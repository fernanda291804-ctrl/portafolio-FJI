/* ============================================================
   MAIN.JS — Navigation, Scroll Effects, Cursor
   Portfolio Personal · Fernanda Jaimes
   ============================================================ */

'use strict';

/* ── HERO HOLOGRÁFICO: secuencia FERNANDA → JAIMES ─────────── */
(function initHeroName() {
  const word1  = document.getElementById('holo-word-1');
  const word2  = document.getElementById('holo-word-2');
  const top    = document.getElementById('hero-top');
  const bottom = document.getElementById('hero-bottom');
  if (!word1 || !word2) return;

  // Reduced motion: mostrar estado final sin animación
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    word2.style.opacity = '1';
    word2.style.filter  = 'blur(0)';
    if (top)    top.classList.add('revealed');
    if (bottom) bottom.classList.add('revealed');
    return;
  }

  // ── Fase 1: FERNANDA entra (blur → sharp) ─────────────────
  // Pequeño delay para que la página termine de pintar
  setTimeout(() => {
    word1.classList.add('word-in');
  }, 200);

  // ── Fase 2: tras 2.8 s → FERNANDA sale (sharp → blur) ────
  setTimeout(() => {
    word1.classList.remove('word-in');
    word1.classList.add('word-out');

    // ── Fase 3: 0.75 s después → JAIMES entra ───────────────
    setTimeout(() => {
      word1.style.display = 'none';          // retira del flujo
      word2.classList.add('word-in');

      // ── Fase 4: 0.9 s después → top + bottom aparecen ─────
      setTimeout(() => {
        if (top)    top.classList.add('revealed');
        if (bottom) bottom.classList.add('revealed');
      }, 900);

    }, 750);
  }, 3000);
})();

/* ── NAV: scroll glass effect ─────────────────────────────── */
(function initNav() {
  const nav = document.querySelector('.nav');
  if (!nav) return;

  let ticking = false;

  function updateNav() {
    const scrolled = window.scrollY > 60;
    nav.classList.toggle('scrolled', scrolled);
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateNav);
      ticking = true;
    }
  }, { passive: true });

  updateNav(); // run once on load
})();

/* ── MOBILE MENU ──────────────────────────────────────────── */
(function initMobileMenu() {
  const toggle = document.querySelector('.nav-toggle');
  const mobileMenu = document.querySelector('.nav-mobile');
  if (!toggle || !mobileMenu) return;

  function openMenu() {
    toggle.setAttribute('aria-expanded', 'true');
    mobileMenu.classList.add('open');
    document.body.classList.add('scroll-locked');
    // Focus first link
    const firstLink = mobileMenu.querySelector('a');
    if (firstLink) firstLink.focus();
  }

  function closeMenu() {
    toggle.setAttribute('aria-expanded', 'false');
    mobileMenu.classList.remove('open');
    document.body.classList.remove('scroll-locked');
    toggle.focus();
  }

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    isOpen ? closeMenu() : openMenu();
  });

  // Close on link click
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
      closeMenu();
    }
  });
})();

/* ── ACTIVE NAV LINK ──────────────────────────────────────── */
(function initActiveNav() {
  const links = document.querySelectorAll('.nav-link[data-section]');
  if (!links.length) return;

  const sections = Array.from(links).map(link => {
    const id = link.dataset.section;
    return { link, section: document.getElementById(id) };
  }).filter(({ section }) => section !== null);

  if (!sections.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        const match = sections.find(s => s.section === entry.target);
        if (match && entry.isIntersecting) {
          links.forEach(l => l.classList.remove('active'));
          match.link.classList.add('active');
        }
      });
    },
    { rootMargin: '-40% 0px -40% 0px', threshold: 0 }
  );

  sections.forEach(({ section }) => observer.observe(section));
})();

/* ── SCROLL PROGRESS (case study pages) ──────────────────── */
(function initScrollProgress() {
  const bar = document.querySelector('.case-progress');
  if (!bar) return;

  function updateProgress() {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
    bar.style.width = `${Math.min(progress, 100)}%`;
  }

  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();
})();

/* ── CUSTOM CURSOR — glass, lerp ring ─────────────────────── */
(function initCursor() {
  if (!window.matchMedia('(pointer: fine)').matches) return;

  const dot  = document.createElement('div');
  const ring = document.createElement('div');
  dot.className  = 'cursor-dot';
  ring.className = 'cursor-ring';
  dot.setAttribute('aria-hidden', 'true');
  ring.setAttribute('aria-hidden', 'true');
  document.body.appendChild(dot);
  document.body.appendChild(ring);

  let mx = -200, my = -200;   // mouse
  let rx = -200, ry = -200;   // ring (lerped)

  // Dot follows instantly
  document.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top  = my + 'px';
    dot.classList.add('visible');
    ring.classList.add('visible');
  });
  document.addEventListener('mouseleave', () => {
    dot.classList.remove('visible');
    ring.classList.remove('visible');
  });

  // Ring lerps toward mouse on every frame
  function lerp(a, b, t) { return a + (b - a) * t; }
  (function animateRing() {
    rx = lerp(rx, mx, 0.10);
    ry = lerp(ry, my, 0.10);
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(animateRing);
  })();

  // Hover state
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest('a, button, [role="button"]')) {
      dot.classList.add('hover');
      ring.classList.add('hover');
    } else {
      dot.classList.remove('hover');
      ring.classList.remove('hover');
    }
  });
})();

