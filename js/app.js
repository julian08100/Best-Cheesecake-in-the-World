/* ============================================================
   BEST CHEESECAKE IN THE WORLD — App
   ============================================================ */

const API_URL = 'api/cheesecakes.json';

let allCheesecakes = [];
let filteredCheesecakes = [];

// ── Bootstrap ────────────────────────────────────────────────

async function init() {
  const data = await fetch(API_URL).then(r => r.json());
  allCheesecakes = data.cheesecakes;
  filteredCheesecakes = [...allCheesecakes];

  populateCountryFilter();
  renderStats();
  renderAll();
  bindEvents();
}

// ── Stats Bar ────────────────────────────────────────────────

function renderStats() {
  const countries = new Set(allCheesecakes.map(c => c.country));
  const avg = allCheesecakes.reduce((s, c) => s + c.rating, 0) / allCheesecakes.length;
  document.getElementById('stat-total').textContent = allCheesecakes.length;
  document.getElementById('stat-countries').textContent = countries.size;
  document.getElementById('stat-avg').textContent = avg.toFixed(1);
}

// ── Filters ──────────────────────────────────────────────────

function populateCountryFilter() {
  const countries = [...new Set(allCheesecakes.map(c => c.country))].sort();
  const sel = document.getElementById('country-select');
  countries.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    const flag = allCheesecakes.find(x => x.country === c)?.countryFlag ?? '';
    opt.textContent = `${flag} ${c}`;
    sel.appendChild(opt);
  });
}

function applyFilters() {
  const sort    = document.getElementById('sort-select').value;
  const country = document.getElementById('country-select').value;
  const query   = document.getElementById('search-input').value.toLowerCase().trim();

  filteredCheesecakes = allCheesecakes.filter(c => {
    const matchCountry = country === 'all' || c.country === country;
    const matchSearch  = !query ||
      c.name.toLowerCase().includes(query) ||
      c.city.toLowerCase().includes(query) ||
      c.country.toLowerCase().includes(query) ||
      c.description.toLowerCase().includes(query);
    return matchCountry && matchSearch;
  });

  filteredCheesecakes.sort((a, b) => {
    switch (sort) {
      case 'rating-desc': return b.rating - a.rating;
      case 'rating-asc':  return a.rating - b.rating;
      case 'year-desc':   return b.year - a.year;
      case 'name':        return a.name.localeCompare(b.name);
      default:            return a.rank - b.rank;
    }
  });

  document.getElementById('results-count').textContent =
    `${filteredCheesecakes.length} result${filteredCheesecakes.length !== 1 ? 's' : ''}`;

  renderAll();
}

// ── Render ───────────────────────────────────────────────────

function renderAll() {
  const podium = filteredCheesecakes.slice(0, 3);
  const rest   = filteredCheesecakes.slice(3);
  renderPodium(podium);
  renderCards(rest);
}

function scoreClass(rating) {
  if (rating >= 7.5) return 'score-high';
  if (rating >= 5.0) return 'score-mid';
  return 'score-low';
}

function renderPodium(items) {
  const grid = document.getElementById('podium-grid');
  if (!items.length) { grid.innerHTML = ''; return; }

  const order = items.length >= 3
    ? [items[1], items[0], items[2]]  // 2-1-3 podium visual order
    : items;

  grid.innerHTML = order.map((c, i) => {
    const displayRank = items.length >= 3
      ? (i === 0 ? 2 : i === 1 ? 1 : 3)
      : c.rank;
    return `
      <div class="podium-card rank-${displayRank}" data-id="${c.id}" role="button" tabindex="0" aria-label="${c.name}">
        <div class="podium-img-wrap">
          <img src="${c.imageUrl}" alt="${c.name}" loading="lazy" />
          <div class="podium-overlay"></div>
          <div class="podium-rank-badge">${displayRank}</div>
        </div>
        <div class="podium-info">
          <div class="podium-meta">
            <span class="podium-flag">${c.countryFlag}</span>
            <span class="podium-score ${scoreClass(c.rating)}">${c.rating.toFixed(1)}</span>
          </div>
          <div class="podium-name">${c.name}</div>
          <div class="podium-location">${c.city}, ${c.country}</div>
          <div class="podium-note">"${c.shortNote}"</div>
        </div>
      </div>`;
  }).join('');

  grid.querySelectorAll('.podium-card').forEach(el => {
    el.addEventListener('click', () => openModal(+el.dataset.id));
    el.addEventListener('keydown', e => { if (e.key === 'Enter') openModal(+el.dataset.id); });
  });
}

