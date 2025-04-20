"use client";

import { motion, AnimatePresence } from "framer-motion";
import React, { useState, useRef, useMemo, useEffect, memo, JSX } from "react";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	CarIcon,
	TruckIcon,
	BatteryChargingIcon,
	BikeIcon,
	InfoIcon,
	ArrowRightIcon,
	ClockIcon,
	CreditCardIcon,
} from "lucide-react";
import {
	isLowPerformanceDevice,
	createFrameRateLimiter,
} from "@/lib/performance";

interface ParkingSlot {
	id: number;
	status: string;
	vehicle?: {
		id: number;
		license_plate: string;
		vehicle_type: string;
		vehicle_size?: string;
		arrival_time: string;
		estimated_departure?: string;
		is_vip?: boolean;
		slots_occupied?: number;
	};
}

interface ProcessedParkingSlot extends ParkingSlot {
	isPartOfGroup: boolean;
	groupId?: number;
	isGroupStart?: boolean;
	groupSize?: number;
	groupColor?: string;
}

interface ParkingGridProps {
	gridSize: number;
	parkingSlots: ParkingSlot[];
	allocatedSlot?: number;
	animateGrid?: boolean;
	floor: number | string;
	viewMode?: "3d" | "2d";
	compact?: boolean;
}

// Define colors for different vehicle types
const vehicleTypeColors = {
	car: {
		small: "rgba(99, 102, 241, 0.5)", // Indigo for small cars
		medium: "rgba(99, 102, 241, 0.6)", // Darker indigo for medium cars
		large: "rgba(99, 102, 241, 0.7)", // Darkest indigo for large cars
	},
	bike: {
		default: "rgba(52, 211, 153, 0.6)", // Green for bikes
	},
	ev: {
		default: "rgba(251, 146, 60, 0.6)", // Orange for EVs
	},
	truck: {
		default: "rgba(239, 68, 68, 0.6)", // Red for trucks
	},
	vip: {
		overlay: "rgba(250, 204, 21, 0.5)", // Gold overlay for VIP vehicles
	},
};

// Helper function to format date - memoized to improve performance
const formatDate = (dateString: string) => {
	if (!dateString) return "";
	try {
		// Create date object from string and format using local time
		const date = new Date(dateString);

		// Format with localized date and time
		return new Intl.DateTimeFormat("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			hour12: true,
		}).format(date);
	} catch (e) {
		return dateString;
	}
};

