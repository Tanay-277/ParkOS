"use client";

import { useEffect } from "react";

type ShortcutConfig = {
  key: string;
  action: () => void;
  description: string;
};

interface KeyboardShortcutsProps {
  shortcuts: ShortcutConfig[];
  enabled?: boolean;
}

export function KeyboardShortcuts({ shortcuts, enabled = true }: KeyboardShortcutsProps) {
  useEffect(() => {
    if (!enabled) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (
        document.activeElement?.tagName === "INPUT" || 
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.getAttribute("role") === "combobox"
      ) {
        return;
      }
      
      const key = e.key.toLowerCase();
      const shortcut = shortcuts.find(s => s.key.toLowerCase() === key);
      
      if (shortcut) {
        e.preventDefault();
        shortcut.action();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts, enabled]);
  
  // This is a headless component, no UI to render
  return null;
}