function renderCards(items) {
  const grid = document.getElementById('cards-grid');
  if (!items.length) {
    grid.innerHTML = '';
    return;
  }

  grid.innerHTML = items.map(c => `
    <article class="cake-card" data-id="${c.id}" role="button" tabindex="0" aria-label="${c.name}">
      <div class="card-img-wrap">
        <img src="${c.imageUrl}" alt="${c.name}" loading="lazy" />
        <div class="card-rank-badge">#${c.rank}</div>
      </div>
      <div class="card-body">
        <div class="card-header">
          <div class="card-name">${c.name}</div>
          <div class="card-score ${scoreClass(c.rating)}">${c.rating.toFixed(1)}</div>
        </div>
        <div class="card-location">
          <span>${c.countryFlag}</span>${c.city}, ${c.country}
        </div>
        <div class="card-bar-wrap">
          <div class="card-bar-bg">
            <div class="card-bar-fill" style="width: ${c.rating * 10}%"></div>
          </div>
        </div>
        <p class="card-note">"${c.shortNote}"</p>
        <div class="card-footer">
          <span class="card-year">${c.year}</span>
          <span class="card-approved">
            <span class="approved-dot"></span> Approved
          </span>
        </div>
      </div>
    </article>
  `).join('');

  grid.querySelectorAll('.cake-card').forEach(el => {
    el.addEventListener('click', () => openModal(+el.dataset.id));
    el.addEventListener('keydown', e => { if (e.key === 'Enter') openModal(+el.dataset.id); });
  });
}

// ── Modal ────────────────────────────────────────────────────

function openModal(id) {
  const c = allCheesecakes.find(x => x.id === id);
  if (!c) return;

  const content = document.getElementById('modal-content');
  content.innerHTML = `
    <img class="modal-img" src="${c.imageUrl}" alt="${c.name}" />
    <div class="modal-body">
      <div class="modal-rank-row">
        <span class="modal-rank">Rank #${c.rank}</span>
        <span class="modal-status">
          <span class="approved-dot"></span> Approved by Marcel & Julian
        </span>
      </div>
      <h2 class="modal-title">${c.name}</h2>
      <p class="modal-location">${c.countryFlag} ${c.city}, ${c.country}</p>

      <div class="modal-score-row">
        <div class="modal-score-big ${scoreClass(c.rating)}">${c.rating.toFixed(1)}</div>
        <div class="modal-score-meta">
          <div class="modal-score-label">Score out of 10</div>
          <div class="modal-score-bar-bg">
            <div class="modal-score-bar-fill" style="width: ${c.rating * 10}%"></div>
          </div>
        </div>
      </div>

      <p class="modal-desc">${c.description}</p>
      <div class="modal-quote">"${c.shortNote}"</div>

      <div class="modal-meta-grid">
        <div class="modal-meta-item">
          <div class="modal-meta-label">Country</div>
          <div class="modal-meta-value">${c.countryFlag} ${c.country}</div>
        </div>
        <div class="modal-meta-item">
          <div class="modal-meta-label">Year Visited</div>
          <div class="modal-meta-value">${c.year}</div>
        </div>
        <div class="modal-meta-item">
          <div class="modal-meta-label">Assessors</div>
          <div class="modal-meta-value">${c.approvedBy.join(' & ')}</div>
        </div>
        <div class="modal-meta-item">
          <div class="modal-meta-label">Status</div>
          <div class="modal-meta-value" style="color: #7FC47A;">✓ Published</div>
        </div>
      </div>

      ${c.tags?.length ? `
      <div class="modal-tags">
        ${c.tags.map(t => `<span class="modal-tag">#${t}</span>`).join('')}
      </div>` : ''}
    </div>
  `;

  const overlay = document.getElementById('modal-overlay');
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

// ── Events ───────────────────────────────────────────────────

function bindEvents() {
  document.getElementById('sort-select').addEventListener('change', applyFilters);
  document.getElementById('country-select').addEventListener('change', applyFilters);
  document.getElementById('search-input').addEventListener('input', debounce(applyFilters, 250));

  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });
}

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

// ── Start ────────────────────────────────────────────────────

init().catch(console.error);
