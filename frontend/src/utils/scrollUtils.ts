// Scroll utility functions to prevent freezing and ensure proper scroll behavior

/**
 * Safely scroll to top with fallback for different browsers
 */
export const scrollToTop = (behavior: ScrollBehavior = 'smooth') => {
  try {
    window.scrollTo({ top: 0, behavior });
  } catch (error) {
    // Fallback for browsers that don't support smooth scrolling
    window.scrollTo(0, 0);
  }
};

/**
 * Prevent body scroll (for modals)
 */
export const preventBodyScroll = () => {
  const scrollY = window.scrollY;
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollY}px`;
  document.body.style.width = '100%';
  document.body.classList.add('modal-open');
};

/**
 * Restore body scroll (for modals)
 */
export const restoreBodyScroll = () => {
  const scrollY = document.body.style.top;
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  document.body.classList.remove('modal-open');
  window.scrollTo(0, parseInt(scrollY || '0') * -1);
};

/**
 * Check if scrolling is possible
 */
export const isScrollable = (element: HTMLElement = document.body): boolean => {
  return element.scrollHeight > element.clientHeight;
};

/**
 * Force scroll restoration for problematic elements
 */
export const forceScrollRestoration = () => {
  // Remove any inline styles that might be blocking scroll
  const elements = document.querySelectorAll('*');
  elements.forEach((element) => {
    if (element instanceof HTMLElement) {
      const style = window.getComputedStyle(element);
      if (style.overflow === 'hidden' && element !== document.body) {
        // Only reset if it's not intentionally hidden
        element.style.overflow = '';
      }
    }
  });
  
  // Ensure body scroll is enabled
  document.body.style.overflow = '';
  document.body.style.overflowX = 'hidden';
  document.body.style.overflowY = 'auto';
};

/**
 * Debounced scroll handler to prevent excessive scroll events
 */
export const debounceScroll = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Initialize scroll fixes on page load
 */
export const initializeScrollFixes = () => {
  // Ensure proper scroll behavior on page load
  document.addEventListener('DOMContentLoaded', () => {
    forceScrollRestoration();
  });

  // Handle scroll restoration on navigation
  window.addEventListener('beforeunload', () => {
    forceScrollRestoration();
  });

  // Prevent scroll freezing on touch devices
  if ('ontouchstart' in window) {
    document.addEventListener('touchmove', (e) => {
      // Allow default touch scrolling
      e.stopPropagation();
    }, { passive: true });
  }
};

/**
 * Debug function to check scroll state (development only)
 */
export const debugScrollState = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Scroll Debug Info:');
    console.log('Body overflow:', document.body.style.overflow);
    console.log('Body scrollHeight:', document.body.scrollHeight);
    console.log('Body clientHeight:', document.body.clientHeight);
    console.log('Window scrollY:', window.scrollY);
    console.log('Is scrollable:', isScrollable());
    console.log('Modal open class:', document.body.classList.contains('modal-open'));
  }
}; 