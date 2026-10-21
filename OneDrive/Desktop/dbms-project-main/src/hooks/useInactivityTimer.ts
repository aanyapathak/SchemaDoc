import { useEffect, useRef } from 'react';

export function useInactivityTimer(onTimeout: () => void, timeoutMs: number = 600000) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const resetTimer = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        onTimeout();
      }, timeoutMs);
    };

    // Attach event listeners
    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
    
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    // Start timer on mount
    resetTimer();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [onTimeout, timeoutMs]);
}
