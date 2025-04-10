import { useState, useEffect, useCallback } from 'react';
import { 
  getParkingSlots, 
  getParkingStatus, 
  getWaitlist,
  vehicleArrival,
  initializeParking as apiInitializeParking,
  ParkingSlot,
  ParkingStatus,
  WaitlistEntry,
  AllocationResponse
} from '@/services/api';
import { toast } from 'sonner';

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

export function useBackendParking(floor: string): ParkingSystemResult {
  const [parkingSlots, setParkingSlots] = useState<ParkingSlot[]>([]);
  const [parkingStatus, setParkingStatus] = useState<ParkingStatus | null>(null);
  const [waitlist, setWaitlist] = useState<WaitlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Process slots to include multi-slot vehicle info for UI rendering
  const processSlots = useCallback((slots: ParkingSlot[]) => {
    // Create a map of vehicles to their occupied slots
    const vehicleMap = new Map();
    
    // First pass - identify which vehicles occupy multiple slots
    slots.forEach(slot => {
      if (slot.vehicle && slot.status === 'occupied') {
        const vehicleId = slot.vehicle.id;
        if (!vehicleMap.has(vehicleId)) {
          vehicleMap.set(vehicleId, []);
        }
        vehicleMap.get(vehicleId).push(slot);
      }
    });
    
    // Second pass - add multi-slot info to each slot
    return slots.map(slot => {
      if (slot.vehicle && slot.status === 'occupied') {
        const occupiedSlots = vehicleMap.get(slot.vehicle.id);
        if (occupiedSlots && occupiedSlots.length > 1) {
          // This is a multi-slot vehicle
          // Sort slots by slot_number
          const sortedSlots = [...occupiedSlots].sort((a, b) => a.slot_number - b.slot_number);
          const firstSlot = sortedSlots[0];
          const isFirstSlot = slot.slot_number === firstSlot.slot_number;
          
          // Return the slot with multi-slot information
          return {
            ...slot,
            isPartOfGroup: true,
            groupId: slot.vehicle.id,
            isGroupStart: isFirstSlot,
            groupSize: occupiedSlots.length
          };
        }
      }
      return slot;
    });
  }, []);

  // Fetch all data from the backend
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Fetching data for floor:", floor);
      
      // Fetch slots
      const slots = await getParkingSlots(floor);
      
      // Process slots to add multi-slot vehicle information
      const processedSlots = processSlots(slots);
      setParkingSlots(processedSlots);
      
      // Fetch status
      const status = await getParkingStatus(floor);
      setParkingStatus(status);
      
      // Fetch waitlist
      const waitlistData = await getWaitlist();
      setWaitlist(
        Array.isArray(waitlistData) 
          ? waitlistData.map(entry => ({
              id: entry.id,
              vehicle_type: (entry as any).vehicle_type || "unknown",
              arrival_time: (entry as any).arrival_time || new Date().toISOString(),
              position: entry.position
            }))
          : []
      );
      
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err instanceof Error ? err.message : "Failed to load parking data");
      toast.error("Failed to load parking data", {
        description: err instanceof Error ? err.message : "Unknown error occurred",
      });
    } finally {
      setLoading(false);
    }
  }, [floor, processSlots]);

  // Park a vehicle
  const parkVehicle = useCallback(async (
    vehicleType: "car" | "bike" | "ev" | "truck",
    departureHours: number,
    vehicleSize?: "small" | "medium" | "large",
    isVip?: boolean
  ): Promise<AllocationResponse> => {
    try {
      setLoading(true);
      
      // Generate a random license plate
      const generateRandomPlate = () => {
        const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
        const numbers = '0123456789';
        
        const getRandomChar = (str: string) => str[Math.floor(Math.random() * str.length)];
        
        const letter1 = getRandomChar(letters);
        const letter2 = getRandomChar(letters);
        const num1 = getRandomChar(numbers);
        const num2 = getRandomChar(numbers);
        const num3 = getRandomChar(numbers);
        const num4 = getRandomChar(numbers);
        
        return `${letter1}${letter2}-${num1}${num2}${num3}${num4}`;
      };
      
      console.log(`Parking ${vehicleType} vehicle for ${departureHours} hours, size: ${vehicleSize}, VIP: ${isVip}`);
      
      // Call the API
      const result = await vehicleArrival({
        license_plate: generateRandomPlate(),
        vehicle_type: vehicleType,
        vehicle_size: vehicleSize,
        estimated_departure_hours: departureHours,
        floor: floor,
        is_vip: isVip
      });
      
      // Refresh data after a successful operation
      fetchData();
      
      return result;
    } catch (error) {
      console.error("Error parking vehicle:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [floor, fetchData]);

  // Initialize parking system
  const initializeParking = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Call API to initialize
      const result = await apiInitializeParking();
      
      // Refresh data
      await fetchData();
      
      return { success: true };
    } catch (error) {
      console.error("Error initializing parking system:", error);
      setError(error instanceof Error ? error.message : "Failed to initialize parking system");
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  // Load data when component mounts or floor changes
  useEffect(() => {
    fetchData();
  }, [fetchData, floor]);

  return {
    parkingSlots,
    parkingStatus,
    waitlist,
    loading,
    error,
    refreshData: fetchData,
    parkVehicle,
    initializeParking
  };
}
