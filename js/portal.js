/* ============================================================
   PORTAL.JS — La Sala de las Puertas
   Rotación por scroll · navegación · animación de entrada
   Portfolio Personal · Fernanda Jaimes
   ============================================================ */

(() => {
  const room = document.querySelector('.portal-room');
  if (!room) return;

  const sticky     = room.querySelector('.portal-room__sticky');
  const carousel   = room.querySelector('.portal-carousel');
  const doors      = Array.from(room.querySelectorAll('.portal-door'));
  const dots       = Array.from(room.querySelectorAll('.portal-dot'));
  const prevBtn    = room.querySelector('.portal-arrow--prev');
  const nextBtn    = room.querySelector('.portal-arrow--next');
  const particles  = room.querySelector('.portal-particles');

  if (!carousel || doors.length === 0) return;

  const total        = doors.length;             // 3
  const stepAngle    = 360 / total;              // 120°
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile     = window.matchMedia('(max-width: 900px)').matches;

  // Estado
  let rotationTarget  = 0;             // ángulo objetivo (según scroll / navegación)
  let rotationCurrent = 0;             // ángulo aplicado (interpolado)
  let currentIdx      = 0;             // puerta en foco
  let manualLock      = false;         // true = botones/dots dominan (no scroll)
  let lockTimer       = null;
  let animRAF         = null;          // rAF id del loop de animación

  /* ──────────────────────────────────────────
     1. PARTÍCULAS — reducidas para mejor perf
     ────────────────────────────────────────── */
  if (particles && !reduceMotion) {
    // Recortamos a la mitad: a 36 partículas con box-shadow pintan
    // cada frame y consumen GPU innecesariamente.
    const count = isMobile ? 10 : 18;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'portal-particle';

      // Colores alternos de la paleta aurora
      const palette = ['#7B5EA7', '#4A90D9', '#2BBFCF', '#E86BA0'];
      p.style.background = palette[i % palette.length];

      p.style.left           = Math.random() * 100 + '%';
      p.style.bottom         = -Math.random() * 20 + '%';
      p.style.setProperty('--drift', (Math.random() * 80 - 40) + 'px');
      p.style.animationDelay = -Math.random() * 14 + 's';
      p.style.animationDuration = (10 + Math.random() * 10) + 's';
      p.style.width  = p.style.height = (2 + Math.random() * 3) + 'px';

      particles.appendChild(p);
    }
  }

  /* ──────────────────────────────────────────
     2. APLICAR ROTACIÓN + CALCULAR DOOR EN FOCO
     Ahora el aplicador solo escribe el CSS var y recalcula foco.
     La suavidad vive en el loop de animación (lerp rAF).
     ────────────────────────────────────────── */
  const computeFocus = (angle) => {
    let bestIdx  = 0;
    let bestDist = Infinity;
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

  const paintRotation = (angle) => {
    carousel.style.setProperty('--rotation', angle + 'deg');
    const newIdx = computeFocus(angle);
    if (newIdx !== currentIdx) {
      currentIdx = newIdx;
      updateFocus();
    }
  };

  const updateFocus = () => {
    doors.forEach((door, i) => {
      door.classList.toggle('is-focus', i === currentIdx);
    });
    dots.forEach((dot, i) => {
      dot.classList.toggle('is-active', i === currentIdx);
    });
  };

  /* ──────────────────────────────────────────
     3. ROTACIÓN POR SCROLL (desktop)
     Usamos dos pasos:
     a) onScroll actualiza el ÁNGULO OBJETIVO
     b) un rAF loop interpola el ángulo actual hacia el objetivo
        con un lerp suave. Esto elimina el jank del seguimiento
        1:1 del scroll y se siente mucho más fluido.
     ────────────────────────────────────────── */
  const computeTargetFromScroll = () => {
    if (isMobile) return 0;
    const rect = room.getBoundingClientRect();
    const runway = room.offsetHeight - window.innerHeight;
    if (runway <= 0) return rotationTarget;
    const scrolled = Math.min(Math.max(-rect.top, 0), runway);
    const progress = scrolled / runway;
    // progreso 0 → 1  ⇒  rotación 0 → -(total-1) * stepAngle
    return -progress * (total - 1) * stepAngle;
  };

  // Loop: corre cuando la sección está en viewport y el ángulo actual
  // difiere del objetivo. Se auto-detiene al llegar para no gastar CPU.
  const LERP = 0.18;                  // factor de suavizado (0–1)
  const EPSILON = 0.02;               // umbral para detener el loop

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

  const onScroll = () => {
    if (manualLock || isMobile) return;
    rotationTarget = computeTargetFromScroll();
    // Desactivamos transición CSS durante el scroll — el lerp JS se encarga
    carousel.classList.add('is-scrolling');
    ensureAnim();
  };

  if (!isMobile) {
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    // Estado inicial
    rotationTarget = computeTargetFromScroll();
    rotationCurrent = rotationTarget;
    paintRotation(rotationCurrent);
    carousel.classList.add('is-scrolling');
  } else {
    // Mobile: arrancamos con la primera puerta en foco
    paintRotation(0);
  }

  /* ──────────────────────────────────────────
     4. NAVEGACIÓN MANUAL (flechas / dots / teclado / swipe)
     En navegación manual queremos la transición CSS larga (feel
     de "puerta giratoria"), así que quitamos .is-scrolling.
     ────────────────────────────────────────── */
  const goTo = (idx) => {
    idx = ((idx % total) + total) % total;
    currentIdx = idx;
    const target = -idx * stepAngle;

    manualLock = true;
    // Usa la transición CSS (0.85s) en vez del lerp para este movimiento
    carousel.classList.remove('is-scrolling');
    // Cancela cualquier lerp en curso
    if (animRAF !== null) { cancelAnimationFrame(animRAF); animRAF = null; }
    rotationTarget  = target;
    rotationCurrent = target;
    paintRotation(target);
    updateFocus();

    // Desktop: además sincronizamos la posición del scroll
    // para que cuando termine el lock no salte el cilindro
    if (!isMobile) {
      const runway = room.offsetHeight - window.innerHeight;
      if (runway > 0) {
        const sectionTop  = room.getBoundingClientRect().top + window.scrollY;
        const targetScroll = sectionTop + (idx / (total - 1)) * runway;
        window.scrollTo({
          top: targetScroll,
          behavior: reduceMotion ? 'auto' : 'smooth'
        });
      }
    }

    clearTimeout(lockTimer);
    lockTimer = setTimeout(() => {
      manualLock = false;
    }, 1100);
  };

  if (prevBtn) prevBtn.addEventListener('click', () => goTo(currentIdx - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goTo(currentIdx + 1));

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => goTo(i));
  });

  // Teclado — solo cuando la sección está en viewport
  const isRoomVisible = () => {
    const r = room.getBoundingClientRect();
    return r.top < window.innerHeight * 0.6 && r.bottom > window.innerHeight * 0.4;
  };

  window.addEventListener('keydown', (e) => {
    if (!isRoomVisible()) return;
    if (e.key === 'ArrowLeft')  { e.preventDefault(); goTo(currentIdx - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(currentIdx + 1); }
  });

  // Swipe en móvil
  if (isMobile) {
    let touchStartX = null;
    const stage = room.querySelector('.portal-stage');
    if (stage) {
      stage.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
      }, { passive: true });

      stage.addEventListener('touchend', (e) => {
        if (touchStartX === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) > 40) {
          if (dx < 0) goTo(currentIdx + 1);
          else        goTo(currentIdx - 1);
        }
        touchStartX = null;
      }, { passive: true });
    }
  }

  /* ──────────────────────────────────────────
     5. ENTRAR AL PROYECTO — Umbral + Paleta
     Dos capas narrativas:
       (a) un resplandor BLANCO crece desde la cerradura y llena
           la pantalla — cruzaste el umbral de la puerta
       (b) sobre ese blanco, la paleta del proyecto se materializa
           con fade-in — aterrizaste en el mundo
     Navegamos cuando la paleta ya está totalmente presente para
     que la nueva página aparezca sin corte visual.
     ────────────────────────────────────────── */
  const enterLayer = document.createElement('div');
  enterLayer.className = 'portal-enter-layer';
  enterLayer.setAttribute('aria-hidden', 'true');
  enterLayer.innerHTML = `
    <div class="portal-enter-glow"></div>
    <div class="portal-enter-color"></div>
  `;
  document.body.appendChild(enterLayer);

  const paintEnterPalette = (core, mid, edge, ox, oy) => {
    enterLayer.style.setProperty('--enter-core', core);
    enterLayer.style.setProperty('--enter-mid',  mid);
    enterLayer.style.setProperty('--enter-edge', edge);
    if (ox != null) enterLayer.style.setProperty('--origin-x', ox + 'px');
    if (oy != null) enterLayer.style.setProperty('--origin-y', oy + 'px');
  };

  doors.forEach((door) => {
    const link = door.querySelector('.portal-door__link');
    if (!link) return;

    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || href === '#') return;

      // Si la puerta no está en foco, primero la traemos al centro
      const idx = doors.indexOf(door);
      if (idx !== currentIdx) {
        e.preventDefault();
        goTo(idx);
        return;
      }

      if (reduceMotion) return; // dejamos que navegue normal

      e.preventDefault();

      // Origen del efecto = cerradura de la puerta
      const keyhole = door.querySelector('.portal-door__keyhole');
      const rect = (keyhole || door).getBoundingClientRect();
      const ox = rect.left + rect.width / 2;
      const oy = rect.top  + rect.height / 2;

      const style = getComputedStyle(door);
      const core  = style.getPropertyValue('--enter-core').trim()
                 || style.getPropertyValue('--accent').trim()
                 || '#7B5EA7';
      const mid   = style.getPropertyValue('--enter-mid').trim()
                 || style.getPropertyValue('--accent').trim()
                 || '#4A3078';
      const edge  = style.getPropertyValue('--enter-edge').trim()
                 || '#0D0B1A';

      paintEnterPalette(core, mid, edge, ox, oy);

      // 1. Abrir las hojas de la puerta
      door.classList.add('is-opening');

      // 2. Activar el umbral — el resplandor blanco crece desde la
      //    cerradura y, con 0.4s de delay, la paleta del proyecto
      //    aparece encima (ambas transiciones se disparan por CSS).
      requestAnimationFrame(() => {
        enterLayer.classList.add('is-active');
      });

      // 3. Navegar cuando la paleta ya está totalmente asentada y
      //    tuvo un breve momento para "respirar" en pantalla.
      //    (0.5s delay + 1.1s fade + 100ms linger = ~1700ms)
      setTimeout(() => {
        window.location.href = href;
      }, 1700);
    });
  });

  /* ──────────────────────────────────────────
     6. Pintar color de cada dot según su accent
     ────────────────────────────────────────── */
  dots.forEach((dot, i) => {
    const door = doors[i];
    if (!door) return;
    const accent = getComputedStyle(door).getPropertyValue('--accent').trim();
    if (accent) dot.style.setProperty('--dot-accent', accent);
  });

  // Estado inicial
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
    'rgba(255, 214, 165, 0.75)',   // dorado cálido
    'rgba(232, 107, 160, 0.55)',   // rosa aurora
    'rgba(155, 126, 200, 0.55)',   // violeta
    'rgba(43, 191, 207, 0.45)'     // turquesa sutil
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
   ------------------------------------------------------------
   Click en el retrato → resplandor cálido crece desde la foto,
   la aurora pastel se materializa encima, y navegamos cuando
   el color ya está totalmente asentado. Mismo timing que el
   portal de proyectos para mantener un lenguaje consistente.
   ============================================================ */
