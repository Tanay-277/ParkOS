/**
 * Performance optimization utilities to improve app performance
 * @deprecated - Use functions from lib/performance.ts instead
 * This file is maintained for backward compatibility only
 */

/**
 * Track FPS over time to help debug performance issues
 */
export class FPSMonitor {
  private frameCount = 0;
  private lastSecond = Date.now();
  private fps = 0;
  private listeners: ((fps: number) => void)[] = [];
  private running = false;
  private animationFrame: number | null = null;

  start() {
    if (this.running) return;
    this.running = true;
    this.measure();
    return this;
  }

  stop() {
    if (!this.running) return;
    this.running = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    return this;
  }

  addListener(listener: (fps: number) => void) {
    this.listeners.push(listener);
    return this;
  }

  removeListener(listener: (fps: number) => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
    return this;
  }

  getCurrentFPS() {
    return this.fps;
  }

  private measure = () => {
    this.frameCount++;
    const now = Date.now();
    
    // Update FPS once per second
    if (now - this.lastSecond >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastSecond = now;
      
      // Notify listeners
      for (const listener of this.listeners) {
        listener(this.fps);
      }
    }
    
    this.animationFrame = requestAnimationFrame(this.measure);
  };
}

/**
 * Returns a function that throttles animation frames 
 * to a specific frame rate target (e.g., 30fps)
 * @deprecated - Use createFrameRateLimiter from lib/performance.ts instead
 */
export function createFrameThrottler(targetFPS: number = 30) {
  const frameInterval = 1000 / targetFPS;
  let lastFrameTime = 0;
  
  return (callback: FrameRequestCallback): void => {
    const now = performance.now();
    const elapsed = now - lastFrameTime;
    
    if (elapsed > frameInterval) {
      lastFrameTime = now - (elapsed % frameInterval);
      requestAnimationFrame(callback);
    }
  };
}

/**
 * Detect if device is likely to have performance issues
 * @deprecated - Use isLowPerformanceDevice from lib/performance.ts instead
 */
export function isLowPerformanceDevice() {
  // Import from the new location to maintain backward compatibility
  const { isLowPerformanceDevice } = require('../lib/performance');
  return isLowPerformanceDevice();
}

/**
 * Batch DOM operations for better performance
 * @deprecated - Use batchDOMOperations from lib/performance.ts instead
 */
export function batchDOMOperations<T>(callback: () => T): T {
  // Import from the new location to maintain backward compatibility
  const { batchDOMOperations } = require('../lib/performance');
  return batchDOMOperations(callback);
}
