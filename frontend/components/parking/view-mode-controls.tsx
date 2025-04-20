"use client";

import { motion } from "framer-motion";
import { Scale3DIcon, PanelTopIcon, LayersIcon, ViewIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ViewModeControlsProps {
  viewMode: "3d" | "2d";
  showAllFloors: boolean;
  onViewModeChange: (mode: "3d" | "2d") => void;
  onShowAllFloorsChange: (show: boolean) => void;
}

export function ViewModeControls({
  viewMode,
  showAllFloors,
  onViewModeChange,
  onShowAllFloorsChange
}: ViewModeControlsProps) {
  return (
    <div className="fixed right-3 sm:right-4 lg:right-6 top-1/2 -translate-y-1/2 flex flex-col gap-2 md:gap-3 z-30">
      {/* View mode controls */}
      {!showAllFloors && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col gap-2"
        >
          <motion.button
            onClick={() => onViewModeChange("3d")}
            className={`h-9 w-9 md:h-10 md:w-10 rounded-full flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 ${
              viewMode === "3d"
                ? "bg-primary text-primary-foreground"
                : "bg-muted/80 text-muted-foreground hover:bg-muted/90"
            }`}
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.95 }}
            title="3D View"
            aria-label="Enable 3D View"
            aria-pressed={viewMode === "3d"}
          >
            <Scale3DIcon className="h-4 w-4 md:h-5 md:w-5" />
          </motion.button>

          <motion.button
            onClick={() => onViewModeChange("2d")}
            className={`h-9 w-9 md:h-10 md:w-10 rounded-full flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 ${
              viewMode === "2d"
                ? "bg-primary text-primary-foreground"
                : "bg-muted/80 text-muted-foreground hover:bg-muted/90"
            }`}
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.95 }}
            title="2D View"
            aria-label="Enable 2D View"
            aria-pressed={viewMode === "2d"}
          >
            <PanelTopIcon className="h-4 w-4 md:h-5 md:w-5" />
          </motion.button>
        </motion.div>
      )}

      {/* All floors toggle */}
      <motion.div
        className="mt-1"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                onClick={() => onShowAllFloorsChange(!showAllFloors)}
                className={`h-9 w-9 md:h-10 md:w-10 rounded-full flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                  showAllFloors
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/80 text-muted-foreground hover:bg-muted/90"
                }`}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                aria-pressed={showAllFloors}
              >
                {showAllFloors ? (
                  <ViewIcon className="h-4 w-4 md:h-5 md:w-5" />
                ) : (
                  <LayersIcon className="h-4 w-4 md:h-5 md:w-5" />
                )}
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>{showAllFloors ? "Single Floor View" : "All Floors View"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </motion.div>
    </div>
  );
}