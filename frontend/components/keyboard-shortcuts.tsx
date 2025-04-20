"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { KeyboardIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

// Define the shortcut type
interface Shortcut {
  key: string;
  action: () => void;
  description: string;
}

interface KeyboardShortcutsProps {
  shortcuts: Shortcut[];
}

export function KeyboardShortcuts({ shortcuts }: KeyboardShortcutsProps) {
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  
  // Register keyboard event listeners
  useEffect(() => {
    if (!shortcuts || shortcuts.length === 0) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }
      
      // "?" key to toggle help dialog
      if (event.key === "?" || (event.key === "/" && event.shiftKey)) {
        setShowHelpDialog((prev) => !prev);
        return;
      }
      
      // Find matching shortcut
      const shortcut = shortcuts.find((s) => s.key.toLowerCase() === event.key.toLowerCase());
      
      if (shortcut) {
        event.preventDefault();
        shortcut.action();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [shortcuts]);
  
  // Format key name for display
  const formatKeyName = (key: string) => {
    switch (key.toLowerCase()) {
      case "arrowup":
        return "↑";
      case "arrowdown":
        return "↓";
      case "arrowleft":
        return "←";
      case "arrowright":
        return "→";
      case "escape":
        return "Esc";
      case " ":
        return "Space";
      default:
        return key;
    }
  };

  return (
    <>
      {/* Help button */}
      <div className="fixed bottom-4 left-4 z-50">
        <Button 
          size="sm"
          variant="outline"
          className="h-8 w-8 p-0 rounded-full"
          onClick={() => setShowHelpDialog(true)}
        >
          <KeyboardIcon className="h-4 w-4" />
          <span className="sr-only">Keyboard Shortcuts</span>
        </Button>
      </div>
      
      {/* Shortcuts help dialog */}
      <AnimatePresence>
        {showHelpDialog && (
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-card border border-border rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col"
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", duration: 0.4 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <KeyboardIcon className="h-5 w-5" />
                  Keyboard Shortcuts
                </h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 rounded-full"
                  onClick={() => setShowHelpDialog(false)}
                >
                  <XIcon className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </div>
              
              {/* Shortcuts list */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-1 gap-1">
                  {shortcuts.map((shortcut, index) => (
                    <div 
                      key={`${shortcut.key}-${index}`} 
                      className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
                    >
                      <span className="text-sm">{shortcut.description}</span>
                      <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded min-w-9 text-center">
                        {formatKeyName(shortcut.key)}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Footer */}
              <div className="p-3 bg-muted/30 text-xs text-muted-foreground text-center">
                Press <kbd className="px-1 py-0.5 mx-1 font-mono bg-muted rounded">?</kbd> to toggle this dialog at any time
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
