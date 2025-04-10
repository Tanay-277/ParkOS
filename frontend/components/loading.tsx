"use client";

import { motion } from "framer-motion";

export function LoadingScreen() {
  return (
    <div className="h-screen w-full bg-[#111] flex items-center justify-center">
      <motion.div 
        className="flex flex-col items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div 
          className="w-12 h-12 mb-8"
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 1 }}
        >
          <svg viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg" fill="none">
            <motion.path 
              d="M22 4C12 4 4 12 4 22C4 32 12 40 22 40C32 40 40 32 40 22C40 12 32 4 22 4ZM22 36C14 36 8 30 8 22C8 14 14 8 22 8C30 8 36 14 36 22C36 30 30 36 22 36Z" 
              stroke="rgba(255,255,255,0.85)" 
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.8, ease: "easeInOut", repeat: Infinity }}
            />
            <motion.path 
              d="M22 12C16 12 12 16 12 22" 
              stroke="rgba(255,255,255,0.85)" 
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ pathLength: 0, rotate: 0 }}
              animate={{ pathLength: 1, rotate: 360 }}
              transition={{ duration: 1.5, ease: "linear", repeat: Infinity }}
              style={{ originX: "22px", originY: "22px" }}
            />
          </svg>
        </motion.div>
        
        <motion.h1
          className="text-[#f1f1f1] text-4xl font-semibold tracking-tight"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          ParkOS
        </motion.h1>

        <motion.div 
          className="mt-6 h-[1px] w-16 bg-[#333]"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        />
        
        <motion.p
          className="mt-6 text-[#777] text-xs tracking-widest uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          Redefining Urban Mobility
        </motion.p>
      </motion.div>
    </div>
  );
}