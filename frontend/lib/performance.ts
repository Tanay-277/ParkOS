/**
 * Performance utilities for optimization
 */

/**
 * Debounce a function to delay its execution until after a wait period
 * @param func The function to debounce
 * @param wait Wait time in milliseconds
 * @param immediate Whether to call the function immediately before the wait period
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate: boolean = false
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(this: any, ...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(this, args);
    };
    
    const callNow = immediate && !timeout;
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func.apply(this, args);
  };
}

/**
 * Throttle a function to limit how often it can be called
 * @param func The function to throttle
 * @param limit Time limit in milliseconds
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T, 
  limit: number
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  let inThrottle = false;
  let lastResult: ReturnType<T>;
  
  return function(this: any, ...args: Parameters<T>): ReturnType<T> | undefined {
    if (!inThrottle) {
      inThrottle = true;
      lastResult = func.apply(this, args);
      
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
    
    return lastResult;
  };
}

/**
 * Memoize function - caches the results of expensive function calls
 */
export function memoize<T extends (...args: any[]) => any>(func: T): T {
  const cache = new Map();
  
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = func(...args);
    cache.set(key, result);
    
    return result;
  }) as T;
}

/**
 * Check if the current device is likely a low-performance device
 */
export function isLowPerformanceDevice(): boolean {
  // Check if we're running in a browser
  if (typeof window === 'undefined' || !window.navigator) {
    return false;
  }

  // Mobile device detection
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  // CPU cores check (if available)
  const lowCores = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
  
  // Memory check (if available)
  const lowMemory = (navigator as any).deviceMemory && (navigator as any).deviceMemory <= 4;
  
  // Assume low performance with 2 or more indicators
  return (isMobile && lowCores) || 
         (isMobile && lowMemory) || 
         (lowCores && lowMemory);
}

/**
 * Enhanced frame rate limiter with smooth frame pacing
 * More optimized version for production
 */
export function createFrameRateLimiter(targetFps: number): (callback: FrameRequestCallback) => void {
  const frameInterval = 1000 / targetFps;
  let lastFrameTime = 0;
  let rafId: number | null = null;
  
  // Track timing metrics for smoother animation
  let frameTimeHistory: number[] = [];
  const MAX_HISTORY = 10;

  return function(callback: FrameRequestCallback): void {
    const currentTime = performance.now();
    
    // Calculate average frame time for smoother pacing
    if (lastFrameTime !== 0) {
      const frameTime = currentTime - lastFrameTime;
      frameTimeHistory.push(frameTime);
      if (frameTimeHistory.length > MAX_HISTORY) {
        frameTimeHistory.shift();
      }
    }
    
    // Calculate expected next frame time
    const avgFrameTime = frameTimeHistory.length > 0 
      ? frameTimeHistory.reduce((sum, time) => sum + time, 0) / frameTimeHistory.length 
      : frameInterval;
    
    const timeUntilNextFrame = Math.max(0, frameInterval - avgFrameTime);
    
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
    
    setTimeout(() => {
      lastFrameTime = performance.now();
      rafId = requestAnimationFrame(callback);
    }, timeUntilNextFrame);
  };
}

/**
 * Production-ready performance monitor
 * Collects and reports performance metrics
 */
export class PerformanceMonitor {
  private metrics: {
    fps: number[];
    frameTime: number[];
    memoryUsage?: number[];
  } = {
    fps: [],
    frameTime: [],
    memoryUsage: []
  };
  
  private lastFrameTime = 0;
  private frameCount = 0;
  private lastFpsUpdate = 0;
  private isRunning = false;
  private frameId: number | null = null;
  
  constructor(private sampleSize = 60, private reportCallback?: (metrics: any) => void) {}
  
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    this.lastFpsUpdate = performance.now();
    this.collectMetrics();
  }
  
  stop(): void {
    this.isRunning = false;
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }
  
  private collectMetrics(): void {
    if (!this.isRunning) return;
    
    const now = performance.now();
    const frameTime = now - this.lastFrameTime;
    this.lastFrameTime = now;
    
    this.metrics.frameTime.push(frameTime);
    if (this.metrics.frameTime.length > this.sampleSize) {
      this.metrics.frameTime.shift();
    }
    
    this.frameCount++;
    
    // Update FPS once per second
    if (now - this.lastFpsUpdate >= 1000) {
      const fps = this.frameCount;
      this.metrics.fps.push(fps);
      if (this.metrics.fps.length > this.sampleSize) {
        this.metrics.fps.shift();
      }
      
      this.frameCount = 0;
      this.lastFpsUpdate = now;
      
      // Sample memory if available
      if ((performance as any).memory) {
        const memoryInfo = (performance as any).memory;
        const memoryUsage = memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit;
        
        if (this.metrics.memoryUsage) {
          this.metrics.memoryUsage.push(memoryUsage);
          if (this.metrics.memoryUsage.length > this.sampleSize) {
            this.metrics.memoryUsage.shift();
          }
        }
      }
      
      // Report metrics if callback is provided
      if (this.reportCallback) {
        const avgFps = this.metrics.fps.reduce((sum, fps) => sum + fps, 0) / this.metrics.fps.length;
        const avgFrameTime = this.metrics.frameTime.reduce((sum, time) => sum + time, 0) / this.metrics.frameTime.length;
        const avgMemory = this.metrics.memoryUsage && this.metrics.memoryUsage.length > 0
          ? this.metrics.memoryUsage.reduce((sum, mem) => sum + mem, 0) / this.metrics.memoryUsage.length
          : undefined;
          
        this.reportCallback({
          avgFps,
          avgFrameTime,
          avgMemory,
          timestamp: now
        });
      }
    }
    
    // Continue collecting metrics
    this.frameId = requestAnimationFrame(this.collectMetrics.bind(this));
  }
  
  getMetrics() {
    return {
      fps: this.metrics.fps.length > 0 
        ? this.metrics.fps.reduce((sum, fps) => sum + fps, 0) / this.metrics.fps.length 
        : 0,
      frameTime: this.metrics.frameTime.length > 0
        ? this.metrics.frameTime.reduce((sum, time) => sum + time, 0) / this.metrics.frameTime.length
        : 0,
      memoryUsage: this.metrics.memoryUsage && this.metrics.memoryUsage.length > 0
        ? this.metrics.memoryUsage.reduce((sum, mem) => sum + mem, 0) / this.metrics.memoryUsage.length
        : undefined
    };
  }
}
