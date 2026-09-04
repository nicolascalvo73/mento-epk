import Snap from 'lenis/snap';
import type Lenis from 'lenis';

// Snaps scroll release to the nearest section boundary — but only when
// that boundary is close (within `distanceThreshold`, default ~50% of the
// viewport). A section shorter than the viewport is always within that
// range, so it always snaps; a section taller than the viewport has scroll
// positions deep inside it that are far from either edge, so scrolling
// stays free until you approach the next boundary.
export function initScrollSnap(lenis: Lenis): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const sections = Array.from(document.querySelectorAll<HTMLElement>('main > section'));
  if (sections.length === 0) return;

  const snap = new Snap(lenis, {
    type: 'proximity',
    duration: 1,
  });

  snap.addElements(sections, { align: ['start'] });
}
