// ─── Types ──────────────────────────────────────────────────────────────────

interface CarouselState {
  activeOverlayVideo: HTMLVideoElement | null;
}

const state: CarouselState = { activeOverlayVideo: null };

// ─── Lazy load via IntersectionObserver ─────────────────────────────────────

function initLazyVideos(): void {
  const videos = document.querySelectorAll<HTMLVideoElement>('.carousel__video[data-src]');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target as HTMLVideoElement;
        if (entry.isIntersecting) {
          if (!video.src || video.src === window.location.href) {
            video.src = video.dataset.src ?? '';
            video.load();
          }
          video.play().catch(() => {/* autoplay blocked, silently ignore */});
        } else {
          video.pause();
        }
      });
    },
    { rootMargin: '200px 0px', threshold: 0.1 }
  );

  videos.forEach((v) => observer.observe(v));
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

// ─── Pause control (accessibility: mute/unmute carousel thumbs) ──────────────

function initPauseControls(): void {
  document.querySelectorAll<HTMLButtonElement>('.carousel__pause-btn').forEach((btn) => {
    const item = btn.closest<HTMLElement>('.carousel__item');
    const video = item?.querySelector<HTMLVideoElement>('.carousel__video');
    if (!video) return;

    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // don't trigger overlay open
      const paused = video.paused;
      paused ? video.play() : video.pause();
      btn.setAttribute('aria-pressed', paused ? 'false' : 'true');
      btn.setAttribute('aria-label', paused ? 'Pausar video' : 'Reproducir video');
    });
  });
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

    // Keyboard: Enter or Space opens overlay
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        item.click();
      }
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
  initLazyVideos();
  initPauseControls();
  initCarouselClicks();
  initOverlayClose();
}