/* ── HERO NAME HOVER: JAIMES ↔ FERNANDA ─────────────────────
   Hover sobre el nombre → FERNANDA aparece (blur-in)
   Mouse sale → vuelve JAIMES (blur-in)
   Solo activo después de que termina la animación inicial (~5s)
   ─────────────────────────────────────────────────────────── */
(function initHeroNameHover() {
  if (!window.matchMedia('(pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const word1  = document.getElementById('holo-word-1');
  const word2  = document.getElementById('holo-word-2');
  const center = document.querySelector('.hero-holo__center');
  if (!word1 || !word2 || !center) return;

  let ready      = false;
  let swapTimer  = null;
  let showing    = 'jaimes'; // tracks which word is currently visible

  // La animación inicial termina ~4.65s desde carga — esperamos un poco más
  setTimeout(() => { ready = true; }, 5200);

  function showWord(show, hide, hideThenShow) {
    clearTimeout(swapTimer);
    // 1. El visible sale con blur-out
    hide.classList.remove('word-in');
    hide.classList.add('word-out');
    // 2. Cuando acaba de irse (~400ms) entra el otro con blur-in
    swapTimer = setTimeout(() => {
      hide.style.display = 'none';
      show.style.display = '';
      show.classList.remove('word-out');
      show.classList.add('word-in');
    }, 420);
  }

  center.addEventListener('mouseenter', () => {
    if (!ready || showing === 'fernanda') return;
    showing = 'fernanda';
    showWord(word1, word2);
  });

  center.addEventListener('mouseleave', () => {
    if (!ready || showing === 'jaimes') return;
    showing = 'jaimes';
    showWord(word2, word1);
  });
})();


/* ── SMOOTH SCROLL: anchor links ─────────────────────────── */
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
})();

/* ── WIP PROGRESS BAR FILL ────────────────────────────────── */
(function initWipBar() {
  const wipBar = document.querySelector('.wip-bar[data-width]');
  if (!wipBar) return;

  const target = wipBar.dataset.width || '65%';

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        wipBar.style.width = target;
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  observer.observe(wipBar);
})();

/* ── LAZY LOADING IMAGES ──────────────────────────────────── */
(function initLazyImages() {
  if ('loading' in HTMLImageElement.prototype) {
    // Native lazy loading supported — attribute is already set in HTML
    return;
  }

  // Fallback: IntersectionObserver polyfill
  const lazyImages = document.querySelectorAll('img[loading="lazy"]');
  if (!lazyImages.length) return;

  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
        }
        imageObserver.unobserve(img);
      }
    });
  });

  lazyImages.forEach(img => imageObserver.observe(img));
})();

/* ── SCROLL HORIZONTAL: process track ─────────────────────── */
(function initProcessTrack() {
  const tracks = document.querySelectorAll('.process-track');
  if (!tracks.length) return;

  tracks.forEach(track => {
    // Add keyboard navigation for accessibility
    track.setAttribute('tabindex', '0');

    let isDown = false;
    let startX;
    let scrollLeft;

    track.addEventListener('mousedown', (e) => {
      isDown = true;
      track.style.cursor = 'grabbing';
      startX = e.pageX - track.offsetLeft;
      scrollLeft = track.scrollLeft;
    });

    track.addEventListener('mouseleave', () => {
      isDown = false;
      track.style.cursor = 'grab';
    });

    track.addEventListener('mouseup', () => {
      isDown = false;
      track.style.cursor = 'grab';
    });

    track.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - track.offsetLeft;
      const walk = (x - startX) * 1.5;
      track.scrollLeft = scrollLeft - walk;
    });

    // Set initial cursor
    track.style.cursor = 'grab';
  });
})();

