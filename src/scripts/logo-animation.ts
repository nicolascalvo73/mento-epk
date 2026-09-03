import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// ─── Draw-in helpers ────────────────────────────────────────────────────────

function prepareStrokePaths(paths: SVGGeometryElement[]): void {
  paths.forEach((p) => {
    const len = p.getTotalLength();
    gsap.set(p, {
      strokeDasharray: len,
      strokeDashoffset: len,
    });
  });
}

function drawInPaths(paths: SVGGeometryElement[], delay = 0): gsap.core.Tween {
  return gsap.to(paths, {
    strokeDashoffset: 0,
    duration: 0.7,
    stagger: 0.15,
    ease: 'power2.inOut',
    delay,
  });
}

// ─── Main init ──────────────────────────────────────────────────────────────

export function initLogoAnimation(): void {
  const wrapper = document.querySelector<HTMLElement>('.logo-wrapper');
  const svg = wrapper?.querySelector<SVGSVGElement>('svg');
  if (!wrapper || !svg) return;

  const paths = Array.from(
    svg.querySelectorAll<SVGGeometryElement>('path, circle, rect, ellipse, line, polyline, polygon')
  );

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── 1. Draw-in on load ──────────────────────────────────────────────────

  if (prefersReduced) {
    // Skip animation: show logo immediately
    gsap.set(paths, { strokeDasharray: 'none', strokeDashoffset: 0, opacity: 1 });
    gsap.set(wrapper, { opacity: 1 });
  } else {
    gsap.set(wrapper, { opacity: 0 });
    // Attempt DrawSVGPlugin (Club GSAP). If not registered, fall back to manual.
    const hasDrawSVG = gsap.plugins && ('drawSVG' in (gsap.plugins as Record<string, unknown>));

    if (hasDrawSVG) {
      gsap.set(wrapper, { opacity: 1 });
      gsap.from(paths, {
        drawSVG: '0%',
        duration: 0.8,
        stagger: 0.15,
        ease: 'power2.inOut',
        delay: 0.3,
      });
    } else {
      // Manual stroke-dashoffset fallback
      prepareStrokePaths(paths);
      gsap.set(wrapper, { opacity: 1 });
      drawInPaths(paths, 0.3);
    }
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
  // on wrapper here. The SVG paths already respond to --logo-stroke via CSS.
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
