import { useEffect, useState } from 'react';

/**
 * Tracks the global mouse position. Used for cursor-reactive lighting.
 * Returns { x, y } in viewport pixels.
 */
export default function useMousePosition() {
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let frame = 0;
    const handler = (e) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setPos({ x: e.clientX, y: e.clientY }));
    };
    window.addEventListener('mousemove', handler);
    return () => {
      window.removeEventListener('mousemove', handler);
      cancelAnimationFrame(frame);
    };
  }, []);

  return pos;
}
