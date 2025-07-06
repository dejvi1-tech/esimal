import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Performance monitoring for scrolling issues
if (import.meta.env.DEV) {
  // Monitor for potential performance issues
  let lastScrollTime = 0;
  let scrollEventCount = 0;
  
  const handleScroll = () => {
    const now = performance.now();
    scrollEventCount++;
    
    // If we have too many scroll events in a short time, log a warning
    if (now - lastScrollTime < 16 && scrollEventCount > 5) { // 60fps = 16ms
      console.warn('⚠️ High scroll event frequency detected. This may cause performance issues.');
      scrollEventCount = 0;
    }
    
    lastScrollTime = now;
  };
  
  // Throttle scroll events for monitoring
  let scrollTimeout: number;
  const throttledScrollHandler = () => {
    if (scrollTimeout) return;
    scrollTimeout = window.setTimeout(() => {
      handleScroll();
      scrollTimeout = 0;
    }, 16); // ~60fps
  };
  
  window.addEventListener('scroll', throttledScrollHandler, { passive: true });
  
  // Monitor for long tasks
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) { // Tasks longer than 50ms
          console.warn('⚠️ Long task detected:', entry.name, `${entry.duration.toFixed(2)}ms`);
        }
      }
    });
    observer.observe({ entryTypes: ['longtask'] });
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)