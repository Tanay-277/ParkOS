"use client";

import { useState, useEffect, useRef } from "react";
import { SignalIcon } from "lucide-react";
import { throttle } from "@/lib/performance";

interface ApiStatusIndicatorProps {
  pollInterval?: number;
  apiUrl?: string;
  className?: string;
}

/**
 * API Status Indicator component that shows connection status with backend
 * Features automated retry with exponential backoff
 */
export function ApiStatusIndicator({
  pollInterval = 60000, // Default to 60s between checks
  apiUrl,
  className = ""
}: ApiStatusIndicatorProps) {
  const [apiConnected, setApiConnected] = useState(true);
  const [checkFailed, setCheckFailed] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const attemptCount = useRef(0);
  const API_BASE_URL = apiUrl || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

  // Throttled check function to prevent excessive requests
  const checkApiStatus = throttle(async () => {
    try {
      setIsRetrying(attemptCount.current > 0);
      // Use a simple GET request to the health endpoint
      const controller = new AbortController();
      const abortTimeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`${API_BASE_URL}/health`, {
        method: "GET",
        signal: controller.signal,
        cache: "no-store",
      });

      clearTimeout(abortTimeoutId);

      if (response.ok) {
        setApiConnected(true);
        setCheckFailed(false);
        attemptCount.current = 0;
      } else {
        console.warn(`API health check returned status ${response.status}`);
        setApiConnected(false);
        setCheckFailed(true);
        attemptCount.current++;
      }
    } catch (error) {
      console.warn("API health check failed:", error);
      setApiConnected(false);
      setCheckFailed(true);
      attemptCount.current++;
    } finally {
      setIsRetrying(false);
    }
  }, 3000);  // Throttle to once every 3 seconds at most

  // Check API status with exponential backoff
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    // Initial check
    checkApiStatus();

    // Set up polling with exponential backoff on failure
    const scheduleNextCheck = () => {
      const backoffFactor = Math.min(attemptCount.current, 5); // Cap at 5 for reasonable max time
      const nextInterval =
        attemptCount.current === 0
          ? pollInterval
          : Math.min(pollInterval * Math.pow(1.5, backoffFactor), 60000); // Max 1 minute

      if (process.env.NODE_ENV !== "production") {
        console.log(`Next API check in ${Math.round(nextInterval / 1000)}s`);
      }
      
      timeoutId = setTimeout(checkApiStatus, nextInterval);
    };

    scheduleNextCheck();
    return () => clearTimeout(timeoutId);
  }, [checkApiStatus, pollInterval]);

  // Only show when disconnected (after a check has failed) to reduce visual noise
  if (apiConnected || !checkFailed) return null;

  return (
    <div className={`fixed top-16 left-2 z-50 px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 bg-destructive/20 text-destructive ${className}`}>
      <SignalIcon className={`size-4 ${isRetrying ? "animate-pulse" : ""}`} />
      <span>{isRetrying ? "Reconnecting..." : "API Disconnected"}</span>
    </div>
  );
}
