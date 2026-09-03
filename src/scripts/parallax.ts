import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function initParallax(): void {
  // Respect prefers-reduced-motion: keep image fixed, no animation
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const bg = document.querySelector<HTMLElement>('.parallax-bg');
  if (!bg) return;

  gsap.to(bg, {
    yPercent: 30,
    ease: 'none',
    scrollTrigger: {
      trigger: 'body',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.2,
    },
  });
}
