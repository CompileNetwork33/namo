// =============================================
// NAMO MEDICAL STORE - Main JavaScript
// =============================================

document.addEventListener('DOMContentLoaded', () => {

  // --- Sticky header scroll class ---
  const header = document.getElementById('main-header');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 60);
  });

  // --- Active nav link on scroll ---
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-menu a');
  if (sections.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          navLinks.forEach(a => a.classList.remove('active'));
          const link = document.querySelector(`.nav-menu a[href="#${e.target.id}"]`);
          if (link) link.classList.add('active');
        }
      });
    }, { threshold: 0.45 });
    sections.forEach(s => observer.observe(s));
  }

  // --- Mobile nav toggle ---
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobile-nav');
  const mobileClose = document.getElementById('mobile-close');

  function openMobileNav() {
    mobileNav.classList.add('open');
    document.body.style.overflow = 'hidden';
    hamburger.classList.add('open');
  }
  function closeMobileNav() {
    mobileNav.classList.remove('open');
    document.body.style.overflow = '';
    hamburger.classList.remove('open');
  }

  hamburger.addEventListener('click', openMobileNav);
  mobileClose.addEventListener('click', closeMobileNav);
  mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMobileNav));

  // --- Scroll reveal ---
  const revealEls = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        revealObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => revealObserver.observe(el));

  // --- Counter animation for hero stats ---
  function animateCount(el, target, duration = 1800) {
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { el.textContent = target + (el.dataset.suffix || ''); clearInterval(timer); }
      else el.textContent = start + (el.dataset.suffix || '');
    }, 16);
  }

  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        document.querySelectorAll('.stat-number[data-count]').forEach(el => {
          animateCount(el, parseInt(el.dataset.count));
        });
        statsObserver.disconnect();
      }
    });
  }, { threshold: 0.5 });
  const statsBlock = document.querySelector('.hero-stats');
  if (statsBlock) statsObserver.observe(statsBlock);

  // --- Smooth scroll for anchor links ---
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

});
