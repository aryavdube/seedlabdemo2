/* ==========================================================================
   SEED Lab — main.js
   --------------------------------------------------------------------------
   Builds the shared header + footer and fills each page from data.js.
   The forked-paths visual lives in strings.js. No animation libraries.

   CONTENTS
     1. Helpers + icons
     2. Logo mark
     3. Header, mobile nav, theme toggle
     4. Footer
     5. Home previews (publications, news)
     6. News page
     7. Team page (PI, grid, filters, bio pop-up, alumni)
     8. Publications page (search + filters)
     9. Participate page (study interest form)
    10. Contact page (people, topic chooser, copy buttons)
    11. Research page (table of contents)
    12. Reveal on scroll
    13. Boot
   ========================================================================== */
(() => {
  'use strict';

  /* 1. Helpers + icons ----------------------------------------------------- */
  const D = window.SEED || {};
  const SITE = D.SITE;
  const html = document.documentElement;
  const page = document.body.dataset.page || 'home';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const bold = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  const fmtDate = iso => new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const ICON = {
    arrow: '<svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M1 6h10M6.5 1.5 11 6l-4.5 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    arrowUR: '<svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.5 9.5 9.5 2.5M4 2.5h5.5V8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    close: '<svg viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M2 2l10 10M12 2 2 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    menu: '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M3 7h14M3 13h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    moon: '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M16.5 12.2A7 7 0 0 1 7.8 3.5a7 7 0 1 0 8.7 8.7Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>',
    sun: '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="3.6" stroke="currentColor" stroke-width="1.4"/><path d="M10 1.5v2M10 16.5v2M18.5 10h-2M3.5 10h-2M16 4l-1.4 1.4M5.4 14.6 4 16M16 16l-1.4-1.4M5.4 5.4 4 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
    copy: '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="5" y="5" width="9" height="9" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" stroke="currentColor" stroke-width="1.4"/></svg>',
    check: '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m3 8.5 3 3 7-7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  /* 2. Logo mark ------------------------------------------------------------
     One origin node, four strings to four nodes, each trailing off in dots
     (Logo Option A). Colors come from --c0…--c4 on .mark (see base.css). */
  let uid = 0;
  const NODES = [8, 22, 42, 56];
  function mark({ label = '' } = {}) {
    const i = ++uid;
    const grads = NODES.map((_, k) => `<linearGradient id="mg${i}${k}" x1="10" x2="76" gradientUnits="userSpaceOnUse"><stop offset="0" style="stop-color:var(--c0)"/><stop offset="1" style="stop-color:var(--c${k + 1})"/></linearGradient>`).join('');
    const strings = NODES.map((y, k) => `<path class="s" pathLength="1" style="stroke-dasharray:1" d="M10 32C40 32 ${k === 0 || k === 3 ? 46 : 50} ${y} 76 ${y}" stroke="url(#mg${i}${k})"/>`).join('');
    const trail = [[87, 1.9, .8], [96, 1.6, .6], [104, 1.3, .45], [111, 1, .3]];
    const nodes = NODES.map((y, k) => `<g style="fill:var(--c${k + 1})"><circle class="node" cx="76" cy="${y}" r="4.6"/>${trail.map(([x, r, o], n) => `<circle class="trail" style="--i:${n};--o:${o}" cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>`).join('');
    return `<svg class="mark" viewBox="0 0 124 64" ${label ? `role="img" aria-label="${esc(label)}"` : 'aria-hidden="true"'}>
      <defs>${grads}</defs>
      <g fill="none" stroke-width="2.4" stroke-linecap="round">${strings}</g>
      ${nodes}<circle class="node" cx="10" cy="32" r="5.6" style="fill:var(--c0)"/>
    </svg>`;
  }
  D.mark = mark;

  /* 3. Header, mobile nav, theme toggle ------------------------------------ */
  const isDark = () => html.dataset.theme ? html.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  const navLink = n => `<a href="${n.href}" ${page === n.key ? 'aria-current="page"' : ''}>${n.label}</a>`;

  function renderHeader() {
    const skip = document.createElement('a');
    skip.className = 'skip'; skip.href = '#main'; skip.textContent = 'Skip to content';

    const header = document.createElement('header');
    header.className = 'site-header';
    header.innerHTML = `
      <div class="wrap nav">
        <a class="brand" href="index.html" aria-label="SEED Laboratory, UCLA — home">
          ${mark()}
          <span class="brand-word">SEED</span>
          <span class="brand-rule" aria-hidden="true"></span>
          <span class="brand-sub"><b>Laboratory</b><span>UCLA Semel</span></span>
        </a>
        <nav class="nav-links" aria-label="Primary">${SITE.nav.map(navLink).join('')}</nav>
        <div class="nav-actions">
          <button class="icon-btn theme-btn" type="button" aria-label="Switch to ${isDark() ? 'light' : 'dark'} mode">${isDark() ? ICON.sun : ICON.moon}</button>
          <a class="btn btn-primary nav-cta" href="${SITE.cta.href}">${SITE.cta.label} ${ICON.arrow}</a>
          <button class="icon-btn menu-btn" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="mobileNav">${ICON.menu}</button>
        </div>
      </div>
      <nav class="mobile-nav" id="mobileNav" aria-label="Mobile">
        ${navLink({ href: 'index.html', label: 'Home', key: 'home' })}
        ${SITE.nav.map(navLink).join('')}
        <a class="btn btn-primary" href="${SITE.cta.href}">${SITE.cta.label} ${ICON.arrow}</a>
      </nav>`;
    document.body.prepend(header);
    document.body.prepend(skip);

    const onScroll = () => header.classList.toggle('is-scrolled', scrollY > 8);
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });

    const btn = $('.menu-btn'), nav = $('#mobileNav');
    const toggle = open => {
      nav.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      btn.innerHTML = open ? ICON.close : ICON.menu;
    };
    btn.addEventListener('click', () => toggle(!nav.classList.contains('open')));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') toggle(false); });
    // composedPath, not target.closest: the menu button swaps its icon on click, detaching e.target
    document.addEventListener('click', e => { if (nav.classList.contains('open') && !e.composedPath().includes(header)) toggle(false); });
    addEventListener('resize', () => { if (innerWidth > 1080) toggle(false); });

    const themeBtn = $('.theme-btn');
    themeBtn.addEventListener('click', () => {
      const next = isDark() ? 'light' : 'dark';
      html.dataset.theme = next;
      store.set('seed-theme', next);
      themeBtn.innerHTML = next === 'dark' ? ICON.sun : ICON.moon;
      themeBtn.setAttribute('aria-label', `Switch to ${next === 'dark' ? 'light' : 'dark'} mode`);
      dispatchEvent(new Event('seed-theme'));
    });
  }

  /* 4. Footer --------------------------------------------------------------- */
  function renderFooter() {
    const footer = $('[data-footer]'); if (!footer) return;
    footer.className = 'site-footer';
    footer.innerHTML = `
      <div class="wrap">
        <div class="foot-grid">
          <div class="foot-intro">
            <p>Seeing divergence early — so care can arrive <em>before</em> illness does.</p>
            <a class="btn" href="${SITE.cta.href}">${SITE.cta.label} ${ICON.arrow}</a>
          </div>
          <div><h4>Visit</h4><ul>${SITE.address.map(l => `<li>${esc(l)}</li>`).join('')}</ul></div>
          <div><h4>Explore</h4><ul><li><a href="index.html">Home</a></li>${SITE.nav.map(n => `<li><a href="${n.href}">${n.label}</a></li>`).join('')}<li><a href="${SITE.cta.href}">${SITE.cta.label}</a></li></ul></div>
          <div><h4>Connect</h4><ul>
            <li><a href="mailto:${SITE.email}">${SITE.email}</a></li>
            <li><a href="${SITE.semelUrl}" target="_blank" rel="noopener">Semel Institute page ↗</a></li>
          </ul>
          <h4 style="margin-top:1.75rem">Supported by</h4><ul>${SITE.funders.map(f => `<li>${esc(f)}</li>`).join('')}</ul></div>
        </div>
        <div class="foot-word">
          <div class="big" aria-hidden="true">${'SEED'.split('').map(c => `<span>${c}</span>`).join('')}</div>
          <div class="mark-hover">${mark()}<span class="tag">Laboratory</span></div>
        </div>
      </div>
      <div class="wrap foot-bottom">
        <span>© ${new Date().getFullYear()} SEED Laboratory · UCLA</span>
        <span>Signatures of Early Emergence and Divergence</span>
        <a href="#top">Back to top ↑</a>
      </div>`;
  }

  /* Placeholder portrait — initials over a quiet string motif */
  const SWATCH = [['#E9EFFB', '#3268D9'], ['#F8EDE4', '#C9824F'], ['#EEF0F4', '#10243A'], ['#F3EEE8', '#B06B3C']];
  function avatar(name, i) {
    const [bg, fg] = SWATCH[i % SWATCH.length];
    const ini = name.replace(/,.*$/, '').split(/\s+/).filter(w => /^[A-Za-z]/.test(w)).slice(0, 2).map(w => w[0]).join('').toUpperCase();
    const num = (name.match(/\d+/) || [''])[0];
    const strings = [-90, -40, 40, 90].map(dy => `<path d="M40 250 C 180 250 220 ${250 + dy} 360 ${250 + dy}"/>`).join('');
    return `<svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="400" height="500" fill="${bg}"/>
      <g fill="none" stroke="${fg}" stroke-opacity=".22" stroke-width="2">${strings}</g>
      <circle cx="40" cy="250" r="7" fill="${fg}" fill-opacity=".5"/>
      <text x="200" y="420" text-anchor="middle" fill="${fg}" font-family="Jost, sans-serif" font-size="96" letter-spacing="6">${esc(ini)}${esc(num)}</text>
    </svg>`;
  }
  const portrait = (m, i) => m.photo ? `<img src="${esc(m.photo)}" alt="Portrait of ${esc(m.name)}" loading="lazy">` : avatar(m.name, i);

  /* 5. Home previews -------------------------------------------------------- */
  function renderHomePreviews() {
    const pubs = $('#pubPreview');
    if (pubs && D.PUBLICATIONS) pubs.innerHTML = D.PUBLICATIONS.filter(p => p.featured).slice(0, 3).map(p => `
      <a class="pub-mini" href="publications.html">
        <span class="meta">${p.year} · ${esc(p.type)} · ${esc(p.venue)}</span>
        <h3>${esc(p.title)}</h3>
        <p>${bold(p.authors)}</p>
      </a>`).join('');
    const news = $('#newsPreview');
    if (news && D.NEWS) news.innerHTML = D.NEWS.slice(0, 3).map(n => `
      <a class="news-mini" href="news.html">
        <img src="${esc(n.image)}" alt="" loading="lazy">
        <div><span class="meta">${fmtDate(n.date)} · ${esc(n.category)}</span><h3>${esc(n.title)}</h3></div>
      </a>`).join('');
  }

  /* 6. News page ------------------------------------------------------------ */
  function renderNews() {
    const host = $('#newsGrid'); if (!host || !D.NEWS) return;
    host.innerHTML = D.NEWS.map(n => `
      <a class="news-card reveal" href="${esc(n.href)}">
        <img src="${esc(n.image)}" alt="" loading="lazy">
        <div class="body">
          <div class="meta"><span class="pill">${esc(n.category)}</span><span>${fmtDate(n.date)}</span></div>
          <h3>${esc(n.title)}</h3>
          <p>${esc(n.excerpt)}</p>
        </div>
      </a>`).join('');
  }

  /* 7. Team page ------------------------------------------------------------ */
  function renderTeam() {
    const grid = $('#teamGrid'); if (!grid || !D.TEAM) return;
    const pi = D.TEAM.find(m => m.group === 'pi');
    const others = D.TEAM.filter(m => m.group !== 'pi');

    const piHost = $('#piFeature');
    if (pi && piHost) piHost.innerHTML = `
      <div class="portrait reveal">${pi.photo ? `<img src="${esc(pi.photo)}" alt="Portrait of ${esc(pi.name)}">` : `${avatar(pi.name, 0)}<span class="tag">Portrait · replace</span>`}</div>
      <div class="reveal">
        <span class="eyebrow">Principal Investigator</span>
        <h2 class="pi-name">${esc(pi.name.replace(', Ph.D.', ''))}<span>, Ph.D.</span></h2>
        <div class="pill-row"><span class="pill">Child &amp; Adolescent Psychiatry</span><span class="pill">Psychology</span><span class="pill warm">Semel Institute</span></div>
        <div class="prose"><p>${esc(pi.bio)}</p></div>
        <div class="btn-row">
          <a class="btn btn-primary" href="mailto:${esc(pi.email)}">Email Dr. Wolff ${ICON.arrow}</a>
          <a class="link" href="${esc(pi.links.cv || '#')}">CV ${ICON.arrowUR}</a>
          <a class="link" href="${esc(pi.links.scholar || '#')}">Google Scholar ${ICON.arrowUR}</a>
        </div>
      </div>`;

    const GROUPS = { all: 'Everyone', postdoc: 'Postdoctoral', grad: 'Graduate', staff: 'Research staff', undergrad: 'Undergraduate' };
    const counts = others.reduce((a, m) => (a[m.group] = (a[m.group] || 0) + 1, a), {});
    const filters = $('#teamFilters');
    filters.innerHTML = Object.entries(GROUPS).filter(([k]) => k === 'all' || counts[k])
      .map(([k, v]) => `<button class="chip" type="button" data-f="${k}" aria-pressed="${k === 'all'}">${v} <span class="c">${k === 'all' ? others.length : counts[k]}</span></button>`).join('');
    grid.innerHTML = others.map((m, i) => `
      <button class="member" type="button" data-g="${m.group}" data-i="${i}">
        <div class="ph">${portrait(m, i + 1)}</div>
        <div class="nm">${esc(m.name)}</div>
        <div class="rl">${esc(m.role)}</div>
      </button>`).join('');
    filters.addEventListener('click', e => {
      const ch = e.target.closest('.chip'); if (!ch) return;
      $$('.chip', filters).forEach(c => c.setAttribute('aria-pressed', String(c === ch)));
      $$('.member', grid).forEach(el => { el.hidden = !(ch.dataset.f === 'all' || el.dataset.g === ch.dataset.f); });
    });

    const al = $('#alumni');
    if (al && D.ALUMNI) al.innerHTML = D.ALUMNI.map(a => `<li><span>${esc(a.name)}</span><span>${esc(a.next)}</span></li>`).join('');

    // Bio pop-up (native <dialog>: focus trap + Esc built in)
    const dlg = $('#memberDialog'); if (!dlg) return;
    grid.addEventListener('click', e => {
      const b = e.target.closest('.member'); if (!b) return;
      const i = +b.dataset.i, m = others[i], L = m.links || {};
      $('.md-photo', dlg).innerHTML = portrait(m, i + 1);
      $('.md-body', dlg).innerHTML = `
        <span class="eyebrow">${esc(m.role)}</span>
        <h3 id="mdTitle">${esc(m.name)}</h3>
        <p>${esc(m.bio)}</p>
        <dl><dt>Focus</dt><dd>${esc(m.focus)}</dd><dt>Education</dt><dd>${esc(m.education)}</dd>${m.email ? `<dt>Email</dt><dd><a class="link" href="mailto:${esc(m.email)}">${esc(m.email)}</a></dd>` : ''}</dl>
        ${Object.keys(L).length ? `<div class="btn-row" style="margin-top:1.25rem">${Object.entries(L).map(([k, v]) => `<a class="link" href="${esc(v)}">${esc(k[0].toUpperCase() + k.slice(1))} ${ICON.arrowUR}</a>`).join('')}</div>` : ''}`;
      dlg.showModal();
    });
    $('.md-close', dlg).addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  }

  /* 8. Publications page ---------------------------------------------------- */
  function renderPublications() {
    const host = $('#pubList'); if (!host || !D.PUBLICATIONS) return;
    const P = D.PUBLICATIONS.slice().sort((a, b) => b.year - a.year);
    const types = ['All', ...new Set(P.map(p => p.type))];
    const typeCount = t => t === 'All' ? P.length : P.filter(p => p.type === t).length;
    const filters = $('#pubFilters'), search = $('#pubSearch');
    filters.innerHTML = types.map(t => `<button type="button" class="chip" data-t="${esc(t)}" aria-pressed="${t === 'All'}">${esc(t)} <span class="c">${typeCount(t)}</span></button>`).join('');
    let type = 'All', q = '';
    const draw = () => {
      const ql = q.trim().toLowerCase();
      const items = P.filter(p => (type === 'All' || p.type === type) && (!ql || [p.title, p.authors, p.venue, p.year, ...(p.tags || [])].join(' ').toLowerCase().includes(ql)));
      host.innerHTML = [...new Set(items.map(p => p.year))].map(y => `
        <section class="pub-year"><div class="yl">${y}</div><div>${items.filter(p => p.year === y).map(p => `
          <article class="pub-item">
            <h3>${esc(p.title)}</h3>
            <p class="au">${bold(p.authors)}</p>
            <p class="ve">${esc(p.venue)}, ${p.year}</p>
            <div class="row">
              <div class="pill-row"><span class="pill warm">${esc(p.type)}</span>${(p.tags || []).map(t => `<span class="pill">${esc(t)}</span>`).join('')}</div>
              ${p.pdf ? `<a class="link" href="${esc(p.pdf)}">PDF ${ICON.arrowUR}</a>` : ''}
              ${p.doi ? `<a class="link" href="${esc(p.doi)}">DOI ${ICON.arrowUR}</a>` : ''}
              ${p.code ? `<a class="link" href="${esc(p.code)}">Code ${ICON.arrowUR}</a>` : ''}
            </div>
          </article>`).join('')}</div></section>`).join('');
      $('#pubEmpty').classList.toggle('show', items.length === 0);
      $('#pubCount').textContent = `Showing ${items.length} of ${P.length}`;
    };
    const setType = t => { type = t; $$('.chip', filters).forEach(c => c.setAttribute('aria-pressed', String(c.dataset.t === t))); draw(); };
    filters.addEventListener('click', e => { const ch = e.target.closest('.chip'); if (ch) setType(ch.dataset.t); });
    let tmr; search.addEventListener('input', () => { clearTimeout(tmr); tmr = setTimeout(() => { q = search.value; draw(); }, 120); });
    $('#pubClear').addEventListener('click', () => { q = ''; search.value = ''; setType('All'); });
    draw();
  }

  /* 9. Participate page — study interest form ------------------------------
     Opens the visitor's email app addressed to the lab.
     Swap for the lab's secure intake (e.g. a REDCap survey) before launch. */
  function initStudyForm() {
    const f = $('#studyForm'); if (!f) return;
    f.addEventListener('submit', e => {
      e.preventDefault();
      if (!f.reportValidity()) return;
      const d = new FormData(f);
      const body = [
        `Name: ${d.get('name')}`,
        `I am: ${d.get('relation')}`,
        `Email: ${d.get('email')}`,
        `Phone: ${d.get('phone') || '—'}`,
        `Age of the young person: ${d.get('age')}`,
        `Best time to reach me: ${d.get('reach') || '—'}`,
        `How I heard about the lab: ${d.get('heard') || '—'}`,
        '', d.get('message') || ''
      ].join('\n');
      $('#formOk').classList.add('show');
      location.href = `mailto:${SITE.email}?subject=${encodeURIComponent('[SEED Lab] Study interest')}&body=${encodeURIComponent(body)}`;
    });
  }

  /* 10. Contact page -------------------------------------------------------- */
  function renderContact() {
    const host = $('#people'); if (!host || !D.CONTACTS) return;
    host.insertAdjacentHTML('afterbegin', D.CONTACTS.map(c => `
      <article class="person reveal" data-topics="${esc(c.topics.join(' '))}">
        <span class="best">Best contact</span>
        <div class="avatar" aria-hidden="true">${esc(c.initials)}</div>
        <h3>${esc(c.name)}</h3>
        <div class="role"><span class="pill">${esc(c.role)}</span></div>
        <p>${esc(c.about)}</p>
        <div class="email-row">
          <a href="mailto:${esc(c.email)}">${esc(c.email)}</a>
          <button class="copy-btn" type="button" data-copy="${esc(c.email)}" aria-label="Copy ${esc(c.email)}">${ICON.copy}<span>Copy</span></button>
        </div>
      </article>`).join(''));

    // Copy buttons (emails + address)
    document.addEventListener('click', async e => {
      const b = e.target.closest('[data-copy]'); if (!b) return;
      try { await navigator.clipboard.writeText(b.dataset.copy); } catch (err) { return; }
      const label = b.querySelector('span'), old = label.textContent, oldIcon = b.querySelector('svg').outerHTML;
      b.classList.add('done'); label.textContent = 'Copied'; b.querySelector('svg').outerHTML = ICON.check;
      setTimeout(() => { b.classList.remove('done'); label.textContent = old; b.querySelector('svg').outerHTML = oldIcon; }, 1600);
    });

    // "I'm reaching out about…" chooser
    const chooser = $('#chooser'), hint = $('#chooserHint'); if (!chooser) return;
    const people = $$('.person', host);
    chooser.addEventListener('click', e => {
      const ch = e.target.closest('.chip'); if (!ch) return;
      const on = ch.getAttribute('aria-pressed') !== 'true';
      const topic = on ? ch.dataset.topic : null;
      $$('.chip', chooser).forEach(c => c.setAttribute('aria-pressed', String(c === ch && on)));
      people.forEach(p => {
        const match = !!topic && p.dataset.topics.split(' ').includes(topic);
        p.classList.toggle('is-match', match);
        p.classList.toggle('is-dim', !!topic && !match);
      });
      const best = people.find(p => p.classList.contains('is-match'));
      hint.textContent = !topic ? 'Pick a topic and we’ll point you to the right person.'
        : topic === 'study' ? 'Families: the study interest form goes straight to our study team.'
        : `Best contact: ${best.querySelector('h3').textContent}, ${best.querySelector('.pill').textContent}.`;
      if (best && best.getBoundingClientRect().top > innerHeight - 120) best.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    });
  }

  /* 11. Research page — table of contents highlight ------------------------- */
  function initToc() {
    const links = $$('.toc a'); if (!links.length) return;
    const map = new Map(links.map(a => [$(a.getAttribute('href')), a]));
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (en.isIntersecting) links.forEach(a => a.classList.toggle('active', a === map.get(en.target)));
    }), { rootMargin: '-40% 0px -55% 0px' });
    map.forEach((_, sec) => sec && io.observe(sec));
  }

  /* 12. Reveal on scroll ---------------------------------------------------- */
  function initReveal() {
    const els = $$('.reveal');
    if (reduce || !('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('in')); return; }
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    els.forEach(el => io.observe(el));
  }

  /* 13. Boot ---------------------------------------------------------------- */
  renderHeader();
  renderFooter();
  $$('[data-mark]').forEach(el => { el.innerHTML = mark(); });
  renderHomePreviews();
  renderNews();
  renderTeam();
  renderPublications();
  initStudyForm();
  renderContact();
  initToc();
  initReveal();
})();
