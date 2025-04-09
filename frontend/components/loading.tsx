"use client";

import { motion } from "framer-motion";

export function LoadingScreen() {
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
