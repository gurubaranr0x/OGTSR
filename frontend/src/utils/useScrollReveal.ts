import { useEffect, useRef } from 'react';

/**
 * Lightweight, hardware-accelerated scroll-reveal hook.
 * Uses native browser IntersectionObserver to smoothly reveal sections as they scroll into view.
 */
export function useScrollReveal() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const elements = container.querySelectorAll('.scroll-reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.02,
        rootMargin: '0px 0px 80px 0px'
      }
    );

    elements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, []);

  return containerRef;
}
