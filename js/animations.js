/* ============================================================
   ANIMATIONS.JS — IntersectionObserver, Aurora Blobs, Stagger
   Portfolio Personal · Fernanda Jaimes
   ============================================================ */

'use strict';

/* ── INTERSECTION OBSERVER: reveal on scroll ─────────────── */
(function initRevealAnimations() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    document.querySelectorAll(
      '.anim-ready, .anim-rise, .anim-line, .anim-scale, .anim-left, .anim-right'
    ).forEach(el => el.classList.add('revealed'));
    return;
  }

  const elements = document.querySelectorAll(
    '.anim-ready, .anim-rise, .anim-line, .anim-scale, .anim-left, .anim-right'
  );
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.06, rootMargin: '0px 0px -6% 0px' }
  );

  elements.forEach(el => observer.observe(el));
})();

/* ── STAGGER GROUPS ──────────────────────────────────────── */
(function initStagger() {
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  if (prefersReducedMotion) return;

  const groups = document.querySelectorAll('[data-stagger]');
  if (!groups.length) return;

  groups.forEach(group => {
    const delay = parseFloat(group.dataset.stagger) || 0.1;
    const children = group.querySelectorAll('.anim-ready, .anim-scale');

    children.forEach((child, i) => {
      child.style.transitionDelay = `${i * delay}s`;
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            children.forEach(child => child.classList.add('revealed'));
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(group);
  });
})();

/* ── WIP PROGRESS BAR ─────────────────────────────────────── */
(function initWipBars() {
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  const wipBars = document.querySelectorAll('.wip-bar[data-width]');
  if (!wipBars.length) return;

  wipBars.forEach(bar => {
    const target = bar.dataset.width || '65%';

    if (prefersReducedMotion) {
      bar.style.width = target;
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Small delay for visual effect
            setTimeout(() => {
              bar.style.width = target;
            }, 300);
            observer.unobserve(bar);
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(bar);
  });
})();

/* ── PARALLAX: subtle on hero image ──────────────────────── */
(function initParallax() {
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  if (prefersReducedMotion) return;

  const parallaxEls = document.querySelectorAll('[data-parallax]');
  if (!parallaxEls.length) return;

  let ticking = false;

  function updateParallax() {
    const scrollY = window.scrollY;
    parallaxEls.forEach(el => {
      const speed = parseFloat(el.dataset.parallax) || 0.3;
      const rect = el.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const offset = (window.innerHeight / 2 - center) * speed;
      el.style.transform = `translateY(${offset}px)`;
    });
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }, { passive: true });
})();

/* ── COUNTER ANIMATION ────────────────────────────────────── */
(function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  counters.forEach(counter => {
    const target = parseInt(counter.dataset.count, 10);
    const suffix = counter.dataset.suffix || '';
    const duration = 1200;

    if (prefersReducedMotion) {
      counter.textContent = target + suffix;
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;

          const start = performance.now();
          function step(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            counter.textContent = Math.round(eased * target) + suffix;
            if (progress < 1) requestAnimationFrame(step);
          }
          requestAnimationFrame(step);
          observer.unobserve(counter);
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(counter);
  });
})();

/* ── HERO BLOB INTERACTION ────────────────────────────────── */
(function initBlobInteraction() {
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  if (prefersReducedMotion) return;

  const hero = document.querySelector('.hero');
  const blobs = document.querySelectorAll('.blob');
  if (!hero || !blobs.length) return;

  let mouseX = 0, mouseY = 0;
  let targetX = 0, targetY = 0;

  hero.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    // Normalize to -1 .. 1
    mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
  });

  // Very subtle lerp for blob reaction to cursor
  function lerp(a, b, t) { return a + (b - a) * t; }

  function animateBlobs() {
    targetX = lerp(targetX, mouseX, 0.03);
    targetY = lerp(targetY, mouseY, 0.03);

    blobs.forEach((blob, i) => {
      const factor = (i + 1) * 8;
      const dx = targetX * factor;
      const dy = targetY * factor;
      // The CSS animation handles the primary float;
      // we add a subtle extra offset from mouse
      blob.style.setProperty('--mouse-x', `${dx}px`);
      blob.style.setProperty('--mouse-y', `${dy}px`);
    });

    requestAnimationFrame(animateBlobs);
  }

  // Only run if blobs exist in hero
  const heroBlobs = hero.querySelectorAll('.blob');
  if (heroBlobs.length) animateBlobs();
})();

/* ── IMAGE LOADED STATE ───────────────────────────────────── */
(function initImageLoad() {
  document.querySelectorAll('img').forEach(img => {
    if (img.complete) {
      img.classList.add('loaded');
    } else {
      img.addEventListener('load', () => img.classList.add('loaded'));
      img.addEventListener('error', () => img.closest('.project-card__image, .benchmark-card__thumb')
        ?.classList.add('image-error'));
    }
  });
})();
