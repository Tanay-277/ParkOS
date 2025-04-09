"use client";

import { motion, AnimatePresence } from "framer-motion";
import React from "react";

interface VehicleButtonProps {
	icon: React.ReactNode;
	label: string;
	active: boolean;
	onClick: () => void;
	shortcut?: string;
}

export function VehicleButton({ 
	icon, 
	label, 
	active, 
	onClick, 
	shortcut 
}: VehicleButtonProps) {
	return (
		<motion.button
			className={`
        relative flex flex-col items-center justify-center gap-0.5 md:gap-1 px-4 md:px-6 py-2 md:py-3 rounded-lg 
        ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"}
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
			<div className="relative z-10">{icon}</div>
			<div className="relative z-10 flex items-center gap-1.5">
				<span className="text-[10px] md:text-xs">{label}</span>
				{/* {shortcut && (
					<span className="text-[8px] md:text-[10px] opacity-70 bg-background/30 px-1 rounded">
						{shortcut}
					</span>
				)} */}
			</div>
		</motion.button>
	);
}