/* ── SECTION INDICATOR — lateral flotante ─────────────────── */
(function initSectionIndicator() {
  const indicator = document.getElementById('section-indicator');
  if (!indicator) return;

  const dots = indicator.querySelectorAll('.section-indicator__dot');
  if (!dots.length) return;

  // Hero ahora usa id="hero-section"; toda la página es light
  const sectionIds = ['hero-section', 'proyectos', 'sobre-mi', 'contacto'];
  // Todo el portfolio es light → dots siempre en modo violeta
  const darkSections = [];

  // Smooth scroll al hacer click en los dots
  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const targetId = dot.dataset.target;
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  function updateIndicator() {
    const scrollY = window.scrollY;
    const viewportMid = window.innerHeight * 0.45;
    let activeIndex = 0;
    let currentSection = 'hero-section';

    sectionIds.forEach((id, i) => {
      const el = document.getElementById(id);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.top <= viewportMid) {
        activeIndex = i;
        currentSection = id;
      }
    });

    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === activeIndex);
    });

    // Mostrar/ocultar
    indicator.classList.toggle('visible', scrollY > 80);

    // Todo light → siempre on-light (dots violeta visibles sobre #F5F3FD)
    const onDark = darkSections.includes(currentSection);
    indicator.classList.toggle('on-light', !onDark);
  }

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => { updateIndicator(); ticking = false; });
      ticking = true;
    }
  }, { passive: true });

  updateIndicator();
})();

/* ── PROJECT ROW HOVER — floating cursor preview ─────────────── */
(function initProjectHover() {
  // Only on fine-pointer devices (desktop/trackpad)
  if (!window.matchMedia('(pointer: fine)').matches) return;

  const rows = document.querySelectorAll('.project-row');
  if (!rows.length) return;

  let mouseX = 0;
  let mouseY = 0;
  let rafId = null;
  let activePreview = null;

  // Track mouse globally so preview starts at correct position immediately
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (activePreview && !rafId) {
      rafId = requestAnimationFrame(() => {
        positionPreview(activePreview);
        rafId = null;
      });
    }
  }, { passive: true });

  function positionPreview(preview) {
    // Offset: preview appears to the right and slightly above cursor
    const offsetX = 36;
    const offsetY = -160;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pw = preview.offsetWidth || 380;
    const ph = preview.offsetHeight || 270;

    let x = mouseX + offsetX;
    let y = mouseY + offsetY;

    // Keep inside viewport
    if (x + pw > vw - 16) x = mouseX - pw - 16;
    if (y < 16) y = 16;
    if (y + ph > vh - 16) y = vh - ph - 16;

    preview.style.left = x + 'px';
    preview.style.top = y + 'px';
  }

  rows.forEach(row => {
    const link = row.querySelector('.project-row__link');
    if (!link) return;

    // Read preview data from data attributes
    const bg = row.dataset.previewBg || 'linear-gradient(135deg, #f5f0ff 0%, #fce4ef 100%)';
    const label = row.dataset.previewLabel || '';
    const accent = getComputedStyle(row).getPropertyValue('--accent').trim() || '#7B5EA7';

    // Build preview element and append to body (avoids transform stacking context issues)
    const preview = document.createElement('div');
    preview.className = 'project-preview';
    preview.setAttribute('aria-hidden', 'true');
    preview.style.background = bg;
    preview.innerHTML = `
      <div class="project-preview__inner">
        <div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px;">
          <div style="font-size:52px;line-height:1;">✦</div>
          <p class="project-preview__label" style="color:${accent};">${label}</p>
        </div>
      </div>`;
    document.body.appendChild(preview);

    link.addEventListener('mouseenter', () => {
      // Set position before making visible to prevent flash
      positionPreview(preview);
      activePreview = preview;
      preview.classList.add('visible');
    });

    link.addEventListener('mouseleave', () => {
      activePreview = null;
      preview.classList.remove('visible');
    });
  });
})();

/* ── BLOB PARALLAX — blobs se mueven a diferentes velocidades ── */
(function initBlobParallax() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // [selector, speed multiplier]
  const layers = [
    ['.proyectos-blob--1',  0.12],
    ['.proyectos-blob--2', -0.08],
    ['.proyectos-blob--3',  0.06],
    ['.sobre-mi-blob--1',  -0.10],
    ['.sobre-mi-blob--2',   0.08],
    ['.sobre-mi-blob--3',  -0.06],
    ['.contact-blob--1',    0.09],
    ['.contact-blob--2',   -0.07],
    ['.contact-blob--3',    0.05],
  ];

  const blobs = layers.map(([sel, speed]) => ({
    el: document.querySelector(sel),
    speed
  })).filter(b => b.el);

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const sy = window.scrollY;
        blobs.forEach(({ el, speed }) => {
          // Get Y offset relative to section
          const section = el.closest('section');
          if (!section) return;
          const sectionTop = section.offsetTop;
          const relativeScroll = sy - sectionTop;
          el.style.transform = `translateY(${relativeScroll * speed}px)`;
        });
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
})();

/* ── MAGNETIC EFFECT — project rows attract to cursor ─────── */
(function initMagnetic() {
  if (!window.matchMedia('(pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  document.querySelectorAll('.project-row__link').forEach(link => {
    link.addEventListener('mousemove', (e) => {
      const rect = link.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) * 0.08;
      const dy = (e.clientY - cy) * 0.08;
      link.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    link.addEventListener('mouseleave', () => {
      link.style.transform = '';
    });
  });
})();
