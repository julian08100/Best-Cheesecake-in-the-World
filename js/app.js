/* ============================================================
   BEST CHEESECAKE IN THE WORLD — App v2
   API endpoint for iOS app: /api/cheesecakes.json
   Form endpoint: configure FORM_ENDPOINT below (Firebase Function or Formspree)
   ============================================================ */

const API_URL = 'api/cheesecakes.json';

let allCheesecakes = [];
let filteredCheesecakes = [];
let votes = JSON.parse(localStorage.getItem('bcw_votes') || '{}'); // { id: 'up'|'down' }
let communityVotes = JSON.parse(localStorage.getItem('bcw_community') || '{}'); // { id: { approve, disapprove } }

// ── Bootstrap ────────────────────────────────────────────────

async function init() {
  try {
    const data = await fetch(API_URL).then(r => r.json());
    allCheesecakes = data.cheesecakes;
  } catch {
    console.warn('API unavailable');
    allCheesecakes = [];
  }

  // Merge community votes from localStorage into data
  allCheesecakes = allCheesecakes.map(c => ({
    ...c,
    communityVotes: communityVotes[c.id] ?? c.communityVotes ?? { approve: 0, disapprove: 0 }
  }));

  filteredCheesecakes = [...allCheesecakes];
  populateCountryFilter();
  renderStats();
  renderAll();
  renderMap();
  bindEvents();
  bindMobileNav();
}

// ── Stats ────────────────────────────────────────────────────

function renderStats() {
  const countries = new Set(allCheesecakes.map(c => c.country));
  el('stat-total').textContent = allCheesecakes.length;
  el('stat-countries').textContent = countries.size;
}

// ── Filters ──────────────────────────────────────────────────

function populateCountryFilter() {
  const countries = [...new Set(allCheesecakes.map(c => c.country))].sort();
  const sel = el('country-select');
  countries.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    const flag = allCheesecakes.find(x => x.country === c)?.countryFlag ?? '';
    opt.textContent = `${flag} ${c}`;
    sel.appendChild(opt);
  });
}

function applyFilters() {
  const sort    = el('sort-select').value;
  const country = el('country-select').value;
  const query   = el('search-input').value.toLowerCase().trim();

  filteredCheesecakes = allCheesecakes.filter(c => {
    const matchCountry = country === 'all' || c.country === country;
    const matchQuery   = !query ||
      c.name.toLowerCase().includes(query) ||
      c.venue?.toLowerCase().includes(query) ||
      c.city.toLowerCase().includes(query) ||
      c.country.toLowerCase().includes(query) ||
      c.description.toLowerCase().includes(query);
    return matchCountry && matchQuery;
  });

  const sorted = [...filteredCheesecakes];
  sorted.sort((a, b) => {
    switch (sort) {
      case 'rating-desc': return b.rating - a.rating;
      case 'rating-asc':  return a.rating - b.rating;
      case 'year-desc':   return b.year - a.year;
      case 'name':        return a.name.localeCompare(b.name);
      default:            return a.rank - b.rank;
    }
  });
  filteredCheesecakes = sorted;

  el('results-count').textContent = `${filteredCheesecakes.length} result${filteredCheesecakes.length !== 1 ? 's' : ''}`;
  renderAll();
}

// ── Render ───────────────────────────────────────────────────

function renderAll() {
  renderPodium(filteredCheesecakes.slice(0, 3));
  renderCards(filteredCheesecakes.slice(3));
}

function scoreClass(r) {
  return r >= 7.5 ? 'score-high' : r >= 5.0 ? 'score-mid' : 'score-low';
}

function imgTag(c, cls = '') {
  const local = `assets/images/${c.imageFile}`;
  return `<img
    src="${local}"
    alt="${esc(c.name)}"
    class="${cls}"
    onerror="handleImgError(this)"
  />`;
}

function votePills(c) {
  const v = communityVotes[c.id] ?? c.communityVotes ?? { approve: 0, disapprove: 0 };
  const total = v.approve + v.disapprove;
  if (total === 0) return '';
  return `<div class="podium-votes">
    <span class="vote-pill vote-pill--up">▲ ${v.approve}</span>
    <span class="vote-pill vote-pill--down">▼ ${v.disapprove}</span>
  </div>`;
}

