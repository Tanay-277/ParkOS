"use client";

import { motion } from "framer-motion";

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <div className="w-full max-w-xs mx-auto flex flex-col items-center">
        <motion.div
          className="flex flex-col items-center justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center space-x-2 mb-4">
            <Logo />
            <h1 className="text-2xl font-bold text-primary">ParkOS</h1>
          </div>
          <p className="text-muted-foreground text-sm mb-6">Intelligent Parking System</p>

          {/* Animated loading indicator */}
          <div className="relative w-12 h-12 mb-8">
            <motion.div
              className="absolute inset-0 border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-1 border-2 border-r-primary border-l-transparent border-t-transparent border-b-transparent rounded-full"
              animate={{ rotate: -360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          </div>
        </motion.div>

        <motion.div
          className="w-full max-w-[200px] h-1 bg-muted rounded-full overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.div
            className="h-full bg-primary"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
        </motion.div>
      </div>
    </div>
  );
}

function Logo() {
  return (
    <div className="relative w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
      <motion.div
        className="absolute inset-0 border-2 border-primary rounded-lg"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      />
      <motion.div
        className="w-6 h-6 border-2 border-primary rounded flex items-center justify-center"
        initial={{ rotate: -20 }}
        animate={{ rotate: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <motion.div
          className="w-3 h-3 bg-primary rounded-sm"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        />
      </motion.div>
    </div>
  );
}