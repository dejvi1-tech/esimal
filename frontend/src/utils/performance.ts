// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private observers: Map<string, PerformanceObserver> = new Map();

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Monitor Largest Contentful Paint (LCP)
  monitorLCP(callback?: (entry: PerformanceEntry) => void): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        console.log('LCP:', lastEntry.startTime, 'ms');
        
        if (callback) {
          callback(lastEntry);
        }
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.set('lcp', observer);
    }
  }

  // Monitor First Input Delay (FID)
  monitorFID(callback?: (entry: PerformanceEntry) => void): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          console.log('FID:', entry.processingStart - entry.startTime, 'ms');
          
          if (callback) {
            callback(entry);
          }
        });
      });

      observer.observe({ entryTypes: ['first-input'] });
      this.observers.set('fid', observer);
    }
  }

  // Monitor Cumulative Layout Shift (CLS)
  monitorCLS(callback?: (entry: PerformanceEntry) => void): void {
    if ('PerformanceObserver' in window) {
      let clsValue = 0;
      let clsEntries: PerformanceEntry[] = [];

      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceEntry[];
        entries.forEach((entry) => {
          if (!clsEntries.includes(entry)) {
            clsValue += (entry as any).value;
            clsEntries.push(entry);
            
            console.log('CLS:', clsValue);
            
            if (callback) {
              callback(entry);
            }
          }
        });
      });

      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('cls', observer);
    }
  }

  // Monitor Time to First Byte (TTFB)
  monitorTTFB(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const ttfb = entry.responseStart - entry.requestStart;
          console.log('TTFB:', ttfb, 'ms');
        });
      });

      observer.observe({ entryTypes: ['navigation'] });
      this.observers.set('ttfb', observer);
    }
  }

  // Get current performance metrics
  getMetrics(): Record<string, number> {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    
    return {
      ttfb: navigation ? navigation.responseStart - navigation.requestStart : 0,
      fcp: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
      lcp: 0, // Will be updated by observer
      fid: 0, // Will be updated by observer
      cls: 0, // Will be updated by observer
    };
  }

  // Disconnect all observers
  disconnect(): void {
    this.observers.forEach((observer) => {
      observer.disconnect();
    });
    this.observers.clear();
  }
}

// Resource loading performance
export const monitorResourceLoading = () => {
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        const resourceEntry = entry as PerformanceResourceTiming;
        if (resourceEntry.initiatorType === 'img' && resourceEntry.duration > 1000) {
          console.warn('Slow image load:', resourceEntry.name, resourceEntry.duration, 'ms');
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });
  }
};

// Memory usage monitoring
export const monitorMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    console.log('Memory usage:', {
      used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + 'MB',
      total: Math.round(memory.totalJSHeapSize / 1024 / 1024) + 'MB',
      limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) + 'MB',
    });
  }
};

// Bundle size monitoring
export const getBundleSize = async () => {
  try {
    const response = await fetch('/src/main.tsx');
    const size = response.headers.get('content-length');
    console.log('Bundle size:', size ? Math.round(parseInt(size) / 1024) + 'KB' : 'Unknown');
  } catch (error) {
    console.log('Could not determine bundle size');
  }
};

// Initialize performance monitoring
export const initPerformanceMonitoring = () => {
  const monitor = PerformanceMonitor.getInstance();
  
  // Monitor Core Web Vitals
  monitor.monitorLCP();
  monitor.monitorFID();
  monitor.monitorCLS();
  monitor.monitorTTFB();
  
  // Monitor resource loading
  monitorResourceLoading();
  
  // Monitor memory usage periodically
  setInterval(monitorMemoryUsage, 30000);
  
  // Get initial metrics
  setTimeout(() => {
    console.log('Initial performance metrics:', monitor.getMetrics());
  }, 1000);
  
  return monitor;
}; 