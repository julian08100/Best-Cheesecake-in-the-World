/* ============================================================
   BEST CHEESECAKE IN THE WORLD — App v3
   Bilingual (EN/NL) + Dark/Light theme
   ============================================================ */

const API_URL = 'api/cheesecakes.json';

let allCheesecakes = [];
let filteredCheesecakes = [];
let votes = JSON.parse(localStorage.getItem('bcw_votes') || '{}');
let communityVotes = JSON.parse(localStorage.getItem('bcw_community') || '{}');

// ── Language & Theme ─────────────────────────────────────────

let lang  = localStorage.getItem('bcw_lang')  || detectLang();
let theme = localStorage.getItem('bcw_theme') || detectTheme();

function detectLang() {
  const nav = (navigator.language || navigator.languages?.[0] || 'en').toLowerCase();
  if (nav.startsWith('nl')) return 'nl';
  if (nav.startsWith('de')) return 'de';
  return 'en';
}

function detectTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// ── i18n ─────────────────────────────────────────────────────

const T = {
  en: {
    'logo.title': 'Best Cheesecake',
    'logo.sub': 'in the World',
    'nav.rankings': 'Rankings',
    'nav.map': 'Map',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'hero.eyebrow': 'An Obsessive Mission',
    'hero.title': 'Best Cheesecake',
    'hero.title.em': 'in the World',
    'hero.desc': "We travel. We taste. We rank.<br />Every cheesecake that crosses our path gets an honest, personal assessment — and its rightful place on this list.",
    'hero.btn': 'Explore the Rankings',
    'hero.btn2': 'The Mission',
    'hero.scroll': 'Scroll',
    'mission.text': "Not all cheesecakes are created equal. Some are transcendent; some are forgettable; some should never have been called a cheesecake at all. We've tasted them in beach bars, mountain restaurants, and city cafés across Europe and beyond. This is our record.",
    'stat.reviewed': 'Cheesecakes Reviewed',
    'stat.countries': 'Countries on the Map',
    'stat.assessors': 'Dedicated Assessors',
    'stat.since': 'Journey Began',
    'section.rankings': 'The Rankings',
    'section.rankings.sub': 'From a 9.0 masterpiece to a mountain-altitude disappointment — every cheesecake tells its own story.',
    'filter.sort': 'Sort',
    'filter.sort.rank': 'By Rank',
    'filter.sort.rating-desc': 'Rating ↓',
    'filter.sort.rating-asc': 'Rating ↑',
    'filter.sort.year-desc': 'Newest First',
    'filter.sort.name': 'Name A–Z',
    'filter.country': 'Country',
    'filter.country.all': 'All Countries',
    'filter.search': 'Search venue, city…',
    'section.map': 'On the Map',
    'section.map.sub': 'Every cheesecake, plotted across Europe and beyond.',
    'about.eyebrow': 'Why We Do This',
    'about.title': 'The Mission',
    'about.p1': "Somewhere out there is a cheesecake so perfectly crafted that it defines what a cheesecake can be. We haven't found it yet — but we're looking. Not critics, not professional food writers — simply people with a genuine obsession for a well-made cheesecake and a belief that the world deserves to know where the best ones are.",
    'about.p2': 'Every entry on this list has been personally assessed. We evaluate appearance, texture, flavour, and the overall experience. Our assessments go through a review process before publication to maintain honesty and consistency.',
    'about.p3': 'Travelling across Europe and beyond, we continue to discover and document. The list grows with every trip. The best cheesecake in the world is still out there.',
    'about.badge': 'Rank #1',
    'contact.eyebrow': 'Get in Touch',
    'contact.title': 'Join the Mission',
    'contact.sub': 'Know a great cheesecake? Think we missed one? Tell us — the search never ends.',
    'contact.hint': 'Click below to reveal contact details.',
    'contact.btn': 'Reveal Contact Details',
    'footer.brand': 'Best Cheesecake in the World',
    'footer.tagline': 'Personally assessed by our team of connoisseurs. The search continues.',
    'footer.privacy': 'Privacy',
    'footer.terms': 'Terms',
    'modal.published': 'Published',
    'modal.score': 'Score / 10',
    'modal.community': 'Community Response',
    'modal.agree': '▲ Agree',
    'modal.disagree': '▼ Disagree',
    'modal.country': 'Country',
    'modal.year': 'Year Visited',
    'modal.assessors': 'Assessors',
    'modal.restaurant': 'Restaurant',
    'modal.connoisseurs': 'Our Connoisseurs',
    'vote.up': '▲ Vote recorded — thank you!',
    'vote.down': '▼ Noted — honest feedback appreciated',
  },
  nl: {
    'logo.title': 'Beste Cheesecake',
    'logo.sub': 'ter Wereld',
    'nav.rankings': 'Ranglijst',
    'nav.map': 'Kaart',
    'nav.about': 'Over ons',
    'nav.contact': 'Contact',
    'hero.eyebrow': 'Een Obsessieve Missie',
    'hero.title': 'Beste Cheesecake',
    'hero.title.em': 'ter Wereld',
    'hero.desc': 'Wij reizen. Wij proeven. Wij rangschikken.<br />Elke cheesecake die ons pad kruist krijgt een eerlijke, persoonlijke beoordeling — en zijn rechtmatige plek op deze lijst.',
    'hero.btn': 'Bekijk de Ranglijst',
    'hero.btn2': 'De Missie',
    'hero.scroll': 'Scroll',
    'mission.text': 'Niet alle cheesecakes zijn gelijk. Sommige zijn subliem; sommige zijn vergeetbaar; sommige hadden nooit een cheesecake mogen heten. We hebben ze geproefd in strandtenten, bergrestaurants en cafés van Nederland tot Noorwegen. Dit is ons verslag.',
    'stat.reviewed': 'Cheesecakes Beoordeeld',
    'stat.countries': 'Landen op de Kaart',
    'stat.assessors': 'Toegewijde Beoordelaars',
    'stat.since': 'Begin van de Reis',
    'section.rankings': 'De Ranglijst',
    'section.rankings.sub': 'Van een 9,0 meesterwerk tot een teleurstelling op berghoogte — elke cheesecake vertelt zijn eigen verhaal.',
    'filter.sort': 'Sorteren',
    'filter.sort.rank': 'Op Rang',
    'filter.sort.rating-desc': 'Beoordeling ↓',
    'filter.sort.rating-asc': 'Beoordeling ↑',
    'filter.sort.year-desc': 'Nieuwste Eerst',
    'filter.sort.name': 'Naam A–Z',
    'filter.country': 'Land',
    'filter.country.all': 'Alle Landen',
    'filter.search': 'Zoek locatie, stad…',
    'section.map': 'Op de Kaart',
    'section.map.sub': 'Elke cheesecake, in kaart gebracht door Europa en verder.',
    'about.eyebrow': 'Waarom Wij Dit Doen',
    'about.title': 'De Missie',
    'about.p1': 'Ergens bestaat er een cheesecake die zo perfect is bereid dat hij definieert wat een cheesecake kan zijn. We hebben hem nog niet gevonden — maar we zijn op zoek. Geen critici, geen professionele voedseljournalisten — gewoon mensen met een echte obsessie voor een goed gemaakte cheesecake en het geloof dat de wereld verdient te weten waar de beste te vinden zijn.',
    'about.p2': 'Elke vermelding op deze lijst is persoonlijk beoordeeld. We evalueren uiterlijk, textuur, smaak en de algehele beleving. Onze beoordelingen doorlopen een reviewproces voor publicatie om eerlijkheid en consistentie te waarborgen.',
    'about.p3': 'Reizend door Europa en verder blijven we ontdekken en documenteren. De lijst groeit met elke reis. De beste cheesecake ter wereld is er nog steeds.',
    'about.badge': 'Rang #1',
    'contact.eyebrow': 'Neem Contact Op',
    'contact.title': 'Doe Mee aan de Missie',
    'contact.sub': 'Ken jij een geweldige cheesecake? Denk je dat we er een hebben gemist? Laat het ons weten — de zoektocht eindigt nooit.',
    'contact.hint': 'Klik hieronder om contactgegevens te tonen.',
    'contact.btn': 'Toon Contactgegevens',
    'footer.brand': 'Beste Cheesecake ter Wereld',
    'footer.tagline': 'Persoonlijk beoordeeld door ons team van kenners. De zoektocht gaat door.',
    'footer.privacy': 'Privacy',
    'footer.terms': 'Voorwaarden',
    'modal.published': 'Gepubliceerd',
    'modal.score': 'Score / 10',
    'modal.community': 'Community Reactie',
    'modal.agree': '▲ Mee eens',
    'modal.disagree': '▼ Niet mee eens',
    'modal.country': 'Land',
    'modal.year': 'Jaar Bezocht',
    'modal.assessors': 'Beoordelaars',
    'modal.restaurant': 'Restaurant',
    'modal.connoisseurs': 'Onze Kenners',
    'vote.up': '▲ Stem geregistreerd — dankje!',
    'vote.down': '▼ Genoteerd — eerlijke feedback gewaardeerd',
  },
  de: {
    'logo.title': 'Bester Cheesecake',
    'logo.sub': 'der Welt',
    'nav.rankings': 'Rangliste',
    'nav.map': 'Karte',
    'nav.about': 'Über uns',
    'nav.contact': 'Kontakt',
    'hero.eyebrow': 'Eine Obsessive Mission',
    'hero.title': 'Bester Cheesecake',
    'hero.title.em': 'der Welt',
    'hero.desc': 'Wir reisen. Wir probieren. Wir bewerten.<br />Jeder Cheesecake, der uns begegnet, erhält eine ehrliche, persönliche Bewertung — und seinen verdienten Platz auf dieser Liste.',
    'hero.btn': 'Rangliste erkunden',
    'hero.btn2': 'Die Mission',
    'hero.scroll': 'Scrollen',
    'mission.text': 'Nicht alle Cheesecakes sind gleich. Manche sind herausragend; manche vergesslich; manche hätten nie Cheesecake genannt werden dürfen. Wir haben sie in Strandlokalen, Bergrestaurants und Stadtkafés quer durch Europa und darüber hinaus probiert. Das ist unser Bericht.',
    'stat.reviewed': 'Bewertete Cheesecakes',
    'stat.countries': 'Länder auf der Karte',
    'stat.assessors': 'Engagierte Bewerter',
    'stat.since': 'Beginn der Reise',
    'section.rankings': 'Die Rangliste',
    'section.rankings.sub': 'Von einem 9,0-Meisterwerk bis zur Enttäuschung auf Berghöhe — jeder Cheesecake erzählt seine eigene Geschichte.',
    'filter.sort': 'Sortieren',
    'filter.sort.rank': 'Nach Rang',
    'filter.sort.rating-desc': 'Bewertung ↓',
    'filter.sort.rating-asc': 'Bewertung ↑',
    'filter.sort.year-desc': 'Neueste zuerst',
    'filter.sort.name': 'Name A–Z',
    'filter.country': 'Land',
    'filter.country.all': 'Alle Länder',
    'filter.search': 'Lokal, Stadt suchen…',
    'section.map': 'Auf der Karte',
    'section.map.sub': 'Jeder Cheesecake, durch Europa und darüber hinaus eingezeichnet.',
    'about.eyebrow': 'Warum wir das tun',
    'about.title': 'Die Mission',
    'about.p1': "Irgendwo da draußen gibt es einen so perfekt zubereiteten Cheesecake, der definiert, was ein Cheesecake sein kann. Wir haben ihn noch nicht gefunden — aber wir suchen. Keine Kritiker, keine professionellen Foodjournalisten — einfach Menschen mit einer echten Besessenheit für einen gut gemachten Cheesecake und der Überzeugung, dass die Welt es verdient zu wissen, wo die besten zu finden sind.",
    'about.p2': 'Jeder Eintrag auf dieser Liste wurde persönlich bewertet. Wir beurteilen Aussehen, Textur, Geschmack und das Gesamterlebnis. Unsere Bewertungen durchlaufen vor der Veröffentlichung einen Prüfprozess, um Ehrlichkeit und Konsistenz zu gewährleisten.',
    'about.p3': 'Auf Reisen durch Europa und darüber hinaus entdecken und dokumentieren wir weiter. Die Liste wächst mit jeder Reise. Der beste Cheesecake der Welt ist noch da draußen.',
    'about.badge': 'Rang #1',
    'contact.eyebrow': 'Kontakt aufnehmen',
    'contact.title': 'Der Mission beitreten',
    'contact.sub': 'Kennen Sie einen großartigen Cheesecake? Denken Sie, wir haben einen verpasst? Sagen Sie es uns — die Suche endet nie.',
    'contact.hint': 'Klicken Sie unten, um Kontaktdaten anzuzeigen.',
    'contact.btn': 'Kontaktdaten anzeigen',
    'footer.brand': 'Bester Cheesecake der Welt',
    'footer.tagline': 'Persönlich bewertet von unserem Kenner-Team. Die Suche geht weiter.',
    'footer.privacy': 'Datenschutz',
    'footer.terms': 'Nutzungsbedingungen',
    'modal.published': 'Veröffentlicht',
    'modal.score': 'Punkte / 10',
    'modal.community': 'Community-Reaktion',
    'modal.agree': '▲ Stimme zu',
    'modal.disagree': '▼ Stimme nicht zu',
    'modal.country': 'Land',
    'modal.year': 'Jahr des Besuchs',
    'modal.assessors': 'Bewerter',
    'modal.restaurant': 'Restaurant',
    'modal.connoisseurs': 'Unsere Kenner',
    'vote.up': '▲ Stimme erfasst — Danke!',
    'vote.down': '▼ Notiert — ehrliches Feedback geschätzt',
  }
};

