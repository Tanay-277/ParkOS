# ParkOS: Operating System Concepts Implementation

ParkOS is a modern parking management system that applies operating system concepts to efficiently manage parking resources. This document outlines the various OS concepts implemented throughout the project and how they map to traditional operating system mechanisms.

## 1. Resource Allocation (Dynamic Memory Allocation)

### Concept
In operating systems, dynamic memory allocation involves assigning memory blocks to processes as needed. ParkOS implements this concept by dynamically allocating parking slots to vehicles based on their requirements.

### Implementation
- **File:** `backend/app/services/allocator.py` in `find_optimal_slots()` method
- **How it works:** Similar to memory allocation algorithms like First-Fit, Best-Fit, and Worst-Fit, ParkOS allocates parking slots based on vehicle size requirements.
- **Example:** When a truck requires 6 consecutive slots, the system searches for the optimal allocation:
  ```python
  def find_optimal_slots(self, vehicle: Vehicle, floor: str = None) -> List[ParkingSlot]:
      slots_needed = vehicle.get_slots_needed()
      # Find consecutive slots in the same row first
      for start_idx in range(len(available_slots) - slots_needed + 1):
          slot_group = available_slots[start_idx:start_idx + slots_needed]
          # Check if slots are consecutive in the same row
          # ...
  ```

## 2. Paging

### Concept
Operating systems use paging to manage memory by dividing it into fixed-size blocks. ParkOS implements this by organizing parking slots into separate floors (pages).

### Implementation
- **File:** `backend/app/core/config.py` and `backend/app/services/allocator.py`
- **How it works:** Each floor serves as a "page" containing a grid of parking slots.
- **Example:**
  ```python
  # In config.py
  FLOORS: List[str] = ["1", "2", "3"]
  GRID_SIZE_PER_FLOOR: int = 8  # 8x8 grid
  
  # In allocator.py - floor-specific operations
  def get_parking_status(self, floor: str = None):
      query = self.db.query(ParkingSlot)
      if floor:
          query = query.filter(ParkingSlot.floor == floor)
  ```

## 3. Process Scheduling

### Concept
OS schedulers determine which processes get CPU time and in what order. ParkOS implements various scheduling algorithms to determine which vehicles get allocated parking slots.

### Implementation
- **File:** `backend/app/services/allocator.py` - `_process_waitlist()` method
- **How it works:** Uses priority-based scheduling with considerations for VIP vehicles and vehicle urgency.
- **Example:**
  ```python
  # Priority-based scheduling of waitlisted vehicles
  waitlist_entries = self.db.query(WaitlistEntry).filter(
      WaitlistEntry.resolved == False
  ).order_by(WaitlistEntry.priority.desc(), WaitlistEntry.entry_time.asc()).all()
  ```

## 4. Deadlock Prevention

### Concept
Operating systems implement mechanisms to prevent, detect, or recover from deadlocks. ParkOS implements deadlock prevention by careful resource allocation.

### Implementation
- **File:** `backend/app/services/allocator.py`
- **How it works:** Before allocating slots, the system ensures all required resources (parking slots) are available, preventing the "hold and wait" condition of deadlocks.
- **Example:**
  ```python
  # Check if we can fit the vehicle before allocation
  if (slots_needed > 1):
      for r in range(row, row + slots_needed):
          if r > gridSize or occupiedSlots.has(currentSlotId):
              canFit = False
              break
  ```

## 5. Compaction

### Concept
In memory management, compaction involves moving processes to create larger blocks of free space. ParkOS implements parking compaction.

### Implementation
- **File:** `backend/app/services/allocator.py` - `_check_and_perform_compaction()` method
- **How it works:** When fragmentation reaches a threshold, vehicles are moved to optimize parking slot usage.
- **Example:**
  ```python
  def _perform_compaction(self, floor: str) -> None:
      # Sort occupied slots by distance from origin (top-left)
      occupied_slots.sort(key=lambda slot: -(slot.position_x + slot.position_y))
      
      # Sort available slots by distance from origin (closer first)
      available_slots.sort(key=lambda slot: slot.position_x + slot.position_y)
      
      # Match distant occupied slots with closer available slots
      for occupied in occupied_slots:
          # Move vehicles to better positions
  ```

## 6. Swapping (Waitlist Management)

### Concept
OS swapping moves processes between main memory and secondary storage. ParkOS implements this with its waitlist system.

### Implementation
- **File:** `backend/app/services/allocator.py` - `allocate_parking_slot()` method
- **How it works:** When parking is full, vehicles are placed in a waitlist (like virtual memory) and are "swapped in" when slots become available.
- **Example:**
  ```python
  # Add to waitlist when parking is full
  waitlist_entry = WaitlistEntry(
      vehicle_id=vehicle.id,
      priority=priority
  )
  self.db.add(waitlist_entry)
  
  # Later process waitlist to allocate slots
  def _process_waitlist(self) -> bool:
      waitlist_entries = self.db.query(WaitlistEntry).filter(
          WaitlistEntry.resolved == False
      ).order_by(WaitlistEntry.priority.desc(), WaitlistEntry.entry_time.asc()).all()
      
      for entry in waitlist_entries:
          # Try to allocate a slot
          success, slot_or_waitlist, message = self.allocate_parking_slot(vehicle)
  ```

## 7. Multi-level Queue Scheduling

### Concept
OS multi-level queue scheduling assigns processes to different queues with different priorities. ParkOS implements this with different priorities for vehicle types.

### Implementation
- **File:** `backend/app/services/allocator.py` - priority calculation in `allocate_parking_slot()`
- **How it works:** Different vehicle types (VIP, emergency, regular) enter different priority queues.
- **Example:**
  ```python
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
  ```

