// ─── Types ──────────────────────────────────────────────────────────────────

interface CarouselState {
  activeOverlayVideo: HTMLVideoElement | null;
}

const state: CarouselState = { activeOverlayVideo: null };

const AUTO_ADVANCE_MS = 60_000;

// ─── Horizontal slider: one clip visible, auto-advances every minute ────────

function initCarouselSlider(): void {
  const root = document.querySelector<HTMLElement>('.carousel');
  const track = root?.querySelector<HTMLElement>('.carousel__track');
  const slides = Array.from(root?.querySelectorAll<HTMLElement>('.carousel__slide') ?? []);
  const dots = Array.from(root?.querySelectorAll<HTMLButtonElement>('.carousel__dot') ?? []);
  const prevBtn = root?.querySelector<HTMLButtonElement>('.carousel__nav--prev');
  const nextBtn = root?.querySelector<HTMLButtonElement>('.carousel__nav--next');
  if (!root || !track || slides.length === 0) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let index = 0;
  let timer: ReturnType<typeof setInterval> | null = null;
  let inView = false;

  const videoOf = (slide: HTMLElement) => slide.querySelector<HTMLVideoElement>('.carousel__video');

  function render(): void {
    track.style.transform = `translateX(-${index * 100}%)`;

    slides.forEach((slide, i) => {
      const video = videoOf(slide);
      if (!video) return;
      if (i === index) {
        if (inView) {
          if (!video.src) {
            video.src = video.dataset.src ?? '';
            video.load();
          }
          video.play().catch(() => {/* autoplay blocked, silently ignore */});
        }
      } else {
        video.pause();
      }
    });

    dots.forEach((dot, i) => {
      dot.classList.toggle('is-active', i === index);
      dot.setAttribute('aria-selected', i === index ? 'true' : 'false');
    });
  }

  function goTo(target: number): void {
    index = (target + slides.length) % slides.length;
    render();
  }

  function stopTimer(): void {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function startTimer(): void {
    if (prefersReduced || slides.length < 2) return;
    stopTimer();
    timer = setInterval(() => goTo(index + 1), AUTO_ADVANCE_MS);
  }

  prevBtn?.addEventListener('click', () => { goTo(index - 1); startTimer(); });
  nextBtn?.addEventListener('click', () => { goTo(index + 1); startTimer(); });
  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      goTo(Number(dot.dataset.index ?? 0));
      startTimer();
    });
  });

  // Auto-advance is a moving-content pattern (WCAG 2.2.2): pause it on
  // hover/focus so it never fights someone reading or interacting with it.
  root.addEventListener('pointerenter', stopTimer);
  root.addEventListener('pointerleave', () => { if (inView) startTimer(); });
  root.addEventListener('focusin', stopTimer);
  root.addEventListener('focusout', (e) => {
    if (inView && !root.contains(e.relatedTarget as Node | null)) startTimer();
  });

  // Only load/play/auto-advance once the carousel is actually on screen.
  const visibility = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      inView = entry.isIntersecting;
      if (inView) {
        render();
        startTimer();
      } else {
        stopTimer();
        slides.forEach((slide) => videoOf(slide)?.pause());
      }
    },
    { threshold: 0.3 }
  );
  visibility.observe(root);

  render();
}

// ─── Overlay open / close ────────────────────────────────────────────────────

function openOverlay(src: string): void {
  const overlay = document.querySelector<HTMLElement>('.video-overlay');
  const ovVideo = overlay?.querySelector<HTMLVideoElement>('.video-overlay__video');
  if (!overlay || !ovVideo) return;

  ovVideo.src = src;
  ovVideo.currentTime = 0;
  overlay.removeAttribute('hidden');
  overlay.setAttribute('aria-hidden', 'false');
  overlay.classList.add('is-open');

  ovVideo.play().catch(() => {});
  state.activeOverlayVideo = ovVideo;

  // Trap focus inside overlay
  trapFocus(overlay);
}

function closeOverlay(): void {
  const overlay = document.querySelector<HTMLElement>('.video-overlay');
  const ovVideo = overlay?.querySelector<HTMLVideoElement>('.video-overlay__video');
  if (!overlay) return;

  overlay.classList.remove('is-open');
  overlay.setAttribute('aria-hidden', 'true');

  if (ovVideo) {
    ovVideo.pause();
    ovVideo.src = '';
  }

  state.activeOverlayVideo = null;

  // Return focus to the thumbnail that opened it
  const lastFocused = document.querySelector<HTMLElement>('.carousel__item.was-active');
  lastFocused?.focus();
  lastFocused?.classList.remove('was-active');

  setTimeout(() => overlay.setAttribute('hidden', ''), 300); // after CSS transition
}

// ─── Focus trap ─────────────────────────────────────────────────────────────

function trapFocus(container: HTMLElement): void {
  const focusable = container.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), video'
  );
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  first?.focus();

  const handler = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
    }
  };

  container.addEventListener('keydown', handler);
  // Cleanup when overlay closes
  container.addEventListener('transitionend', () => {
    if (!container.classList.contains('is-open')) {
      container.removeEventListener('keydown', handler);
    }
  }, { once: true });
}

// ─── Carousel click → overlay ────────────────────────────────────────────────

function initCarouselClicks(): void {
  document.querySelectorAll<HTMLElement>('.carousel__item').forEach((item) => {
    item.addEventListener('click', () => {
      const video = item.querySelector<HTMLVideoElement>('.carousel__video');
      const src = video?.dataset.src ?? video?.src ?? '';
      if (!src) return;
      item.classList.add('was-active');
      openOverlay(src);
    });
  });
}

// ─── Overlay close listeners ─────────────────────────────────────────────────

function initOverlayClose(): void {
  const overlay = document.querySelector<HTMLElement>('.video-overlay');
  const closeBtn = overlay?.querySelector<HTMLButtonElement>('.video-overlay__close');

  closeBtn?.addEventListener('click', closeOverlay);

  // Click outside the video closes overlay
  overlay?.addEventListener('click', (e) => {
    if (e.target === overlay) closeOverlay();
  });

  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay?.classList.contains('is-open')) closeOverlay();
  });
}

// ─── Entry point ─────────────────────────────────────────────────────────────

export function initVideoCarousel(): void {
  initCarouselSlider();
  initCarouselClicks();
  initOverlayClose();
}
