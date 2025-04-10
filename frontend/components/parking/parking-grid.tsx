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
	viewMode?: "3d" | "2d";
	compact?: boolean;
}

export function ParkingGrid({
	gridSize,
	parkingSlots,
	allocatedSlot,
	animateGrid,
	floor,
	viewMode = "3d",
	compact = false,
}: ParkingGridProps) {
	const perspectiveValue = viewMode === "3d" ? "1200px" : "none";

	return (
		<motion.div
			className={`w-full ${compact ? 'max-w-[calc(100%-1rem)]' : 'max-w-xs sm:max-w-sm md:max-w-2xl lg:max-w-4xl'} relative mx-auto`}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.5 }}
			style={{ perspective: perspectiveValue }}
			role="region"
			aria-label={`Floor ${floor} parking grid, ${gridSize}x${gridSize} layout`}
		>
			{/* Floor Header - Improved positioning for different screen sizes */}
			<motion.div
				className={`absolute -top-8 sm:-top-10 ${compact ? '' : 'md:-top-12'} left-0 right-0 text-center`}
				initial={{ opacity: 0, y: -15 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: compact ? 0.2 : 0.5, duration: 0.5 }}
			>
				<h2
					className={`${
						compact ? "text-sm sm:text-base" : "text-base sm:text-lg md:text-xl"
					} font-semibold text-primary`}
				>
					Floor {floor}
				</h2>
				{!compact && (
					<p className="text-2xs sm:text-xs text-muted-foreground">
						Parking Grid
					</p>
				)}
			</motion.div>

			{/* Main grid container with enhanced 3D transform - Improved responsive scaling */}
			<motion.div
				className="relative w-full"
				initial={
					viewMode === "3d"
						? { rotateX: 60, rotateZ: 0, scale: compact ? 0.7 : 0.8 } 
						: { rotateX: 0, scale: compact ? 0.8 : 0.9 }
				}
				animate={
					viewMode === "3d"
						? { 
								rotateX: compact ? 50 : 55, 
								rotateZ: compact ? -3 : -5, 
								scale: compact ? 0.8 : (window.innerWidth < 640 ? 0.9 : 1)
							} 
						: { 
								rotateX: 0, 
								rotateZ: 0, 
								scale: compact ? 0.85 : (window.innerWidth < 640 ? 0.95 : 1.05)
							}
				}
				transition={{
					duration: 0.8,
					ease: [0.16, 1, 0.3, 1],
					delay: 0.2,
				}}
				style={{
					transformStyle: "preserve-3d",
					transformOrigin: "center center",
				}}
			>
					{/* Enhanced 3D shadow with better responsive sizing */}
					{viewMode === "3d" && !compact && (
						<motion.div
							className="absolute -bottom-4 sm:-bottom-6 left-0 right-0 h-16 sm:h-24 rounded-[50%] bg-gradient-radial from-black/30 to-transparent opacity-60 blur-md"
							initial={{ opacity: 0, scale: 0.8 }}
							animate={{ opacity: 0.6, scale: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.8 }}
							style={{
								width: "96%",
								marginLeft: "2%",
								filter: "blur(8px) sm:blur(12px)",
								transform: "translateZ(-20px) rotateX(90deg)",
								transformOrigin: "center bottom",
							}}
							aria-hidden="true"
						/>
					)}

				{/* MAIN GRID CONTAINER - Enhanced responsive design */}
				<div
					className="w-full aspect-square bg-card/30 backdrop-blur-sm overflow-hidden mx-auto rounded-lg border border-white/10"
					style={{
						transformStyle: "preserve-3d",
						boxShadow: viewMode === "3d" 
							? "0 20px 40px rgba(0,0,0,0.3), 0 0 30px rgba(0,0,0,0.1) inset" 
							: "0 10px 30px rgba(0,0,0,0.2)",
					}}
				>
					{/* Grid surface plate for 3D */}
					{viewMode === "3d" && (
						<div
							className="absolute inset-0 bg-gradient-to-br from-slate-800/30 to-slate-900/50 backdrop-blur-md"
							style={{
								transformStyle: "preserve-3d",
								transform: "translateZ(-2px)",
								borderRadius: "12px",
							}}
							aria-hidden="true"
						/>
					)}

					{/* EXPLICIT GRID LINES - Now more visible on all screen sizes */}
					<div 
						className="absolute inset-0" 
						style={{ transformStyle: "preserve-3d" }}
						aria-hidden="true"
					>
						{/* Horizontal grid lines */}
						{Array.from({ length: gridSize + 1 }).map((_, i) => (
							<div
								key={`h-${i}`}
								className="absolute h-[1px] left-0 right-0 bg-white/20"
								style={{
									top: `${(i / gridSize) * 100}%`,
									transformStyle: "preserve-3d",
									transform: viewMode === "3d" ? "translateZ(0.5px)" : "none",
								}}
							/>
						))}

						{/* Vertical grid lines */}
						{Array.from({ length: gridSize + 1 }).map((_, i) => (
							<div
								key={`v-${i}`}
								className="absolute w-[1px] top-0 bottom-0 bg-white/20"
								style={{
									left: `${(i / gridSize) * 100}%`,
									transformStyle: "preserve-3d",
									transform: viewMode === "3d" ? "translateZ(0.5px)" : "none",
								}}
							/>
						))}
					</div>

					{/* PARKING SLOTS - Improved accessibility and responsiveness */}
					<div
						className={`absolute inset-0 grid grid-cols-${gridSize} grid-rows-${gridSize} gap-0`}
						style={{ 
                            transformStyle: "preserve-3d",
                            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                            gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`,
                        }}
                        role="grid"
                        aria-label={`Parking slots grid with ${parkingSlots.length} slots`}
					>
						{parkingSlots.map((slot) => (
							<div
								key={slot.id}
								className={`
									relative flex items-center justify-center
									${allocatedSlot === slot.id
									? "bg-sidebar-primary/20"
									: "hover:bg-white/5"}
								`}
								style={{
									transformStyle: "preserve-3d",
									transition: "all 0.2s ease",
									transform: viewMode === "3d" ? "translateZ(1px)" : "none",
								}}
                                role="gridcell"
                                aria-label={`Parking slot ${slot.id}${allocatedSlot === slot.id ? ', selected' : ''}`}
							>
								{/* Enhanced font sizing for different screen sizes and grid sizes */}
								<span 
									className={`select-none ${
                                        gridSize >= 8 
                                            ? (compact ? 'text-[0.5rem] sm:text-[0.65rem]' : 'text-[0.65rem] sm:text-xs') 
                                            : (compact ? 'text-[0.65rem] sm:text-xs' : 'text-xs sm:text-sm')
                                    } font-mono
									${allocatedSlot === slot.id ? 'font-medium text-white' : 'text-white/70'}`}
								>
									{slot.id}
								</span>

								{/* Selection indicator - Enhanced for better visibility */}
								{allocatedSlot === slot.id && (
									<div
										className="absolute inset-1 rounded-md -z-10"
										style={{
											background: "radial-gradient(circle, rgba(99,102,241,0.3) 0%, rgba(99,102,241,0.1) 70%, transparent 100%)",
											boxShadow: "0 0 15px rgba(99,102,241,0.5)",
										}}
										aria-hidden="true"
									/>
								)}

								{/* 3D floor marking with improved contrast */}
								{viewMode === "3d" && (
									<div
										className="absolute inset-0.5 rounded-sm -z-10"
										style={{
											border: "1px solid rgba(255,255,255,0.05)",
											background: allocatedSlot === slot.id 
												? "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(99,102,241,0.25))" 
												: "linear-gradient(135deg, rgba(255,255,255,0.02), rgba(255,255,255,0.05))",
										}}
										aria-hidden="true"
									/>
								)}
							</div>
						))}
					</div>
				</div>
			</motion.div>

			{/* Grid floor illumination effect - 3D only - Enhanced for better visibility */}
			{viewMode === "3d" && !compact && (
				<motion.div
					className="absolute -z-10 inset-0 bg-gradient-to-b from-primary/5 to-transparent rounded-3xl blur-2xl"
					initial={{ opacity: 0 }}
					animate={{ opacity: 0.3 }}
					transition={{ delay: 0.5, duration: 1 }}
					style={{
						transform: "translateY(20%) scale(0.8)",
						filter: "blur(40px)",
					}}
					aria-hidden="true"
				/>
			)}

			{/* Key indicators - Responsive positioning based on screen size */}
			{!compact && (
				<motion.div
					className="absolute -bottom-8 sm:-bottom-10 md:-bottom-12 lg:-bottom-16 left-0 right-0 flex justify-center flex-wrap gap-2 sm:gap-3 md:gap-4 text-2xs sm:text-xs text-muted-foreground"
					initial={{ opacity: 0, y: 15 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.8, duration: 0.5 }}
					aria-label="Legend"
				>
					<div className="flex items-center">
						<span className="inline-block w-2.5 h-2.5 border border-border/50 mr-1.5" aria-hidden="true"></span>
						<span>Available</span>
					</div>
					<div className="flex items-center">
						<span className="inline-block w-2.5 h-2.5 bg-sidebar-primary/30 mr-1.5" aria-hidden="true"></span>
						<span>Selected</span>
					</div>
					<div className="flex items-center">
						<span className="inline-block w-2.5 h-2.5 bg-muted/50 mr-1.5" aria-hidden="true"></span>
						<span>Occupied</span>
					</div>
				</motion.div>
			)}
		</motion.div>
	);
}
