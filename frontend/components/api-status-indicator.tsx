"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircleIcon, CheckCircleIcon, ServerIcon } from "lucide-react";
import { checkApiStatus, ApiStatus } from "@/utils/api-status";

interface ApiStatusIndicatorProps {
  className?: string;
  pollInterval?: number; // in ms
}

export function ApiStatusIndicator({ 
  className = "",
  pollInterval = 30000  // Default: check every 30 seconds
}: ApiStatusIndicatorProps) {
  const [status, setStatus] = useState<ApiStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // Initial check
    checkStatus();
    
    // Set up polling
    const intervalId = setInterval(checkStatus, pollInterval);
    
    return () => clearInterval(intervalId);
    
    async function checkStatus() {
      setLoading(true);
      try {
        const result = await checkApiStatus();
        setStatus(result);
      } catch (error) {
        console.error("Error checking API status:", error);
        setStatus({
          connected: false,
          corsOk: false,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      } finally {
        setLoading(false);
      }
    }
  }, [pollInterval]);
  
  // Don't show anything while first check is running
  if (!status && loading) return null;
  
  const isConnected = status?.connected;
  const hasCorsIssue = status?.connected === false && status?.error?.includes('CORS');
  
  return (
    <motion.div 
      className={`fixed bottom-2 left-2 z-50 rounded-lg shadow-md ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div 
        className={`${
          isConnected 
            ? "bg-green-500/80" 
            : hasCorsIssue 
              ? "bg-amber-500/80" 
              : "bg-red-500/80"
        } backdrop-blur-md p-2 rounded-lg text-xs text-white flex items-center gap-2 cursor-pointer`}
        onClick={() => setExpanded(!expanded)}
        whileHover={{ scale: 1.02 }}
      >
        {loading ? (
          <motion.div 
            animate={{ rotate: 360 }} 
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          >
            <ServerIcon className="h-3.5 w-3.5" />
          </motion.div>
        ) : isConnected ? (
          <CheckCircleIcon className="h-3.5 w-3.5" />
        ) : (
          <AlertCircleIcon className="h-3.5 w-3.5" />
        )}
        <span>API: {isConnected ? "Connected" : hasCorsIssue ? "CORS Error" : "Disconnected"}</span>
      </motion.div>
      
      {expanded && status && (
        <motion.div 
          className="mt-1 bg-card/95 backdrop-blur-md p-3 rounded-lg text-xs shadow-lg border border-border/50 max-w-[260px]"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.2 }}
        >
          <div className="font-medium mb-2">API Status</div>
          
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Connection:</span>
              <span className={isConnected ? "text-green-500" : "text-red-500"}>
                {isConnected ? "OK" : "Failed"}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">CORS:</span>
              <span className={status.corsOk ? "text-green-500" : "text-amber-500"}>
                {status.corsOk ? "OK" : "Issue"}
              </span>
            </div>
            
            {status.apiInfo && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Version:</span>
                  <span>{status.apiInfo.api_version}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Slots:</span>
                  <span>{status.apiInfo.total_slots}</span>
                </div>
              </>
            )}
            
            {status.error && (
              <div className="text-red-400 text-[10px] mt-2 break-words leading-tight">
                {status.error}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
