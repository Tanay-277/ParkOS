"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock3Icon, ListOrderedIcon, XIcon, AlertCircleIcon, CarIcon, BikeIcon, BatteryChargingIcon, TruckIcon, ZapIcon } from "lucide-react";
import { WaitlistEntry } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { vehicleDeparture } from "@/services/api";
import { toast } from "sonner";

interface WaitlistPanelProps {
  waitlist: WaitlistEntry[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function WaitlistPanel({ waitlist, isLoading, onRefresh }: WaitlistPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Auto close the panel when the waitlist becomes empty
  useEffect(() => {
    if (waitlist.length === 0 && isOpen) {
      setIsOpen(false);
    }
  }, [waitlist, isOpen]);
  
  // Auto open the panel when new vehicles are added to the waitlist
  useEffect(() => {
    if (waitlist.length > 0 && !isOpen) {
      setIsOpen(true);
      
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setIsOpen(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [waitlist.length]);
  
  // Format the date in a readable way
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return "";
    }
  };
  
  // Render the icon based on vehicle type
  const renderVehicleIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'car':
        return <CarIcon className="h-4 w-4" />;
      case 'bike':
        return <BikeIcon className="h-4 w-4" />;
      case 'ev':
        return <BatteryChargingIcon className="h-4 w-4" />;
      case 'truck':
        return <TruckIcon className="h-4 w-4" />;
      default:
        return <CarIcon className="h-4 w-4" />;
    }
  };
  
  const handleRemoveFromWaitlist = async (licensePlate: string) => {
    try {
      await vehicleDeparture({ license_plate: licensePlate });
      toast.success(`Vehicle ${licensePlate} removed from waitlist`);
      onRefresh();
    } catch (error) {
      toast.error(`Failed to remove vehicle: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  const waitlistCount = waitlist.length;
  
  return (
    <>
      {/* Waitlist indicator button */}
      {waitlistCount > 0 && (
        <div className="fixed bottom-16 right-4 z-40">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  className={`rounded-full px-3 py-1 flex items-center gap-1.5 text-xs font-medium ${isOpen ? "bg-amber-500/80 text-black" : "bg-amber-500/30 text-amber-500"}`}
                  onClick={() => setIsOpen(!isOpen)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: 1, 
                    opacity: 1,
                    y: [0, -3, 0],
                  }}
                  transition={{ 
                    y: { 
                      repeat: Infinity,
                      repeatDelay: 1.5,
                      duration: 0.8
                    }
                  }}
                >
                  <ListOrderedIcon className="h-3.5 w-3.5" />
                  <span>{waitlistCount} in waitlist</span>
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>{isOpen ? 'Hide' : 'Show'} waitlist</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
      
      {/* Waitlist panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="fixed bottom-24 right-4 z-40 bg-card/95 backdrop-blur-md shadow-lg border border-border rounded-lg overflow-hidden w-[300px]"
            initial={{ opacity: 0, scale: 0.9, x: 50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: 50 }}
            transition={{ type: "spring", damping: 20 }}
          >
            <div className="flex items-center justify-between px-4 py-2 border-b border-border">
              <h3 className="font-medium text-sm flex items-center gap-1.5">
                <ListOrderedIcon className="h-4 w-4 text-amber-500" />
                Waitlist ({waitlistCount})
              </h3>
              
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 w-7 p-0 rounded-full"
                  onClick={onRefresh}
                  disabled={isLoading}
                >
                  <Clock3Icon className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span className="sr-only">Refresh</span>
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 w-7 p-0 rounded-full"
                  onClick={() => setIsOpen(false)}
                >
                  <XIcon className="h-3.5 w-3.5" />
                  <span className="sr-only">Close</span>
                </Button>
              </div>
            </div>
            
            <div className="max-h-[250px] overflow-y-auto">
              {waitlist.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  <p>No vehicles in waitlist</p>
                </div>
              ) : (
                <ul className="divide-y divide-border/50">
                  {waitlist.map((entry) => (
                    <li key={entry.id} className="p-3 hover:bg-muted/30">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-md ${entry.vehicle.vehicle_type === 'car' ? 'bg-indigo-500/15' : entry.vehicle.vehicle_type === 'bike' ? 'bg-emerald-500/15' : entry.vehicle.vehicle_type === 'ev' ? 'bg-orange-500/15' : 'bg-red-500/15'}`}>
                            {renderVehicleIcon(entry.vehicle.vehicle_type)}
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-1 text-sm font-medium">
                              {entry.vehicle.license_plate}
                              {entry.priority > 1 && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="inline-flex">
                                        <ZapIcon className="h-3 w-3 text-yellow-500" />
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>VIP Priority</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>Position {entry.position}</span>
                              <span>·</span>
                              <span>{formatDate(entry.entry_time)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemoveFromWaitlist(entry.vehicle.license_plate)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <div className="px-3 py-2 bg-background/50 text-xs text-muted-foreground border-t border-border">
              <div className="flex items-center gap-1">
                <AlertCircleIcon className="h-3 w-3" />
                <span>Vehicles will be parked automatically when slots become available</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}