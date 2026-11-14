import React from 'react';
import { createRoot } from 'react-dom/client';

/**
 * Show payment animation overlay
 * @param {string} type - 'success' or 'failure'
 * @param {function} onComplete - Callback function after animation completes
 */
export const showPaymentAnimation = async (type, onComplete) => {
  try {
    // Dynamic import to avoid loading animation component on initial page load
    const { default: PaymentAnimation } = await import('../components/common/PaymentAnimation.jsx');
    
    // Create container for animation
    const container = document.createElement('div');
    container.id = 'payment-animation-root';
    document.body.appendChild(container);

    // Create root and render animation
    const root = createRoot(container);
    
    const handleComplete = () => {
      // Cleanup
      setTimeout(() => {
        root.unmount();
        if (document.body.contains(container)) {
          document.body.removeChild(container);
        }
      }, 100);
      
      // Call the callback
      if (onComplete) {
        onComplete();
      }
    };

    // Use React.createElement instead of JSX to avoid transpilation issues
    root.render(
      React.createElement(PaymentAnimation, {
        type: type,
        onComplete: handleComplete
      })
    );
  } catch (error) {
    console.error('Error loading payment animation:', error);
    // Fallback: just call the callback if animation fails to load
    if (onComplete) {
      onComplete();
    }
  }
};
