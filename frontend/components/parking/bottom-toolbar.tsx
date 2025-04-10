"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
	CarIcon,
	TruckIcon,
	BatteryChargingIcon,
	ClockIcon,
	MapPinIcon,
	CheckCircleIcon,
	Bike,
	XIcon,
	ChevronDownIcon,
	ChevronUpIcon,
	ArrowRightIcon,
	KeyboardIcon,
} from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { VehicleButton } from "../ui/vehicle-button";
import { Button } from "../ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import { KeyboardShortcuts } from "../keyboard-shortcuts";

interface BottomToolbarProps {
	vehicleType: string | null;
	setVehicleType: (type: string | null) => void;
	carSize: string;
	setCarSize: (size: string) => void;
	floor: string;
	setFloor: (floor: string) => void;
	departureTime: string;
	setDepartureTime: (time: string) => void;
	handleParkVehicle: () => void;
	visible: boolean;
	setVisible: (visible: boolean) => void;
	disabled?: boolean;
}

export function BottomToolbar({
	vehicleType,
	setVehicleType,
	carSize,
	setCarSize,
	floor,
	setFloor,
	departureTime,
	setDepartureTime,
	handleParkVehicle,
	visible,
	setVisible,
	disabled = false,
}: BottomToolbarProps) {
	const [optionsReady, setOptionsReady] = useState(false);
	const [showShortcutHint, setShowShortcutHint] = useState(true);

	useEffect(() => {
		const timer = setTimeout(() => {
			if (!vehicleType && visible) {
				setVisible(false);
			}
		}, 1000000);

		return () => clearTimeout(timer);
	}, [vehicleType, visible, setVisible]);

	useEffect(() => {
		let timer: NodeJS.Timeout;

		if (vehicleType) {
			// Short delay before showing options for smoother animation
			timer = setTimeout(() => setOptionsReady(true), 50);
		} else {
			setOptionsReady(false);
		}

		return () => clearTimeout(timer);
	}, [vehicleType]);

	// Auto-hide shortcut hint after 10 seconds
	useEffect(() => {
		const timer = setTimeout(() => {
			setShowShortcutHint(false);
		}, 10000);

		return () => clearTimeout(timer);
	}, []);

	const isFormComplete =
		vehicleType && departureTime && floor && (vehicleType !== "car" || carSize);

	const shortcuts = [
		{
			key: "c",
			action: () => setVehicleType("car"),
			description: "Select Car",
		},
		{
			key: "b",
			action: () => setVehicleType("bike"),
			description: "Select Bike",
		},
		{ key: "e", action: () => setVehicleType("ev"), description: "Select EV" },
		{
			key: "t",
			action: () => setVehicleType("truck"),
			description: "Select Truck",
		},
		{
			key: "Escape",
			action: () => setVehicleType(null),
			description: "Clear Selection",
		},
		{
			key: "f",
			action: () => isFormComplete && handleParkVehicle(),
			description: "Park Vehicle (when form is complete)",
		},
	];

	const vehicleOptions = [
		{ type: "car", icon: <CarIcon />, label: "Car", shortcut: "C" },
		{ type: "bike", icon: <Bike />, label: "Bike", shortcut: "B" },
		{ type: "ev", icon: <BatteryChargingIcon />, label: "EV", shortcut: "E" },
		{ type: "truck", icon: <TruckIcon />, label: "Truck", shortcut: "T" },
	];

	return (
		<>
			{/* Keyboard shortcuts handler */}
			<KeyboardShortcuts shortcuts={shortcuts} />

			<AnimatePresence mode="wait">
				{visible ? (
					<motion.div
						className={`w-full bg-card/90 backdrop-blur-md border-t border-border/50 shadow-lg z-40 fixed bottom-0 left-0 ${disabled ? "opacity-60 pointer-events-none" : ""}`}
						initial={{ y: 100, opacity: 0 }}
						animate={{ y: 0, opacity: disabled ? 0.6 : 1 }}
						exit={{ y: 100, opacity: 0 }}
						transition={{
							duration: 0.5,
							type: "spring",
							stiffness: 100,
							damping: 20,
						}}
					>
						<div className="container mx-auto py-4 px-4 md:px-6 relative">
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<motion.button
											onClick={() => setVisible(false)}
											className="absolute top-2 right-2 md:top-4 md:right-4 h-8 w-8 md:h-10 md:w-10 rounded-full bg-background/50 hover:bg-background/80 flex items-center justify-center transition-all"
											whileHover={{
												scale: 1.1,
												backgroundColor: "rgba(255, 255, 255, 0.2)",
											}}
											whileTap={{ scale: 0.95 }}
										>
											<motion.div
												animate={{ y: [0, 2, 0] }}
												transition={{
													repeat: Infinity,
													repeatDelay: 2,
													duration: 0.5,
												}}
											>
												<ChevronDownIcon className="size-5 md:h-5 md:w-5 text-foreground" />
											</motion.div>
										</motion.button>
									</TooltipTrigger>
									<TooltipContent side="left">
										<p>Minimize toolbar</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>

							<AnimatePresence>
								{showShortcutHint && (
									<motion.div
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: 10 }}
										className="absolute top-2 left-2 md:top-4 md:left-4 bg-background/60 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs flex items-center gap-1.5 text-muted-foreground"
									>
										<KeyboardIcon className="size-3.5" />
										<span>Use keyboard shortcuts</span>
									</motion.div>
								)}
							</AnimatePresence>

							<div className="flex flex-wrap justify-center gap-3 md:gap-5">
								<TooltipProvider delayDuration={300}>
									{vehicleOptions.map((vehicle) => (
										<Tooltip key={vehicle.type}>
											<TooltipTrigger asChild>
												<VehicleButton
													icon={
														<span className="size-5 md:h-5 md:w-5">
															{vehicle.icon}
														</span>
													}
													label={vehicle.label}
													shortcut={vehicle.shortcut}
													active={vehicleType === vehicle.type}
													onClick={() => setVehicleType(vehicle.type)}
												/>
											</TooltipTrigger>
											<TooltipContent>
												<p>
													Select {vehicle.label} ({vehicle.shortcut})
												</p>
											</TooltipContent>
										</Tooltip>
									))}
								</TooltipProvider>
							</div>

							{/* Vehicle options */}
							<AnimatePresence>
								{vehicleType && optionsReady && (
									<motion.div
										initial={{ height: 0, opacity: 0 }}
										animate={{ height: "auto", opacity: 1 }}
										exit={{ height: 0, opacity: 0 }}
										transition={{
											duration: 0.4,
											opacity: { duration: 0.3, delay: 0.1 },
											type: "spring",
											stiffness: 150,
											damping: 20,
										}}
										className="pt-4 mt-2 overflow-hidden border-t border-border/40"
									>
										<div className="flex flex-col md:flex-row items-center justify-between gap-4">
											<div className="flex flex-wrap justify-center md:justify-start gap-3 md:gap-4 w-full md:w-auto">
												<motion.div
													className="flex items-center gap-2 backdrop-blur-sm rounded-lg px-3 py-2"
													initial={{ opacity: 0, scale: 0.95, y: 10 }}
													animate={{ opacity: 1, scale: 1, y: 0 }}
													transition={{ duration: 0.3, delay: 0.1 }}
												>
													<ClockIcon className="size-5 text-primary" />
													<Select
														value={departureTime}
														onValueChange={setDepartureTime}
													>
														<SelectTrigger className="w-[130px] md:w-[150px] h-9 border-none bg-transparent shadow-none">
															<SelectValue placeholder="Departure Time" />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="1">1 hour</SelectItem>
															<SelectItem value="2">2 hours</SelectItem>
															<SelectItem value="3">3 hours</SelectItem>
															<SelectItem value="4">4+ hours</SelectItem>
														</SelectContent>
													</Select>
												</motion.div>

												{vehicleType === "car" && (
													<motion.div
														className="flex items-center gap-2 backdrop-blur-sm rounded-lg px-3 py-2"
														initial={{ opacity: 0, scale: 0.95, y: 10 }}
														animate={{ opacity: 1, scale: 1, y: 0 }}
														transition={{ duration: 0.3, delay: 0.2 }}
													>
														<CarIcon className="size-5 text-primary" />
														<Select value={carSize} onValueChange={setCarSize}>
															<SelectTrigger className="w-[100px] md:w-[120px] h-9 border-none bg-transparent shadow-none">
																<SelectValue placeholder="Size" />
															</SelectTrigger>
															<SelectContent>
																<SelectItem value="small">Small</SelectItem>
																<SelectItem value="medium">Medium</SelectItem>
																<SelectItem value="large">Large</SelectItem>
															</SelectContent>
														</Select>
													</motion.div>
												)}

												<motion.div
													className="flex items-center gap-2 backdrop-blur-sm rounded-lg px-3 py-2"
													initial={{ opacity: 0, scale: 0.95, y: 10 }}
													animate={{ opacity: 1, scale: 1, y: 0 }}
													transition={{ duration: 0.3, delay: 0.3 }}
												>
													<MapPinIcon className="size-5 text-primary" />
													<Select value={floor} onValueChange={setFloor}>
														<SelectTrigger className="w-[100px] md:w-[120px] h-9 border-none bg-transparent shadow-none">
															<SelectValue placeholder="Floor" />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="1">Floor 1</SelectItem>
															<SelectItem value="2">Floor 2</SelectItem>
															<SelectItem value="3">Floor 3</SelectItem>
														</SelectContent>
													</Select>
												</motion.div>
											</div>

											<div className="flex items-center gap-3 w-full md:w-auto justify-center md:justify-end">
												<motion.div
													initial={{ opacity: 0, x: -20 }}
													animate={{ opacity: 1, x: 0 }}
													transition={{ duration: 0.3, delay: 0.4 }}
												>
													<Tooltip>
														<TooltipTrigger asChild>
															<Button
																variant="ghost"
																size="sm"
																onClick={() => setVehicleType(null)}
																className="rounded-full px-4"
															>
																<XIcon className="size-5 mr-2" />
																Cancel
															</Button>
														</TooltipTrigger>
														<TooltipContent>
															<p>Press ESC to cancel</p>
														</TooltipContent>
													</Tooltip>
												</motion.div>

												<motion.div
													initial={{ opacity: 0, x: -20 }}
													animate={{ opacity: 1, x: 0 }}
													transition={{ duration: 0.3, delay: 0.5 }}
												>
													<Tooltip>
														<TooltipTrigger asChild>
															<motion.button
																onClick={handleParkVehicle}
																disabled={!isFormComplete}
																className={`flex items-center gap-2 rounded-full px-6 py-2 text-sm font-medium ${
																	isFormComplete
																		? "bg-primary hover:bg-primary/90 text-primary-foreground"
																		: "bg-muted cursor-not-allowed text-muted-foreground"
																}`}
																whileHover={
																	isFormComplete
																		? {
																				boxShadow:
																					"0 0 8px rgba(255, 255, 255, 0.3)",
																		  }
																		: {}
																}
																whileTap={isFormComplete ? { scale: 0.97 } : {}}
															>
																<motion.div
																	animate={
																		isFormComplete
																			? {
																					rotate: [0, 15, 0, -15, 0],
																					scale: [1, 1.2, 1],
																			  }
																			: {}
																	}
																	transition={{
																		repeat: Infinity,
																		repeatDelay: 5,
																		duration: 1.5,
																	}}
																>
																	<CheckCircleIcon className="size-5 mr-1" />
																</motion.div>
																Park Vehicle
																<motion.div
																	animate={
																		isFormComplete ? { x: [0, 5, 0] } : {}
																	}
																	transition={{
																		repeat: Infinity,
																		repeatDelay: 3,
																		duration: 0.8,
																		ease: "easeInOut",
																	}}
																>
																	<ArrowRightIcon className="size-5 ml-1" />
																</motion.div>
															</motion.button>
														</TooltipTrigger>
														<TooltipContent>
															<p>
																{isFormComplete
																	? "Press F to park"
																	: "Complete all fields"}
															</p>
														</TooltipContent>
													</Tooltip>
												</motion.div>
											</div>
										</div>
									</motion.div>
								)}
							</AnimatePresence>
						</div>
					</motion.div>
				) : (
					<motion.div
						initial={{ opacity: 0, scale: 0.8, y: 20 }}
						animate={{ opacity: disabled ? 0.6 : 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.8, y: 20 }}
						className={`fixed bottom-4 right-4 z-40 ${disabled ? "opacity-60 pointer-events-none" : ""}`}
						transition={{ type: "spring", stiffness: 300, damping: 25 }}
					>
						<Tooltip>
							<TooltipTrigger asChild>
								<motion.button
									onClick={() => setVisible(true)}
									className="h-12 w-12 rounded-full shadow-lg bg-primary text-primary-foreground flex items-center justify-center"
									whileHover={{
										scale: 1.1,
										boxShadow: "0 0 15px rgba(255, 255, 255, 0.3)",
										y: -2,
									}}
									whileTap={{ scale: 0.9 }}
								>
									<motion.div
										animate={{
											y: [0, -4, 0],
										}}
										transition={{
											repeat: Infinity,
											repeatDelay: 1,
											duration: 1,
											ease: "easeInOut",
										}}
									>
										<ChevronUpIcon className="h-6 w-6" />
									</motion.div>
								</motion.button>
							</TooltipTrigger>
							<TooltipContent side="left">
								<p>Open toolbar (Tab)</p>
							</TooltipContent>
						</Tooltip>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
}
