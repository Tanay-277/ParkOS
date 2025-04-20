"""
Car model utilities and helper functions for vehicle management.
These utilities help with vehicle size calculations and slot requirements.
"""

from app.models.parking import VehicleType, VehicleSize, VehicleSizeSlots

def calculate_slots_needed(vehicle_type: str, vehicle_size: str = None) -> int:
    """
    Calculate how many parking slots are needed for a given vehicle type and size
    
    Args:
        vehicle_type: Type of vehicle (car, bike, ev, truck)
        vehicle_size: Size of vehicle if applicable (small, medium, large)
    
    Returns:
        int: Number of slots required
    """
    # Validate inputs
    try:
        v_type = VehicleType(vehicle_type)
    except ValueError:
        # Default to car if invalid type
        v_type = VehicleType.CAR
    
    try:
        v_size = VehicleSize(vehicle_size) if vehicle_size else VehicleSize.MEDIUM
    except ValueError:
        # Default to medium if invalid size
        v_size = VehicleSize.MEDIUM
    
    # Calculate slots based on type and size
    if v_type == VehicleType.BIKE:
        return VehicleSizeSlots.BIKE
    elif v_type == VehicleType.EV:
        return VehicleSizeSlots.EV
    elif v_type == VehicleType.TRUCK:
        return VehicleSizeSlots.TRUCK
    elif v_type == VehicleType.CAR:
        if v_size == VehicleSize.SMALL:
            return VehicleSizeSlots.SMALL
        elif v_size == VehicleSize.MEDIUM:
            return VehicleSizeSlots.MEDIUM
        elif v_size == VehicleSize.LARGE:
            return VehicleSizeSlots.LARGE
    
    # Default to medium car if something unexpected happens
    return VehicleSizeSlots.MEDIUM