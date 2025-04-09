"use client";

import { motion, AnimatePresence } from "framer-motion";
import React from "react";

interface ParkingSlot {
  id: number;
  status: string;
}

interface ParkingGridProps {
  gridSize: number;
  parkingSlots: ParkingSlot[];
  allocatedSlot: number | null;
  animateGrid: boolean;
  floor: string;
}

export function ParkingGrid({ 
  gridSize, 
  parkingSlots, 
  allocatedSlot, 
  animateGrid,
  floor
}: ParkingGridProps) {
  return (
    <motion.div
      className="w-full max-w-4xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl relative"
      initial={{ rotateX: 60, scale: 0.8, opacity: 0 }}
      animate={{ rotateX: 45, scale: 1, opacity: 1 }}
      transition={{ delay: 0.3, duration: 1, ease: "easeOut" }}
    >
      {/* Floor Header */}
      <motion.div
        className="absolute -top-12 md:-top-16 left-0 right-0 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <h2 className="text-lg md:text-xl font-semibold text-primary">
          Floor {floor}
        </h2>
        <p className="text-xs md:text-sm text-muted-foreground">
          Parking Grid
        </p>
      </motion.div>

      {/* Grid */}
      <div className="grid grid-cols-8 gap-0 aspect-square bg-card/20 backdrop-blur-sm border border-border/30 rounded-lg shadow-xl overflow-hidden w-full md:w-[calc(100%-2rem)] lg:w-[calc(100%-4rem)] mx-auto">
        {parkingSlots.map((slot) => (
          <motion.div
            key={slot.id}
            className={`
              aspect-square flex items-center justify-center relative overflow-hidden
              ${
                allocatedSlot === slot.id
                  ? "bg-sidebar-primary/30 text-sidebar-primary-foreground"
                  : "hover:bg-accent/10"
              }
            `}
            whileHover={{
              backgroundColor:
                allocatedSlot === slot.id
                  ? "rgba(99, 102, 241, 0.4)"
                  : "rgba(224, 225, 226, 0.2)",
              transition: { duration: 0.2 },
            }}
          >
            <AnimatePresence>
              {allocatedSlot === slot.id && (
                <motion.div
                  className="absolute inset-0 z-0"
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.5, 1] }}
                  transition={{ duration: 1 }}
                >
                  <div className="w-full h-full bg-sidebar-primary/20 rounded-lg" />
                </motion.div>
              )}
            </AnimatePresence>

            <span className="text-xs font-mono z-10">{slot.id}</span>

            {/* Horizontal line animations */}
            {animateGrid && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-[1px] bg-border/50"
                initial={{ scaleX: 0, originX: "left" }}
                animate={{ scaleX: 1 }}
                transition={{
                  delay: 0.05 * Math.floor((slot.id - 1) / gridSize),
                  duration: 0.5,
                }}
              />
            )}

            {/* Vertical line animations */}
            {animateGrid && (slot.id - 1) % gridSize === 0 ? null : (
              <motion.div
                className="absolute top-0 left-0 bottom-0 w-[1px] bg-border/50"
                initial={{ scaleY: 0, originY: "top" }}
                animate={{ scaleY: 1 }}
                transition={{
                  delay: 0.05 * ((slot.id - 1) % gridSize),
                  duration: 0.5,
                }}
              />
            )}
          </motion.div>
        ))}
      </div>

      {/* Key indicators */}
      <motion.div
        className="absolute -bottom-12 md:-bottom-16 left-0 right-0 flex justify-center gap-4 md:gap-6 text-xs text-muted-foreground"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <div className="flex items-center">
          <span className="inline-block w-3 h-3 border border-border/50 mr-2"></span>
          <span>Available</span>
        </div>
        <div className="flex items-center">
          <span className="inline-block w-3 h-3 bg-sidebar-primary/30 mr-2"></span>
          <span>Selected</span>
        </div>
        <div className="flex items-center">
          <span className="inline-block w-3 h-3 bg-muted/50 mr-2"></span>
          <span>Occupied</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
