"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronUpIcon, ChevronDownIcon, MoveIcon } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";

interface FloorNavigationProps {
  currentFloor: string;
  floors: string[];
  onFloorChange: (floor: string) => void;
}

export function FloorNavigation({ currentFloor, floors, onFloorChange }: FloorNavigationProps) {
  const [isDragging, setIsDragging] = useState(false);
  
  const prevFloor = () => {
    const currentIndex = floors.indexOf(currentFloor);
    if (currentIndex > 0) {
      onFloorChange(floors[currentIndex - 1]);
    }
  };
  
  const nextFloor = () => {
    const currentIndex = floors.indexOf(currentFloor);
    if (currentIndex < floors.length - 1) {
      onFloorChange(floors[currentIndex + 1]);
    }
  };

  return (
    <div className="fixed left-6 sm:left-8 lg:left-10 top-1/2 -translate-y-1/2 flex flex-col gap-2 md:gap-3 z-30 drop-shadow-md">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              onClick={prevFloor}
              className={`h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                floors.indexOf(currentFloor) > 0
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "bg-muted/60 text-muted-foreground cursor-not-allowed"
              }`}
              whileHover={{
                scale: floors.indexOf(currentFloor) > 0 ? 1.1 : 1,
                y: floors.indexOf(currentFloor) > 0 ? -2 : 0,
              }}
              whileTap={{ scale: floors.indexOf(currentFloor) > 0 ? 0.95 : 1 }}
              disabled={floors.indexOf(currentFloor) === 0}
            >
              <ChevronUpIcon className="h-5 w-5" />
            </motion.button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Previous floor</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Floor indicator - improved visibility */}
      <motion.div 
        className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-card flex items-center justify-center font-bold text-lg border border-primary/50 shadow-lg backdrop-blur-sm"
        whileTap={{ scale: 0.97 }}
        whileHover={{ 
          boxShadow: "0 0 12px rgba(255, 255, 255, 0.3)",
          scale: 1.02 
        }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={(e, info) => {
          setIsDragging(false);
          // If dragged down by enough distance, go down a floor
          if (info.offset.y > 20) {
            nextFloor();
          }
          // If dragged up by enough distance, go up a floor
          else if (info.offset.y < -20) {
            prevFloor();
          }
        }}
      >
        <span className="text-xl md:text-2xl">{currentFloor}</span>
        <MoveIcon className="absolute h-3 w-3 text-muted-foreground/40 bottom-1 right-1" />
      </motion.div>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              onClick={nextFloor}
              className={`h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                floors.indexOf(currentFloor) < floors.length - 1
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "bg-muted/60 text-muted-foreground cursor-not-allowed"
              }`}
              whileHover={{
                scale: floors.indexOf(currentFloor) < floors.length - 1 ? 1.1 : 1,
                y: floors.indexOf(currentFloor) < floors.length - 1 ? 2 : 0,
              }}
              whileTap={{
                scale: floors.indexOf(currentFloor) < floors.length - 1 ? 0.95 : 1,
              }}
              disabled={floors.indexOf(currentFloor) === floors.length - 1}
            >
              <ChevronDownIcon className="h-5 w-5" />
            </motion.button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Next floor</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}