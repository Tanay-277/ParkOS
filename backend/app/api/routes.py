from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import traceback  # Add this import at the top level

# Add the missing import
from app.core.config import settings
from app.database.db import get_db
from app.models.parking import Vehicle, ParkingSlot, WaitlistEntry, ParkingEvent
# Update this line to include VehicleSizeSlots
from app.models.parking import VehicleType, VehicleSize, SlotStatus, SlotType
from app.models.car import calculate_slots_needed
from app.services.allocator import ParkingAllocator
from app.api.models import (
    VehicleArrivalRequest, VehicleDepartureRequest, ExtendStayRequest,
    SlotResponse, VehicleResponse, WaitlistResponse, ParkingStatusResponse, AllocationResponse
)

router = APIRouter()

# Add a health check endpoint
@router.get("/health", response_model=Dict[str, str])
def health_check():
    """Health check endpoint for API status and CORS checking"""
    return {"status": "ok", "version": settings.VERSION}

@router.post("/initialize", response_model=Dict[str, str])
def initialize_parking_system(db: Session = Depends(get_db)):
    """Initialize the parking system with default slots"""
    allocator = ParkingAllocator(db)
    allocator.initialize_parking_grid()
    return {"message": "Parking system initialized successfully"}

@router.get("/status", response_model=ParkingStatusResponse)
def get_parking_status(floor: Optional[str] = None, db: Session = Depends(get_db)):
    """Get current parking status"""
    allocator = ParkingAllocator(db)
    return allocator.get_parking_status(floor)

@router.get("/slots", response_model=List[Dict[str, Any]])
def get_parking_slots(floor: Optional[str] = None, status: Optional[str] = None, db: Session = Depends(get_db)):
    """Get all parking slots with optional filtering"""
    allocator = ParkingAllocator(db)
    slot_status = SlotStatus(status) if status else None
    return allocator.get_all_slots(floor, slot_status)

@router.get("/waitlist", response_model=List[Dict[str, Any]])
def get_waitlist(db: Session = Depends(get_db)):
    """Get current waitlist"""
    allocator = ParkingAllocator(db)
    waitlist = allocator.get_waitlist()
    # Add position info
    for i, entry in enumerate(waitlist):
        entry["position"] = i + 1
    return waitlist

@router.post("/arrive", response_model=AllocationResponse)
def vehicle_arrival(request: VehicleArrivalRequest, db: Session = Depends(get_db)):
    """Register a new vehicle arrival and allocate a parking slot"""
    try:
        # Check if vehicle with this license plate already exists
        existing_vehicle = db.query(Vehicle).filter(Vehicle.license_plate == request.license_plate).first()
        
        if existing_vehicle and not existing_vehicle.actual_departure:
            slot = db.query(ParkingSlot).filter(ParkingSlot.id == existing_vehicle.slot_id).first()
            return AllocationResponse(
                success=True,
                message=f"Vehicle {request.license_plate} is already registered",
                allocated=existing_vehicle.slot_id is not None,
                slot=slot.to_dict() if slot else None,
                waitlist_position=None
            )
        
        # Calculate departure time from hours
        departure_time = datetime.utcnow() + timedelta(hours=request.estimated_departure_hours)
        
        # Calculate slots needed using our utility function
        slots_needed = calculate_slots_needed(request.vehicle_type, request.vehicle_size)
        
        # Create new vehicle
        new_vehicle = Vehicle(
            license_plate=request.license_plate,
            vehicle_type=VehicleType(request.vehicle_type),
            vehicle_size=VehicleSize(request.vehicle_size),
            arrival_time=datetime.utcnow(),
            estimated_departure=departure_time,
            is_vip=request.is_vip,
            is_emergency=request.is_emergency,
            slots_occupied=slots_needed
        )
        
        db.add(new_vehicle)
        db.flush()  # Generate ID without committing
        
        # Allocate a parking slot
        allocator = ParkingAllocator(db)
        success, result, message = allocator.allocate_parking_slot(new_vehicle)
        
        # Prepare response
        if success:
            # Allocated to a slot
            return AllocationResponse(
                success=True,
                message=message,
                allocated=True,
                slot=result.to_dict() if isinstance(result, ParkingSlot) else None
            )
        else:
            # Added to waitlist
            waitlist = allocator.get_waitlist()
            position = next((i + 1 for i, entry in enumerate(waitlist) if entry["id"] == result.id), None)
            
            return AllocationResponse(
                success=True,
                message=message,
                allocated=False,
                waitlist_position=position
            )
    except Exception as e:
        traceback_str = traceback.format_exc()
        print(f"Error in vehicle arrival: {str(e)}\n{traceback_str}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/depart", response_model=Dict[str, Any])
