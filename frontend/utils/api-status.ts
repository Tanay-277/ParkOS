/**
 * Utility to check API connectivity and CORS status
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export interface ApiStatus {
  connected: boolean;
  corsOk: boolean;
  error?: string;
  apiInfo?: any;
}

/**
 * Check if the API is reachable and CORS is properly configured
 */
export async function checkApiStatus(): Promise<ApiStatus> {
  try {
    // Use the health endpoint to check CORS and API status
    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      return {
        connected: false,
        corsOk: true, // CORS is working if we got a response
        error: `API responded with ${response.status}: ${response.statusText}`
      };
    }
    
    // Get more detailed info if available
    let debugInfo = null;
    try {
      const debugResponse = await fetch(`${API_URL}/debug`);
      if (debugResponse.ok) {
        debugInfo = await debugResponse.json();
      }
    } catch (err) {
      console.log("Debug endpoint not available", err);
    }
    
    const data = await response.json();
    
    return {
      connected: true,
      corsOk: true,
      apiInfo: debugInfo || data
    };
  } catch (error) {
    return {
      connected: false,
      corsOk: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Test API connectivity with simple health check
 */
export async function pingApi(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    return response.ok;
  } catch (error) {
    console.error("API ping failed:", error);
    return false;
  }
}
