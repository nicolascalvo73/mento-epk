import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// ─── Main init ──────────────────────────────────────────────────────────────

export function initLogoAnimation(): void {
  const wrapper = document.querySelector<HTMLElement>('.logo-wrapper');
  const svg = wrapper?.querySelector<SVGSVGElement>('svg');
  if (!wrapper || !svg) return;

  // Target each letter path by id — order determines stagger sequence (m→e→n→t→o)
  const letterIds = ['#logo-m', '#logo-e', '#logo-n', '#logo-t', '#logo-o'];
  const paths = letterIds
    .map((id) => svg.querySelector<SVGPathElement>(id))
    .filter((el): el is SVGPathElement => el !== null);

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── 1. Draw-in on load ──────────────────────────────────────────────────
  //
  // Logo uses filled paths (not strokes), so the reveal is a staggered
  // opacity + upward translateY per letter — cleaner than clip-path for
  // a serif/handcrafted mark like this one.

  if (prefersReduced) {
    gsap.set(paths, { opacity: 1, y: 0 });
    gsap.set(wrapper, { opacity: 1 });
  } else {
    gsap.set(wrapper, { opacity: 1 });
    gsap.set(paths, { opacity: 0, y: 18 });
    gsap.to(paths, {
      opacity: 1,
      y: 0,
      duration: 0.65,
      stagger: 0.1,
      ease: 'power3.out',
      delay: 0.25,
    });
  }

  // ── 2. Sticky shrink on scroll ─────────────────────────────────────────
  //
  // Logo starts centered in Hero (large), moves to top-left and shrinks
  // as the user scrolls through the hero section.
  // wrapper has position: fixed; initial transform set via CSS (centered).

  if (prefersReduced) {
    // Jump to small state immediately (no animation, but behavior intact)
    gsap.set(wrapper, {
      '--logo-current-size': 'var(--logo-size-sticky)',
      top: '1rem',
      left: '1.5rem',
      xPercent: 0,
      yPercent: 0,
    });
    return;
  }

  const hero = document.querySelector('#hero');
  if (!hero) return;

  // Timeline scrubbed to hero scroll progress
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: hero,
      start: 'top top',
      end: 'bottom top',
      scrub: 1,
    },
  });

  tl.to(wrapper, {
    top: '1rem',
    left: '1.5rem',
    xPercent: 0,
    yPercent: 0,
    width: 'var(--logo-size-sticky)',
    ease: 'none',
  });

  // ── 3. Section-aware color (prep hook) ─────────────────────────────────
  //
  // Future: add data-logo-color to each section, and toggle a class/data-attr
  // on wrapper here. The SVG paths already respond to --logo-fill via CSS.
  //
  // Example:
  // document.querySelectorAll('[data-logo-color]').forEach((section) => {
  //   ScrollTrigger.create({
  //     trigger: section,
  //     start: 'top center',
  //     end: 'bottom center',
  //     onEnter: () => wrapper.dataset.section = section.dataset.logoColor ?? '',
  //     onLeaveBack: () => wrapper.dataset.section = '',
  //   });
  // });
}
