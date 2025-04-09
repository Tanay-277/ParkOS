"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Toaster } from "sonner";
import { toast } from "sonner";

import { LoadingScreen } from "@/components/loading";
import { ParkingGrid } from "@/components/parking/parking-grid";
import { BottomToolbar } from "@/components/parking/bottom-toolbar";

export default function Home() {
	const [loading, setLoading] = useState(true);
	const [vehicleType, setVehicleType] = useState<string | null>(null);
	const [carSize, setCarSize] = useState("medium");
	const [floor, setFloor] = useState("1");
	const [departureTime, setDepartureTime] = useState("");
	const [allocatedSlot, setAllocatedSlot] = useState<number | null>(null);
	const [animateGrid, setAnimateGrid] = useState(false);
	const [bottomBarVisible, setBottomBarVisible] = useState(true);

	const gridSize = 8;
	const parkingSlots = Array.from({ length: gridSize * gridSize }).map(
		(_, i) => ({
			id: i + 1,
			status: "available",
		})
	);

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

		toast.loading("Finding optimal parking slot...");

		setTimeout(() => {
			const randomSlot = Math.floor(Math.random() * (gridSize * gridSize)) + 1;
			setAllocatedSlot(randomSlot);

			toast.dismiss();
			toast.success("Vehicle parked successfully!", {
				description: `Your ${vehicleType} has been allocated to slot ${randomSlot}`,
				position: "top-center",
				dismissible: true,
				closeButton: true,
			});
		}, 1500);
	};

	// Loading screen animation
	if (loading) {
		return <LoadingScreen />;
	}

	return (
		<div className="flex flex-col h-screen bg-background overflow-hidden">
			{/* Main Content Area with 3D Perspective */}
			<motion.div
				className="flex-1 flex items-center justify-center perspective-[1000px] px-4 md:px-6 lg:px-8"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.5 }}
			>
				<ParkingGrid
					gridSize={gridSize}
					parkingSlots={parkingSlots}
					allocatedSlot={allocatedSlot}
					animateGrid={animateGrid}
					floor={floor}
				/>
			</motion.div>

			<BottomToolbar
				vehicleType={vehicleType}
				setVehicleType={setVehicleType}
				carSize={carSize}
				setCarSize={setCarSize}
				floor={floor}
				setFloor={setFloor}
				departureTime={departureTime}
				setDepartureTime={setDepartureTime}
				handleParkVehicle={handleParkVehicle}
				visible={bottomBarVisible}
				setVisible={setBottomBarVisible}
			/>

			<Toaster />
		</div>
	);
}
