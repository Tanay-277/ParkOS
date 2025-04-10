"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster } from "sonner";
import { toast } from "sonner";
import { Scale3DIcon, PanelTopIcon, LayersIcon, ViewIcon } from "lucide-react";

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
	const [viewMode, setViewMode] = useState<"3d" | "2d">("3d");
	const [showAllFloors, setShowAllFloors] = useState(false);
	const [gridSize, setGridSize] = useState(8);
	const [showGridConfig, setShowGridConfig] = useState(false);

	const parkingSlots = Array.from({ length: gridSize * gridSize }).map(
		(_, i) => ({
			id: i + 1,
			status: "available",
		})
	);

	const floors = ["1", "2", "3"];

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

	const handleGridSizeChange = (newSize: number) => {
		setGridSize(newSize);
		setAllocatedSlot(null); // Reset allocated slot when changing grid
	};

	if (loading) {
		return <LoadingScreen />;
	}

	return (
		<div className="flex flex-col h-screen bg-background overflow-hidden">
			{/* Main content area with improved responsive padding */}
			<motion.div
				className="flex-1 flex items-center justify-center perspective-[1000px] px-3 sm:px-4 md:px-6 lg:px-8 py-6 md:py-10 relative"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.5 }}
			>
				<AnimatePresence mode="wait">
					{showAllFloors ? (
						<motion.div
							key="all-floors"
							className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 w-full max-w-6xl"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -20 }}
							transition={{ duration: 0.5 }}
						>
							{floors.map((floorNum) => (
								<div key={floorNum} className="relative">
									<ParkingGrid
										gridSize={gridSize}
										parkingSlots={parkingSlots}
										allocatedSlot={floor === floorNum ? allocatedSlot : null}
										animateGrid={animateGrid}
										floor={floorNum}
										viewMode={viewMode}
										compact={true}
									/>
								</div>
							))}
						</motion.div>
					) : (
						<motion.div
							key="single-floor"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.5 }}
							className="w-full flex justify-center items-center"
						>
							<ParkingGrid
								gridSize={gridSize}
								parkingSlots={parkingSlots}
								allocatedSlot={allocatedSlot}
								animateGrid={animateGrid}
								floor={floor}
								viewMode={viewMode}
								compact={false}
							/>
						</motion.div>
					)}
				</AnimatePresence>
			</motion.div>

			{/* Improved responsive and accessible controls */}
			<div className="fixed right-3 sm:right-4 lg:right-6 top-1/2 -translate-y-1/2 flex flex-col gap-2 md:gap-3 z-30">
				<AnimatePresence>
					{!showAllFloors && (
						<motion.div
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: 20 }}
							transition={{ duration: 0.3 }}
							className="flex flex-col gap-2"
						>
							<motion.button
								onClick={() => setViewMode("3d")}
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
								onClick={() => setViewMode("2d")}
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
				</AnimatePresence>

				<motion.div
					className="mt-1"
					initial={{ opacity: 0, x: 20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.3, delay: 0.1 }}
				>
					<motion.button
						onClick={() => setShowAllFloors(!showAllFloors)}
						className={`h-9 w-9 md:h-10 md:w-10 rounded-full flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 ${
							showAllFloors
								? "bg-primary text-primary-foreground"
								: "bg-muted/80 text-muted-foreground hover:bg-muted/90"
						}`}
						whileHover={{ scale: 1.1, y: -2 }}
						whileTap={{ scale: 0.95 }}
						title={showAllFloors ? "Single Floor View" : "All Floors View"}
						aria-label={showAllFloors ? "Switch to Single Floor View" : "Switch to All Floors View"}
						aria-pressed={showAllFloors}
					>
						{showAllFloors ? (
							<ViewIcon className="h-4 w-4 md:h-5 md:w-5" />
						) : (
							<LayersIcon className="h-4 w-4 md:h-5 md:w-5" />
						)}
					</motion.button>
				</motion.div>
				
				{/* Grid Configuration Button */}
				<motion.div
					initial={{ opacity: 0, x: 20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.3, delay: 0.2 }}
				>
					<motion.button
						onClick={() => setShowGridConfig(!showGridConfig)}
						className={`h-9 w-9 md:h-10 md:w-10 rounded-full flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 ${
							showGridConfig
								? "bg-primary text-primary-foreground"
								: "bg-muted/80 text-muted-foreground hover:bg-muted/90"
						}`}
						whileHover={{ scale: 1.1, y: -2 }}
						whileTap={{ scale: 0.95 }}
						title="Grid Settings"
						aria-label="Grid Configuration Settings"
						aria-expanded={showGridConfig}
						aria-controls="grid-config-panel"
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:w-5 md:h-5">
							<rect width="18" height="18" x="3" y="3" rx="2" />
							<path d="M3 9h18" />
							<path d="M3 15h18" />
							<path d="M9 3v18" />
							<path d="M15 3v18" />
						</svg>
					</motion.button>
				</motion.div>
			</div>
			
			{/* Improved responsive grid configuration panel */}
			<AnimatePresence>
				{showGridConfig && (
					<motion.div
						id="grid-config-panel"
						initial={{ opacity: 0, y: 20, scale: 0.95 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 10, scale: 0.9 }}
						transition={{ type: "spring", stiffness: 300, damping: 30 }}
						className="fixed right-14 sm:right-16 top-1/2 -translate-y-1/2 bg-card/90 backdrop-blur-md border border-border/50 rounded-lg shadow-xl p-3 sm:p-4 z-20 w-36 sm:w-44 md:w-48"
						role="dialog"
						aria-labelledby="grid-config-title"
					>
						<h3 id="grid-config-title" className="text-sm font-medium mb-3 flex items-center">
							<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
								<rect width="18" height="18" x="3" y="3" rx="2" />
								<path d="M3 9h18" />
								<path d="M3 15h18" />
								<path d="M9 3v18" />
								<path d="M15 3v18" />
							</svg>
							Grid Settings
						</h3>
						
						<div className="space-y-4">
							{/* Grid Size Selector */}
							<div>
								<label id="grid-size-label" className="text-xs text-muted-foreground mb-1.5 block">Grid Size</label>
								<div className="grid grid-cols-3 gap-1.5 sm:gap-2" role="radiogroup" aria-labelledby="grid-size-label">
									{[5, 6, 8].map((size) => (
										<button
											key={size}
											onClick={() => handleGridSizeChange(size)}
											className={`py-1.5 px-2 text-xs rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 ${
												gridSize === size
													? "bg-primary text-primary-foreground"
													: "bg-muted/50 hover:bg-muted/70 text-foreground/70"
											}`}
											role="radio"
											aria-checked={gridSize === size}
											aria-label={`${size} by ${size} grid`}
										>
											{size}×{size}
										</button>
									))}
								</div>
							</div>
							
							<div>
								<label id="grid-animation-label" className="text-xs text-muted-foreground mb-1.5 block">Grid Animation</label>
								<button
									onClick={() => setAnimateGrid(!animateGrid)}
									className={`w-full py-1.5 px-2 text-xs rounded-md transition-all flex items-center justify-center space-x-1.5 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
										animateGrid
											? "bg-primary text-primary-foreground"
											: "bg-muted/50 hover:bg-muted/70 text-foreground/70"
									}`}
									role="switch"
									aria-checked={animateGrid}
									aria-labelledby="grid-animation-label"
								>
									<span>{animateGrid ? "Animated" : "Static"}</span>
									<span className={`relative inline-flex h-4 w-7 flex-shrink-0 rounded-full border border-transparent transition-colors duration-200 ease-in-out ${animateGrid ? 'bg-white/30' : 'bg-white/10'}`}>
										<span
											className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${animateGrid ? 'translate-x-3' : 'translate-x-0.5'}`}
										/>
									</span>
								</button>
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

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
				disabled={showAllFloors}
			/>

			{/* Toaster for better visibility on all screen sizes */}
			<Toaster 
				position="top-center"
				toastOptions={{
					className: 'max-w-md mx-auto',
				}}
			/>
		</div>
	);
}
