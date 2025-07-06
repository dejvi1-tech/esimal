import React from 'react';
import { Button } from '@/components/ui/button';
import { restoreScroll, checkScrollStatus } from '@/utils/scrollRestoration';

/**
 * Test component for scroll restoration functionality
 * This can be temporarily added to any page for testing
 */
const ScrollTestButton: React.FC = () => {
  const handleTestScrollBlock = () => {
    // Simulate scroll blocking
    document.body.style.overflow = 'hidden';
    document.body.classList.add('no-scroll');
    console.log('🔒 Scroll blocked for testing');
  };

  const handleRestoreScroll = () => {
    restoreScroll();
  };

  const handleCheckStatus = () => {
    checkScrollStatus();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      <Button 
        onClick={handleTestScrollBlock}
        className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1"
      >
        🔒 Block Scroll
      </Button>
      <Button 
        onClick={handleRestoreScroll}
        className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1"
      >
        ✅ Restore Scroll
      </Button>
      <Button 
        onClick={handleCheckStatus}
        className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1"
      >
        🔍 Check Status
      </Button>
    </div>
  );
};

export default ScrollTestButton; 