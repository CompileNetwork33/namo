// =============================================
// NAMO MEDICAL STORE – Testimonials Carousel
// =============================================
(function () {
  'use strict';

  const track    = document.getElementById('testi-track');
  const carousel = document.getElementById('testi-carousel');
  const dotsWrap = document.getElementById('testi-dots');
  const prevBtn  = document.getElementById('testi-prev');
  const nextBtn  = document.getElementById('testi-next');

  if (!track || !prevBtn || !nextBtn) return;

  const cards      = Array.from(track.querySelectorAll('.testi-card'));
  const WIDE       = window.matchMedia('(min-width: 900px)');
  let current      = 0;
  let autoTimer    = null;

  // ---- Helper: how many cards visible at once ----
  function perView() { return WIDE.matches ? 2 : 1; }

  // ---- Total "pages" (positions) ----
  function totalPages() { return Math.ceil(cards.length / perView()); }

  // ---- Build / rebuild dots ----
  function buildDots() {
    dotsWrap.innerHTML = '';
    const n = totalPages();
    for (let i = 0; i < n; i++) {
      const dot = document.createElement('button');
      dot.className = 'testi-dot' + (i === current ? ' active' : '');
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', 'Review ' + (i + 1));
      dot.setAttribute('aria-selected', i === current ? 'true' : 'false');
      dot.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(dot);
    }
  }

  // ---- Update dots ----
  function updateDots() {
    Array.from(dotsWrap.children).forEach((d, i) => {
      d.classList.toggle('active', i === current);
      d.setAttribute('aria-selected', i === current ? 'true' : 'false');
    });
  }

  // ---- Calculate card width for translation ----
  function cardWidth() {
    if (!cards.length) return 0;
    const gap = perView() > 1 ? 24 : 0; // 1.5rem gap = 24px
    return (carousel.offsetWidth + gap) / perView();
  }

  // ---- Move to page ----
  function goTo(page) {
    const pages = totalPages();
    current = (page + pages) % pages;
    const offset = current * perView() * cardWidth();
    track.style.transform = 'translateX(-' + offset + 'px)';
    updateDots();
  }

  // ---- Prev / Next ----
  prevBtn.addEventListener('click', () => { goTo(current - 1); restartAuto(); });
  nextBtn.addEventListener('click', () => { goTo(current + 1); restartAuto(); });

  // ---- Keyboard support ----
  carousel.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  { goTo(current - 1); restartAuto(); }
    if (e.key === 'ArrowRight') { goTo(current + 1); restartAuto(); }
  });

  // ---- Autoplay ----
  function startAuto() {
    autoTimer = setInterval(() => goTo(current + 1), 5000);
  }
  function restartAuto() {
    clearInterval(autoTimer);
    startAuto();
  }

  // Pause on hover/focus
  carousel.addEventListener('mouseenter', () => clearInterval(autoTimer));
  carousel.addEventListener('focusin',    () => clearInterval(autoTimer));
  carousel.addEventListener('mouseleave', startAuto);
  carousel.addEventListener('focusout',   startAuto);

  // ---- Touch / swipe support ----
  let touchStartX = 0;
  carousel.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
  carousel.addEventListener('touchend', (e) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) goTo(current + 1); else goTo(current - 1);
      restartAuto();
    }
  }, { passive: true });

  // ---- Responsive: rebuild on resize ----
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      buildDots();
      goTo(Math.min(current, totalPages() - 1));
    }, 150);
  });

  // ---- Init ----
  buildDots();
  goTo(0);
  startAuto();

})();
