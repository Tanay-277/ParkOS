"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	CarIcon,
	BikeIcon,
	BatteryChargingIcon,
	TruckIcon,
	LogOutIcon,
	XIcon,
	SearchIcon,
	CircleCheckIcon,
	ClockIcon,
	BanIcon,
	ShieldCheckIcon,
	ZapIcon,
} from "lucide-react";
import { ParkingSlot, vehicleDeparture } from "@/services/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface DepartureDialogProps {
	isOpen: boolean;
	onClose: () => void;
	parkingSlots: ParkingSlot[];
	onDeparted: () => Promise<void>;
}

export function DepartureDialog({
	isOpen,
	onClose,
	parkingSlots,
	onDeparted,
}: DepartureDialogProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [processingPlate, setProcessingPlate] = useState<string | null>(null);

	// Format date with proper localization (use local time zone)
	const formatDate = (dateString: string) => {
		if (!dateString) return "Not available";
		try {
			const date = new Date(dateString);
			// Use local time zone
			return date.toLocaleString(undefined, {
				year: "numeric",
				month: "short",
				day: "numeric",
				hour: "2-digit",
				minute: "2-digit",
				hour12: true,
			});
		} catch (e) {
			return "Invalid date";
		}
	};

	// Calculate the parking duration based on arrival time
	const calculateDuration = (arrivalTime: string) => {
		if (!arrivalTime) return "Unknown";
		try {
			const arrival = new Date(arrivalTime);
			const now = new Date();
			let diffMs = now.getTime() - arrival.getTime();
			if (diffMs < 0) diffMs = 0; // Prevent negative durations
			const diffMinutes = Math.floor(diffMs / 1000 / 60);

			if (diffMinutes < 60) {
				return `${diffMinutes} min${diffMinutes !== 1 ? "s" : ""}`;
			}

			const hours = Math.floor(diffMinutes / 60);
			const minutes = diffMinutes % 60;

			if (hours < 24) {
				return `${hours} hr${hours !== 1 ? "s" : ""} ${
					minutes > 0 ? `${minutes} min${minutes !== 1 ? "s" : ""}` : ""
				}`;
			}

			const days = Math.floor(hours / 24);
			const remainingHours = hours % 24;

			return `${days} day${days !== 1 ? "s" : ""} ${
				remainingHours > 0
					? `${remainingHours} hr${remainingHours !== 1 ? "s" : ""}`
					: ""
			}`;
		} catch (e) {
			return "Error calculating duration";
		}
	};

	const renderVehicleIcon = (type: string) => {
		switch (type.toLowerCase()) {
			case "car":
				return <CarIcon className="h-5 w-5" />;
			case "bike":
				return <BikeIcon className="h-5 w-5" />;
			case "ev":
				return <BatteryChargingIcon className="h-5 w-5" />;
			case "truck":
				return <TruckIcon className="h-5 w-5" />;
			default:
				return <CarIcon className="h-5 w-5" />;
		}
	};

	const occupiedSlots = parkingSlots.filter(
		(slot) => slot.status === "occupied" && slot.vehicle
	);

	const vehicleMap = new Map();
	occupiedSlots.forEach((slot) => {
		if (slot.vehicle) {
			const vehicleId = slot.vehicle.id;
			if (!vehicleMap.has(vehicleId)) {
				vehicleMap.set(vehicleId, {
					vehicle: slot.vehicle,
					slots: [],
					floor: slot.floor,
				});
			}
			vehicleMap.get(vehicleId).slots.push(slot);
		}
	});

	const vehicles = Array.from(vehicleMap.values()).sort((a, b) => {
		if (!a.vehicle.arrival_time || !b.vehicle.arrival_time) return 0;
		return (
			new Date(b.vehicle.arrival_time).getTime() -
			new Date(a.vehicle.arrival_time).getTime()
		);
	});

	console.log(
		"Vehicles in departure dialog:",
		vehicles.map((v) => ({
			license_plate: v.vehicle.license_plate,
			arrival_time: v.vehicle.arrival_time || "MISSING",
			departure: v.vehicle.estimated_departure || "MISSING",
		}))
	);

	// Filter vehicles based on search query
	const filteredVehicles = searchQuery
		? vehicles.filter(
				(v) =>
					v.vehicle.license_plate
						.toLowerCase()
						.includes(searchQuery.toLowerCase()) ||
					v.vehicle.vehicle_type
						.toLowerCase()
						.includes(searchQuery.toLowerCase()) ||
					(v.vehicle.vehicle_size &&
						v.vehicle.vehicle_size
							.toLowerCase()
							.includes(searchQuery.toLowerCase()))
		  )
		: vehicles;

	const handleDeparture = async (licensePlate: string) => {
		try {
			setIsLoading(true);
			setProcessingPlate(licensePlate);

			await vehicleDeparture({ license_plate: licensePlate });

			toast.success(`Vehicle ${licensePlate} has departed`);

			await onDeparted();

			setSearchQuery("");
		} catch (error) {
			toast.error(
				`Failed to process departure: ${
					error instanceof Error ? error.message : String(error)
				}`
			);
		} finally {
			setIsLoading(false);
			setProcessingPlate(null);
		}
	};

	const freeSlots = parkingSlots.filter(
		(slot) => slot.status === "available"
	).length;
	const totalSlots = parkingSlots.length;

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
				>
					<motion.div
						className="bg-card border border-border rounded-lg shadow-lg max-w-xl w-full max-h-[80vh] overflow-hidden flex flex-col"
						initial={{ scale: 0.9, y: 20, opacity: 0 }}
						animate={{ scale: 1, y: 0, opacity: 1 }}
						exit={{ scale: 0.9, y: 20, opacity: 0 }}
						transition={{ type: "spring", duration: 0.4 }}
					>
						{/* Header */}
						<div className="flex items-center justify-between p-4 border-b border-border">
							<h2 className="text-lg font-semibold flex items-center gap-2">
								<LogOutIcon className="h-5 w-5" />
								Vehicle Departure
							</h2>
							<Button
								variant="ghost"
								size="sm"
								className="h-8 w-8 p-0 rounded-full"
								onClick={onClose}
								disabled={isLoading}
							>
								<XIcon className="h-4 w-4" />
								<span className="sr-only">Close</span>
							</Button>
						</div>

						{/* Search and stats */}
						<div className="p-4 border-b border-border space-y-3">
							<div className="relative">
								<SearchIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
								<Input
									placeholder="Search by license plate or type..."
									className="pl-9"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									disabled={isLoading}
								/>
							</div>

							<div className="flex items-center justify-between text-sm">
								<div className="flex items-center gap-1.5">
									<span className="text-muted-foreground">Occupied:</span>
									<span className="font-medium">{vehicles.length}</span>
								</div>
								<div className="flex items-center gap-1.5">
									<span className="text-muted-foreground">Available:</span>
									<span className="font-medium">
										{freeSlots} / {totalSlots}
									</span>
								</div>
							</div>
						</div>

						{/* Vehicle list */}
						<div className="flex-1 overflow-y-auto p-2">
							{filteredVehicles.length === 0 ? (
								<div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground">
									{searchQuery ? (
										<>
											<BanIcon className="h-8 w-8 mb-2 opacity-50" />
											<p className="text-sm">No vehicles match your search</p>
										</>
									) : (
										<>
											<CircleCheckIcon className="h-8 w-8 mb-2 opacity-50" />
											<p className="text-sm">No vehicles currently parked</p>
										</>
									)}
								</div>
							) : (
								<div className="grid grid-cols-1 gap-2">
									{filteredVehicles.map(({ vehicle, slots, floor }) => (
										<Card
											key={vehicle.id}
											className="overflow-hidden hover:shadow-md transition-shadow"
										>
											<CardContent className="p-3">
												<div className="flex items-center justify-between gap-2">
													<div className="flex items-center gap-3">
														<div
															className={`p-2 rounded-md ${
																vehicle.vehicle_type === "car"
																	? "bg-indigo-500/15"
																	: vehicle.vehicle_type === "bike"
																	? "bg-emerald-500/15"
																	: vehicle.vehicle_type === "ev"
																	? "bg-orange-500/15"
																	: "bg-red-500/15"
															}`}
														>
															{renderVehicleIcon(vehicle.vehicle_type)}
														</div>

														<div>
															<div className="font-medium flex items-center gap-1.5">
																{vehicle.license_plate}
																{vehicle.is_vip && (
																	<span className="inline-flex">
																		<ZapIcon className="h-3.5 w-3.5 text-yellow-500" />
																	</span>
																)}
															</div>
															<div className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1">
																<span className="capitalize">
																	{vehicle.vehicle_type}
																	{vehicle.vehicle_size
																		? ` (${vehicle.vehicle_size})`
																		: ""}
																</span>
																<span>·</span>
																<span>Floor {floor}</span>
																<span>·</span>
																<span>
																	{slots.length} slot
																	{slots.length !== 1 ? "s" : ""}
																</span>
															</div>
														</div>
													</div>

													<Button
														variant="outline"
														size="sm"
														className="gap-1"
														onClick={() =>
															handleDeparture(vehicle.license_plate)
														}
														disabled={
															isLoading &&
															processingPlate === vehicle.license_plate
														}
													>
														{isLoading &&
														processingPlate === vehicle.license_plate ? (
															<>
																<div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
																<span>Processing...</span>
															</>
														) : (
															<>
																<LogOutIcon className="h-3.5 w-3.5" />
																<span>Depart</span>
															</>
														)}
													</Button>
												</div>

												<div className="grid grid-cols-2 gap-1 mt-2 text-xs text-muted-foreground">
													<div className="flex items-center gap-1">
														<ClockIcon className="h-3 w-3" />
														<span>
															Arrived: {formatDate(vehicle.arrival_time)}
														</span>
													</div>
													<div className="flex items-center gap-1">
														<LogOutIcon className="h-3 w-3" />
														<span>
															Duration:{" "}
															{vehicle.arrival_time
																? calculateDuration(vehicle.arrival_time)
																: "Not available"}
														</span>
													</div>
												</div>

												<div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
													<ShieldCheckIcon className="h-3 w-3" />
													<span>
														Est. departure:{" "}
														{formatDate(vehicle.estimated_departure)}
													</span>
												</div>
											</CardContent>
										</Card>
									))}
								</div>
							)}
						</div>

						{/* Footer */}
						<div className="p-4 border-t border-border flex items-center justify-end">
							<Button variant="ghost" onClick={onClose} disabled={isLoading}>
								Close
							</Button>
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
