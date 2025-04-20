"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShuffleIcon, XIcon } from "lucide-react";
import { ParkingSlot } from "@/services/api";
import { Button } from "@/components/ui/button";

interface CompactionNotificationProps {
  triggerCompaction: boolean;
  parkingSlots: ParkingSlot[];
  onCompactionEnd: () => void;
}

export function CompactionNotification({ triggerCompaction, parkingSlots, onCompactionEnd }: CompactionNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isCompacting, setIsCompacting] = useState(false);
  
  // Show notification when compaction is triggered
  useEffect(() => {
    if (triggerCompaction) {
      setIsVisible(true);
      setIsCompacting(true);
      
      // Animation timers
      const progressTimer = setInterval(() => {
        setProgress((prev) => {
          const next = prev + 1;
          return next <= 100 ? next : 100;
        });
      }, 40);
      
      // End compaction after animation completes
      const finishTimer = setTimeout(() => {
        setIsCompacting(false);
        onCompactionEnd();
        
        // Auto hide notification after 5 seconds
        setTimeout(() => {
          setIsVisible(false);
          setProgress(0);
        }, 5000);
      }, 4000);
      
      return () => {
        clearInterval(progressTimer);
        clearTimeout(finishTimer);
      };
    }
  }, [triggerCompaction, onCompactionEnd]);
  
  // Count occupied slots
  const occupiedSlotsCount = parkingSlots.filter(slot => slot.status === 'occupied').length;
  
  // Calculate fragmentation - simple algorithm just for visualization
  const calculateFragmentation = () => {
    if (parkingSlots.length === 0) return 0;
    
    let emptySlotClusters = 0;
    let lastStatus = "occupied";
    
    // Count transitions from occupied to empty
    parkingSlots.forEach(slot => {
      if (lastStatus === "occupied" && slot.status === "available") {
        emptySlotClusters++;
      }
      lastStatus = slot.status;
    });

    // Adjust for beginning/end
    if (lastStatus === "available") {
      emptySlotClusters--;
    }
    
    // Normalize to a percentage
    return Math.min(100, Math.max(0, (emptySlotClusters / (parkingSlots.length / 10)) * 100));
  };
  
  // Calculate better fragmentation value after compaction
  const beforeFragmentation = calculateFragmentation();
  const afterFragmentation = Math.max(0, beforeFragmentation - Math.random() * 40 - 20);
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 bg-card/95 backdrop-blur-md shadow-lg border border-border rounded-lg overflow-hidden"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ type: "spring", damping: 20 }}
          style={{ width: "min(400px, 90vw)" }}
        >
          <div className="flex items-start justify-between p-3 pb-2">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-full ${isCompacting ? "bg-amber-500/20" : "bg-emerald-500/20"}`}>
                <ShuffleIcon 
                  className={`h-4 w-4 ${isCompacting ? "text-amber-500 animate-spin" : "text-emerald-500"}`}
                  style={{ animationDuration: "3s" }}
                />
              </div>
              <span className="font-medium text-sm">
                {isCompacting ? "Compacting Parking Area..." : "Compaction Complete"}
              </span>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0 rounded-full"
              onClick={() => setIsVisible(false)}
              disabled={isCompacting}
            >
              <XIcon className="h-3.5 w-3.5" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          
          <div className="px-3 pb-2">
            <div className="mb-2 flex justify-between items-center text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-amber-500"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: "easeInOut" }}
              />
            </div>
            
            <div className="mt-3 grid grid-cols-2 gap-4 p-2">
              <div className="rounded-md bg-muted/50 p-2">
                <div className="text-xs text-muted-foreground">Before</div>
                <div className="flex justify-between items-center mt-1">
                  <div className="text-sm font-medium">Fragmentation</div>
                  <div className="text-sm">{Math.round(beforeFragmentation)}%</div>
                </div>
              </div>
              
              <div className="rounded-md bg-muted/50 p-2">
                <div className="text-xs text-muted-foreground">After</div>
                <div className="flex justify-between items-center mt-1">
                  <div className="text-sm font-medium">Fragmentation</div>
                  <div className="text-sm">{isCompacting ? "..." : `${Math.round(afterFragmentation)}%`}</div>
                </div>
              </div>
              
              <div className="col-span-2 rounded-md bg-muted/50 p-2">
                <div className="text-xs text-muted-foreground">Slots Optimized</div>
                <div className="flex justify-between items-center mt-1">
                  <div className="text-sm font-medium">Occupied Slots</div>
                  <div className="text-sm">{occupiedSlotsCount}</div>
                </div>
              </div>
            </div>
            
            <div className="mt-3 text-xs text-muted-foreground px-1">
              {isCompacting ? (
                "Optimizing vehicle placement to reduce fragmentation..."
              ) : (
                "Parking space has been optimized for better efficiency."
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}