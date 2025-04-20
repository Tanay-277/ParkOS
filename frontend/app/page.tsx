"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Toaster } from "sonner";
import { toast } from "sonner";
import {
	Scale3DIcon,
	PanelTopIcon,
	LayersIcon,
	ViewIcon,
	RefreshCwIcon,
	AlertCircleIcon,
	ZapIcon,
	TrashIcon,
	SignalIcon,
	LogOutIcon,
	ShuffleIcon,
	SettingsIcon
} from "lucide-react";

import { LoadingScreen } from "@/components/loading";
import { ParkingGrid } from "@/components/parking/parking-grid";
import { BottomToolbar } from "@/components/parking/bottom-toolbar";
import { FloorNavigation } from "@/components/parking/floor-navigation";
import { DepartureDialog } from "@/components/parking/departure-dialog";
import { WaitlistPanel } from "@/components/parking/waitlist-panel";
import { CompactionNotification } from "@/components/parking/compaction-notification";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import { useBackendParking } from "@/hooks/useBackendParking";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { throttle } from "@/lib/performance";
import Link from "next/link";

// More descriptive API Status Indicator with retry functionality
const ApiStatusIndicator = ({ pollInterval }: { pollInterval: number }) => {
	const [apiConnected, setApiConnected] = useState(true);
	const [checkFailed, setCheckFailed] = useState(false);
	const [isRetrying, setIsRetrying] = useState(false);
	const attemptCount = useRef(0);

	// Check API status with exponential backoff
	useEffect(() => {
		const API_BASE_URL =
			process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
		let timeoutId: NodeJS.Timeout;

		const checkApiStatus = async () => {
			try {
				setIsRetrying(attemptCount.current > 0);
				// Use a simple GET request to the root or health endpoint
				const controller = new AbortController();
				const abortTimeoutId = setTimeout(() => controller.abort(), 3000);

				const response = await fetch(`${API_BASE_URL}/health`, {
					method: "GET",
					signal: controller.signal,
					cache: "no-store",
				});

				clearTimeout(abortTimeoutId);

				if (response.ok) {
					setApiConnected(true);
					setCheckFailed(false);
					attemptCount.current = 0;
				} else {
					console.warn(`API health check returned status ${response.status}`);
					setApiConnected(false);
					setCheckFailed(true);
					attemptCount.current++;
				}
			} catch (error) {
				console.warn("API health check failed:", error);
				setApiConnected(false);
				setCheckFailed(true);
				attemptCount.current++;
			} finally {
				setIsRetrying(false);
			}
		};

		// Initial check
		checkApiStatus();

		// Set up polling with exponential backoff on failure
		const scheduleNextCheck = () => {
			const backoffFactor = Math.min(attemptCount.current, 5); // Cap at 5 for reasonable max time
			const nextInterval =
				attemptCount.current === 0
					? pollInterval
					: Math.min(pollInterval * Math.pow(1.5, backoffFactor), 60000); // Max 1 minute

			console.log(`Next API check in ${Math.round(nextInterval / 1000)}s`);
			timeoutId = setTimeout(checkApiStatus, nextInterval);
		};

		scheduleNextCheck();
		return () => clearTimeout(timeoutId);
	}, [pollInterval]);

	// Only show when disconnected (after a check has failed) to reduce visual noise
	if (apiConnected || !checkFailed) return null;

	return (
		<div className="fixed top-16 left-2 z-50 px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 bg-destructive/20 text-destructive">
			<SignalIcon className={`size-4 ${isRetrying ? "animate-pulse" : ""}`} />
			<span>{isRetrying ? "Reconnecting..." : "API Disconnected"}</span>
		</div>
	);
};