// Memoized slot component to prevent unnecessary re-renders
const ParkingSlotComponent = memo(
	({
		slot,
		allocatedSlot,
		viewMode,
		hoveredGroup,
		hoveredSlot,
		handleSlotHover,
		renderVehicleIcon,
		isCompact,
		gridSize,
	}: {
		slot: ProcessedParkingSlot;
		allocatedSlot?: number;
		viewMode: "3d" | "2d";
		hoveredGroup: number | null;
		hoveredSlot: number | null;
		handleSlotHover: (id: number | null, groupId?: number | null) => void;
		renderVehicleIcon: (type: string) => JSX.Element;
		isCompact: boolean;
		gridSize: number;
	}) => {
		const isOccupied = slot.status === "occupied";
		const isVIP = isOccupied && slot.vehicle?.is_vip;
		const hasHoverInfo = isOccupied && slot.vehicle;
		const isPartOfHoveredGroup =
			slot.isPartOfGroup && slot.groupId === hoveredGroup;

		// Determine slot appearance
		let slotBorderStyle = "";

		if (isOccupied) {
			// Basic styling - Use the group color consistently across all slots

			// Special styling for multi-slot vehicles
			if (slot.isPartOfGroup) {
				// All slots of a multi-slot vehicle get the same background color and border
				slotBorderStyle = "border border-opacity-90";

				// Apply consistent styling based on vehicle type for all slots in the group
				if (slot.vehicle?.vehicle_type === "truck") {
					slotBorderStyle = "border-2 border-red-500/90";
				} else if (slot.vehicle?.vehicle_type === "car") {
					slotBorderStyle = "border-2 border-indigo-500/90";
				} else if (slot.vehicle?.vehicle_type === "ev") {
					slotBorderStyle = "border-2 border-orange-500/90";
				} else if (slot.vehicle?.vehicle_type === "bike") {
					slotBorderStyle = "border-2 border-emerald-500/90";
				}

				// Highlight the first slot slightly differently
				if (slot.isGroupStart) {
					slotBorderStyle += " rounded-tl-md";
				}
			} else {
				// Single-slot vehicle
				slotBorderStyle = `border border-opacity-90`;
			}

			// VIP styling overlay
			if (isVIP) {
				slotBorderStyle += " ring-2 ring-yellow-400";
			}
		}

		return (
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<div
							className={`
              relative flex items-center justify-center cursor-pointer
              ${allocatedSlot === slot.id ? "bg-sidebar-primary/20" : ""}
              ${isOccupied ? "" : "hover:bg-white/5"}
              ${
								isPartOfHoveredGroup || slot.id === hoveredSlot
									? "ring-2 ring-white/40"
									: ""
							}
            `}
							style={{
								transformStyle: "preserve-3d",
								transition: "all 0.2s ease",
								transform: viewMode === "3d" ? "translateZ(1px)" : "none",
								// Apply consistent background color based on vehicle type
								backgroundColor: isOccupied
									? slot.vehicle?.vehicle_type === "car"
										? "rgba(99, 102, 241, 0.5)"
										: slot.vehicle?.vehicle_type === "bike"
										? "rgba(52, 211, 153, 0.6)"
										: slot.vehicle?.vehicle_type === "ev"
										? "rgba(251, 146, 60, 0.6)"
										: slot.vehicle?.vehicle_type === "truck"
										? "rgba(239, 68, 68, 0.6)"
										: "rgba(05, 12, 21, 0.5)"
									: "transparent",
								// Add golden overlay for VIP vehicles
								backgroundImage: isVIP
									? "linear-gradient(rgba(250, 204, 21, 0.3), rgba(250, 204, 21, 0.1))"
									: "none",
								boxShadow: isVIP
									? `0 0 8px rgba(250, 204, 21, 0.8)`
									: undefined,
								border: isOccupied ? slotBorderStyle : undefined,
							}}
							role="gridcell"
							aria-label={`Parking slot ${slot.id}${
								allocatedSlot === slot.id
									? ", selected"
									: isOccupied
									? ", occupied"
									: ""
							}${slot.isPartOfGroup ? ", multi-slot vehicle" : ""}`}
							onMouseEnter={() =>
								handleSlotHover(
									slot.id,
									slot.isPartOfGroup ? slot.groupId : null
								)
							}
							onMouseLeave={() => handleSlotHover(null, null)}
						>
							{/* Slot number */}
							<span
								className={`select-none ${
									gridSize >= 8
										? isCompact
											? "text-[0.5rem] sm:text-[0.65rem]"
											: "text-[0.65rem] sm:text-xs"
										: isCompact
										? "text-[0.65rem] sm:text-xs"
										: "text-xs sm:text-sm"
								} font-mono
              ${
								allocatedSlot === slot.id
									? "font-medium text-white"
									: isOccupied
									? "font-medium text-white/90"
									: "text-white/70"
							}`}
							>
								{slot.id}
							</span>

							{/* Vehicle icon - only show on the first slot of a group */}
							{isOccupied && slot.vehicle && (
								<>
									{(!slot.isPartOfGroup ||
										(slot.isPartOfGroup && slot.isGroupStart)) && (
										<div
											className="absolute top-0.5 right-0.5"
											style={{
												transform:
													viewMode === "3d" ? "translateZ(2px)" : "none",
											}}
										>
											{renderVehicleIcon(slot.vehicle?.vehicle_type || "car")}
										</div>
									)}
								</>
							)}

							{/* Show number of slots for multi-slot vehicles */}
							{isOccupied &&
								slot.isPartOfGroup &&
								slot.isGroupStart &&
								slot.groupSize &&
								slot.groupSize > 1 && (
									<div
										className="absolute bottom-0.5 left-0.5 text-white/90"
										style={{
											transform: viewMode === "3d" ? "translateZ(2px)" : "none",
										}}
									>
										<span className="text-[8px] font-bold">
											{slot.groupSize}x
										</span>
									</div>
								)}

							{/* VIP indicator */}
							{isVIP && (slot.isGroupStart || !slot.isPartOfGroup) && (
								<div
									className="absolute bottom-0.5 right-0.5 text-yellow-400"
									style={{
										transform: viewMode === "3d" ? "translateZ(2px)" : "none",
									}}
								>
									<span className="text-[8px] font-bold">VIP</span>
								</div>
							)}

							{/* Info hover effect - show on any slot in the group */}
							{hasHoverInfo &&
								(slot.id === hoveredSlot || isPartOfHoveredGroup) && (
									<div
										className="absolute -bottom-1 -right-1 text-primary-foreground bg-primary rounded-full p-0.5"
										style={{
											transform:
												viewMode === "3d"
													? "translateZ(4px)"
													: "translateY(-4px)",
											zIndex: 10,
										}}
									>
										<InfoIcon className="h-3 w-3" />
									</div>
								)}

							{/* Selection indicator */}
							{allocatedSlot === slot.id && (
								<div
									className="absolute inset-1 rounded-md -z-10"
									style={{
										background:
											"radial-gradient(circle, rgba(99,102,241,0.3) 0%, rgba(99,102,241,0.1) 70%, transparent 100%)",
										boxShadow: "0 0 15px rgba(99,102,241,0.5)",
									}}
									aria-hidden="true"
								/>
							)}
						</div>
					</TooltipTrigger>

					{hasHoverInfo &&
						(slot.id === hoveredSlot || isPartOfHoveredGroup) && (
							<TooltipContent
								side="top"
								sideOffset={5}
								className="p-0 overflow-hidden"
							>
								<div className="bg-popover text-popover-foreground rounded-md shadow-md border">
									<div className="flex items-center gap-2 bg-background/40 backdrop-blur-sm px-3 py-2 border-b">
										<div className="p-1.5 bg-primary/20 rounded-full">
											{renderVehicleIcon(slot.vehicle?.vehicle_type || "car")}
										</div>
										<div className="font-medium">
											{slot.vehicle?.license_plate || "Unknown Vehicle"}
										</div>
										{isVIP && (
											<div className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-500 text-[10px] font-semibold rounded-sm ml-auto">
												VIP
											</div>
										)}
									</div>
									<div className="px-3 py-2">
										<div className="grid gap-1 text-sm">
											<div className="flex items-center gap-2">
												<ClockIcon className="h-3.5 w-3.5 text-muted-foreground" />
												<span>
													Arrived:{" "}
													{formatDate(slot.vehicle?.arrival_time || "")}
												</span>
											</div>
											{slot.vehicle?.estimated_departure && (
												<div className="flex items-center gap-2">
													<ArrowRightIcon className="h-3.5 w-3.5 text-muted-foreground" />
													<span>
														Departure:{" "}
														{formatDate(slot.vehicle.estimated_departure)}
													</span>
												</div>
											)}
											{slot.isPartOfGroup &&
												slot.groupSize &&
												slot.groupSize > 1 && (
													<div className="flex items-center gap-2 mt-1 pt-1 border-t border-border/40">
														<CreditCardIcon className="h-3.5 w-3.5 text-muted-foreground" />
														<span>
															Multi-slot vehicle ({slot.groupSize} slots)
														</span>
													</div>
												)}
										</div>
									</div>
								</div>
							</TooltipContent>
						)}
				</Tooltip>
			</TooltipProvider>
		);
	},
	(prevProps, nextProps) => {
		// Custom comparison function to prevent unnecessary re-renders
		if (
			prevProps.slot.id !== nextProps.slot.id ||
			prevProps.slot.status !== nextProps.slot.status ||
			prevProps.allocatedSlot !== nextProps.allocatedSlot ||
			prevProps.viewMode !== nextProps.viewMode ||
			prevProps.hoveredGroup !== nextProps.hoveredGroup ||
			(prevProps.slot.id === prevProps.hoveredSlot) !==
				(nextProps.slot.id === nextProps.hoveredSlot) ||
			(prevProps.slot.isPartOfGroup &&
				prevProps.slot.groupId === prevProps.hoveredGroup) !==
				(nextProps.slot.isPartOfGroup &&
					nextProps.slot.groupId === nextProps.hoveredGroup)
		) {
			return false; // Props have changed, re-render
		}
		return true; // Props are the same, don't re-render
	}
);