(() => {
  const link = document.querySelector('.final-hall__portrait-link');
  if (!link) return;

  const href = link.getAttribute('href');
  if (!href || href === '#') return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Construye la capa de transición una sola vez (perezosamente al
  // primer click para no inyectar DOM innecesario en la carga).
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
    // Respeta cmd/ctrl/middle-click para abrir en nueva pestaña
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
    if (reduceMotion) return; // navegación normal

    e.preventDefault();

    // Origen del efecto = centro del retrato (para que el umbral
    // emerja desde la foto, no desde el click exacto).
    const frame = link.querySelector('.final-hall__portrait-frame') || link;
    const rect  = frame.getBoundingClientRect();
    const ox    = rect.left + rect.width / 2;
    const oy    = rect.top  + rect.height / 2;

    const layer = ensureLayer();
    layer.style.setProperty('--origin-x', ox + 'px');
    layer.style.setProperty('--origin-y', oy + 'px');

    // Feedback visual en el retrato antes de la expansión
    link.classList.add('is-entering');

    // Dispara la expansión en el siguiente frame para que los
    // custom props ya estén aplicados cuando el navegador
    // interpole clip-path.
    requestAnimationFrame(() => {
      layer.classList.add('is-active');
    });

    // Navegar cuando la aurora ya está totalmente presente:
    //  0.5s delay + 1.1s fade + 0.1s linger ≈ 1700ms
    setTimeout(() => {
      window.location.href = href;
    }, 1700);
  });
})();