export default function Home() {
	// State hooks - keep them all together at the top
	const [initialLoading, setInitialLoading] = useState(true);
	const [vehicleType, setVehicleType] = useState<string | null>(null);
	const [carSize, setCarSize] = useState("medium");
	const [floor, setFloor] = useState("1");
	const [departureTime, setDepartureTime] = useState("");
	const [animateGrid, setAnimateGrid] = useState(false);
	const [bottomBarVisible, setBottomBarVisible] = useState(true);
	const [viewMode, setViewMode] = useState<"3d" | "2d">("3d");
	const [showAllFloors, setShowAllFloors] = useState(false);
	const [gridSize, setGridSize] = useState(8);
	const [showGridConfig, setShowGridConfig] = useState(false);
	const [isVIP, setIsVIP] = useState(false);
	const [showDepartureDialog, setShowDepartureDialog] = useState(false);
	const [triggerCompaction, setTriggerCompaction] = useState(false);

	// All ref hooks
	const prefersReducedMotion = useReducedMotion();
	const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
	const floorChangeRef = useRef(false); // Track if floor change is in progress

	// Custom hooks
	const {
		parkingSlots,
		parkingStatus,
		waitlist,
		loading: apiLoading,
		error: apiError,
		refreshData,
		parkVehicle,
		initializeParking,
	} = useBackendParking(floor);
	  
	// Create our own initializing state since it's not provided by the hook
	const [initializing, setInitializing] = useState(false);

	// All useEffect hooks - keep them together
	// If user prefers reduced motion, disable animations
	useEffect(() => {
		if (prefersReducedMotion) {
			setAnimateGrid(false);
			setViewMode("2d");
		}
	}, [prefersReducedMotion]);

	// Reduced initial loading time for production
	useEffect(() => {
		const timer = setTimeout(() => {
			setInitialLoading(false);
		}, 1000); // Reduced from 1500ms
		return () => clearTimeout(timer);
	}, []);
	
	// Initialize the parking system if needed
	useEffect(() => {
		// Only initialize if we're not already loading and have no slots
		if (
			!initialLoading &&
			!apiLoading &&
			!initializing &&
			(!parkingSlots || parkingSlots.length === 0)
		) {
			setInitializing(true);
			initializeParking()
				.catch((error) => {
					toast.error(`Initialization failed: ${error.message}`);
				})
				.finally(() => {
					setInitializing(false);
				});
		}
	}, [
		initialLoading,
		parkingSlots,
		initializeParking,
		apiLoading,
		initializing,
	]);
	
	// Auto-compaction trigger when a certain number of vehicles depart
	useEffect(() => {
		// Simple algorithm to detect when compaction should be triggered
		// In real implementation, this would be triggered by backend API
		const occupied = parkingSlots.filter(slot => slot.status === 'occupied').length;
		const total = parkingSlots.length;
		const occupancyRate = occupied / total;
		
		// If occupancy is between 30% and 70% and not already compacting, consider compaction
		if (occupancyRate > 0.3 && occupancyRate < 0.7 && !triggerCompaction) {
			// Count separate clusters of occupied slots
			let clusters = 0;
			let lastEmpty = true;
			
			// Simplified detection
			parkingSlots.forEach(slot => {
				const isEmpty = slot.status === 'available';
				if (!isEmpty && lastEmpty) {
					clusters++;
				}
				lastEmpty = isEmpty;
			});
			
			// If we detect fragmentation, randomly trigger compaction
			// This is just a visual simulation
			if (clusters > 3 && Math.random() < 0.01) {
				setTriggerCompaction(true);
			}
		}
	}, [parkingSlots, triggerCompaction]);

	// Analytics tracking - make sure this is always defined
	useEffect(() => {
		try {
			// Initialize analytics (you would replace this with your actual analytics code)
			const trackPageView = () => {
				if (
					typeof window !== "undefined" &&
					process.env.NODE_ENV === "production"
				) {
					console.log("Page view tracked");
					// Example: analytics.pageView()
				}
			};

			trackPageView();

			// Track navigation events within the app
			const handleRouteChange = () => {
				trackPageView();
			};

			window.addEventListener("popstate", handleRouteChange);

			return () => {
				window.removeEventListener("popstate", handleRouteChange);
			};
		} catch (error) {
			console.error("Analytics error:", error);
		}
	}, []);

	// Memory leak protection - make sure this is always defined
	useEffect(() => {
		return () => {
			// Cleanup any subscriptions or timers when component unmounts
			if (refreshTimerRef.current) {
				clearTimeout(refreshTimerRef.current);
			}
		};
	}, []);

	// All useMemo hooks
	const floors = useMemo(() => ["1", "2", "3"], []);

	// Define keyboard shortcuts
	const shortcuts = useMemo(() => [
		{ key: "c", action: () => setVehicleType("car"), description: "Select Car" },
		{ key: "b", action: () => setVehicleType("bike"), description: "Select Bike" },
		{ key: "e", action: () => setVehicleType("ev"), description: "Select Electric Vehicle" },
		{ key: "t", action: () => setVehicleType("truck"), description: "Select Truck" },
		{ key: "1", action: () => !showAllFloors && setFloor("1"), description: "Go to Floor 1" },
		{ key: "2", action: () => !showAllFloors && setFloor("2"), description: "Go to Floor 2" },
		{ key: "3", action: () => !showAllFloors && setFloor("3"), description: "Go to Floor 3" },
		{ key: "v", action: () => setIsVIP(!isVIP), description: "Toggle VIP Status" },
		{ key: "a", action: () => setShowAllFloors(!showAllFloors), description: "Toggle All Floors View" },
		{ key: "d", action: () => setViewMode(viewMode === "2d" ? "3d" : "2d"), description: "Toggle 2D/3D View" },
		{ key: "Tab", action: () => setBottomBarVisible(true), description: "Show Bottom Toolbar" },
		{ key: "l", action: () => setShowDepartureDialog(true), description: "Show Departure Dialog" },
		{ key: "Escape", action: () => {
			if (showDepartureDialog) {
				setShowDepartureDialog(false);
				return;
			}
			
			if (vehicleType) {
				setVehicleType(null);
				return;
			}
		}, description: "Cancel/Close Current Action" },
		{ key: "r", action: () => refreshData(), description: "Refresh Parking Data" },
	], [showAllFloors, isVIP, viewMode, vehicleType, showDepartureDialog, refreshData]);

	// All useCallback hooks - keep them together at the end
	// Throttled park vehicle function to prevent multiple submissions
	const handleParkVehicle = useCallback(async () => {
		if (!vehicleType || !departureTime) {
			toast.error("Please select vehicle type and departure time");
			return;
		}

		// Convert departure time from hours string to number
		const departureHours = parseFloat(departureTime);
		if (isNaN(departureHours)) {
			toast.error("Invalid departure time");
			return;
		}

		// Call the API to park the vehicle
		toast.loading("Finding optimal parking slot...");

		const vehicleSizeValue =
			vehicleType === "car"
				? (carSize as "small" | "medium" | "large")
				: undefined;

		try {
			const result = await parkVehicle(
				vehicleType as "car" | "bike" | "ev" | "truck",
				departureHours,
				vehicleSizeValue,
				isVIP
			);

			toast.dismiss();

			// Handle the response from the backend
			if (result.success) {
				if (result.allocated) {
					toast.success(`Vehicle parked successfully!`, {
						description: `Allocated to slot ${result.slot?.slot_number} on floor ${result.slot?.floor}`,
						duration: 4000,
					});

					// Reset form only if successful
					setVehicleType(null);
					setDepartureTime("");

					// Refresh data to show the updated parking grid
					refreshData();
				} else {
					toast.warning(`Parking is full, added to waitlist`, {
						description: `Your position in waitlist: ${result.waitlist_position}`,
						duration: 5000,
					});
				}
			} else {
				toast.error(`Failed to park vehicle: ${result.message}`);
			}
		} catch (error) {
			toast.dismiss();
			toast.error(
				`Error: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}, [vehicleType, departureTime, carSize, isVIP, parkVehicle, refreshData]);
	
	// Reset function with confirmation - throttled
	const handleResetSystem = useCallback(
		throttle(async () => {
			const confirmed = window.confirm(
				"Are you sure you want to reset the entire parking system? This will clear all data."
			);

			if (confirmed) {
				try {
					setInitializing(true);
					await initializeParking();
					toast.success("Parking system reset successfully!");
					refreshData();
				} catch (error) {
					toast.error(
						`Reset failed: ${
							error instanceof Error ? error.message : String(error)
						}`
					);
				} finally {
					setInitializing(false);
				}
			}
		}, 1000),
		[initializeParking, refreshData]
	);
	
	// Trigger compaction manually (simulation)
	const handleTriggerCompaction = useCallback(() => {
		setTriggerCompaction(true);
	}, []);
	
	// Handle compaction completion
	const handleCompactionEnd = useCallback(() => {
		setTriggerCompaction(false);
		refreshData(); // Refresh to show updated slots
	}, [refreshData]);

	// Update grid size with throttling to prevent excessive re-renders
	const handleGridSizeChange = useCallback(
		throttle((newSize: number) => {
			setGridSize(newSize);
		}, 300),
		[]
	);
	
	// Handle vehicle departure completion
	const handleDepartureComplete = useCallback(async () => {
		await refreshData();
	}, [refreshData]);

	// Show loading screen during initialization
	if (initialLoading) {
		return <LoadingScreen />;
	}

	return (
		<div className="flex flex-col h-screen bg-background overflow-hidden">
			 {/* Add settings link */}
			 <Link 
        href="/settings" 
        className="fixed top-2 left-2 z-50 p-1.5 bg-card/80 backdrop-blur-sm rounded-full hover:bg-card/95 transition-colors"
      >
        <SettingsIcon className="size-4 text-muted-foreground" />
      </Link>
      
      {/* Keyboard shortcuts component */}
      <KeyboardShortcuts shortcuts={shortcuts} />

			{/* API status indicator with longer poll interval to reduce unnecessary requests */}
			<ApiStatusIndicator pollInterval={60000} />

			{/* API error notification */}
			{apiError && (
				<div className="fixed top-2 left-2 z-50 bg-destructive/90 text-destructive-foreground px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5">
					<AlertCircleIcon className="size-4" />
					<span>API Error - {apiError}</span>
				</div>
			)}

			{/* Loading indicator */}
			{(apiLoading || initializing) && (
				<div className="fixed top-2 left-2 z-50 bg-primary/20 text-primary px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5">
					<RefreshCwIcon className="size-4 animate-spin" />
					<span>{initializing ? "Initializing..." : "Loading..."}</span>
				</div>
			)}

			{/* Parking status display */}
			{parkingStatus && (
				<div className="fixed top-2 right-2 z-50 bg-card/80 backdrop-blur-lg border border-border/30 px-3 py-2 rounded-lg text-xs shadow-md">
					<div className="flex items-center gap-2 mb-1">
						<div className="font-medium">Parking Status</div>
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										size="icon"
										variant="ghost"
										className="h-5 w-5 rounded-full"
										onClick={refreshData}
									>
										<RefreshCwIcon className="h-3 w-3" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									<p>Refresh data</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>
					<div className="flex flex-col space-y-0.5">
						<div className="flex justify-between gap-4">
							<span className="text-muted-foreground">Occupied:</span>
							<span>
								{parkingStatus.occupied_slots}/{parkingStatus.total_slots}
							</span>
						</div>
						<div className="flex justify-between gap-4">
							<span className="text-muted-foreground">Available:</span>
							<span>{parkingStatus.available_slots}</span>
						</div>
						<div className="flex justify-between gap-4">
							<span className="text-muted-foreground">Floor:</span>
							<span>{parkingStatus.floor}</span>
						</div>
						{parkingStatus.waitlist_count > 0 && (
							<div className="flex justify-between gap-4 text-amber-500">
								<span>Waitlist:</span>
								<span>{parkingStatus.waitlist_count}</span>
							</div>
						)}
					</div>
					
					{/* Action buttons */}
					<div className="border-t border-border/30 mt-1.5 pt-1.5 flex gap-2">
						<Button 
							size="sm" 
							variant="ghost" 
							className="text-[10px] h-6 px-2 gap-1"
							onClick={() => setShowDepartureDialog(true)}
						>
							<LogOutIcon className="h-3 w-3" />
							<span>Departures</span>
						</Button>
						
						<Button 
							size="sm" 
							variant="ghost" 
							className="text-[10px] h-6 px-2 gap-1"
							onClick={handleTriggerCompaction}
							disabled={triggerCompaction}
						>
							<ShuffleIcon className="h-3 w-3" />
							<span>Compact</span>
						</Button>
					</div>
				</div>
			)}

			{/* Reset button */}
			<div className="fixed top-2 left-10 z-50">
				<Button
					onClick={handleResetSystem}
					className="text-xs bg-destructive hover:bg-destructive/90 text-white gap-1.5"
					size="sm"
					disabled={initializing || apiLoading}
				>
					<TrashIcon className="h-3 w-3" />
					Reset System
				</Button>
			</div>

			{/* Floor navigation */}
			{!showAllFloors && (
				<FloorNavigation 
					currentFloor={floor}
					floors={floors}
					onFloorChange={setFloor}
				/>
			)}

			{/* Main content area - Optimized rendering */}
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
										parkingSlots={floorNum === floor ? parkingSlots : []}
										animateGrid={false} // Disable animation in multi-floor view
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
								animateGrid={animateGrid && !prefersReducedMotion}
								floor={floor}
								viewMode={viewMode}
								compact={false}
							/>
						</motion.div>
					)}
				</AnimatePresence>
			</motion.div>

			{/* Control buttons - Right side panel */}
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
						aria-label={
							showAllFloors
								? "Switch to Single Floor View"
								: "Switch to All Floors View"
						}
						aria-pressed={showAllFloors}
					>
						{showAllFloors ? (
							<ViewIcon className="h-4 w-4 md:h-5 md:w-5" />
						) : (
							<LayersIcon className="h-4 w-4 md:h-5 md:w-5" />
						)}
					</motion.button>
				</motion.div>

				{/* VIP toggle button */}
				<motion.div
					initial={{ opacity: 0, x: 20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.3, delay: 0.2 }}
				>
					<Tooltip>
						<TooltipTrigger asChild>
							<motion.button
								onClick={() => setIsVIP(!isVIP)}
								className={`h-9 w-9 md:h-10 md:w-10 rounded-full flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 ${
									isVIP
										? "bg-yellow-500/90 text-black"
										: "bg-muted/80 text-muted-foreground hover:bg-muted/90"
								}`}
								whileHover={{ scale: 1.1, y: -2 }}
								whileTap={{ scale: 0.95 }}
							>
								<ZapIcon className="h-4 w-4 md:h-5 md:w-5" />
							</motion.button>
						</TooltipTrigger>
						<TooltipContent side="left">
							<p>{isVIP ? "Disable VIP priority" : "Enable VIP priority"}</p>
						</TooltipContent>
					</Tooltip>
				</motion.div>
				
				{/* Departure button */}
				<motion.div
					initial={{ opacity: 0, x: 20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.3, delay: 0.3 }}
				>
					<Tooltip>
						<TooltipTrigger asChild>
							<motion.button
								onClick={() => setShowDepartureDialog(true)}
								className="h-9 w-9 md:h-10 md:w-10 rounded-full bg-muted/80 text-muted-foreground hover:bg-muted/90 flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-primary/50"
								whileHover={{ scale: 1.1, y: -2 }}
								whileTap={{ scale: 0.95 }}
							>
								<LogOutIcon className="h-4 w-4 md:h-5 md:w-5" />
							</motion.button>
						</TooltipTrigger>
						<TooltipContent side="left">
							<p>Vehicle Departure</p>
						</TooltipContent>
					</Tooltip>
				</motion.div>
			</div>
			
			{/* Waitlist panel */}
			{/* <WaitlistPanel
				waitlist={waitlist}
				isLoading={apiLoading}
				onRefresh={refreshData}
			/> */}
			
			{/* Compaction notification */}
			<CompactionNotification
				triggerCompaction={triggerCompaction}
				parkingSlots={parkingSlots}
				onCompactionEnd={handleCompactionEnd}
			/>
			
			{/* Departure dialog */}
			<DepartureDialog
				isOpen={showDepartureDialog}
				onClose={() => setShowDepartureDialog(false)}
				parkingSlots={parkingSlots}
				onDeparted={handleDepartureComplete}
			/>

			{/* Bottom toolbar */}
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
				disabled={showAllFloors || apiLoading || initializing}
			/>

			{/* Optimized toaster configuration */}
			<Toaster
				position="top-center"
				toastOptions={{
					className: "max-w-md mx-auto",
					duration: 3000, // Shorter duration for production
					style: { zIndex: 1000 },
				}}
				closeButton={true}
			/>
		</div>
	);
}
