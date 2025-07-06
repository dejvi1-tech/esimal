import { useEffect, useRef } from 'react';

/**
 * Hook to safely manage scroll locking for modals and overlays
 * Prevents scroll blocking issues by properly storing and restoring overflow state
 */
export const useScrollLock = (isLocked: boolean) => {
  const originalOverflowRef = useRef<string>('');
  const isLockedRef = useRef<boolean>(false);

  useEffect(() => {
    if (isLocked && !isLockedRef.current) {
      // Store the original overflow value before changing it
      originalOverflowRef.current = document.body.style.overflow || '';
      document.body.style.overflow = 'hidden';
      isLockedRef.current = true;
    } else if (!isLocked && isLockedRef.current) {
      // Restore the original overflow value
      document.body.style.overflow = originalOverflowRef.current;
      isLockedRef.current = false;
    }
  }, [isLocked]);

  // Cleanup effect to ensure overflow is restored when component unmounts
  useEffect(() => {
    return () => {
      if (isLockedRef.current) {
        document.body.style.overflow = originalOverflowRef.current;
        isLockedRef.current = false;
      }
    };
  }, []);

  // Function to force restore scroll (useful for emergency cleanup)
  const forceRestoreScroll = () => {
    if (isLockedRef.current) {
      document.body.style.overflow = originalOverflowRef.current;
      isLockedRef.current = false;
    }
  };

  return { forceRestoreScroll };
};

/**
 * Utility function to restore scroll globally (for emergency use)
 * Call this if scroll gets stuck and you need to force restore it
 */
export const restoreScroll = () => {
  // Remove any problematic classes that might block scroll
  document.body.classList.remove('overflow-hidden', 'no-scroll', 'scroll-lock');
  document.documentElement.classList.remove('overflow-hidden', 'no-scroll', 'scroll-lock');
  
  // Reset overflow styles
  document.body.style.overflow = '';
  document.documentElement.style.overflow = '';
  
  // Remove any inline styles that might be blocking scroll
  document.body.style.removeProperty('overflow');
  document.documentElement.style.removeProperty('overflow');
  
  console.log('Scroll restored - removed all scroll blocking styles');
}; 