import { useEffect } from 'react';

const InactivityHandler = ({ timeout = 30 * 60 * 1000 }) => { // Default 30 minutes
  useEffect(() => {
    let timeoutId;
    let lastActivity = Date.now();
    let isHidden = false;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      lastActivity = Date.now();
      
      if (!isHidden) {
        timeoutId = setTimeout(() => {
          window.location.reload();
        }, timeout);
      }
    };

    const handleVisibilityChange = () => {
      isHidden = document.hidden;
      
      if (!isHidden && Date.now() - lastActivity >= timeout) {
        window.location.reload();
      } else if (!isHidden) {
        resetTimer();
      }
    };

    // Events to track user activity
    const events = ['mousedown', 'keydown', 'touchstart', 'mousemove'];
    events.forEach(event => document.addEventListener(event, resetTimer));
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initial timer
    resetTimer();

    return () => {
      events.forEach(event => document.removeEventListener(event, resetTimer));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimeout(timeoutId);
    };
  }, [timeout]);

  return null;
};

export default InactivityHandler;