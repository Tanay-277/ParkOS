"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster } from "sonner";
import { toast } from "sonner";
import { CarIcon, TruckIcon, BatteryChargingIcon, ClockIcon, MapPinIcon, CheckCircleIcon,Bike } from "lucide-react";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [vehicleType, setVehicleType] = useState<string | null>(null);
  const [carSize, setCarSize] = useState("medium");
  const [floor, setFloor] = useState("1");
  const [departureTime, setDepartureTime] = useState("");
  const [allocatedSlot, setAllocatedSlot] = useState<number | null>(null);
  const [animateGrid, setAnimateGrid] = useState(false);

  // Initialize grid - 8x8
  const gridSize = 8;
  const parkingSlots = Array.from({ length: gridSize * gridSize }).map((_, i) => ({
    id: i + 1,
    status: "available",
  }));

  // Loading sequence
  useEffect(() => {
    const timer1 = setTimeout(() => {
      setLoading(false);
    }, 2500);

    const timer2 = setTimeout(() => {
      setAnimateGrid(true);
    }, 3000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const handleParkVehicle = () => {
    if (!vehicleType || !departureTime) {
      toast.error("Please select vehicle type and departure time");
      return;
    }
    
    // Mock API call
    toast.loading("Finding optimal parking slot...");
    
    setTimeout(() => {
      // Find a random available slot
      const randomSlot = Math.floor(Math.random() * (gridSize * gridSize)) + 1;
      setAllocatedSlot(randomSlot);
      
      toast.dismiss();
      toast.success("Vehicle parked successfully!", {
        description: `Your ${vehicleType} has been allocated to slot ${randomSlot}`,
        position: "top-center",
      });
    }, 1500);
  };

  // Loading screen animation
  if (loading) {
    return (
      <div className="h-screen w-full bg-background flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center"
        >
          <motion.h1 
            className="text-7xl font-bold bg-gradient-to-r from-chart-1 via-sidebar-primary to-chart-4 text-transparent bg-clip-text"
            initial={{ letterSpacing: "0.5em" }}
            animate={{ letterSpacing: "0.1em" }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          >
            ParkOS
          </motion.h1>
          <motion.div 
            className="mt-6 h-1 w-48 mx-auto bg-gradient-to-r from-chart-1 via-sidebar-primary to-chart-4 rounded-full"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "12rem", opacity: 1 }}
            transition={{ delay: 0.3, duration: 1 }}
          />
          <motion.p 
            className="mt-4 text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            Smart Parking System
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Main Content Area with 3D Perspective */}
      <motion.div 
        className="flex-1 flex items-center justify-center perspective-[1000px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className="w-full max-w-4xl relative"
          initial={{ rotateX: 60, scale: 0.8, opacity: 0 }}
          animate={{ rotateX: 45, scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 1, ease: "easeOut" }}
        >
          {/* Floor Header */}
          <motion.div 
            className="absolute -top-16 left-0 right-0 text-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <h2 className="text-xl font-semibold text-primary">Floor {floor}</h2>
            <p className="text-sm text-muted-foreground">Parking Grid</p>
          </motion.div>
          
          {/* Grid */}
          <div className="grid grid-cols-8 gap-0 aspect-square bg-card/20 backdrop-blur-sm border border-border/30 rounded-lg shadow-xl overflow-hidden">
            {parkingSlots.map((slot) => (
              <motion.div
                key={slot.id}
                className={`
                  aspect-square flex items-center justify-center relative overflow-hidden
                  ${allocatedSlot === slot.id 
                    ? "bg-sidebar-primary/30 text-sidebar-primary-foreground" 
                    : "hover:bg-accent/10"}
                `}
                whileHover={{ 
                  backgroundColor: allocatedSlot === slot.id ? "rgba(var(--sidebar-primary), 0.4)" : "rgba(var(--accent), 0.2)",
                  transition: { duration: 0.2 }
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
                      duration: 0.5 
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
                      duration: 0.5 
                    }}
                  />
                )}
              </motion.div>
            ))}
          </div>
          
          {/* Key indicators */}
          <motion.div 
            className="absolute -bottom-16 left-0 right-0 flex justify-center gap-6 text-xs text-muted-foreground"
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
      </motion.div>

      {/* Bottom Toolbar */}
      <motion.div 
        className="w-full bg-card/80 backdrop-blur-md border-t border-border/30 shadow-2xl z-10"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 1.2, duration: 0.5, ease: "easeOut" }}
      >
        <div className="container mx-auto px-4 py-4 max-w-5xl">
          {/* Vehicle Type Selection */}
          <div className="flex flex-wrap justify-center gap-4">
            <VehicleButton 
              icon={<CarIcon className="h-5 w-5" />} 
              label="Car" 
              active={vehicleType === "car"}
              onClick={() => setVehicleType("car")}
            />
            <VehicleButton 
              icon={<Bike className="h-5 w-5" />} 
              label="Bike" 
              active={vehicleType === "bike"}
              onClick={() => setVehicleType("bike")}
            />
            <VehicleButton 
              icon={<BatteryChargingIcon className="h-5 w-5" />} 
              label="EV" 
              active={vehicleType === "ev"}
              onClick={() => setVehicleType("ev")}
            />
            <VehicleButton 
              icon={<TruckIcon className="h-5 w-5" />} 
              label="Truck" 
              active={vehicleType === "truck"}
              onClick={() => setVehicleType("truck")}
            />
          </div>
          
          {/* Additional Options (appear when vehicle type is selected) */}
          <AnimatePresence>
            {vehicleType && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="pt-4 mt-4 border-t border-border/30 flex flex-wrap justify-center gap-x-6 gap-y-3">
                  {/* Departure Time */}
                  <div className="flex items-center gap-2">
                    <ClockIcon className="h-4 w-4 text-muted-foreground" />
                    <select 
                      value={departureTime} 
                      onChange={(e) => setDepartureTime(e.target.value)}
                      className="bg-background/30 backdrop-blur-sm border border-border/50 rounded px-3 py-1 text-sm"
                    >
                      <option value="">Departure Time</option>
                      <option value="1">1 hour</option>
                      <option value="2">2 hours</option>
                      <option value="3">3 hours</option>
                      <option value="4">4+ hours</option>
                    </select>
                  </div>
                  
                  {/* Car Size (only for cars) */}
                  {vehicleType === "car" && (
                    <div className="flex items-center gap-2">
                      <CarIcon className="h-4 w-4 text-muted-foreground" />
                      <select 
                        value={carSize} 
                        onChange={(e) => setCarSize(e.target.value)}
                        className="bg-background/30 backdrop-blur-sm border border-border/50 rounded px-3 py-1 text-sm"
                      >
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                      </select>
                    </div>
                  )}
                  
                  {/* Floor Selection */}
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="h-4 w-4 text-muted-foreground" />
                    <select 
                      value={floor} 
                      onChange={(e) => setFloor(e.target.value)}
                      className="bg-background/30 backdrop-blur-sm border border-border/50 rounded px-3 py-1 text-sm"
                    >
                      <option value="1">Floor 1</option>
                      <option value="2">Floor 2</option>
                      <option value="3">Floor 3</option>
                    </select>
                  </div>
                  
                  {/* Park Button */}
                  <motion.button
                    onClick={handleParkVehicle}
                    className="flex items-center gap-2 bg-sidebar-primary text-sidebar-primary-foreground rounded-full px-5 py-1.5 text-sm font-medium"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                    Park My Vehicle
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      
      <Toaster />
    </div>
  );
}

// Vehicle Selection Button component
interface VehicleButtonProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

function VehicleButton({ icon, label, active, onClick }: VehicleButtonProps) {
  return (
    <motion.button
      className={`
        relative flex flex-col items-center justify-center gap-1 px-6 py-3 rounded-lg 
        ${active 
          ? "text-primary" 
          : "text-muted-foreground hover:text-foreground"
        }
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      <AnimatePresence>
        {active && (
          <motion.div 
            className="absolute inset-0 bg-accent/30 rounded-lg"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>
      <div className="relative z-10">
        {icon}
      </div>
      <span className="text-xs relative z-10">{label}</span>
    </motion.button>
  );
}
