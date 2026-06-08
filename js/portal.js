/* ============================================================
   PORTAL.JS — La Sala de las Puertas en Hélice
   Rotación por scroll · navegación · animación de entrada
   Portfolio Personal · Fernanda Jaimes
   ============================================================ */

(() => {
  const room = document.querySelector('.portal-room');
  if (!room) return;

  const carousel  = room.querySelector('.portal-carousel');
  const doors     = Array.from(room.querySelectorAll('.portal-door'));
  const dots      = Array.from(room.querySelectorAll('.portal-dot'));
  const prevBtn   = room.querySelector('.portal-arrow--prev');
  const nextBtn   = room.querySelector('.portal-arrow--next');
  const particles = room.querySelector('.portal-particles');

  if (!carousel || doors.length === 0) return;

  const total        = doors.length;
  const stepAngle    = 360 / total;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile     = window.matchMedia('(max-width: 900px)').matches;

  let rotationTarget  = 0;
  let rotationCurrent = 0;
  let currentIdx      = 0;
  let manualLock      = false;
  let lockTimer       = null;
  let animRAF         = null;

  /* ── Partículas ────────────────────────────────────────────── */
  if (particles && !reduceMotion) {
    const count = isMobile ? 10 : 18;
    const palette = ['#7B5EA7', '#4A90D9', '#2BBFCF', '#E86BA0'];
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'portal-particle';
      p.style.background      = palette[i % palette.length];
      p.style.left            = Math.random() * 100 + '%';
      p.style.bottom          = -Math.random() * 20 + '%';
      p.style.setProperty('--drift', (Math.random() * 80 - 40) + 'px');
      p.style.animationDelay    = -Math.random() * 14 + 's';
      p.style.animationDuration = (10 + Math.random() * 10) + 's';
      p.style.width = p.style.height = (2 + Math.random() * 3) + 'px';
      particles.appendChild(p);
    }
  }

  /* ── Calcular qué puerta está en foco dado el ángulo actual ── */
  const computeFocus = (angle) => {
    let bestIdx = 0, bestDist = Infinity;
    doors.forEach((door, i) => {
      const doorBase = i * stepAngle;
      let eff = (doorBase + angle) % 360;
      if (eff > 180)  eff -= 360;
      if (eff < -180) eff += 360;
      const dist = Math.abs(eff);
      if (dist < bestDist) { bestDist = dist; bestIdx = i; }
    });
    return bestIdx;
  };

  /* ── Máximo offset vertical de los doors (debe coincidir con el
       --door-offset-y de la última puerta en el HTML) ─────────── */
  const MAX_DOOR_OFFSET = 210; // px

  const paintRotation = (angle) => {
    carousel.style.setProperty('--rotation', angle + 'deg');

    /* Desplaza el carousel en Y para que la puerta enfocada quede
       centrada en pantalla. Aplica tanto en desktop (scroll) como en
       mobile (swipe), ya que los doors tienen offsets verticales.
       Cuando angle=0 → LUMA (offset -210px) → carouselY = +210px
       Cuando angle=-240 → DreamSync (offset +210px) → carouselY = -210px
       Fórmula: carouselY = maxOffset * (1 + 2*angle / totalAngle) */
    const totalAngle = (total - 1) * stepAngle; // 240 para 3 puertas
    const carouselY  = totalAngle > 0
      ? MAX_DOOR_OFFSET * (1 + 2 * angle / totalAngle)
      : 0;
    carousel.style.setProperty('--carousel-y', carouselY.toFixed(2) + 'px');

    const newIdx = computeFocus(angle);
    if (newIdx !== currentIdx) {
      currentIdx = newIdx;
      updateFocus();
    }
  };

  const updateFocus = () => {
    doors.forEach((door, i) => door.classList.toggle('is-focus', i === currentIdx));
    dots.forEach((dot, i)   => dot.classList.toggle('is-active', i === currentIdx));
  };

  /* ── Loop de animación con lerp (suaviza el scroll) ──────── */
  const LERP    = 0.18;
  const EPSILON = 0.02;

  const runAnim = () => {
    animRAF = null;
    const delta = rotationTarget - rotationCurrent;
    if (Math.abs(delta) < EPSILON) {
      rotationCurrent = rotationTarget;
      paintRotation(rotationCurrent);
      return;
    }
    rotationCurrent += delta * LERP;
    paintRotation(rotationCurrent);
    animRAF = requestAnimationFrame(runAnim);
  };

  const ensureAnim = () => {
    if (animRAF === null) animRAF = requestAnimationFrame(runAnim);
  };

  /* ── Header externo (fuera del sticky) ──────────────────────
     El header vive antes del sticky en el DOM. Su altura hay que
     restarla del runway para que la rotación empiece justo cuando
     el sticky se activa (no durante el scroll del header). */
  const headerEl  = room.querySelector('.portal-room__header');
  const headerH   = () => headerEl ? headerEl.offsetHeight : 0;

  /* ── Rotación por scroll ─────────────────────────────────── */
  const computeTargetFromScroll = () => {
    if (isMobile) return 0;
    const rect   = room.getBoundingClientRect();
    const hh     = headerH();
    const runway = room.offsetHeight - window.innerHeight - hh;
    if (runway <= 0) return rotationTarget;
    // scrolled empieza en 0 cuando el sticky se activa (rect.top = -hh)
    const scrolled  = Math.min(Math.max(-rect.top - hh, 0), runway);
    const progress  = scrolled / runway;
    return -progress * (total - 1) * stepAngle;
  };

  const onScroll = () => {
    if (manualLock || isMobile) return;
    rotationTarget = computeTargetFromScroll();
    carousel.classList.add('is-scrolling');
    ensureAnim();
  };

  if (!isMobile) {
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    rotationTarget  = computeTargetFromScroll();
    rotationCurrent = rotationTarget;
    paintRotation(rotationCurrent);
    carousel.classList.add('is-scrolling');
  } else {
    paintRotation(0);
  }

  /* ── Navegación manual (flechas / dots / teclado / swipe) ── */
  const goTo = (idx) => {
    idx = ((idx % total) + total) % total;
    currentIdx = idx;
    const target = -idx * stepAngle;

    manualLock = true;
    carousel.classList.remove('is-scrolling');
    if (animRAF !== null) { cancelAnimationFrame(animRAF); animRAF = null; }
    rotationTarget  = target;
    rotationCurrent = target;
    paintRotation(target);
    updateFocus();

    if (!isMobile) {
      const hh         = headerH();
      const runway     = room.offsetHeight - window.innerHeight - hh;
      const sectionTop = room.getBoundingClientRect().top + window.scrollY;
      if (runway > 0) {
        // El scroll objetivo empieza desde el punto en que el sticky activa
        const targetScroll = sectionTop + hh + (idx / (total - 1)) * runway;
        window.scrollTo({ top: targetScroll, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    }

    clearTimeout(lockTimer);
    lockTimer = setTimeout(() => { manualLock = false; }, 1100);
  };

  if (prevBtn) prevBtn.addEventListener('click', () => goTo(currentIdx - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goTo(currentIdx + 1));
  dots.forEach((dot, i) => dot.addEventListener('click', () => goTo(i)));

  const isRoomVisible = () => {
    const r = room.getBoundingClientRect();
    return r.top < window.innerHeight * 0.6 && r.bottom > window.innerHeight * 0.4;
  };

  window.addEventListener('keydown', (e) => {
    if (!isRoomVisible()) return;
    if (e.key === 'ArrowLeft')  { e.preventDefault(); goTo(currentIdx - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(currentIdx + 1); }
  });

  if (isMobile) {
    let touchStartX = null;
    const stage = room.querySelector('.portal-stage');
    if (stage) {
      stage.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
      stage.addEventListener('touchend',   (e) => {
        if (touchStartX === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) > 40) goTo(dx < 0 ? currentIdx + 1 : currentIdx - 1);
        touchStartX = null;
      }, { passive: true });
    }
  }

  /* ── Entrar al proyecto — Umbral + Paleta ───────────────── */
  const enterLayer = document.createElement('div');
  enterLayer.className = 'portal-enter-layer';
  enterLayer.setAttribute('aria-hidden', 'true');
  enterLayer.innerHTML = `
    <div class="portal-enter-glow"></div>
    <div class="portal-enter-color"></div>
  `;
  document.body.appendChild(enterLayer);

  doors.forEach((door) => {
    const link = door.querySelector('.portal-door__link');
    if (!link) return;

    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || href === '#') return;

      const idx = doors.indexOf(door);
      if (idx !== currentIdx) {
        e.preventDefault();
        goTo(idx);
        return;
      }

      if (reduceMotion) return;

      e.preventDefault();

      // Origen = centro de la puerta (no hay cerradura en el HTML simplificado)
      const rect = door.getBoundingClientRect();
      const ox   = rect.left + rect.width  / 2;
      const oy   = rect.top  + rect.height / 2;

      const style = getComputedStyle(door);
      const core  = style.getPropertyValue('--enter-core').trim() || style.getPropertyValue('--accent').trim() || '#7B5EA7';
      const mid   = style.getPropertyValue('--enter-mid').trim()  || style.getPropertyValue('--accent').trim() || '#4A3078';
      const edge  = style.getPropertyValue('--enter-edge').trim() || '#0D0B1A';

      enterLayer.style.setProperty('--enter-core', core);
      enterLayer.style.setProperty('--enter-mid',  mid);
      enterLayer.style.setProperty('--enter-edge', edge);
      enterLayer.style.setProperty('--origin-x',   ox + 'px');
      enterLayer.style.setProperty('--origin-y',   oy + 'px');

      door.classList.add('is-opening');
      requestAnimationFrame(() => { enterLayer.classList.add('is-active'); });
      setTimeout(() => { window.location.href = href; }, 1700);
    });
  });

  /* ── Color acento en dots ──────────────────────────────── */
  dots.forEach((dot, i) => {
    const door   = doors[i];
    if (!door) return;
    const accent = getComputedStyle(door).getPropertyValue('--accent').trim();
    if (accent) dot.style.setProperty('--dot-accent', accent);
  });

  updateFocus();
})();


