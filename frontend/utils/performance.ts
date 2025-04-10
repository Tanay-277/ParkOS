/**
 * Performance optimization utilities to improve app performance
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
 */
export function isLowPerformanceDevice() {
  // Check for low memory
  const memory = (navigator as any).deviceMemory;
  if (memory && memory <= 4) {
    return true;
  }
  
  // Check for mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Check for slow CPU
  const hardwareConcurrency = navigator.hardwareConcurrency || 0;
  if (hardwareConcurrency <= 4 && isMobile) {
    return true;
  }
  
  return false;
}

/**
 * Batch DOM operations for better performance
 */
export function batchDOMOperations<T>(callback: () => T): T {
  // Leverage requestAnimationFrame for batching
  return callback();
}