def vehicle_departure(request: VehicleDepartureRequest, db: Session = Depends(get_db)):
    """Register a vehicle departure"""
    # Find the vehicle
    vehicle = db.query(Vehicle).filter(Vehicle.license_plate == request.license_plate).first()
    
    if not vehicle:
        raise HTTPException(status_code=404, detail=f"Vehicle {request.license_plate} not found")
    
    if vehicle.actual_departure:
        return {"success": True, "message": f"Vehicle {request.license_plate} already departed"}
    
    # Release the slot
    allocator = ParkingAllocator(db)
    success, message = allocator.release_slot(vehicle)
    
    return {"success": success, "message": message}

@router.post("/extend", response_model=Dict[str, Any])
def extend_stay(request: ExtendStayRequest, db: Session = Depends(get_db)):
    """Extend the stay of a parked vehicle"""
    # Find the vehicle
    vehicle = db.query(Vehicle).filter(Vehicle.license_plate == request.license_plate).first()
    
    if not vehicle:
        raise HTTPException(status_code=404, detail=f"Vehicle {request.license_plate} not found")
    
    if vehicle.actual_departure:
        raise HTTPException(status_code=400, detail=f"Vehicle {request.license_plate} has already departed")
    
    if not vehicle.slot_id:
        raise HTTPException(status_code=400, detail=f"Vehicle {request.license_plate} is not parked")
    
    # Calculate new departure time
    current_departure = vehicle.estimated_departure or datetime.utcnow()
    new_departure = current_departure + timedelta(hours=request.additional_hours)
    
    # Extend stay
    allocator = ParkingAllocator(db)
    success, message = allocator.extend_stay(vehicle, new_departure)
    
    return {"success": success, "message": message}

@router.get("/debug", response_model=Dict[str, Any])
def debug_info(db: Session = Depends(get_db)):
    """Get debug information about the API and database"""
    try:
        # Count slots
        slots_by_floor = {}
        for floor in settings.FLOORS:
            slots_by_floor[floor] = db.query(ParkingSlot).filter(ParkingSlot.floor == floor).count()
        
        # Count vehicles
        vehicles_count = db.query(Vehicle).count()
        parked_vehicles = db.query(Vehicle).filter(Vehicle.slot_id.isnot(None)).count()
        
        # Count waitlist
        waitlist_count = db.query(WaitlistEntry).filter(WaitlistEntry.resolved == False).count()
        
        return {
            "api_version": settings.VERSION,
            "cors_origins": settings.BACKEND_CORS_ORIGINS,
            "database_url": settings.DATABASE_URL.split("///")[0] + "///*****",  # Hide actual path
            "slots_per_floor": slots_by_floor,
            "total_slots": sum(slots_by_floor.values()),
            "vehicles": {
                "total": vehicles_count,
                "parked": parked_vehicles,
                "waitlist": waitlist_count
            },
            "grid_size": settings.GRID_SIZE_PER_FLOOR,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        import traceback
        print(f"Debug endpoint error: {str(e)}")
        print(traceback.format_exc())
        return {
            "error": str(e),
            "api_version": settings.VERSION,
            "timestamp": datetime.utcnow().isoformat()
        }