function t(key) {
  return T[lang]?.[key] ?? T.en[key] ?? key;
}

function resultsLabel(n) {
  if (lang === 'nl') return `${n} resultaat${n !== 1 ? 'en' : ''}`;
  if (lang === 'de') return `${n} Ergebnis${n !== 1 ? 'se' : ''}`;
  return `${n} result${n !== 1 ? 's' : ''}`;
}

function rankLabel(n) {
  return (lang === 'nl' || lang === 'de') ? `Rang #${n}` : `Rank #${n}`;
}

function langNextLabel() {
  if (lang === 'en') return 'NL';
  if (lang === 'nl') return 'DE';
  return 'EN';
}

// ── Language helpers for bilingual cheesecake data ────────────

function note(c)   {
  if (lang === 'nl' && c.shortNote_nl)   return c.shortNote_nl;
  if (lang === 'de' && c.shortNote_de)   return c.shortNote_de;
  return c.shortNote;
}
function desc(c)   {
  if (lang === 'nl' && c.description_nl) return c.description_nl;
  if (lang === 'de' && c.description_de) return c.description_de;
  return c.description;
}

// ── Apply theme & language ────────────────────────────────────

function applyTheme() {
  document.documentElement.classList.toggle('light-mode', theme === 'light');
  const icon = theme === 'dark' ? '&#9790;' : '&#9788;';
  ['theme-toggle', 'theme-toggle-mobile'].forEach(id => {
    const btn = el(id);
    if (btn) btn.innerHTML = icon;
  });
}

