from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum
import datetime
from typing import Optional

from app.database.db import Base

# Enumerations
class VehicleType(str, enum.Enum):
    CAR = "car"
    BIKE = "bike"
    EV = "ev" 
    TRUCK = "truck"

class VehicleSize(str, enum.Enum):
    SMALL = "small"
    MEDIUM = "medium"
    LARGE = "large"

class SlotStatus(str, enum.Enum):
    AVAILABLE = "available"
    OCCUPIED = "occupied"
    RESERVED = "reserved"
    MAINTENANCE = "maintenance"

class SlotType(str, enum.Enum):
    REGULAR = "regular"
    VIP = "vip"
    EMERGENCY = "emergency"

class VehicleSizeSlots(enum.IntEnum):
    """Number of slots that each vehicle size occupies"""
    BIKE = 1
    SMALL = 2
    MEDIUM = 3
    LARGE = 4
    TRUCK = 6
    EV = 2

# Models
class ParkingSlot(Base):
    __tablename__ = "parking_slots"
    
    id = Column(Integer, primary_key=True, index=True)
    slot_number = Column(Integer, index=True, nullable=False)
    floor = Column(String, index=True, nullable=False)
    status = Column(Enum(SlotStatus), default=SlotStatus.AVAILABLE)
    slot_type = Column(Enum(SlotType), default=SlotType.REGULAR)
    position_x = Column(Integer, nullable=False)  # Grid position X
    position_y = Column(Integer, nullable=False)  # Grid position Y
    last_updated = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    vehicles = relationship("Vehicle", back_populates="slot")
    
    def to_dict(self):
        return {
            "id": self.id,
            "slot_number": self.slot_number,
            "floor": self.floor,
            "status": self.status,
            "slot_type": self.slot_type,
            "position": {"x": self.position_x, "y": self.position_y},
            "last_updated": self.last_updated.isoformat() if self.last_updated else None
        }

class Vehicle(Base):
    __tablename__ = "vehicles"
    
    id = Column(Integer, primary_key=True, index=True)
    license_plate = Column(String, index=True, nullable=False)
    vehicle_type = Column(Enum(VehicleType), nullable=False)
    vehicle_size = Column(Enum(VehicleSize), default=VehicleSize.MEDIUM)
    arrival_time = Column(DateTime, default=datetime.datetime.utcnow)
    estimated_departure = Column(DateTime, nullable=True)
    actual_departure = Column(DateTime, nullable=True)
    is_vip = Column(Boolean, default=False)
    is_emergency = Column(Boolean, default=False)
    slots_occupied = Column(Integer, default=1)  # Number of slots this vehicle occupies
    
    # Foreign keys
    slot_id = Column(Integer, ForeignKey("parking_slots.id"), nullable=True)
    
    # Relationships
    slot = relationship("ParkingSlot", back_populates="vehicles")
    waitlist_entry = relationship("WaitlistEntry", back_populates="vehicle", uselist=False)
    
    def to_dict(self):
        return {
            "id": self.id,
            "license_plate": self.license_plate,
            "vehicle_type": self.vehicle_type,
            "vehicle_size": self.vehicle_size,
            "arrival_time": self.arrival_time.isoformat() if self.arrival_time else None,
            "estimated_departure": self.estimated_departure.isoformat() if self.estimated_departure else None,
            "actual_departure": self.actual_departure.isoformat() if self.actual_departure else None,
            "is_vip": self.is_vip,
            "is_emergency": self.is_emergency,
            "slots_occupied": self.slots_occupied,
            "slot_id": self.slot_id,
            "status": "parked" if self.slot_id else "waitlisted" if self.waitlist_entry else "departed"
        }
    
    def get_slots_needed(self) -> int:
        """Calculate how many slots this vehicle needs based on type and size"""
        if self.vehicle_type == VehicleType.BIKE:
            return VehicleSizeSlots.BIKE
        elif self.vehicle_type == VehicleType.EV:
            return VehicleSizeSlots.EV
        elif self.vehicle_type == VehicleType.TRUCK:
            return VehicleSizeSlots.TRUCK
        elif self.vehicle_type == VehicleType.CAR:
            if self.vehicle_size == VehicleSize.SMALL:
                return VehicleSizeSlots.SMALL
            elif self.vehicle_size == VehicleSize.MEDIUM:
                return VehicleSizeSlots.MEDIUM
            elif self.vehicle_size == VehicleSize.LARGE:
                return VehicleSizeSlots.LARGE
            else:
                return VehicleSizeSlots.MEDIUM
        return 1  # Default

class WaitlistEntry(Base):
    __tablename__ = "waitlist_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    entry_time = Column(DateTime, default=datetime.datetime.utcnow)
    priority = Column(Float, default=1.0)  # Higher number = higher priority
    resolved = Column(Boolean, default=False)
    resolved_time = Column(DateTime, nullable=True)
    
    # Foreign keys
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    
    # Relationships
    vehicle = relationship("Vehicle", back_populates="waitlist_entry")
    
    def to_dict(self):
        return {
            "id": self.id,
            "entry_time": self.entry_time.isoformat() if self.entry_time else None,
            "priority": self.priority,
            "resolved": self.resolved,
            "resolved_time": self.resolved_time.isoformat() if self.resolved_time else None,
            "vehicle_id": self.vehicle_id
        }

class ParkingEvent(Base):
    __tablename__ = "parking_events"
    
    id = Column(Integer, primary_key=True, index=True)
    event_time = Column(DateTime, default=datetime.datetime.utcnow)
    event_type = Column(String, nullable=False)  # arrival, departure, reallocation
    description = Column(String, nullable=True)
    vehicle_id = Column(Integer, nullable=True)
    slot_id = Column(Integer, nullable=True)
    
    def to_dict(self):
        return {
            "id": self.id,
            "event_time": self.event_time.isoformat() if self.event_time else None,
            "event_type": self.event_type,
            "description": self.description,
            "vehicle_id": self.vehicle_id,
            "slot_id": self.slot_id
        }
