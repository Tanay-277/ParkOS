"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Toaster } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Home() {
  const [vehicleType, setVehicleType] = useState("");
  const [carSize, setCarSize] = useState("");
  const [floor, setFloor] = useState("1");
  const [departureTime, setDepartureTime] = useState("");
  const [allocatedSlot, setAllocatedSlot] = useState<number | null>(null);

  // Mock parking slots (5x5 grid)
  const parkingSlots = Array.from({ length: 25 }).map((_, i) => ({
    id: i + 1,
    status: "available",
  }));

  const handleParkVehicle = () => {
    // Mock API call
    setTimeout(() => {
      // Find a random available slot
      const randomSlot = Math.floor(Math.random() * 25) + 1;
      setAllocatedSlot(randomSlot);
      
      toast.success("Vehicle parked successfully!", {
        description: `Your vehicle has been allocated to slot ${randomSlot}`,
        position: "top-center",
      });
    }, 800);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Side Panel */}
      <motion.div 
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-96 border-r bg-card p-6 shadow-xl"
      >
        <div className="flex flex-col h-full">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-primary">
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                ParkOS
              </motion.span>
            </h1>
            <p className="text-muted-foreground mt-2">Smart Parking System</p>
          </div>

          <div className="space-y-6 flex-grow">
            <div className="space-y-2">
              <Label htmlFor="vehicle-type">Vehicle Type</Label>
              <Select value={vehicleType} onValueChange={setVehicleType}>
                <SelectTrigger id="vehicle-type" className="w-full">
                  <SelectValue placeholder="Select vehicle type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="car">Car</SelectItem>
                  <SelectItem value="bike">Bike</SelectItem>
                  <SelectItem value="ev">Electric Vehicle</SelectItem>
                  <SelectItem value="truck">Truck</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="car-size">Vehicle Size</Label>
              <Select value={carSize} onValueChange={setCarSize}>
                <SelectTrigger id="car-size" className="w-full">
                  <SelectValue placeholder="Select vehicle size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="floor">Floor Preference</Label>
              <Select value={floor} onValueChange={setFloor}>
                <SelectTrigger id="floor" className="w-full">
                  <SelectValue placeholder="Select floor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Floor 1</SelectItem>
                  <SelectItem value="2">Floor 2</SelectItem>
                  <SelectItem value="3">Floor 3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="departure">Estimated Departure</Label>
              <Input
                id="departure"
                type="datetime-local"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          <div className="mt-8">
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Button 
                size="lg" 
                className="w-full text-lg py-6 bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={handleParkVehicle}
              >
                Park My Vehicle
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Main Content - Parking Map */}
      <div className="flex-1 p-8 overflow-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="border border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle>Parking Map - Floor {floor}</CardTitle>
              <CardDescription>
                Available parking slots are shown in the grid below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-4 max-w-3xl mx-auto">
                {parkingSlots.map((slot) => (
                  <motion.div
                    key={slot.id}
                    className={`
                      aspect-square flex items-center justify-center rounded-lg border-2 border-border 
                      ${allocatedSlot === slot.id 
                        ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                        : "bg-card hover:bg-accent/20"}
                    `}
                    whileHover={{ scale: 1.05 }}
                    animate={allocatedSlot === slot.id 
                      ? { 
                          scale: [1, 1.2, 1], 
                          borderColor: ["var(--border)", "var(--sidebar-primary)", "var(--sidebar-primary)"],
                          boxShadow: ["0 0 0 rgba(0,0,0,0)", "0 0 20px var(--sidebar-primary)", "0 0 10px var(--sidebar-primary)"],
                        }
                      : {}
                    }
                    transition={{ duration: 0.5 }}
                  >
                    <span className="text-lg font-semibold">{slot.id}</span>
                  </motion.div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between text-sm text-muted-foreground">
              <div>
                <span className="inline-block w-3 h-3 bg-card border border-border rounded-full mr-2"></span>
                Available
              </div>
              <div>
                <span className="inline-block w-3 h-3 bg-sidebar-primary rounded-full mr-2"></span>
                Your Vehicle
              </div>
              <div>
                <span className="inline-block w-3 h-3 bg-muted rounded-full mr-2"></span>
                Occupied
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
      <Toaster />
    </div>
  );
}