function toggleTheme() {
  theme = theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('bcw_theme', theme);
  applyTheme();
}

function applyLang() {
  document.documentElement.lang = lang;

  document.querySelectorAll('[data-i18n]').forEach(node => {
    const key = node.dataset.i18n;
    const val = T[lang]?.[key] ?? T.en[key];
    if (val != null) node.textContent = val;
  });

  document.querySelectorAll('[data-i18n-html]').forEach(node => {
    const key = node.dataset.i18nHtml;
    const val = T[lang]?.[key] ?? T.en[key];
    if (val != null) node.innerHTML = val;
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(node => {
    const key = node.dataset.i18nPlaceholder;
    const val = T[lang]?.[key] ?? T.en[key];
    if (val != null) node.placeholder = val;
  });

  const langLabel = langNextLabel();
  ['lang-toggle', 'lang-toggle-mobile'].forEach(id => {
    const btn = el(id);
    if (btn) btn.textContent = langLabel;
  });

  updateSelectTranslations();
  renderAll();
  renderStats();

  const count = filteredCheesecakes.length;
  const rc = el('results-count');
  if (rc) rc.textContent = resultsLabel(count);
}

function toggleLang() {
  if (lang === 'en')      lang = 'nl';
  else if (lang === 'nl') lang = 'de';
  else                    lang = 'en';
  localStorage.setItem('bcw_lang', lang);
  applyLang();
}

function updateSelectTranslations() {
  const sortSel = el('sort-select');
  if (sortSel) {
    sortSel.querySelectorAll('[data-i18n]').forEach(opt => {
      const key = opt.dataset.i18n;
      const val = T[lang]?.[key] ?? T.en[key];
      if (val != null) opt.textContent = val;
    });
  }
  const countrySel = el('country-select');
  if (countrySel) {
    const allOpt = countrySel.querySelector('[data-i18n="filter.country.all"]');
    if (allOpt) allOpt.textContent = t('filter.country.all');
  }
}

// ── Bootstrap ────────────────────────────────────────────────

async function init() {
  applyTheme();

  try {
    const data = await fetch(API_URL).then(r => r.json());
    allCheesecakes = data.cheesecakes;
  } catch {
    console.warn('API unavailable');
    allCheesecakes = [];
  }

  allCheesecakes = allCheesecakes.map(c => ({
    ...c,
    communityVotes: communityVotes[c.id] ?? c.communityVotes ?? { approve: 0, disapprove: 0 }
  }));

  filteredCheesecakes = [...allCheesecakes];
  populateCountryFilter();
  applyLang(); // sets all static strings + re-renders
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
      c.description.toLowerCase().includes(query) ||
      c.description_nl?.toLowerCase().includes(query) ||
      c.description_de?.toLowerCase().includes(query);
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

  el('results-count').textContent = resultsLabel(filteredCheesecakes.length);
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

  const order   = items.length >= 3 ? [items[1], items[0], items[2]] : items;
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
        <div class="podium-note">"${esc(note(c))}"</div>
        ${votePills(c)}
      </div>
    </div>`;
  }).join('');

  grid.querySelectorAll('.podium-card').forEach(card => {
    card.addEventListener('click', () => openModal(+card.dataset.id));
    card.addEventListener('keydown', e => { if (e.key === 'Enter') openModal(+card.dataset.id); });
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
        <p class="card-note">"${esc(note(c))}"</p>
        <div class="card-footer">
          <span class="card-year">${c.year}</span>
          <div class="card-votes">
            <button class="card-vote-btn card-vote-btn--up ${myVote === 'up' ? 'voted' : ''}" data-id="${c.id}" data-dir="up" title="${t('modal.agree')}" onclick="castVote(event,${c.id},'up')">▲ ${v.approve}</button>
            <button class="card-vote-btn card-vote-btn--down ${myVote === 'down' ? 'voted' : ''}" data-id="${c.id}" data-dir="down" title="${t('modal.disagree')}" onclick="castVote(event,${c.id},'down')">▼ ${v.disapprove}</button>
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
  if (prev === direction) return;

  const v = communityVotes[id] ?? { approve: 0, disapprove: 0 };
  if (prev === 'up')   v.approve    = Math.max(0, v.approve - 1);
  if (prev === 'down') v.disapprove = Math.max(0, v.disapprove - 1);
  if (direction === 'up')   v.approve++;
  if (direction === 'down') v.disapprove++;

  communityVotes[id] = v;
  votes[id] = direction;

  const cake = allCheesecakes.find(c => c.id === id);
  if (cake) cake.communityVotes = { ...v };

  localStorage.setItem('bcw_votes', JSON.stringify(votes));
  localStorage.setItem('bcw_community', JSON.stringify(communityVotes));

  showToast(t(direction === 'up' ? 'vote.up' : 'vote.down'));
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
        <span class="modal-rank-chip">${rankLabel(c.rank)}</span>
        <span class="modal-status-chip"><span class="status-dot"></span>${t('modal.published')}</span>
      </div>
      <h2 class="modal-title">${esc(c.name)}</h2>
      <div class="modal-venue">${esc(c.venue ?? c.name)}</div>
      <div class="modal-location">${c.countryFlag} ${esc(c.city)}, ${esc(c.country)}</div>
      ${c.address && c.address !== c.country ? `<div class="modal-address">${esc(c.address)}</div>` : ''}

      <div class="modal-score-row">
        <div class="modal-score-big ${scoreClass(c.rating)}">${c.rating.toFixed(1)}</div>
        <div class="modal-score-meta">
          <div class="modal-score-label">${t('modal.score')}</div>
          <div class="modal-score-bar-bg">
            <div class="modal-score-bar-fill" style="width:${c.rating * 10}%"></div>
          </div>
        </div>
      </div>

      <p class="modal-desc">${esc(desc(c))}</p>
      <div class="modal-quote">"${esc(note(c))}"</div>

      <div class="modal-community">
        <div class="modal-community-title">${t('modal.community')}</div>
        <div class="modal-vote-row">
          <button class="modal-vote-btn modal-vote-btn--up ${myVote === 'up' ? 'voted' : ''}" onclick="castVote(event,${c.id},'up')">${t('modal.agree')} &nbsp;<strong>${v.approve}</strong></button>
          <button class="modal-vote-btn modal-vote-btn--down ${myVote === 'down' ? 'voted' : ''}" onclick="castVote(event,${c.id},'down')">${t('modal.disagree')} &nbsp;<strong>${v.disapprove}</strong></button>
        </div>
      </div>

      <div class="modal-meta-grid">
        <div class="modal-meta-item">
          <div class="modal-meta-label">${t('modal.country')}</div>
          <div class="modal-meta-value">${c.countryFlag} ${esc(c.country)}</div>
        </div>
        <div class="modal-meta-item">
          <div class="modal-meta-label">${t('modal.year')}</div>
          <div class="modal-meta-value">${c.year}</div>
        </div>
        <div class="modal-meta-item">
          <div class="modal-meta-label">${t('modal.assessors')}</div>
          <div class="modal-meta-value">${t('modal.connoisseurs')}</div>
        </div>
        <div class="modal-meta-item">
          <div class="modal-meta-label">${t('modal.restaurant')}</div>
          <div class="modal-meta-value">
            ${c.websiteUrl
              ? `<a href="${c.websiteUrl}" target="_blank" rel="noopener">${esc(c.venue ?? c.name)} ↗</a>`
              : esc(c.venue ?? c.name)}
          </div>
        </div>
      </div>

      ${c.tags?.length ? `<div class="modal-tags">${c.tags.map(tag => `<span class="modal-tag">#${tag}</span>`).join('')}</div>` : ''}
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
  const btn     = el('contact-reveal-btn');
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

  ['lang-toggle', 'lang-toggle-mobile'].forEach(id => {
    el(id)?.addEventListener('click', toggleLang);
  });
  ['theme-toggle', 'theme-toggle-mobile'].forEach(id => {
    el(id)?.addEventListener('click', toggleTheme);
  });
}

function bindMobileNav() {
  const btn = el('nav-menu-btn');
  const nav = el('mobile-nav');
  if (!btn || !nav) return;
  btn.addEventListener('click', () => nav.classList.toggle('open'));
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));
}

// ── Toast ────────────────────────────────────────────────────

function showToast(msg) {
  const toast = el('toast');
  toast.textContent = msg;
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), 3000);
}

// ── Helpers ──────────────────────────────────────────────────

function el(id)   { return document.getElementById(id); }
function esc(s)   { return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
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
      <div class="map-popup-rank">${rankLabel(c.rank)}</div>
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
