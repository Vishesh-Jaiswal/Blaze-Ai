import { useEffect, useRef, useState } from 'react';

/**
 * Animated counter that eases toward `end` when `start` becomes true.
 * @param {number} end - target value
 * @param {object} opts - { duration, start, decimals }
 */
export default function useCountUp(end, { duration = 1600, start = true, decimals = 0 } = {}) {
  const [value, setValue] = useState(0);
  const frame = useRef(0);
  const startTime = useRef(null);

  useEffect(() => {
    if (!start) return;
    startTime.current = null;

    const tick = (now) => {
      if (startTime.current === null) startTime.current = now;
      const elapsed = now - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setValue(end * eased);
      if (progress < 1) {
        frame.current = requestAnimationFrame(tick);
      } else {
        setValue(end);
      }
    };

    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [end, duration, start]);

  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
