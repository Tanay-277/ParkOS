"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ApiConnectionTest } from "@/components/api-connection-test";
import { Button } from "@/components/ui/button";
import { checkApiHealth, initializeParking } from "@/services/api";
import { toast } from "sonner";
import { ArrowLeft, DatabaseIcon, SettingsIcon } from "lucide-react";
import Link from "next/link";
import { isLowPerformanceDevice } from "@/lib/performance";

export default function SettingsPage() {
  const [backendStatus, setBackendStatus] = useState<boolean | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isLowPerformance, setIsLowPerformance] = useState(false);

  useEffect(() => {
    setIsLowPerformance(isLowPerformanceDevice());
    
    const checkBackendStatus = async () => {
      try {
        const isConnected = await checkApiHealth();
        setBackendStatus(isConnected);
      } catch (error) {
        setBackendStatus(false);
        console.error("Failed to check backend status:", error);
      }
    };
    
    checkBackendStatus();
  }, []);
  
  const handleInitializeSystem = async () => {
    setIsInitializing(true);
    try {
      await initializeParking();
      toast.success("Parking system initialized successfully");
    } catch (error) {
      toast.error("Failed to initialize parking system", {
        description: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft size={18} />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <SettingsIcon size={22} /> Settings
            </h1>
          </div>
        </div>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <ApiConnectionTest />
          </motion.div>
          
          <motion.div
            className="p-4 bg-card rounded-lg border border-border shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-lg font-medium mb-3 flex items-center gap-2">
              <DatabaseIcon size={18} />
              System Management
            </h2>
            
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Initialize or reset the parking system database
              </p>
              
              <Button
                variant="destructive"
                onClick={handleInitializeSystem}
                disabled={isInitializing || backendStatus === false}
                className="w-full"
              >
                {isInitializing ? (
                  <>Initializing...</>
                ) : (
                  <>Initialize Parking System</>
                )}
              </Button>
            </div>
          </motion.div>
          
          <motion.div
            className="p-4 bg-card rounded-lg border border-border shadow-sm md:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h2 className="text-lg font-medium mb-3">System Information</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium">Frontend</h3>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <li>Version: {process.env.NEXT_PUBLIC_APP_VERSION || 'development'}</li>
                  <li>Environment: {process.env.NODE_ENV}</li>
                  <li>Device Performance: {isLowPerformance ? 'Low' : 'Normal/High'}</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-sm font-medium">Backend</h3>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <li>Status: {
                    backendStatus === null ? 'Checking...' : 
                    backendStatus ? 'Connected' : 'Disconnected'
                  }</li>
                  <li>URL: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