/* ============================================================
   FINAL HALL — polvo dorado flotando en la sala del fondo
   ============================================================ */
(() => {
  const dust = document.getElementById('final-hall-dust');
  if (!dust) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const count = window.matchMedia('(max-width: 820px)').matches ? 18 : 40;
  const palette = [
    'rgba(255, 214, 165, 0.75)',
    'rgba(232, 107, 160, 0.55)',
    'rgba(155, 126, 200, 0.55)',
    'rgba(43, 191, 207, 0.45)'
  ];

  for (let i = 0; i < count; i++) {
    const m = document.createElement('span');
    m.className = 'final-hall__dust-mote';
    m.style.left              = Math.random() * 100 + '%';
    m.style.bottom            = -Math.random() * 30 + '%';
    m.style.background        = palette[i % palette.length];
    m.style.boxShadow         = '0 0 8px ' + palette[i % palette.length];
    m.style.setProperty('--drift', (Math.random() * 120 - 60) + 'px');
    m.style.animationDelay    = -Math.random() * 18 + 's';
    m.style.animationDuration = (14 + Math.random() * 10) + 's';
    const size = 1 + Math.random() * 3;
    m.style.width  = size + 'px';
    m.style.height = size + 'px';
    dust.appendChild(m);
  }
})();


/* ============================================================
   PORTRAIT PORTAL — transición "Conóceme" hacia Sobre mí
   ============================================================ */