function renderPodium(items) {
  const grid = el('podium-grid');
  if (!items.length) { grid.innerHTML = ''; return; }

  const order = items.length >= 3 ? [items[1], items[0], items[2]] : items;
  const rankMap = items.length >= 3 ? [2, 1, 3] : items.map((_, i) => i + 1);

  grid.innerHTML = order.map((c, i) => {
    const displayRank = rankMap[i];
    return `<div class="podium-card rank-${displayRank}" data-id="${c.id}" role="button" tabindex="0" aria-label="${esc(c.name)}">
      <div class="podium-img-wrap">
        ${imgTag(c)}
        <div class="img-placeholder">
          <span class="img-placeholder-icon">🍰</span>
          <span class="img-placeholder-text">${esc(c.name)}</span>
        </div>
        <div class="podium-overlay"></div>
        <div class="podium-rank-badge">${displayRank}</div>
      </div>
      <div class="podium-info">
        <div class="podium-meta">
          <span class="podium-flag">${c.countryFlag}</span>
          <span class="podium-score ${scoreClass(c.rating)}">${c.rating.toFixed(1)}</span>
        </div>
        <div class="podium-name">${esc(c.name)}</div>
        <div class="podium-location">${esc(c.city)}, ${esc(c.country)}</div>
        <div class="podium-note">"${esc(c.shortNote)}"</div>
        ${votePills(c)}
      </div>
    </div>`;
  }).join('');

  grid.querySelectorAll('.podium-card').forEach(el => {
    el.addEventListener('click', () => openModal(+el.dataset.id));
    el.addEventListener('keydown', e => { if (e.key === 'Enter') openModal(+el.dataset.id); });
  });

  syncImgPlaceholders(grid);
}

function renderCards(items) {
  const grid = el('cards-grid');
  if (!items.length) { grid.innerHTML = ''; return; }

  grid.innerHTML = items.map(c => {
    const myVote = votes[c.id];
    const v = communityVotes[c.id] ?? c.communityVotes ?? { approve: 0, disapprove: 0 };
    return `<article class="cake-card" data-id="${c.id}" role="button" tabindex="0" aria-label="${esc(c.name)}">
      <div class="card-img-wrap">
        ${imgTag(c)}
        <div class="img-placeholder">
          <span class="img-placeholder-icon" style="font-size:24px">🍰</span>
        </div>
        <div class="card-rank-badge">#${c.rank}</div>
      </div>
      <div class="card-body">
        <div class="card-header">
          <div class="card-name">${esc(c.name)}</div>
          <div class="card-score ${scoreClass(c.rating)}">${c.rating.toFixed(1)}</div>
        </div>
        <div class="card-location">${c.countryFlag} ${esc(c.city)}, ${esc(c.country)}</div>
        <div class="card-bar-bg"><div class="card-bar-fill" style="width:${c.rating * 10}%"></div></div>
        <p class="card-note">"${esc(c.shortNote)}"</p>
        <div class="card-footer">
          <span class="card-year">${c.year}</span>
          <div class="card-votes">
            <button class="card-vote-btn card-vote-btn--up ${myVote === 'up' ? 'voted' : ''}" data-id="${c.id}" data-dir="up" title="Good cheesecake" onclick="castVote(event,${c.id},'up')">▲ ${v.approve}</button>
            <button class="card-vote-btn card-vote-btn--down ${myVote === 'down' ? 'voted' : ''}" data-id="${c.id}" data-dir="down" title="Disagree" onclick="castVote(event,${c.id},'down')">▼ ${v.disapprove}</button>
          </div>
        </div>
      </div>
    </article>`;
  }).join('');

  grid.querySelectorAll('.cake-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('.card-vote-btn')) return;
      openModal(+card.dataset.id);
    });
    card.addEventListener('keydown', e => { if (e.key === 'Enter') openModal(+card.dataset.id); });
  });

  syncImgPlaceholders(grid);
}

// ── Image fallback ───────────────────────────────────────────

function handleImgError(img) {
  img.style.display = 'none';
  const placeholder = img.parentElement.querySelector('.img-placeholder');
  if (placeholder) placeholder.style.display = 'flex';
}