## 8. Resource Fragmentation Management

### Concept
Operating systems must manage memory fragmentation. ParkOS tracks and addresses parking space fragmentation.

### Implementation
- **File:** `backend/app/services/allocator.py` - `_check_and_perform_compaction()` method
- **How it works:** The system calculates fragmentation ratio and performs compaction when needed.
- **Example:**
  ```python
  # Calculate fragmentation by distance between occupied slots
  avg_distance = total_distance / len(occupied_slot_positions)
  grid_size = int(math.sqrt(settings.MAX_PARKING_CAPACITY // len(settings.FLOORS)))
  max_distance = math.sqrt(2) * grid_size  # Maximum possible distance in a grid
  
  fragmentation_ratio = avg_distance / max_distance
  
  # If fragmentation is high, perform compaction
  if fragmentation_ratio > settings.FRAGMENTATION_THRESHOLD:
      self._perform_compaction(floor)
  ```

## 9. Event-Driven Processing

### Concept
Operating systems often use event-driven architecture to respond to various events. ParkOS implements this throughout the system.

### Implementation
- **Files:** `backend/app/services/allocator.py` and `frontend/app/page.tsx`
- **How it works:** Both backend and frontend respond to events (vehicle arrival, departure, waitlist changes).
- **Example:**
  ```python
  # Backend: Log events for important operations
  event = ParkingEvent(
      event_type="arrival",
      description=f"Vehicle {vehicle.license_plate} parked in {slots_text} on floor {optimal_slots[0].floor}",
      vehicle_id=vehicle.id,
      slot_id=optimal_slots[0].id
  )
  ```
  ```tsx
  // Frontend: React to vehicle parking events
  const handleParkVehicle = useCallback(async () => {
    try {
      const result = await parkVehicle(
        vehicleType as "car" | "bike" | "ev" | "truck",
        departureHours,
        vehicleSizeValue,
        isVIP
      );
      
      // Handle the response event
      if (result.success) {
        if (result.allocated) {
          toast.success(`Vehicle parked successfully!`);
          // Update UI...
        }
      }
    } catch (error) {
      // Handle error event
    }
  }, []);
  ```

## 10. Performance Optimization

### Concept
Operating systems implement performance optimizations to maximize resource usage. ParkOS includes several optimization techniques.

### Implementation
- **File:** `frontend/lib/performance.ts` and `frontend/utils/api-status.ts`
- **How it works:** Similar to OS process performance monitoring and throttling, these utilities help manage UI performance.
- **Example:**
  ```typescript
  // Throttle function to limit execution rate
  export function throttle<T extends (...args: any[]) => any>(
    func: T, 
    limit: number
  ): (...args: Parameters<T>) => ReturnType<T> | undefined {
    let inThrottle = false;
    let lastResult: ReturnType<T>;
    
    return function(this: any, ...args: Parameters<T>): ReturnType<T> | undefined {
      if (!inThrottle) {
        inThrottle = true;
        lastResult = func.apply(this, args);
        
        setTimeout(() => {
          inThrottle = false;
        }, limit);
      }
      
      return lastResult;
    };
  }
  ```

## 11. Resource Monitoring

### Concept
Operating systems monitor resource usage to make informed management decisions. ParkOS implements monitoring of parking resources.

### Implementation
- **File:** `backend/app/api/routes.py` - `get_parking_status()` endpoint
- **How it works:** Similar to OS resource usage monitoring, this tracks parking occupancy in real-time.
- **Example:**
  ```python
  @router.get("/status", response_model=ParkingStatusResponse)
  def get_parking_status(floor: Optional[str] = None, db: Session = Depends(get_db)):
      allocator = ParkingAllocator(db)
      return allocator.get_parking_status(floor)
  ```

## 12. Process Synchronization

### Concept
OS synchronization ensures coordinated access to shared resources. ParkOS implements this in its database operations.

### Implementation
- **File:** `backend/app/database/db.py`
- **How it works:** Database sessions provide synchronized access to the parking resources.
- **Example:**
  ```python
  def get_db():
      db = SessionLocal()
      try:
          yield db
      finally:
          db.close()
  ```

## Summary Table: OS Concepts Mapping

| OS Concept | ParkOS Implementation | Location |
|------------|--------------------------|----------|
| Dynamic Memory Allocation | Parking slot allocation based on vehicle size | `allocator.py:find_optimal_slots()` |
| Paging | Floors as memory pages | `config.py` and throughout `allocator.py` |
| Process Scheduling | Priority-based vehicle scheduling | `allocator.py:_process_waitlist()` |
| Deadlock Prevention | Resource pre-allocation checks | `allocator.py:allocate_parking_slot()` |
| Compaction | Parking space reorganization | `allocator.py:_perform_compaction()` |
| Swapping | Waitlist for temporarily "swapped out" vehicles | `allocator.py:allocate_parking_slot()` |
| Multi-level Queue | Different priority queues for vehicles | `allocator.py:allocate_parking_slot()` |
| Resource Fragmentation | Fragmentation tracking and management | `allocator.py:_check_and_perform_compaction()` |
| Event-Driven Processing | Response to system events | Throughout backend and frontend |
| Performance Optimization | Throttling and resource efficiency | `performance.ts` |
| Resource Monitoring | Real-time parking status tracking | `routes.py:get_parking_status()` |
| Process Synchronization | Database session management | `db.py:get_db()` |

## Conclusion

ParkOS successfully demonstrates how operating system concepts can be applied to solve real-world resource allocation problems outside traditional computing environments. By drawing parallels between computer resources and parking spaces, the system efficiently manages limited resources using time-tested algorithms from operating system theory.
