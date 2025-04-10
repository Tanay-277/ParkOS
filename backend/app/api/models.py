from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

# Enums
class VehicleTypeAPI(str, Enum):
    CAR = "car"
    BIKE = "bike"
    EV = "ev"
    TRUCK = "truck"

class VehicleSizeAPI(str, Enum):
    SMALL = "small"
    MEDIUM = "medium"
    LARGE = "large"

# Request models
class VehicleArrivalRequest(BaseModel):
    license_plate: str = Field(..., min_length=1, max_length=10)
    vehicle_type: VehicleTypeAPI
    vehicle_size: Optional[VehicleSizeAPI] = VehicleSizeAPI.MEDIUM
    estimated_departure_hours: float = Field(..., gt=0)  # Hours from now
    floor: Optional[str] = None
    is_vip: Optional[bool] = False
    is_emergency: Optional[bool] = False

class VehicleDepartureRequest(BaseModel):
    license_plate: str = Field(..., min_length=1, max_length=10)

class ExtendStayRequest(BaseModel):
    license_plate: str = Field(..., min_length=1, max_length=10)
    additional_hours: float = Field(..., gt=0)

# Response models
class SlotResponse(BaseModel):
    id: int
    slot_number: int
    floor: str
    status: str
    slot_type: str
    position: Dict[str, int]
    vehicle: Optional[Dict[str, Any]] = None

class VehicleResponse(BaseModel):
    id: int
    license_plate: str
    vehicle_type: str
    vehicle_size: str
    arrival_time: str
    estimated_departure: Optional[str] = None
    actual_departure: Optional[str] = None
    status: str
    slot: Optional[SlotResponse] = None

class WaitlistResponse(BaseModel):
    id: int
    entry_time: str
    priority: float
    vehicle: Dict[str, Any]
    position: int

class ParkingStatusResponse(BaseModel):
    floor: str
    total_slots: int
    available_slots: int
    occupied_slots: int
    occupancy_rate: float
    waitlist_count: int

class AllocationResponse(BaseModel):
    success: bool
    message: str
    allocated: bool
    slot: Optional[SlotResponse] = None
    waitlist_position: Optional[int] = None
