/**
 * Global scroll restoration utilities
 * These can be called from the browser console to fix scroll blocking issues
 */

/**
 * Emergency scroll restoration function
 * Call this from browser console if scroll gets stuck: window.restoreScroll()
 */
export const restoreScroll = () => {
  // Remove any problematic classes that might block scroll
  document.body.classList.remove('overflow-hidden', 'no-scroll', 'scroll-lock', 'modal-open');
  document.documentElement.classList.remove('overflow-hidden', 'no-scroll', 'scroll-lock', 'modal-open');
  
  // Reset overflow styles
  document.body.style.overflow = '';
  document.documentElement.style.overflow = '';
  
  // Remove any inline styles that might be blocking scroll
  document.body.style.removeProperty('overflow');
  document.documentElement.style.removeProperty('overflow');
  
  // Remove any fixed positioning that might be covering the page
  const fixedElements = document.querySelectorAll('[style*="position: fixed"]');
  fixedElements.forEach((element) => {
    const style = (element as HTMLElement).style;
    if (style.position === 'fixed' && style.zIndex === '99999') {
      style.display = 'none';
    }
  });
  
  console.log('✅ Scroll restored - removed all scroll blocking styles and hidden problematic overlays');
  return true;
};

/**
 * Check if scroll is currently blocked
 * Call this from browser console: window.checkScrollStatus()
 */
export const checkScrollStatus = () => {
  const bodyOverflow = document.body.style.overflow;
  const htmlOverflow = document.documentElement.style.overflow;
  const bodyClasses = Array.from(document.body.classList);
  const htmlClasses = Array.from(document.documentElement.classList);
  
  const scrollBlockingClasses = ['overflow-hidden', 'no-scroll', 'scroll-lock', 'modal-open'];
  const hasBlockingClasses = scrollBlockingClasses.some(cls => 
    bodyClasses.includes(cls) || htmlClasses.includes(cls)
  );
  
  const status = {
    bodyOverflow,
    htmlOverflow,
    hasBlockingClasses,
    blockingClasses: bodyClasses.filter(cls => scrollBlockingClasses.includes(cls)),
    isScrollBlocked: bodyOverflow === 'hidden' || htmlOverflow === 'hidden' || hasBlockingClasses
  };
  
  console.log('🔍 Scroll Status:', status);
  return status;
};

/**
 * Initialize global scroll restoration utilities
 * Makes functions available in browser console
 */
export const initScrollRestoration = () => {
  // Make functions available globally for browser console access
  (window as any).restoreScroll = restoreScroll;
  (window as any).checkScrollStatus = checkScrollStatus;
  
  // Add a global event listener to detect scroll blocking
  let scrollBlockedTimeout: NodeTimeout;
  
  const checkForScrollBlocking = () => {
    const status = checkScrollStatus();
    if (status.isScrollBlocked) {
      console.warn('⚠️ Scroll blocking detected! Call window.restoreScroll() to fix.');
    }
  };
  
  // Check for scroll blocking after page load and route changes
  window.addEventListener('load', checkForScrollBlocking);
  window.addEventListener('popstate', checkForScrollBlocking);
  
  // Periodically check for scroll blocking (every 5 seconds)
  setInterval(checkForScrollBlocking, 5000);
  
  console.log('🛠️ Scroll restoration utilities initialized. Use window.restoreScroll() or window.checkScrollStatus() in console.');
};

// Auto-initialize when this module is loaded
if (typeof window !== 'undefined') {
  initScrollRestoration();
} 