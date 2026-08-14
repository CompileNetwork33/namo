// =============================================
// NAMO MEDICAL STORE – Health Tips Page JS
// =============================================
document.addEventListener('DOMContentLoaded', () => {

  const grid      = document.getElementById('ht-grid');
  const noResults = document.getElementById('ht-no-results');
  const searchEl  = document.getElementById('ht-search');
  const catBtns   = document.querySelectorAll('.ht-cat-btn');
  const resetBtn  = document.getElementById('ht-reset');
  const cards     = Array.from(document.querySelectorAll('.ht-card'));

  let activeCat  = 'all';
  let searchTerm = '';

  // ---- Filter logic ----
  function applyFilters() {
    let visible = 0;

    cards.forEach(card => {
      const cat   = card.dataset.cat || '';
      const title = (card.dataset.title || '').toLowerCase();
      const text  = card.innerText.toLowerCase();

      const catMatch    = activeCat === 'all' || cat === activeCat;
      const searchMatch = searchTerm === '' || title.includes(searchTerm) || text.includes(searchTerm);

      if (catMatch && searchMatch) {
        card.classList.remove('hidden');
        visible++;
      } else {
        card.classList.add('hidden');
      }
    });

    noResults.style.display = visible === 0 ? 'block' : 'none';
  }

  // ---- Category buttons ----
  catBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      catBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      activeCat = btn.dataset.cat;
      applyFilters();
    });
  });

  // ---- Search input ----
  if (searchEl) {
    searchEl.addEventListener('input', () => {
      searchTerm = searchEl.value.trim().toLowerCase();
      applyFilters();
    });
  }

  // ---- Reset button ----
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      searchTerm = '';
      activeCat  = 'all';
      if (searchEl) searchEl.value = '';
      catBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      const allBtn = document.querySelector('[data-cat="all"]');
      if (allBtn) {
        allBtn.classList.add('active');
        allBtn.setAttribute('aria-selected', 'true');
      }
      applyFilters();
    });
  }

  // ---- Read More modal (lightweight expand-in-place) ----
  cards.forEach(card => {
    const btn = card.querySelector('.ht-read-more');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const body = card.querySelector('.ht-card-body > p');
      const isExpanded = card.classList.toggle('expanded');

      if (isExpanded) {
        body.style.webkitLineClamp = 'unset';
        body.style.overflow = 'visible';
        body.style.display  = 'block';
        btn.innerHTML = 'Show Less <i class="fas fa-arrow-up"></i>';
        card.style.zIndex = '2';
      } else {
        body.style.webkitLineClamp = '';
        body.style.overflow = '';
        body.style.display  = '';
        btn.innerHTML = 'Read More <i class="fas fa-arrow-right"></i>';
        card.style.zIndex = '';
        // Scroll card into view if it went off-screen
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  });

  // ---- Scroll reveal (cards in grid) ----
  // main.js handles .reveal — no duplication needed here

});