(() => {
  const link = document.querySelector('.final-hall__portrait-link');
  if (!link) return;

  const href = link.getAttribute('href');
  if (!href || href === '#') return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let enterLayer = null;
  const ensureLayer = () => {
    if (enterLayer) return enterLayer;
    enterLayer = document.createElement('div');
    enterLayer.className = 'portrait-enter-layer';
    enterLayer.setAttribute('aria-hidden', 'true');
    enterLayer.innerHTML = `
      <div class="portrait-enter-glow"></div>
      <div class="portrait-enter-aurora"></div>
      <div class="portrait-enter-sparkle"></div>
    `;
    document.body.appendChild(enterLayer);
    return enterLayer;
  };

  link.addEventListener('click', (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
    if (reduceMotion) return;

    e.preventDefault();

    const frame = link.querySelector('.final-hall__portrait-frame') || link;
    const rect  = frame.getBoundingClientRect();
    const ox    = rect.left + rect.width  / 2;
    const oy    = rect.top  + rect.height / 2;

    const layer = ensureLayer();
    layer.style.setProperty('--origin-x', ox + 'px');
    layer.style.setProperty('--origin-y', oy + 'px');

    link.classList.add('is-entering');
    requestAnimationFrame(() => { layer.classList.add('is-active'); });
    setTimeout(() => { window.location.href = href; }, 1700);
  });
})();
