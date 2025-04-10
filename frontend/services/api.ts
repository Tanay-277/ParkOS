/**
 * API service for interacting with the ParkOS backend
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Simple cache implementation
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5000; // 5 seconds cache lifetime

// Type definitions
export interface ParkingSlot {
  id: number;
  slot_number: number;
  floor: string;
  status: string;
  slot_type: string;
  position: { x: number; y: number };
  vehicle?: {
    id: number;
    license_plate: string;
    vehicle_type: string;
    vehicle_size?: string;
    arrival_time: string;
    estimated_departure?: string;
    is_vip?: boolean;
    slots_occupied?: number;
  };
}

export interface ParkingStatus {
  floor: string;
  total_slots: number;
  available_slots: number;
  occupied_slots: number;
  occupancy_rate: number;
  waitlist_count: number;
}

export interface WaitlistEntry {
  id: number;
  entry_time: string;
  priority: number;
  position: number;
  vehicle: {
    id: number;
    license_plate: string;
    vehicle_type: string;
    arrival_time: string;
    estimated_departure: string;
  };
}

export interface VehicleArrivalRequest {
  license_plate: string;
  vehicle_type: 'car' | 'bike' | 'ev' | 'truck';
  vehicle_size?: 'small' | 'medium' | 'large';
  estimated_departure_hours: number;
  floor?: string;
  is_vip?: boolean;
  is_emergency?: boolean;
}

export interface VehicleDepartureRequest {
  license_plate: string;
}

export interface ExtendStayRequest {
  license_plate: string;
  additional_hours: number;
}

export interface AllocationResponse {
  success: boolean;
  message: string;
  allocated: boolean;
  slot?: ParkingSlot;
  waitlist_position?: number;
}

/**
 * Clear the API cache
 */
export function clearCache() {
  console.log("Clearing API cache");
  cache.clear();
}

/**
 * Make a API request with proper error handling and retry logic
 */
