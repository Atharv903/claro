import { useState, useEffect, RefObject } from 'react';

export const lastClickPosition = { x: 0, y: 0 };

if (typeof window !== 'undefined') {
  lastClickPosition.x = window.innerWidth / 2;
  lastClickPosition.y = window.innerHeight / 2;
  
  window.addEventListener('mousedown', (e) => {
    lastClickPosition.x = e.clientX;
    lastClickPosition.y = e.clientY;
  }, { capture: true }); // Use capture phase to catch coordinates before any stopPropagation

  window.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches[0]) {
      lastClickPosition.x = e.touches[0].clientX;
      lastClickPosition.y = e.touches[0].clientY;
    }
  }, { capture: true });
}

export function useRippleOrigin(ref: RefObject<HTMLDivElement | null>) {
  const [origin, setOrigin] = useState<string>('center center');

  useEffect(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = lastClickPosition.x - rect.left;
    const y = lastClickPosition.y - rect.top;
    setOrigin(`${x}px ${y}px`);
  }, [ref]);

  return origin;
}