function syncImgPlaceholders(container) {
  container.querySelectorAll('img').forEach(img => {
    if (!img.complete || img.naturalWidth === 0) {
      img.addEventListener('error', () => handleImgError(img), { once: true });
    }
  });
}

// ── Community Voting ──────────────────────────────────────────

function castVote(event, id, direction) {
  event.stopPropagation();
  const prev = votes[id];
  if (prev === direction) return; // already voted this way

  // Update community tallies
  const v = communityVotes[id] ?? { approve: 0, disapprove: 0 };
  if (prev === 'up')   v.approve   = Math.max(0, v.approve - 1);
  if (prev === 'down') v.disapprove = Math.max(0, v.disapprove - 1);
  if (direction === 'up')   v.approve++;
  if (direction === 'down') v.disapprove++;

  communityVotes[id] = v;
  votes[id] = direction;

  // Update the master array too
  const cake = allCheesecakes.find(c => c.id === id);
  if (cake) cake.communityVotes = { ...v };

  localStorage.setItem('bcw_votes', JSON.stringify(votes));
  localStorage.setItem('bcw_community', JSON.stringify(communityVotes));

  showToast(direction === 'up' ? '▲ Vote recorded — thank you!' : '▼ Noted — honest feedback appreciated');
  applyFilters();
}

// ── Modal ────────────────────────────────────────────────────

function openModal(id) {
  const c = allCheesecakes.find(x => x.id === id);
  if (!c) return;

  const v = communityVotes[id] ?? c.communityVotes ?? { approve: 0, disapprove: 0 };
  const myVote = votes[id];
  const localSrc = `assets/images/${c.imageFile}`;

  el('modal-content').innerHTML = `
    <div class="modal-img-wrap">
      <img class="modal-img" src="${localSrc}" alt="${esc(c.name)}" onerror="this.style.display='none';document.getElementById('modal-img-ph').classList.add('visible')" />
      <div class="modal-img-placeholder" id="modal-img-ph">
        <span style="font-size:40px">🍰</span>
        <span style="font-size:13px;color:var(--text-dim)">${esc(c.name)}</span>
      </div>
    </div>
    <div class="modal-body">
      <div class="modal-top-row">
        <span class="modal-rank-chip">Rank #${c.rank}</span>
        <span class="modal-status-chip"><span class="status-dot"></span>Published</span>
      </div>
      <h2 class="modal-title">${esc(c.name)}</h2>
      <div class="modal-venue">${esc(c.venue ?? c.name)}</div>
      <div class="modal-location">${c.countryFlag} ${esc(c.city)}, ${esc(c.country)}</div>
      ${c.address && c.address !== c.country ? `<div class="modal-address">${esc(c.address)}</div>` : ''}

      <div class="modal-score-row">
        <div class="modal-score-big ${scoreClass(c.rating)}">${c.rating.toFixed(1)}</div>
        <div class="modal-score-meta">
          <div class="modal-score-label">Score / 10</div>
          <div class="modal-score-bar-bg">
            <div class="modal-score-bar-fill" style="width:${c.rating * 10}%"></div>
          </div>
        </div>
      </div>

      <p class="modal-desc">${esc(c.description)}</p>
      <div class="modal-quote">"${esc(c.shortNote)}"</div>

      <div class="modal-community">
        <div class="modal-community-title">Community Response</div>
        <div class="modal-vote-row">
          <button class="modal-vote-btn modal-vote-btn--up ${myVote === 'up' ? 'voted' : ''}" onclick="castVote(event,${c.id},'up')">▲ Agree &nbsp;<strong>${v.approve}</strong></button>
          <button class="modal-vote-btn modal-vote-btn--down ${myVote === 'down' ? 'voted' : ''}" onclick="castVote(event,${c.id},'down')">▼ Disagree &nbsp;<strong>${v.disapprove}</strong></button>
        </div>
      </div>

      <div class="modal-meta-grid">
        <div class="modal-meta-item">
          <div class="modal-meta-label">Country</div>
          <div class="modal-meta-value">${c.countryFlag} ${esc(c.country)}</div>
        </div>
        <div class="modal-meta-item">
          <div class="modal-meta-label">Year Visited</div>
          <div class="modal-meta-value">${c.year}</div>
        </div>
        <div class="modal-meta-item">
          <div class="modal-meta-label">Assessors</div>
          <div class="modal-meta-value">Our Connoisseurs</div>
        </div>
        <div class="modal-meta-item">
          <div class="modal-meta-label">Restaurant</div>
          <div class="modal-meta-value">
            ${c.websiteUrl
              ? `<a href="${c.websiteUrl}" target="_blank" rel="noopener">${esc(c.venue ?? c.name)} ↗</a>`
              : esc(c.venue ?? c.name)}
          </div>
        </div>
      </div>

      ${c.tags?.length ? `<div class="modal-tags">${c.tags.map(t => `<span class="modal-tag">#${t}</span>`).join('')}</div>` : ''}
    </div>`;

  const overlay = el('modal-overlay');
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  el('modal-overlay').classList.remove('open');
  el('modal-overlay').setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

// ── Contact Reveal ────────────────────────────────────────────

function revealContact() {
  const btn = el('contact-reveal-btn');
  const details = el('contact-details');
  if (!details || details.children.length) return;
  const u = 'j.de.haas', d = 'digtialcc.nl';
  details.innerHTML = `
    <a href="https://www.linkedin.com/in/juliandehaas/" target="_blank" rel="noopener" class="contact-link contact-link--linkedin">LinkedIn &mdash; Julian de Haas &#8599;</a>
    <a href="mailto:${u}@${d}" class="contact-link contact-link--email">${u}@${d}</a>
  `;
  details.hidden = false;
  btn.hidden = true;
}

// ── Events ───────────────────────────────────────────────────

function bindEvents() {
  el('sort-select').addEventListener('change', applyFilters);
  el('country-select').addEventListener('change', applyFilters);
  el('search-input').addEventListener('input', debounce(applyFilters, 240));
  el('modal-close').addEventListener('click', closeModal);
  el('modal-overlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  el('contact-reveal-btn').addEventListener('click', revealContact);
}

function bindMobileNav() {
  const btn  = el('nav-menu-btn');
  const nav  = el('mobile-nav');
  if (!btn || !nav) return;
  btn.addEventListener('click', () => nav.classList.toggle('open'));
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));
}