async function makeRequest<T>(
  url: string, 
  options: RequestInit = {}, 
  retryCount: number = 2
): Promise<T> {
  const fetchWithTimeout = async (timeoutMs: number = 10000): Promise<Response> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const response = await fetch(`${API_URL}${url}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
        mode: 'cors',
      });
      
      return response;
    } finally {
      clearTimeout(timeout);
    }
  };
  
  try {
    console.log(`Fetching: ${API_URL}${url}`);
    const response = await fetchWithTimeout();
    
    if (!response.ok) {
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || response.statusText;
      } catch (e) {
        errorMessage = response.statusText;
      }
      
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    if (retryCount > 0 && error instanceof Error && error.name === 'AbortError') {
      console.warn(`Request timed out. Retrying... (${retryCount} attempts left)`);
      return makeRequest(url, options, retryCount - 1);
    }
    
    console.error(`API request failed: ${url}`, error);
    throw error;
  }
}

/**
 * Make a cached API request
 */
async function cachedRequest<T>(
  url: string, 
  options: RequestInit = {}, 
  useCache: boolean = true,
  ttl: number = CACHE_TTL
): Promise<T> {
  const cacheKey = `${options.method || 'GET'}:${url}:${options.body || ''}`;
  
  // Check if we have a valid cached response
  if (useCache && options.method !== 'POST') {
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < ttl) {
      console.log(`Using cached data for ${url}`);
      return cached.data;
    }
  }
  
  // Make the actual request
  const data = await makeRequest<T>(url, options);
  
  // Cache the response if it's a GET request
  if (useCache && (!options.method || options.method === 'GET')) {
    cache.set(cacheKey, { data, timestamp: Date.now() });
  }
    
  return data;
}

/**
 * Process parking slots to identify and group multi-slot vehicles
 */
export function processMultiSlotVehicles(slots: ParkingSlot[]): ParkingSlot[] {
  const vehicleMap = new Map();
  
  // First pass - identify which vehicle occupies which slots
  slots.forEach(slot => {
    if (slot.vehicle && slot.status === 'occupied') {
      const vehicleId = slot.vehicle.id;
      if (!vehicleMap.has(vehicleId)) {
        vehicleMap.set(vehicleId, []);
      }
      vehicleMap.get(vehicleId).push(slot);
    }
  });
  
  // Second pass - enhance slots with grouping information
  return slots.map(slot => {
    if (slot.vehicle && slot.status === 'occupied') {
      const occupiedSlots = vehicleMap.get(slot.vehicle.id);
      if (occupiedSlots && occupiedSlots.length > 1) {
        // Sort slots by number to find the first one
        const sortedSlots = [...occupiedSlots].sort((a, b) => a.slot_number - b.slot_number);
        const isFirstSlot = slot.slot_number === sortedSlots[0].slot_number;
        
        // Return enhanced slot with group info
        return {
          ...slot,
          multi_slot: true,
          group_first: isFirstSlot,
          group_size: occupiedSlots.length,
          group_id: slot.vehicle.id
        };
      }
    }
    return slot;
  });
}

/**
 * Get all parking slots with optional floor filtering
 */
export async function getParkingSlots(floor?: string): Promise<ParkingSlot[]> {
  const url = `/slots${floor ? `?floor=${floor}` : ''}`;
  const slots = await cachedRequest<ParkingSlot[]>(url);
  
  // Process multi-slot vehicles before returning
  return processMultiSlotVehicles(slots);
}

/**
 * Get current parking status
 */
export async function getParkingStatus(floor?: string): Promise<ParkingStatus> {
  const url = `/status${floor ? `?floor=${floor}` : ''}`;
  return cachedRequest<ParkingStatus>(url);
}

/**
 * Get current waitlist
 */
export async function getWaitlist(): Promise<WaitlistEntry[]> {
  return cachedRequest<WaitlistEntry[]>('/waitlist');
}

/**
 * Park a vehicle - never cache this operation
 */
export async function vehicleArrival(request: VehicleArrivalRequest): Promise<AllocationResponse> {
  try {
    console.log("Sending vehicleArrival request:", request);
    const data = await cachedRequest<AllocationResponse>('/arrive', {
      method: 'POST',
      body: JSON.stringify(request),
    }, false); // Don't use cache for POST requests
    
    // Invalidate related caches after a successful POST
    clearCache();
    
    return data;
  } catch (error) {
    console.error("Vehicle arrival error:", error);
    throw new Error(`Error registering vehicle arrival: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Initialize the parking system - never cache this operation
 */
export async function initializeParking(): Promise<{ message: string }> {
  try {
    console.log("Initializing parking system");
    const data = await makeRequest<{ message: string }>('/initialize', {
      method: 'POST',
    }); 
    
    // Clear entire cache after initialization
    clearCache();
    
    return data;
  } catch (error) {
    console.error("Initialization error:", error);
    throw new Error(`Error initializing parking system: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Register vehicle departure
 */
export async function vehicleDeparture(request: VehicleDepartureRequest): Promise<{ success: boolean; message: string }> {
  try {
    const data = await makeRequest<{ success: boolean; message: string }>('/depart', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    
    // Invalidate cache after vehicle departure
    clearCache();
    
    return data;
  } catch (error) {
    console.error("Vehicle departure error:", error);
    throw error;
  }
}

/**
 * Extend vehicle stay
 */
export async function extendVehicleStay(request: ExtendStayRequest): Promise<{ success: boolean; message: string }> {
  try {
    const data = await makeRequest<{ success: boolean; message: string }>('/extend', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    
    // Invalidate cache after extending stay
    clearCache();
    
    return data;
  } catch (error) {
    console.error("Extend vehicle stay error:", error);
    throw error;
  }
}

/**
 * Health check function to verify API connectivity
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout
    
    // Try with a simple GET request to the health endpoint
    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.log("API health check failed:", error);
    return false;
  }
}