// Main ParkingGrid component
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
	const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);
	const [hoveredGroup, setHoveredGroup] = useState<number | null>(null);
	const prevSlotsRef = useRef(parkingSlots);
	const contentRef = useRef<HTMLDivElement>(null);
	const isLowPerformance = useMemo(() => isLowPerformanceDevice(), []);
	const optimizedViewMode = isLowPerformance ? "2d" : viewMode; // Fallback to 2D for low-performance devices
	const frameRateLimiter = useMemo(
		() => createFrameRateLimiter(isLowPerformance ? 15 : 30),
		[isLowPerformance]
	);

	// Process parking slots to identify groups (multi-slot vehicles)
	const processedSlots = useMemo(() => {
		// Check if the slots data has actually changed to avoid unnecessary processing
		const slotsChanged =
			JSON.stringify(parkingSlots) !== JSON.stringify(prevSlotsRef.current);
		if (!slotsChanged && prevSlotsRef.current.length > 0) {
			return prevSlotsRef.current;
		}

		// Make sure we have enough slots to fill the grid
		let filledParkingSlots = [...parkingSlots];
		const totalNeeded = gridSize * gridSize;

		// If we don't have enough slots, generate placeholder slots to fill the grid
		if (filledParkingSlots.length < totalNeeded) {
			for (let i = filledParkingSlots.length + 1; i <= totalNeeded; i++) {
				filledParkingSlots.push({ id: i, status: "available" });
			}
		}

		// Create a map of vehicle IDs to their occupied slots
		const vehicleSlotMap: Record<number, number[]> = {};
		const vehicleColorMap: Record<number, string> = {};

		// First pass: identify which vehicles occupy which slots and assign colors
		filledParkingSlots.forEach((slot) => {
			if (slot.vehicle && slot.status === "occupied") {
				const vehicleId = slot.vehicle.id;

				// Store slot IDs for this vehicle
				if (!vehicleSlotMap[vehicleId]) {
					vehicleSlotMap[vehicleId] = [];

					// Assign a consistent color for this vehicle
					let color;
					if (slot.vehicle.vehicle_type === "car") {
						const size = slot.vehicle.vehicle_size || "medium";
						color =
							vehicleTypeColors.car[size as keyof typeof vehicleTypeColors.car];
					} else if (slot.vehicle.vehicle_type === "bike") {
						color = vehicleTypeColors.bike.default;
					} else if (slot.vehicle.vehicle_type === "ev") {
						color = vehicleTypeColors.ev.default;
					} else if (slot.vehicle.vehicle_type === "truck") {
						color = vehicleTypeColors.truck.default;
					}

					// Apply VIP styling if needed
					if (slot.vehicle.is_vip) {
						color = `linear-gradient(${color || "rgba(99, 102, 241, 0.5)"}, ${
							vehicleTypeColors.vip.overlay
						})`;
					}

					// Store the color for this vehicle
					vehicleColorMap[vehicleId] = color || "rgba(99, 102, 241, 0.5)";
				}

				vehicleSlotMap[vehicleId].push(slot.id);
			}
		});

		// Create a processed version of the slots with group information
		const processed: ProcessedParkingSlot[] = filledParkingSlots.map((slot) => {
			// Default values for a regular slot
			let result: ProcessedParkingSlot = {
				...slot,
				isPartOfGroup: false,
			};

			if (slot.vehicle && slot.status === "occupied") {
				const vehicleId = slot.vehicle.id;
				const slotsForVehicle = vehicleSlotMap[vehicleId] || [];

				if (slotsForVehicle.length > 0) {
					const slotsOccupied = slot.vehicle.slots_occupied || 1;
					const isMultiSlot = slotsOccupied > 1 || slotsForVehicle.length > 1;

					// Get the color from our color map for consistent coloring
					const color = vehicleColorMap[vehicleId];

					// For multi-slot vehicles, mark all slots as part of a group
					if (isMultiSlot) {
						// Sort slots to find the minimum slot ID (first in the group)
						const sortedSlots = [...slotsForVehicle].sort((a, b) => a - b);
						const minSlotId = sortedSlots[0];

						result = {
							...slot,
							isPartOfGroup: true,
							groupId: vehicleId,
							isGroupStart: slot.id === minSlotId,
							groupSize: slotsOccupied || slotsForVehicle.length,
							// Apply the same color to all slots in the group
							groupColor: color,
						};
					} else {
						// Single slot vehicle
						result = {
							...slot,
							isPartOfGroup: false,
							groupColor: color,
						};
					}
				}
			}

			return result;
		});

		// Update the ref with the latest processed slots
		prevSlotsRef.current = processed;
		return processed;
	}, [parkingSlots, gridSize]);

	// Handle hover effects for groups with improved group functionality
	const handleSlotHover = React.useCallback(
		(slotId: number | null, groupId: number | null = null) => {
			setHoveredSlot(slotId);

			if (groupId) {
				// If the slot is part of a group, highlight the whole group
				setHoveredGroup(groupId);
			} else if (slotId) {
				// Check if this slot belongs to a group
				const slot = processedSlots.find((s) => s.id === slotId) as
					| ProcessedParkingSlot
					| undefined;
				if (slot?.isPartOfGroup && slot.groupId) {
					setHoveredGroup(slot.groupId);
				} else {
					setHoveredGroup(null);
				}
			} else {
				setHoveredGroup(null);
			}
		},
		[processedSlots]
	);

	// Render icon based on vehicle type
	const renderVehicleIcon = React.useCallback((vehicleType: string) => {
		switch (vehicleType.toLowerCase()) {
			case "car":
				return <CarIcon className="h-2.5 w-2.5" />;
			case "bike":
				return <BikeIcon className="h-2.5 w-2.5" />;
			case "ev":
				return <BatteryChargingIcon className="h-2.5 w-2.5" />;
			case "truck":
				return <TruckIcon className="h-2.5 w-2.5" />;
			default:
				return <CarIcon className="h-2.5 w-2.5" />;
		}
	}, []);

	// Use a more efficient animation approach
	useEffect(() => {
		if (!animateGrid || !contentRef.current || optimizedViewMode !== "3d")
			return;

		let animationFrame: number;
		let angle = 0;

		const animate = () => {
			if (!contentRef.current) return;

			// Very subtle rotation animation - lower amplitude and frequency
			angle += 0.03;
			const rotateZ = Math.sin(angle / 24) * 1.5; // More subtle rotation

			contentRef.current.style.transform = `
        perspective(1200px) 
        rotateX(${compact ? 50 : 55}deg) 
        rotateZ(${compact ? -3 : -5 + rotateZ}deg) 
        scale(${compact ? 0.8 : window.innerWidth < 640 ? 0.9 : 1})
      `;

			frameRateLimiter(animate); // Use frame rate limiter instead of requestAnimationFrame
		};

		animationFrame = requestAnimationFrame(animate);

		return () => {
			cancelAnimationFrame(animationFrame);
		};
	}, [animateGrid, compact, optimizedViewMode, frameRateLimiter]);

	return (
		<motion.div
			className={`w-full ${
				compact
					? "max-w-[calc(100%-1rem)]"
					: "max-w-xs sm:max-w-sm md:max-w-2xl lg:max-w-4xl"
			} relative mx-auto`}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.5 }}
			style={{ perspective: perspectiveValue }}
			role="region"
			aria-label={`Floor ${floor} parking grid, ${gridSize}x${gridSize} layout`}
		>
			{/* Floor Header - Improved positioning for different screen sizes */}
			<motion.div
				className={`absolute -top-8 sm:-top-10 ${
					compact ? "" : "md:-top-12"
				} left-0 right-0 text-center`}
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
				ref={contentRef}
				className="relative w-full"
				initial={
					optimizedViewMode === "3d"
						? { rotateX: 60, rotateZ: 0, scale: compact ? 0.7 : 0.8 }
						: { rotateX: 0, scale: compact ? 0.8 : 0.9 }
				}
				animate={
					!animateGrid
						? {
								rotateX: optimizedViewMode === "3d" ? (compact ? 50 : 55) : 0,
								rotateZ: optimizedViewMode === "3d" ? (compact ? -3 : -5) : 0,
								scale:
									optimizedViewMode === "3d"
										? compact
											? 0.8
											: window.innerWidth < 640
											? 0.9
											: 1
										: compact
										? 0.85
										: window.innerWidth < 640
										? 0.95
										: 1.05,
						  }
						: {}
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
				{optimizedViewMode === "3d" && !compact && (
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
						boxShadow:
							optimizedViewMode === "3d"
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

					{/* PARKING SLOTS - With vehicle type coloring and tooltips */}
					<div
						className="absolute inset-0 grid gap-0"
						style={{
							transformStyle: "preserve-3d",
							gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
							gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`,
						}}
						role="grid"
						aria-label={`Parking slots grid with ${processedSlots.length} slots`}
					>
						{/* Use virtualization for large grids - only render slots that would be visible */}
						{(processedSlots as ProcessedParkingSlot[]).map((slot) => (
							<ParkingSlotComponent
								key={slot.id}
								slot={slot}
								allocatedSlot={allocatedSlot}
								viewMode={optimizedViewMode}
								hoveredGroup={hoveredGroup}
								hoveredSlot={hoveredSlot}
								handleSlotHover={handleSlotHover}
								renderVehicleIcon={renderVehicleIcon}
								isCompact={compact}
								gridSize={gridSize}
							/>
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
						<span
							className="inline-block w-2.5 h-2.5 border border-border/50 mr-1.5"
							aria-hidden="true"
						></span>
						<span>Available</span>
					</div>
					<div className="flex items-center">
						<span
							className="inline-block w-2.5 h-2.5 bg-indigo-500/40 border border-indigo-500/90 mr-1.5"
							aria-hidden="true"
						></span>
						<span>Car</span>
					</div>
					<div className="flex items-center">
						<span
							className="inline-block w-2.5 h-2.5 bg-emerald-500/40 border border-emerald-500/90 mr-1.5"
							aria-hidden="true"
						></span>
						<span>Bike</span>
					</div>
					<div className="flex items-center">
						<span
							className="inline-block w-2.5 h-2.5 bg-orange-500/40 border border-orange-500/90 mr-1.5"
							aria-hidden="true"
						></span>
						<span>EV</span>
					</div>
					<div className="flex items-center">
						<span
							className="inline-block w-2.5 h-2.5 bg-red-500/40 border border-red-500/90 mr-1.5"
							aria-hidden="true"
						></span>
						<span>Truck</span>
					</div>
				</motion.div>
			)}
		</motion.div>
	);
}
