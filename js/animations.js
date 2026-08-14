// =============================================
// NAMO MEDICAL – Unified Scroll & Micro-Interaction System
// =============================================
(function () {
  'use strict';

  // ── Respect prefers-reduced-motion ───────────────────────────────────────
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // =============================================
  // 1. UNIFIED SCROLL-REVEAL ENGINE
  //    Single IntersectionObserver owns ALL reveal
  //    elements. Stagger is applied programmatically
  //    so it works regardless of CSS nth-child limits.
  // =============================================

  // Animation variants assigned by element type
  const VARIANT_MAP = {
    // Slide up + fade (default)
    'reveal':           { from: 'translateY(32px)', opacity: 0 },
    // Slide left → right
    'reveal-left':      { from: 'translateX(-40px)', opacity: 0 },
    // Slide right → left
    'reveal-right':     { from: 'translateX(40px)', opacity: 0 },
    // Pop in from scale 0.88
    'reveal-scale':     { from: 'scale(.88)',  opacity: 0 },
    // Fade only (no movement)
    'reveal-fade':      { from: 'translateY(0)', opacity: 0 },
  };

  // Stagger groups — children of these parents get auto-staggered
  const STAGGER_PARENTS = [
    '.trust-grid',
    '.categories-grid',
    '.products-grid',
    '.why-grid',
    '.ht-grid',
    '.testi-track',        // testimonial cards
    '.qual-list',
    '.story-highlights',
    '.license-items',
    '.ht-cats',            // filter buttons
    '.footer-grid',
    '.ws-serve-grid',
    '.ws-process-steps',
    '.rx-steps',
    '.rx-trust-grid',
  ];

  // Stagger interval in ms
  const STAGGER_MS = 80;

  // Initialize initial CSS state for each reveal element
  function initEl(el) {
    if (prefersReduced) {
      el.style.opacity = '1';
      el.style.transform = 'none';
      return;
    }
    const variant = getVariant(el);
    const v = VARIANT_MAP[variant] || VARIANT_MAP['reveal'];
    el.style.opacity   = '0';
    el.style.transform = v.from;
    el.style.transition = `
      opacity   ${el.dataset.revealDuration || 620}ms cubic-bezier(.25,.46,.45,.94),
      transform ${el.dataset.revealDuration || 620}ms cubic-bezier(.25,.46,.45,.94)
    `;
    el.style.willChange = 'opacity, transform';
  }

  function getVariant(el) {
    for (const key of Object.keys(VARIANT_MAP)) {
      if (el.classList.contains(key)) return key;
    }
    return 'reveal';
  }

  function showEl(el, delay = 0) {
    if (prefersReduced) { el.classList.add('visible'); return; }
    setTimeout(() => {
      el.style.opacity   = '1';
      el.style.transform = 'none';
      el.style.willChange = 'auto';
      el.classList.add('visible');
    }, delay);
  }

  // ── Assign stagger delays to grid children ──────────────────────────────
  function assignStagger() {
    STAGGER_PARENTS.forEach(selector => {
      const parent = document.querySelector(selector);
      if (!parent) return;
      // Direct children that are also reveal elements
      const children = Array.from(parent.children).filter(
        c => c.classList.contains('reveal') ||
             c.classList.contains('reveal-left') ||
             c.classList.contains('reveal-right') ||
             c.classList.contains('reveal-scale') ||
             c.classList.contains('reveal-fade')
      );
      children.forEach((c, i) => {
        c.dataset.revealDelay = String(i * STAGGER_MS);
      });
    });
  }

  // ── Build the observer ────────────────────────────────────────────────────
  function buildObserver() {
    const allReveal = document.querySelectorAll(
      '.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-fade'
    );

    if (allReveal.length === 0) return;

    // Init styles
    allReveal.forEach(initEl);

    // If reduced motion, just show everything immediately
    if (prefersReduced) {
      allReveal.forEach(el => el.classList.add('visible'));
      return;
    }

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el    = entry.target;
        const delay = parseInt(el.dataset.revealDelay || '0', 10);
        showEl(el, delay);
        obs.unobserve(el);
      });
    }, {
      threshold:   0.10,
      rootMargin: '0px 0px -36px 0px'
    });

    allReveal.forEach(el => obs.observe(el));
  }

  // ── Section-level entrance (sections themselves fade up) ─────────────────
  // Only the page sections that are NOT grids (which use card-level reveal)
  const SECTION_SELECTORS = [
    '.page-hero',
    '.cta-strip',
    '.map-section',
    '.ht-ask-section',
    '.ht-disclaimer',
    '.quick-contact-strip',
  ];

  function buildSectionObserver() {
    if (prefersReduced) return;
    const sections = document.querySelectorAll(SECTION_SELECTORS.join(','));
    if (!sections.length) return;

    sections.forEach(sec => {
      sec.style.opacity   = '1';  // sections show immediately—hero must never hide
    });
  }

  // ── Testimonial carousel special treatment ───────────────────────────────
  // The testi-track contains all cards; animate the wrapper in, then the
  // controls fade up after a short extra delay.
  function animateTestimonialSection() {
    if (prefersReduced) return;

    const carousel  = document.getElementById('testi-carousel');
    const controls  = document.querySelector('.testi-controls');
    if (!carousel) return;

    // Carousel wrapper slides up
    carousel.style.opacity   = '0';
    carousel.style.transform = 'translateY(28px)';
    carousel.style.transition = 'opacity 650ms cubic-bezier(.25,.46,.45,.94), transform 650ms cubic-bezier(.25,.46,.45,.94)';

    const carouselObs = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;

      // Carousel slides in
      setTimeout(() => {
        carousel.style.opacity   = '1';
        carousel.style.transform = 'none';
      }, 0);

      // Controls fade up after carousel appears
      if (controls) {
        controls.style.opacity   = '0';
        controls.style.transform = 'translateY(14px)';
        controls.style.transition = 'opacity 450ms ease, transform 450ms ease';
        setTimeout(() => {
          controls.style.opacity   = '1';
          controls.style.transform = 'none';
        }, 350);
      }

      // Individual testi-cards cascade in (visible inside carousel)
      const cards = carousel.querySelectorAll('.testi-card');
      cards.forEach((card, i) => {
        card.style.opacity   = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = `opacity 500ms ease ${200 + i * 120}ms, transform 500ms ease ${200 + i * 120}ms`;
        setTimeout(() => {
          card.style.opacity   = '1';
          card.style.transform = 'none';
        }, 200 + i * 120);
      });

      carouselObs.disconnect();
    }, { threshold: 0.15 });

    carouselObs.observe(carousel);
  }

  // ── Section header badge + title stagger ────────────────────────────────
  function animateSectionHeaders() {
    if (prefersReduced) return;

    // Find every section heading pair (badge-pill + section-title + section-subtitle)
    document.querySelectorAll('.section-title').forEach((title, i) => {
      const section = title.closest('section');
      if (!section) return;

      const badge    = section.querySelector('.badge-pill');
      const subtitle = section.querySelector('.section-subtitle');

      [badge, title, subtitle].forEach((el, j) => {
        if (!el) return;
        // Skip if already handled by card-level reveal
        if (el.classList.contains('reveal')) return;

        el.style.opacity   = '0';
        el.style.transform = 'translateY(18px)';
        el.style.transition = `opacity 550ms ease ${j * 90}ms, transform 550ms ease ${j * 90}ms`;
      });

      const headerObs = new IntersectionObserver((entries) => {
        if (!entries[0].isIntersecting) return;
        [badge, title, subtitle].forEach((el, j) => {
          if (!el || el.classList.contains('reveal')) return;
          setTimeout(() => {
            el.style.opacity   = '1';
            el.style.transform = 'none';
          }, j * 90);
        });
        headerObs.disconnect();
      }, { threshold: 0.2 });

      headerObs.observe(title);
    });
  }

  // ── Feature-section cards — assign reveal-scale to icon-heavy cards ──────
  // These get a scale-in rather than slide-up for variety
  function assignVariants() {
    // Trust cards → scale in
    document.querySelectorAll('.trust-card.reveal').forEach(c => {
      c.classList.add('reveal-scale');
    });

    // qc-cards → slide from left/right alternating
    document.querySelectorAll('.qc-card.reveal').forEach((c, i) => {
      if (i % 2 === 0) c.classList.add('reveal-left');
      else             c.classList.remove('reveal'); // middle stays default
    });

    // Story grid: image slides left, text slides right
    const storyImg = document.querySelector('.story-img-wrap.reveal');
    const storyCon = document.querySelector('.story-content.reveal');
    if (storyImg) storyImg.classList.add('reveal-left');
    if (storyCon) storyCon.classList.add('reveal-right');

    // Map frame — just fade
    const mapFrame = document.querySelector('.map-frame-wrap.reveal');
    if (mapFrame) mapFrame.classList.add('reveal-fade');
  }

  // =============================================
  // 2. BUTTON RIPPLE
  // =============================================
  function addRipple(e) {
    const btn  = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x    = e.clientX - rect.left  - size / 2;
    const y    = e.clientY - rect.top   - size / 2;

    btn.style.position = 'relative';
    btn.style.overflow = 'hidden';

    const wave = document.createElement('span');
    wave.className = 'ripple-wave';
    wave.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px;`;
    btn.appendChild(wave);
    wave.addEventListener('animationend', () => wave.remove());
  }

  document.querySelectorAll(
    '.btn-primary, .btn-submit, .ws-submit-btn, .ht-ask-btn, .ht-reset-btn, .testi-btn, .btn-call'
  ).forEach(btn => btn.addEventListener('click', addRipple));

  // =============================================
  // 3. CARD 3-D TILT on mousemove
  // =============================================
  if (!prefersReduced && window.innerWidth >= 768) {
    document.querySelectorAll(
      '.trust-card, .why-card, .product-card, .ht-card, .category-card'
    ).forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const r   = card.getBoundingClientRect();
        const dx  = ((e.clientX - r.left) / r.width  - 0.5) * 8;
        const dy  = ((e.clientY - r.top)  / r.height - 0.5) * 8;
        card.style.transform =
          `translateY(-6px) scale(1.01) perspective(700px) rotateX(${(-dy).toFixed(1)}deg) rotateY(${dx.toFixed(1)}deg)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  // =============================================
  // 4. MOBILE HEADER — hide on scroll-down
  // =============================================
  const header = document.getElementById('main-header');
  if (header) {
    let lastY = 0, ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const y = window.scrollY;
          header.classList.toggle('scrolled', y > 60);
          if (window.innerWidth < 768) {
            header.style.transition = 'transform 280ms cubic-bezier(.4,0,.2,1)';
            header.style.transform  = (y > lastY && y > 100)
              ? 'translateY(-100%)'
              : 'translateY(0)';
          } else {
            header.style.transform = '';
          }
          lastY = y;
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // =============================================
  // 5. SVG CHECKMARK — inject into success states
  // =============================================
  const SVG = `<div class="success-svg-wrap" aria-hidden="true">
    <svg viewBox="0 0 70 70" width="80" height="80" xmlns="http://www.w3.org/2000/svg">
      <circle class="success-circle" cx="35" cy="35" r="33"/>
      <polyline class="success-check" points="20,35 30,46 52,24"/>
    </svg>
  </div>`;

  [
    { id: 'form-success',  icon: '.success-icon' },
    { id: 'ws-success',    icon: '.ws-success-icon' },
  ].forEach(({ id, icon }) => {
    const box = document.getElementById(id);
    if (!box) return;
    const old = box.querySelector(icon);
    if (old) old.remove();
    box.insertAdjacentHTML('afterbegin', SVG);
  });

  // =============================================
  // 6. INPUT SHAKE (exposed for form scripts)
  // =============================================
  function shakeEl(el) {
    if (prefersReduced) return;
    el.animate([
      { transform: 'translateX(0)' },
      { transform: 'translateX(-7px)' },
      { transform: 'translateX(7px)' },
      { transform: 'translateX(-4px)' },
      { transform: 'translateX(4px)' },
      { transform: 'translateX(0)' },
    ], { duration: 340, easing: 'ease-out' });
  }

  window.NamoAnim = { shake: shakeEl, ripple: addRipple };

  // =============================================
  // BOOT — run everything in order
  // =============================================
  assignVariants();       // classify elements first
  assignStagger();        // inject data-reveal-delay on grid children
  buildObserver();        // single IO watches every .reveal* element
  buildSectionObserver(); // section wrappers
  animateSectionHeaders(); // badge + title + subtitle cascade
  animateTestimonialSection(); // carousel special treatment

})();