// ── Toast ────────────────────────────────────────────────────

function showToast(msg) {
  const t = el('toast');
  t.textContent = msg;
  t.classList.add('visible');
  setTimeout(() => t.classList.remove('visible'), 3000);
}

// ── Helpers ──────────────────────────────────────────────────

function el(id) { return document.getElementById(id); }
function esc(s) { return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

// ── Map ──────────────────────────────────────────────────────

function renderMap() {
  const mapEl = document.getElementById('cheesecake-map');
  if (!mapEl || typeof L === 'undefined') return;

  const points = allCheesecakes.filter(c => c.coordinates);
  if (!points.length) return;

  const map = L.map('cheesecake-map', { zoomControl: true, scrollWheelZoom: false });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 18
  }).addTo(map);

  const bounds = [];

  points.forEach(c => {
    const { lat, lng } = c.coordinates;
    bounds.push([lat, lng]);

    const icon = L.divIcon({
      className: '',
      html: `<div style="
        width:32px;height:32px;border-radius:50%;
        background:var(--gold);color:#0C0B09;
        font-family:var(--font-sans);font-size:11px;font-weight:700;
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 2px 8px rgba(0,0,0,.5);
        border:2px solid rgba(255,255,255,.15);
        cursor:pointer;
      ">#${c.rank}</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -18]
    });

    const popup = `
      <div class="map-popup-rank">Rank #${c.rank}</div>
      <div class="map-popup-name">${esc(c.name)}</div>
      <div class="map-popup-location">${esc(c.city)}, ${esc(c.country)}</div>
      <span class="map-popup-score">${c.rating.toFixed(1)}</span>
    `;

    L.marker([lat, lng], { icon })
      .addTo(map)
      .bindPopup(popup, { maxWidth: 200 });
  });

  map.fitBounds(bounds, { padding: [40, 40] });
}

// ── Start ────────────────────────────────────────────────────
init();
