import logging
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import random
import heapq
from typing import List, Dict, Tuple, Optional, Union
import math

from app.models.parking import ParkingSlot, Vehicle, WaitlistEntry, ParkingEvent
from app.models.parking import VehicleType, VehicleSize, SlotStatus, SlotType, VehicleSizeSlots
from app.core.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ParkingAllocator:
    """
    Implements allocation strategies using OS concepts:
    - Dynamic Memory Allocation (parking slot assignment)
    - Paging (floor/zone division)
    - Process Scheduling (vehicle prioritization)
    - Compaction (reorganization for space efficiency)
    - Swapping (waitlist management)
    - Deadlock Prevention (efficient slot assignment)
    - Multi-level Queue Scheduling (different queues for different types)
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def initialize_parking_grid(self) -> None:
        """Initialize parking slots if they don't exist already"""
        try:
            logger.info("Initializing parking grid")
            
            # Delete all existing data: parking slots, vehicles, waitlist, events
            self.db.query(ParkingEvent).delete()
            self.db.query(WaitlistEntry).delete()
            self.db.query(Vehicle).delete()
            self.db.query(ParkingSlot).delete()
            self.db.commit()
                
            for floor in settings.FLOORS:
                grid_size = settings.GRID_SIZE_PER_FLOOR
                
                logger.info(f"Creating grid for floor {floor} with size {grid_size}x{grid_size}")
                
                # Create slots for this floor
                slot_count = 1
                for y in range(1, grid_size + 1):
                    for x in range(1, grid_size + 1):
                        # Determine slot type based on position
                        slot_type = SlotType.REGULAR
                        
                        # VIP slots (first few slots)
                        if slot_count <= settings.VIP_SLOTS_PER_FLOOR:
                            slot_type = SlotType.VIP
                        
                        # Emergency slots (near entrance/exit)
                        if x == 1 and y <= settings.EMERGENCY_SLOTS_PER_FLOOR:
                            slot_type = SlotType.EMERGENCY
                        
                        # Create the slot
                        slot = ParkingSlot(
                            slot_number=slot_count,
                            floor=floor,
                            status=SlotStatus.AVAILABLE,
                            slot_type=slot_type,
                            position_x=x,
                            position_y=y
                        )
                        self.db.add(slot)
                        slot_count += 1
                        
                self.db.commit()
                logger.info(f"Created {slot_count-1} slots for floor {floor}")
                
            logger.info("Parking grid initialization complete")
        except Exception as e:
            logger.error(f"Error initializing parking grid: {str(e)}")
            self.db.rollback()
            raise
    
    def find_optimal_slots(self, vehicle: Vehicle, floor: str = None) -> List[ParkingSlot]:
        """
        Find optimal consecutive parking slots based on vehicle size
        Returns the list of slots that should be allocated to the vehicle
        """
        slots_needed = vehicle.get_slots_needed()
        logger.info(f"Finding {slots_needed} slots for {vehicle.license_plate} ({vehicle.vehicle_type})")
        
        query = self.db.query(ParkingSlot).filter(ParkingSlot.status == SlotStatus.AVAILABLE)
        
        if floor:
            query = query.filter(ParkingSlot.floor == floor)
        else:
            # If no floor specified, use the first floor as default
            query = query.filter(ParkingSlot.floor == settings.FLOORS[0])
        
        # Get all available slots
        available_slots = query.order_by(ParkingSlot.slot_number).all()
        
        # If not enough slots available total, return empty list
        if len(available_slots) < slots_needed:
            logger.warning(f"Not enough slots available. Needed: {slots_needed}, Available: {len(available_slots)}")
            return []
        
        # Special handling for VIP and emergency vehicles that need only one slot
        special_slots = []
        if vehicle.is_vip and slots_needed == 1:
            vip_slots = [s for s in available_slots if s.slot_type == SlotType.VIP]
            if vip_slots:
                return [vip_slots[0]]
        
        if vehicle.is_emergency and slots_needed == 1:
            emergency_slots = [s for s in available_slots if s.slot_type == SlotType.EMERGENCY]
            if emergency_slots:
                return [emergency_slots[0]]
        
        # For larger vehicles, find consecutive slots
        if slots_needed > 1:
            # Try to find slots in the same row first
            for start_idx in range(len(available_slots) - slots_needed + 1):
                slot_group = available_slots[start_idx:start_idx + slots_needed]
                
                # Check if slots are consecutive in the same row
                is_consecutive = True
                for i in range(1, len(slot_group)):
                    if (slot_group[i].position_x != slot_group[i-1].position_x + 1 or
                        slot_group[i].position_y != slot_group[i-1].position_y):
                        is_consecutive = False
                        break
                
                if is_consecutive:
                    logger.info(f"Found consecutive slots: {[s.slot_number for s in slot_group]}")
                    return slot_group
            
            # If we couldn't find consecutive slots in the same row, just return any available slots
            logger.warning("Could not find consecutive slots in same row, returning any available slots")
            return available_slots[:slots_needed]
        else:
            # For single slot vehicles, just return the first available slot
            return [available_slots[0]] if available_slots else []
    
    def find_optimal_slot(self, vehicle: Vehicle, floor: str = None) -> Optional[ParkingSlot]:
        """Find a single optimal slot for the vehicle (for backward compatibility)"""
        slots = self.find_optimal_slots(vehicle, floor)
        if slots:
            return slots[0]
        return None

    def allocate_parking_slot(self, vehicle: Vehicle) -> Tuple[bool, Union[ParkingSlot, WaitlistEntry], str]:
        """
        Allocate a parking slot for a vehicle or add to waitlist if full
        Returns: (success, first_slot_or_waitlist, message)
        """
        try:
            logger.info(f"Allocating slot for vehicle {vehicle.license_plate} ({vehicle.vehicle_type}, size: {vehicle.vehicle_size})")
            
            # Check if vehicle already has a slot
            if vehicle.slot_id:
                existing_slot = self.db.query(ParkingSlot).filter(ParkingSlot.id == vehicle.slot_id).first()
                logger.info(f"Vehicle already parked in slot {existing_slot.slot_number} on floor {existing_slot.floor}")
                return True, existing_slot, f"Vehicle already parked in slot {existing_slot.slot_number} on floor {existing_slot.floor}"
            
            # Make sure slots_occupied is set
            if not vehicle.slots_occupied or vehicle.slots_occupied < 1:
                # Calculate slots based on vehicle type and size
                if vehicle.vehicle_type == VehicleType.BIKE:
                    vehicle.slots_occupied = 1
                elif vehicle.vehicle_type == VehicleType.EV:
                    vehicle.slots_occupied = 2
                elif vehicle.vehicle_type == VehicleType.TRUCK:
                    vehicle.slots_occupied = 6
                elif vehicle.vehicle_type == VehicleType.CAR:
                    if vehicle.vehicle_size == VehicleSize.SMALL:
                        vehicle.slots_occupied = 2
                    elif vehicle.vehicle_size == VehicleSize.MEDIUM:
                        vehicle.slots_occupied = 3
                    elif vehicle.vehicle_size == VehicleSize.LARGE:
                        vehicle.slots_occupied = 4
                    else:
                        vehicle.slots_occupied = 3  # Default to medium
                else:
                    vehicle.slots_occupied = 1  # Default for unknown vehicle types
            
            logger.info(f"Vehicle requires {vehicle.slots_occupied} slots")
            
            # Find optimal slots
            optimal_slots = self.find_optimal_slots(vehicle, floor=None)
            
            if optimal_slots and len(optimal_slots) >= vehicle.slots_occupied:
                # Successful allocation - mark all needed slots as occupied
                for slot in optimal_slots:
                    slot.status = SlotStatus.OCCUPIED
                    slot.last_updated = datetime.utcnow()
                
                # Assign the vehicle to the first slot (for reference)
                vehicle.slot_id = optimal_slots[0].id
                
                # Log the event
                slots_text = f"slot {optimal_slots[0].slot_number}" if vehicle.slots_occupied == 1 else f"slots {optimal_slots[0].slot_number}-{optimal_slots[-1].slot_number}"
                event = ParkingEvent(
                    event_type="arrival",
                    description=f"Vehicle {vehicle.license_plate} ({vehicle.vehicle_type}, size: {vehicle.vehicle_size}) parked in {slots_text} on floor {optimal_slots[0].floor}",
                    vehicle_id=vehicle.id,
                    slot_id=optimal_slots[0].id
                )
                self.db.add(event)
                
                # Check if vehicle was on waitlist and resolve if needed
                waitlist_entry = self.db.query(WaitlistEntry).filter(
                    WaitlistEntry.vehicle_id == vehicle.id,
                    WaitlistEntry.resolved == False
                ).first()
                
                if waitlist_entry:
                    waitlist_entry.resolved = True
                    waitlist_entry.resolved_time = datetime.utcnow()
                    logger.info(f"Resolving waitlist entry for vehicle {vehicle.license_plate}")
                
                self.db.commit()
                return True, optimal_slots[0], f"Vehicle parked in {slots_text} on floor {optimal_slots[0].floor}"
            else:
                # Parking is full or not enough consecutive slots, add to waitlist
                logger.info(f"No suitable slots available for {vehicle.license_plate}, adding to waitlist")
                priority = 1.0
                
                # Calculate priority based on vehicle type and attributes
                if vehicle.is_vip:
                    priority *= settings.PRIORITY_WEIGHT_VIP
                if vehicle.is_emergency:
                    priority *= settings.PRIORITY_WEIGHT_EMERGENCY
                    
                # Short-term vehicles get higher priority
                if vehicle.estimated_departure:
                    time_diff = vehicle.estimated_departure - datetime.utcnow()
                    hours = time_diff.total_seconds() / 3600
                    if hours <= settings.SHORT_TERM_THRESHOLD / 60:
                        priority *= settings.PRIORITY_WEIGHT_SHORT_TERM
                
                # Create waitlist entry
                waitlist_entry = WaitlistEntry(
                    vehicle_id=vehicle.id,
                    priority=priority
                )
                
                self.db.add(waitlist_entry)
                
                # Log the event
                event = ParkingEvent(
                    event_type="waitlist",
                    description=f"Vehicle {vehicle.license_plate} added to waitlist with priority {priority}",
                    vehicle_id=vehicle.id
                )
                self.db.add(event)
                
                self.db.commit()
                return False, waitlist_entry, "Parking is full or no suitable slots available, added to waitlist"
        except Exception as e:
            logger.error(f"Error allocating slot: {str(e)}")
            self.db.rollback()
            raise
    
    def release_slot(self, vehicle: Vehicle) -> Tuple[bool, str]:
        """
        Release all parking slots occupied by a vehicle when it leaves
        Returns: (success, message)
        """
        if not vehicle.slot_id:
            return False, "Vehicle is not parked in any slot"
        
        # Find the primary slot
        primary_slot = self.db.query(ParkingSlot).filter(ParkingSlot.id == vehicle.slot_id).first()
        if not primary_slot:
            return False, "Invalid slot reference"
        
        # For multi-slot vehicles, find all consecutive slots
        slots_to_free = [primary_slot]
        if vehicle.slots_occupied > 1:
            # Find additional slots in the same row
            additional_slots = self.db.query(ParkingSlot).filter(
                ParkingSlot.floor == primary_slot.floor,
                ParkingSlot.position_y == primary_slot.position_y,
                ParkingSlot.position_x > primary_slot.position_x,
                ParkingSlot.position_x <= primary_slot.position_x + vehicle.slots_occupied - 1,
                ParkingSlot.status == SlotStatus.OCCUPIED
            ).all()
            
            slots_to_free.extend(additional_slots)
        
        # Update all slots to available
        for slot in slots_to_free:
            slot.status = SlotStatus.AVAILABLE
            slot.last_updated = datetime.utcnow()
        
        # Update vehicle status
        vehicle.actual_departure = datetime.utcnow()
        vehicle.slot_id = None
        
        # Log the event
        event = ParkingEvent(
            event_type="departure",
            description=f"Vehicle {vehicle.license_plate} departed from slots {', '.join([str(slot.slot_number) for slot in slots_to_free])} on floor {primary_slot.floor}",
            vehicle_id=vehicle.id,
            slot_id=primary_slot.id
        )
        self.db.add(event)
        
        self.db.commit()
        
        # Process waitlist to see if any vehicle can be allocated slots
        self._process_waitlist()
        
        # Check if compaction is needed
        self._check_and_perform_compaction()
        
        return True, f"Slots {', '.join([str(slot.slot_number) for slot in slots_to_free])} on floor {primary_slot.floor} released successfully"
    
    def _process_waitlist(self) -> bool:
        """
        Process the waitlist to allocate slots to waiting vehicles
        Returns: True if any vehicle was allocated
        """
        # Get all unresolved waitlist entries sorted by priority (higher first) and entry time
        waitlist_entries = self.db.query(WaitlistEntry).filter(
            WaitlistEntry.resolved == False
        ).order_by(WaitlistEntry.priority.desc(), WaitlistEntry.entry_time.asc()).all()
        
        if not waitlist_entries:
            return False
            
        allocated = False
        for entry in waitlist_entries:
            vehicle = self.db.query(Vehicle).filter(Vehicle.id == entry.vehicle_id).first()
            if not vehicle:
                # Invalid vehicle, mark as resolved
                entry.resolved = True
                entry.resolved_time = datetime.utcnow()
                continue
                
            # Try to allocate a slot
            success, slot_or_waitlist, message = self.allocate_parking_slot(vehicle)
            if success:
                allocated = True
                # Allocation successful, entry already marked as resolved in allocate_parking_slot
                
                # Log the event
                event = ParkingEvent(
                    event_type="waitlist_resolved",
                    description=f"Vehicle {vehicle.license_plate} allocated from waitlist to slot {slot_or_waitlist.slot_number} on floor {slot_or_waitlist.floor}",
                    vehicle_id=vehicle.id,
                    slot_id=slot_or_waitlist.id
                )
                self.db.add(event)
                
        self.db.commit()
        return allocated
    
    def _check_and_perform_compaction(self) -> bool:
        """
        Check if compaction is needed and perform it
        Returns: True if compaction was performed
        """
        # Calculate fragmentation per floor
        for floor in settings.FLOORS:
            total_slots = self.db.query(ParkingSlot).filter(ParkingSlot.floor == floor).count()
            occupied_slots = self.db.query(ParkingSlot).filter(
                ParkingSlot.floor == floor,
                ParkingSlot.status == SlotStatus.OCCUPIED
            ).count()
            
            if total_slots == 0 or occupied_slots == 0:
                continue
                
            # Calculate fragmentation by distance between occupied slots
            occupied_slot_positions = self.db.query(
                ParkingSlot.position_x, ParkingSlot.position_y
            ).filter(
                ParkingSlot.floor == floor,
                ParkingSlot.status == SlotStatus.OCCUPIED
            ).all()
            
            if not occupied_slot_positions:
                continue
                
            # Calculate average distance between slots as a measure of fragmentation
            avg_x = sum(pos[0] for pos in occupied_slot_positions) / len(occupied_slot_positions)
            avg_y = sum(pos[1] for pos in occupied_slot_positions) / len(occupied_slot_positions)
            
            total_distance = sum(
                math.sqrt((pos[0] - avg_x)**2 + (pos[1] - avg_y)**2)
                for pos in occupied_slot_positions
            )
            
            avg_distance = total_distance / len(occupied_slot_positions)
            grid_size = int(math.sqrt(settings.MAX_PARKING_CAPACITY // len(settings.FLOORS)))
            max_distance = math.sqrt(2) * grid_size  # Maximum possible distance in a grid
            
            fragmentation_ratio = avg_distance / max_distance
            
            # If fragmentation is high, perform compaction
            if fragmentation_ratio > settings.FRAGMENTATION_THRESHOLD:
                self._perform_compaction(floor)
                return True
                
        return False
    
    def _perform_compaction(self, floor: str) -> None:
        """
        Perform compaction on a specific floor by reorganizing vehicles
        """
        # Get all occupied slots on this floor
        occupied_slots = self.db.query(ParkingSlot).filter(
            ParkingSlot.floor == floor,
            ParkingSlot.status == SlotStatus.OCCUPIED
        ).all()
        
        # Get all available slots on this floor
        available_slots = self.db.query(ParkingSlot).filter(
            ParkingSlot.floor == floor,
            ParkingSlot.status == SlotStatus.AVAILABLE
        ).all()
        
        if not occupied_slots or not available_slots:
            return
            
        # Sort occupied slots by distance from origin (top-left)
        occupied_slots.sort(key=lambda slot: -(slot.position_x + slot.position_y))
        
        # Sort available slots by distance from origin (closer first)
        available_slots.sort(key=lambda slot: slot.position_x + slot.position_y)
        
        # Match distant occupied slots with closer available slots
        moves_performed = 0
        for occupied in occupied_slots:
            if not available_slots:
                break
                
            # Check if this occupied slot is already well placed
            if occupied.position_x <= 2 and occupied.position_y <= 2:
                continue
                
            # Get the vehicle in this slot
            vehicle = self.db.query(Vehicle).filter(Vehicle.slot_id == occupied.id).first()
            if not vehicle:
                continue
                
            # Get the next available slot closer to the entrance
            new_slot = None
            for avail in available_slots:
                if avail.position_x + avail.position_y < occupied.position_x + occupied.position_y:
                    new_slot = avail
                    available_slots.remove(avail)
                    break
                    
            if new_slot:
                # Move the vehicle to the new slot
                occupied.status = SlotStatus.AVAILABLE
                new_slot.status = SlotStatus.OCCUPIED
                vehicle.slot_id = new_slot.id
                
                # Log the event
                event = ParkingEvent(
                    event_type="compaction",
                    description=f"Vehicle {vehicle.license_plate} moved from slot {occupied.slot_number} to {new_slot.slot_number} during compaction",
                    vehicle_id=vehicle.id,
                    slot_id=new_slot.id
                )
                self.db.add(event)
                
                moves_performed += 1
                
        if moves_performed > 0:
            # Log the overall compaction
            event = ParkingEvent(
                event_type="compaction_summary",
                description=f"Performed compaction on floor {floor}, {moves_performed} vehicles repositioned"
            )
            self.db.add(event)
            
        self.db.commit()
    
    def extend_stay(self, vehicle: Vehicle, new_departure_time: datetime) -> Tuple[bool, str]:
        """
        Extend the stay of a vehicle and reallocate if necessary
        Returns: (success, message)
        """
        if not vehicle.slot_id:
            return False, "Vehicle is not parked in any slot"
            
        old_departure = vehicle.estimated_departure
        vehicle.estimated_departure = new_departure_time
        
        # Log the event
        event = ParkingEvent(
            event_type="stay_extended",
            description=f"Vehicle {vehicle.license_plate} extended stay until {new_departure_time}",
            vehicle_id=vehicle.id,
            slot_id=vehicle.slot_id
        )
        self.db.add(event)
        
        self.db.commit()
        
        # Check if reallocation is needed
        time_diff = new_departure_time - datetime.utcnow()
        hours = time_diff.total_seconds() / 3600
        
        # If extended to long-term and was short-term before, consider reallocation
        was_short_term = False
        if old_departure:
            old_diff = old_departure - datetime.utcnow()
            old_hours = old_diff.total_seconds() / 3600
            was_short_term = old_hours <= settings.SHORT_TERM_THRESHOLD / 60
            
        is_long_term = hours > settings.SHORT_TERM_THRESHOLD / 60
        
        if was_short_term and is_long_term:
            # Consider reallocation by releasing and re-allocating
            slot = self.db.query(ParkingSlot).filter(ParkingSlot.id == vehicle.slot_id).first()
            
            # Only reallocate if we're in an optimal zone for short-term
            if slot and slot.position_x <= 2 and slot.position_y <= 2:
                # Release the current slot
                previous_slot_id = vehicle.slot_id
                previous_slot_number = slot.slot_number
                previous_slot_floor = slot.floor
                
                # Temporarily release the slot
                slot.status = SlotStatus.AVAILABLE
                vehicle.slot_id = None
                
                # Try to find a better slot for long-term
                optimal_slot = self.find_optimal_slot(vehicle)
                
                if optimal_slot and optimal_slot.id != previous_slot_id:
                    # Move to the new slot
                    optimal_slot.status = SlotStatus.OCCUPIED
                    vehicle.slot_id = optimal_slot.id
                    
                    event = ParkingEvent(
                        event_type="reallocation",
                        description=f"Vehicle {vehicle.license_plate} reallocated from slot {previous_slot_number} to {optimal_slot.slot_number} due to extended stay",
                        vehicle_id=vehicle.id,
                        slot_id=optimal_slot.id
                    )
                else:
                    # Move back to the original slot
                    slot.status = SlotStatus.OCCUPIED
                    vehicle.slot_id = previous_slot_id
                
                self.db.add(event)
                self.db.commit()
                
                return True, f"Stay extended and vehicle relocated to optimize parking efficiency"
                
        return True, f"Stay extended successfully until {new_departure_time}"
    
    def get_parking_status(self, floor: str = None) -> Dict:
        """
        Get the current status of the parking lot
        """
        query = self.db.query(ParkingSlot)
        if floor:
            query = query.filter(ParkingSlot.floor == floor)
            
        all_slots = query.all()
        
        # Count by status
        total = len(all_slots)
        available = sum(1 for slot in all_slots if slot.status == SlotStatus.AVAILABLE)
        occupied = sum(1 for slot in all_slots if slot.status == SlotStatus.OCCUPIED)
        
        # Waitlist info
        waitlist_count = self.db.query(WaitlistEntry).filter(WaitlistEntry.resolved == False).count()
        
        return {
            "floor": floor if floor else "all",
            "total_slots": total,
            "available_slots": available,
            "occupied_slots": occupied,
            "occupancy_rate": occupied / total if total else 0,
            "waitlist_count": waitlist_count
        }

    def get_all_slots(self, floor: str = None, status: SlotStatus = None) -> List[Dict]:
        """
        Get information about all slots, optionally filtered by floor and status
        """
        query = self.db.query(ParkingSlot)
        if floor:
            query = query.filter(ParkingSlot.floor == floor)
        if status:
            query = query.filter(ParkingSlot.status == status)
            
        slots = query.all()
        result = []
        
        for slot in slots:
            slot_data = slot.to_dict()
            
            # Add vehicle info if occupied
            if slot.status == SlotStatus.OCCUPIED:
                vehicle = self.db.query(Vehicle).filter(Vehicle.slot_id == slot.id).first()
                if vehicle:
                    # Use to_local_time_string for all datetime fields
                    from app.models.parking import to_local_time_string
                    slot_data["vehicle"] = {
                        "id": vehicle.id,
                        "license_plate": vehicle.license_plate,
                        "vehicle_type": vehicle.vehicle_type,
                        "vehicle_size": vehicle.vehicle_size,
                        "arrival_time": to_local_time_string(vehicle.arrival_time),
                        "estimated_departure": to_local_time_string(vehicle.estimated_departure),
                        "is_vip": vehicle.is_vip,
                        "slots_occupied": vehicle.slots_occupied
                    }
                    
            result.append(slot_data)
            
        return result
    
    def get_waitlist(self) -> List[Dict]:
        """
        Get the current waitlist
        """
        waitlist_entries = self.db.query(WaitlistEntry).filter(
            WaitlistEntry.resolved == False
        ).order_by(WaitlistEntry.priority.desc(), WaitlistEntry.entry_time.asc()).all()
        
        result = []
        for entry in waitlist_entries:
            entry_data = entry.to_dict()
            
            # Add vehicle info
            vehicle = self.db.query(Vehicle).filter(Vehicle.id == entry.vehicle_id).first()
            if vehicle:
                # Use to_local_time_string for all datetime fields
                from app.models.parking import to_local_time_string
                entry_data["vehicle"] = {
                    "id": vehicle.id,
                    "license_plate": vehicle.license_plate,
                    "vehicle_type": vehicle.vehicle_type,
                    "vehicle_size": vehicle.vehicle_size,
                    "arrival_time": to_local_time_string(vehicle.arrival_time),
                    "estimated_departure": to_local_time_string(vehicle.estimated_departure),
                    "is_vip": vehicle.is_vip
                }
                
            result.append(entry_data)
            
        return result

    def _find_adjacent_slots(self, start_slot: ParkingSlot, count: int) -> List[ParkingSlot]:
        """Find adjacent available slots starting from a given slot"""
        if count <= 0:
            return []
            
        # Get slots in the same row
        adjacent_slots = self.db.query(ParkingSlot).filter(
            ParkingSlot.floor == start_slot.floor,
            ParkingSlot.position_y == start_slot.position_y,
            ParkingSlot.position_x > start_slot.position_x,
            ParkingSlot.status == SlotStatus.AVAILABLE
        ).order_by(ParkingSlot.position_x).limit(count).all()
        
        if len(adjacent_slots) < count:
            # Not enough adjacent slots, try next row
            next_row_slots = self.db.query(ParkingSlot).filter(
                ParkingSlot.floor == start_slot.floor,
                ParkingSlot.position_y == start_slot.position_y + 1,
                ParkingSlot.status == SlotStatus.AVAILABLE
            ).order_by(ParkingSlot.position_x).limit(count - len(adjacent_slots)).all()
            
            adjacent_slots.extend(next_row_slots)
        
        return adjacent_slots
