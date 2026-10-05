import { useRef, useCallback } from 'react';

/**
 * Smoothly scrolls the main viewport to the specified element ID with snappy, responsive easing.
 */
export function scrollToSection(elementId: string, offset = 20, duration = 400) {
  const main = document.querySelector('main');
  if (!main) return;
  const targetEl = document.getElementById(elementId);
  if (!targetEl) return;

  const targetRect = targetEl.getBoundingClientRect();
  const mainRect = main.getBoundingClientRect();
  const desiredY = Math.max(0, main.scrollTop + (targetRect.top - mainRect.top) - offset);

  const startY = main.scrollTop;
  const distance = desiredY - startY;
  const startTime = performance.now();

  const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

  const animate = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutQuart(progress);

    main.scrollTop = startY + distance * eased;

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };

  requestAnimationFrame(animate);
}

/**
 * Lightweight scroll helper hook.
 * Preserves 100% natural, instant, hardware-accelerated native mouse/trackpad speed
 * while providing snappy animated navigation for anchor buttons and chapter pills.
 */
export function useSmoothScroll<T extends HTMLElement = HTMLElement>() {
  const containerRef = useRef<T | null>(null);

  const scrollToId = useCallback((elementId: string) => {
    scrollToSection(elementId);
  }, []);

  return { containerRef, scrollToId };
}
