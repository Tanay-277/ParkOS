import { useState, useEffect, useCallback } from 'react';

// Define types for our parking system
interface Vehicle {
  id: number;
  license_plate: string;
  vehicle_type: string;
  vehicle_size?: string;
  arrival_time: string;
  estimated_departure?: string;
  is_vip?: boolean;
  slots_occupied?: number;
}

interface ParkingSlot {
  id: number;
  status: string;
  vehicle?: Vehicle;
}

interface ParkingStatus {
  total_slots: number;
  occupied_slots: number;
  available_slots: number;
  floor: string;
  waitlist_count: number;
}

interface WaitlistItem {
  id: number;
  vehicle_type: string;
  arrival_time: string;
  position: number;
}

interface ParkingSystemResult {
  parkingSlots: ParkingSlot[];
  parkingStatus: ParkingStatus | null;
  waitlist: WaitlistItem[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  parkVehicle: (
    vehicleType: "car" | "bike" | "ev" | "truck",
    departureHours: number,
    vehicleSize?: "small" | "medium" | "large",
    isVip?: boolean
  ) => Promise<any>;
  initializeParking: () => Promise<{ success: boolean; }>;
}

// Generate consistent license plates based on a seed
const generateLicensePlate = (seed: number) => {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const numbers = '0123456789';
  
  // Use seed to consistently generate the same license plate
  const letter1 = letters[seed % letters.length];
  const letter2 = letters[(seed * 7 + 3) % letters.length];
  const num1 = numbers[(seed * 11 + 7) % numbers.length];
  const num2 = numbers[(seed * 13 + 5) % numbers.length];
  const num3 = numbers[(seed * 17 + 11) % numbers.length];
  const num4 = numbers[(seed * 19 + 13) % numbers.length];
  
  return `${letter1}${letter2}-${num1}${num2}${num3}${num4}`;
};

// Helper function to determine how many slots a vehicle type requires
const getSlotsRequired = (vehicleType: string, vehicleSize?: string) => {
  switch (vehicleType) {
    case 'truck':
      return 6; // Trucks always take 6 slots in a column
    case 'car':
      // Cars take different number of slots based on size
      switch (vehicleSize) {
        case 'large': return 2;
        case 'small': return 1;
        case 'medium': 
        default: return 1;
      }
    case 'ev': return 1;
    case 'bike': return 1;
    default: return 1;
  }
};

// Create a fixed dataset for consistent results across page reloads
const createParkingDataForFloor = (floor: string, gridSize: number = 8) => {
  // Vehicles always appear in the same positions for each floor
  const vehiclesData: {
    id: number; 
    type: 'car' | 'bike' | 'ev' | 'truck'; 
    size?: 'small' | 'medium' | 'large';
    vip: boolean;
  }[] = [];

  // Create a seeded random function
  const seededRandom = (seed: number) => {
    return () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  };

  // Initialize the random generator with a floor-specific seed
  const floorSeed = parseInt(floor) * 1000;
  const random = seededRandom(floorSeed);
  
  // Place multi-slot vehicles first (trucks and large cars) in columns
  // Floor 1 data
  if (floor === '1') {
    // Add a truck (6 slots) in column 2
    vehiclesData.push({ id: 10, type: 'truck', vip: true });
    
    // Add large cars (2 slots each) in columns 4 and 6
    vehiclesData.push({ id: 28, type: 'car', size: 'large', vip: false });
    vehiclesData.push({ id: 46, type: 'car', size: 'large', vip: true });
    
    // Add single-slot vehicles
    vehiclesData.push({ id: 1, type: 'car', size: 'small', vip: false });
    vehiclesData.push({ id: 3, type: 'bike', vip: false });
    vehiclesData.push({ id: 5, type: 'ev', vip: false });
    vehiclesData.push({ id: 20, type: 'car', size: 'medium', vip: false });
    vehiclesData.push({ id: 35, type: 'bike', vip: true });
    vehiclesData.push({ id: 40, type: 'car', size: 'medium', vip: false });
    vehiclesData.push({ id: 50, type: 'ev', vip: false });
    vehiclesData.push({ id: 55, type: 'car', size: 'small', vip: false });
  }
  // Floor 2 data
  else if (floor === '2') {
    // Add a truck (6 slots) in column 3
    vehiclesData.push({ id: 19, type: 'truck', vip: false });
    
    // Add large cars (2 slots each) in columns 1 and 7
    vehiclesData.push({ id: 1, type: 'car', size: 'large', vip: true });
    vehiclesData.push({ id: 55, type: 'car', size: 'large', vip: false });
    
    // Add single-slot vehicles
    vehiclesData.push({ id: 8, type: 'bike', vip: true });
    vehiclesData.push({ id: 16, type: 'car', size: 'medium', vip: false });
    vehiclesData.push({ id: 24, type: 'ev', vip: true });
    vehiclesData.push({ id: 32, type: 'car', size: 'small', vip: false });
    vehiclesData.push({ id: 40, type: 'bike', vip: false });
    vehiclesData.push({ id: 48, type: 'car', size: 'medium', vip: false });
  }
  // Floor 3 data
  else {
    // Add two trucks (6 slots each) in columns 5 and 8
    vehiclesData.push({ id: 37, type: 'truck', vip: true });
    vehiclesData.push({ id: 64, type: 'truck', vip: false });
    
    // Add a large car (2 slots) in column 2
    vehiclesData.push({ id: 10, type: 'car', size: 'large', vip: false });
    
    // Add single-slot vehicles
    vehiclesData.push({ id: 1, type: 'car', size: 'small', vip: false });
    vehiclesData.push({ id: 17, type: 'ev', vip: false });
    vehiclesData.push({ id: 25, type: 'bike', vip: true });
    vehiclesData.push({ id: 41, type: 'car', size: 'medium', vip: true });
    vehiclesData.push({ id: 49, type: 'ev', vip: false });
  }
  
  return vehiclesData;
};

export function useParkingSystem(floor: string): ParkingSystemResult {
  const [parkingSlots, setParkingSlots] = useState<ParkingSlot[]>([]);
  const [parkingStatus, setParkingStatus] = useState<ParkingStatus | null>(null);
  const [waitlist, setWaitlist] = useState<WaitlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Function to fetch parking data
  const fetchParkingData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Grid dimensions
      const gridSize = 8;
      const totalSlots = gridSize * gridSize;
      
      // Map slot ID to row and column
      const getRowCol = (id: number, gridSize: number) => {
        const row = Math.ceil(id / gridSize);
        const col = ((id - 1) % gridSize) + 1;
        return { row, col };
      };
      
      // Get slot ID from row and column
      const getSlotId = (row: number, col: number, gridSize: number) => {
        return (row - 1) * gridSize + col;
      };
      
      // Create empty slots
      const slots: ParkingSlot[] = [];
      for (let i = 1; i <= totalSlots; i++) {
        slots.push({ id: i, status: "available" });
      }
      
      // Get vehicle data for this floor
      const vehiclesData = createParkingDataForFloor(floor, gridSize);
      
      // Track occupied slots
      const occupiedSlots = new Set<number>();
      
      // Place vehicles
      for (const vehicleData of vehiclesData) {
        const slotId = vehicleData.id;
        if (slotId < 1 || slotId > totalSlots) continue;
        
        // Skip if this slot is already occupied
        if (occupiedSlots.has(slotId)) continue;
        
        // Calculate how many slots this vehicle needs
        const slotsNeeded = getSlotsRequired(vehicleData.type, vehicleData.size);
        
        // Get row and column for starting slot
        const { row, col } = getRowCol(slotId, gridSize);
        
        // Check if we can fit the vehicle in this column
        let canFit = true;
        const slotsToOccupy: number[] = [];
        
        if (slotsNeeded > 1) {
          // For multi-slot vehicles, check vertical space
          for (let r = row; r < row + slotsNeeded; r++) {
            if (r > gridSize) {
              canFit = false;
              break;
            }
            
            const currentSlotId = getSlotId(r, col, gridSize);
            if (occupiedSlots.has(currentSlotId)) {
              canFit = false;
              break;
            }
            
            slotsToOccupy.push(currentSlotId);
          }
        } else {
          slotsToOccupy.push(slotId);
        }
        
        if (canFit) {
          // Create the vehicle
          const arrivalTime = new Date();
          arrivalTime.setHours(arrivalTime.getHours() - Math.floor(Math.random() * 4)); // 0-3 hours ago
          
          const departureTime = new Date();
          departureTime.setHours(departureTime.getHours() + 1 + Math.floor(Math.random() * 5)); // 1-5 hours from now
          
          const vehicle: Vehicle = {
            id: slotId * 100 + parseInt(floor),
            license_plate: generateLicensePlate(slotId + parseInt(floor) * 100),
            vehicle_type: vehicleData.type,
            vehicle_size: vehicleData.size,
            arrival_time: arrivalTime.toISOString(),
            estimated_departure: departureTime.toISOString(),
            is_vip: vehicleData.vip,
            slots_occupied: slotsNeeded
          };
          
          // Occupy the slots with this vehicle
          for (const occupySlotId of slotsToOccupy) {
            const slotIndex = slots.findIndex(s => s.id === occupySlotId);
            if (slotIndex !== -1) {
              slots[slotIndex] = {
                id: occupySlotId,
                status: "occupied",
                vehicle: vehicle
              };
              occupiedSlots.add(occupySlotId);
            }
          }
        }
      }
      
      // Create consistent status data
      const status: ParkingStatus = {
        total_slots: totalSlots,
        occupied_slots: occupiedSlots.size,
        available_slots: totalSlots - occupiedSlots.size,
        floor: floor,
        waitlist_count: parseInt(floor) // More waitlist on higher floors
      };
      
      // Create consistent waitlist data
      const waitlistItems: WaitlistItem[] = [];
      for (let i = 1; i <= status.waitlist_count; i++) {
        const vehicleTypes = ['car', 'bike', 'ev', 'truck'];
        waitlistItems.push({
          id: i * 1000 + parseInt(floor),
          vehicle_type: vehicleTypes[i % vehicleTypes.length],
          arrival_time: new Date(Date.now() - i * 15 * 60000).toISOString(),
          position: i
        });
      }
      
      // Update state
      setParkingSlots(slots);
      setParkingStatus(status);
      setWaitlist(waitlistItems);
      
    } catch (err) {
      console.error("Error fetching parking data:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  }, [floor]);
  
  // Function to park a vehicle
  const parkVehicle = useCallback(async (
    vehicleType: "car" | "bike" | "ev" | "truck",
    departureHours: number,
    vehicleSize?: "small" | "medium" | "large",
    isVip?: boolean
  ) => {
    try {
      setLoading(true);
      
      // Simulate API latency
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Calculate how many slots this vehicle needs
      const slotsRequired = getSlotsRequired(vehicleType, vehicleSize);
      
      // Find a column with enough consecutive free slots
      const gridSize = 8;
      let foundColumn = -1;
      let startSlotId = -1;
      
      for (let col = 1; col <= gridSize; col++) {
        let consecutiveFree = 0;
        let firstFreeSlot = -1;
        
        // Check this column from top to bottom
        for (let row = 1; row <= gridSize; row++) {
          const slotId = (row - 1) * gridSize + col;
          const slot = parkingSlots.find(s => s.id === slotId);
          
          if (slot && slot.status === "available") {
            if (consecutiveFree === 0) {
              firstFreeSlot = slotId;
            }
            consecutiveFree++;
            
            if (consecutiveFree >= slotsRequired) {
              foundColumn = col;
              startSlotId = firstFreeSlot;
              break;
            }
          } else {
            consecutiveFree = 0;
            firstFreeSlot = -1;
          }
        }
        
        if (foundColumn !== -1) break;
      }
      
      // If we found a suitable column
      if (foundColumn !== -1 && startSlotId !== -1) {
        return {
          success: true,
          allocated: true,
          slot: {
            slot_number: startSlotId,
            floor: floor,
            size: vehicleSize || "standard",
            column: foundColumn,
            slots_occupied: slotsRequired
          },
          message: `Vehicle parked in slot ${startSlotId} (column ${foundColumn})`
        };
      } else {
        // No suitable space found
        return {
          success: true,
          allocated: false,
          position: (parkingStatus?.waitlist_count || 0) + 1,
          message: "No suitable column space available. Try another floor or join waitlist."
        };
      }
      
    } catch (err) {
      console.error("Error parking vehicle:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error occurred"
      };
    } finally {
      setLoading(false);
    }
  }, [parkingSlots, parkingStatus, floor]);
  
  // Function to initialize or reset the parking system
  const initializeParking = useCallback(async () => {
    try {
      setLoading(true);
      
      // Simulate API latency
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // After initializing, refresh the data
      await fetchParkingData();
      
      return { success: true };
    } catch (err) {
      console.error("Error initializing parking system:", err);
      setError(err instanceof Error ? err.message : "Failed to initialize parking system");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchParkingData]);
  
  // Fetch data when the component mounts or when the floor changes
  useEffect(() => {
    fetchParkingData().catch(err => {
      console.error("Error in initial data fetch:", err);
      setError("Failed to load parking data. Please try again.");
    });
  }, [fetchParkingData, floor]);
  
  return {
    parkingSlots,
    parkingStatus,
    waitlist,
    loading,
    error,
    refreshData: fetchParkingData,
    parkVehicle,
    initializeParking,
  };
}
