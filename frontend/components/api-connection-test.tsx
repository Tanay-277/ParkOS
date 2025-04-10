"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { checkApiHealth } from "@/services/api";
import { RefreshCwIcon, CheckCircleIcon, AlertTriangleIcon, ServerIcon } from "lucide-react";

export function ApiConnectionTest() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiUrl, setApiUrl] = useState("");
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  useEffect(() => {
    setApiUrl(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1');
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setIsLoading(true);
    try {
      const connected = await checkApiHealth();
      setIsConnected(connected);
      setLastChecked(new Date());
    } catch (error) {
      console.error("Connection check error:", error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 bg-card rounded-lg border border-border shadow-sm">
      <h2 className="text-lg font-medium mb-3 flex items-center gap-2">
        <ServerIcon size={18} />
        API Connection Test
      </h2>
      
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">
          API URL: <code className="bg-muted px-1 py-0.5 rounded">{apiUrl}</code>
        </p>
        
        <div className="flex items-center gap-2">
          <div className="flex-1">
            {isConnected === null ? (
              <p className="text-sm">Checking connection...</p>
            ) : isConnected ? (
              <div className="flex items-center gap-2 text-green-500">
                <CheckCircleIcon size={16} />
                <span className="text-sm">Connected to backend</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangleIcon size={16} />
                <span className="text-sm">Failed to connect to backend</span>
              </div>
            )}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={checkConnection}
            disabled={isLoading}
          >
            {isLoading ? (
              <RefreshCwIcon className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <RefreshCwIcon className="h-3 w-3 mr-1" />
            )}
            Test
          </Button>
        </div>
        
        {lastChecked && (
          <p className="text-xs text-muted-foreground">
            Last checked: {lastChecked.toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  );
}
