/* ==========================================================================
   SEED Lab — STRINGS (the forked-paths visual)
   --------------------------------------------------------------------------
   One shared origin (familial liability) fans into four bundles of fine
   strings, like the logo: two toward resilience (cobalt), two toward
   progression (copper). Each bundle ends in a node + dotted trail.

   Use on any page:   <canvas data-strings="hero"></canvas>
                      (or "page", "team" — see PRESETS below)
   Optional legend:   buttons with data-group="origin|up|down" placed in the
                      same parent element as the canvas.

   Interactions (every page): strings bend away from the cursor, the nearest
   bundle lights up, click/tap sends a ripple along the strings.
   ========================================================================== */
(() => {
  'use strict';

  /* SETTINGS — tweak the look and feel here -------------------------------- */
  const SETTINGS = {
    colors: ['--cobalt', '--cobalt-soft', '--copper', '--peach'], // CSS vars from theme.css, top → bottom
    ends: [-0.86, -0.36, 0.36, 0.86],    // where each bundle ends (−1 = top, 1 = bottom)
    share: [0.3, 0.25, 0.25, 0.2],       // fraction of strings in each bundle
    spread: 0.4,                         // how far the bundles open (share of canvas height)
    drift: 0.35,                         // speed of the slow idle wave
    drawIn: 2400,                        // ms for the first draw-in
    hover: { radius: 170, push: 20 },    // cursor bend: reach (px) and strength (px)
    ripple: { amp: 16, speed: 560, decay: 1.5 },
    trailGap: 16                         // px between the dots after each node
  };

  const PRESETS = {
    hero: {
      count: 72, mobileCount: 44, glow: true,
      // Hover highlights a whole side and shows these labels
      groups: { up: 'Resilience', down: 'Progression', origin: 'Shared familial liability' }
    },
    page: { count: 40, mobileCount: 28 },
    team: { count: 40, mobileCount: 28, names: ['Aryav', 'Coco', 'Enya', 'Shorayu'] } // top → bottom
  };
  /* ------------------------------------------------------------------------ */

  const html = document.documentElement;
  const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp01 = v => Math.max(0, Math.min(1, v));
  const toRGB = hex => {
    const h = hex.trim().replace('#', '');
    if (!/^[0-9a-f]{3,6}$/i.test(h)) return [16, 36, 58];
    const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    return [n >> 16 & 255, n >> 8 & 255, n & 255].join(',');
  };
  const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

  class Strings {
    constructor(canvas, preset) {
      this.c = canvas; this.ctx = canvas.getContext('2d');
      this.p = preset; this.host = canvas.parentElement;
      this.mouse = { x: -1e4, y: -1e4, tx: -1e4, ty: -1e4 };
      this.ripples = []; this.em = [0, 0, 0, 0]; this.originEm = 0;
      this.active = null; this.forced = null;
      this.t = 0; this.progress = REDUCE ? 1 : 0; this.visible = true;

      this.seed();
      this.readColors();
      this.resize();
      new ResizeObserver(() => { this.resize(); this.frame(); }).observe(canvas);
      document.fonts && document.fonts.ready.then(() => { this.resize(); this.frame(); });
      addEventListener('seed-theme', () => { this.readColors(); this.frame(); });
      matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { this.readColors(); this.frame(); });

      this.bindPointer();
      this.bindLegend();

      this.loop = this.loop.bind(this);
      if (REDUCE) { this.frame(); return; }
      new IntersectionObserver(([en]) => { this.visible = en.isIntersecting; if (this.visible) this.start(); }).observe(canvas);
      document.addEventListener('visibilitychange', () => { if (!document.hidden) this.start(); });
      this.t0 = performance.now();
      this.start();
    }

    /* -- setup ------------------------------------------------------------- */
    seed() {
      const count = innerWidth < 760 ? this.p.mobileCount : this.p.count;
      this.lines = [];
      SETTINGS.ends.forEach((end, b) => {
        const n = Math.max(2, Math.round(count * SETTINGS.share[b]));
        for (let i = 0; i < n; i++) {
          const lead = i === 0;
          this.lines.push({
            b, lead,
            end: lead ? end : end + gauss() * 0.09,
            off: lead ? 0 : gauss() * 0.5,
            ph: Math.random() * Math.PI * 2,
            fq: 0.6 + Math.random() * 0.8,
            w: lead ? 1.8 : 0.6 + Math.random() * 0.5,
            a: lead ? 1 : 0.12 + Math.random() * 0.3,
            delay: lead ? 0.1 : Math.random() * 0.25
          });
        }
      });
      this.lines.sort((a, b) => a.lead - b.lead);          // leads on top
      this.leads = SETTINGS.ends.map((_, b) => this.lines.find(l => l.lead && l.b === b));
      this.dots = Array.from({ length: Math.round(count / 7) }, () => ({ li: Math.floor(Math.random() * this.lines.length), u: Math.random(), sp: 0.0006 + Math.random() * 0.0012 }));
    }
    readColors() {
      const cs = getComputedStyle(html);
      this.ink = toRGB(cs.getPropertyValue('--fg'));
      this.cols = SETTINGS.colors.map(v => toRGB(cs.getPropertyValue(v)));
    }
    resize() {
      const r = this.c.getBoundingClientRect();
      this.W = r.width; this.H = r.height;
      if (!this.W || !this.H) return;
      this.dpr = Math.min(devicePixelRatio || 1, 2);
      this.c.width = Math.round(this.W * this.dpr); this.c.height = Math.round(this.H * this.dpr);
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      // reserve room on the right for trailing dots (+ names, if any)
      let reserve = SETTINGS.trailGap * 4 + 16;
      if (this.p.names) {
        this.ctx.font = this.nameFont();
        reserve += 14 + Math.max(...this.p.names.map(n => this.ctx.measureText(n).width));
      }
      this.ox = 12; this.oy = this.H * 0.5;
      this.ex = Math.max(this.W * 0.45, this.W - reserve);
      this.A = this.H * SETTINGS.spread;
    }
    nameFont() { return `500 ${this.W < 420 ? 13 : 15}px Jost, 'Avenir Next', sans-serif`; }

    /* -- interaction ------------------------------------------------------- */
    bindPointer() {
      const c = this.c;
      const pos = e => { const r = c.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
      const touched = () => this.host.classList.add('touched');
      c.addEventListener('pointermove', e => { [this.mouse.tx, this.mouse.ty] = pos(e); if (REDUCE) { this.mouse.x = this.mouse.tx; this.mouse.y = this.mouse.ty; this.frame(); } }, { passive: true });
      c.addEventListener('pointerleave', () => { this.mouse.tx = this.mouse.ty = -1e4; if (REDUCE) { this.mouse.x = this.mouse.y = -1e4; this.frame(); } });
      c.addEventListener('pointerdown', e => {
        const [x, y] = pos(e);
        touched();
        this.mouse.tx = x; this.mouse.ty = y;
        if (!REDUCE) this.ripples.push({ x, y, t: performance.now() });
        if (e.pointerType !== 'mouse') { clearTimeout(this.tapT); this.tapT = setTimeout(() => { this.mouse.tx = this.mouse.ty = -1e4; }, 1400); }
        this.start();
      });
      c.addEventListener('pointerenter', touched, { once: true });
    }
    bindLegend() {
      this.legend = Array.from(this.host.querySelectorAll('[data-group]'));
      this.legend.forEach(btn => {
        const g = btn.dataset.group;
        const on = () => { this.forced = g; this.start(); };
        const off = () => { if (this.forced === g) this.forced = null; this.start(); };
        btn.addEventListener('pointerenter', on);
        btn.addEventListener('pointerleave', off);
        btn.addEventListener('focus', on);
        btn.addEventListener('blur', off);
        btn.addEventListener('click', () => { this.forced = this.forced === g ? null : g; this.start(); });
      });
    }
    // Which group/bundle is under the cursor?
    hit() {
      const { x, y } = this.mouse;
      if (x < -1e3) return null;
      if (this.p.groups) {
        if (Math.hypot(x - this.ox, y - this.oy) < 46) return 'origin';
        if (x < this.ox + 30) return null;
        return y < this.oy ? 'up' : 'down';
      }
      let best = null, bd = 60;
      this.leads.forEach((l, b) => { const d = Math.abs(this.baseY(l, Math.min(x, this.ex)) - y); if (d < bd) { bd = d; best = b; } });
      return best;
    }
    targets(a) {
      if (a === null || a === undefined || a === 'origin') return [0, 0, 0, 0];
      if (a === 'up') return [1, 1, -1, -1];
      if (a === 'down') return [-1, -1, 1, 1];
      return [0, 1, 2, 3].map(i => i === a ? 1 : -1);
    }

    /* -- geometry ---------------------------------------------------------- */
    baseY(l, x) {
      const u = clamp01((x - this.ox) / (this.ex - this.ox));
      const k = Math.pow(u * u * (3 - 2 * u), 1.2);                 // smooth S like the logo curves
      const drift = REDUCE ? 0 : Math.sin(u * 5 * l.fq + l.ph + this.t * SETTINGS.drift) * this.H * 0.01 * Math.sin(Math.PI * u);
      return this.oy + l.off * this.H * 0.012 * Math.sin(Math.PI * u) + l.end * this.A * k + drift;
    }
    y(l, x, now) {
      const yb = this.baseY(l, x);
      let y = yb;
      const m = this.mouse;
      if (m.x > -1e3) {
        // smooth "parting" around the cursor: strings slide apart like hair under a finger
        const dx = x - m.x, dy = yb - m.y, R = SETTINGS.hover.radius;
        const fall = Math.exp(-(dx * dx) / (2 * (R * 0.45) ** 2)) * Math.exp(-(dy * dy) / (2 * (R * 0.3) ** 2));
        y += Math.tanh(dy / 18) * fall * SETTINGS.hover.push;
      }
      for (const r of this.ripples) {
        const age = (now - r.t) / 1000;
        const d = Math.abs(x - r.x) - age * SETTINGS.ripple.speed;
        const bump = Math.exp(-(d * d) / 4050) * Math.exp(-Math.abs(yb - r.y) / 140);
        y += Math.sign(yb - r.y || 1) * SETTINGS.ripple.amp * Math.exp(-age * SETTINGS.ripple.decay) * bump;
      }
      return y;
    }

    /* -- drawing ----------------------------------------------------------- */
    frame() {
      if (!this.W || !this.H) return;
      const ctx = this.ctx, ink = this.ink, now = performance.now(), step = 6;
      ctx.clearRect(0, 0, this.W, this.H);

      // hover state
      this.active = this.hit();
      const a = this.forced ?? this.active;
      const tg = this.targets(a), ease = REDUCE ? 1 : 0.12;
      this.em = this.em.map((e, i) => e + (tg[i] - e) * ease);
      this.originEm += ((a === 'origin' ? 1 : 0) - this.originEm) * ease;
      this.legend.forEach(btn => btn.classList.toggle('is-active', btn.dataset.group === a));

      // soft glow under the cursor
      if (this.p.glow && this.mouse.x > -1e3) {
        const { x, y } = this.mouse, g = ctx.createRadialGradient(x, y, 0, x, y, 140);
        g.addColorStop(0, `rgba(${this.cols[y < this.oy ? 0 : 2]},.12)`); g.addColorStop(1, `rgba(${this.cols[0]},0)`);
        ctx.fillStyle = g; ctx.fillRect(x - 140, y - 140, 280, 280);
      }

      // strings
      const grads = this.cols.map(c => {
        const g = ctx.createLinearGradient(this.ox, 0, this.ex, 0);
        g.addColorStop(0, `rgba(${ink},.85)`); g.addColorStop(0.4, `rgba(${ink},.5)`); g.addColorStop(1, `rgba(${c},1)`);
        return g;
      });
      for (const l of this.lines) {
        const p = clamp01((this.progress - l.delay) / (1 - l.delay));
        if (p <= 0) continue;
        const e = this.em[l.b], up = Math.max(e, 0), dn = Math.max(-e, 0);
        const xEnd = this.ox + (this.ex - this.ox) * p;
        ctx.beginPath();
        ctx.moveTo(this.ox, this.y(l, this.ox, now));
        for (let x = this.ox + step; x < xEnd; x += step) ctx.lineTo(x, this.y(l, x, now));
        ctx.lineTo(xEnd, this.y(l, xEnd, now));
        ctx.globalAlpha = Math.min(1, l.a * (1 + 1.4 * up) * (1 - 0.65 * dn));
        ctx.strokeStyle = grads[l.b]; ctx.lineWidth = l.w * (1 + 0.45 * up); ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // drifting data points
      if (this.progress >= 1) for (const d of this.dots) {
        if (!REDUCE) { d.u += d.sp; if (d.u > 1) d.u = 0; }
        const l = this.lines[d.li], x = this.ox + (this.ex - this.ox) * d.u;
        ctx.beginPath(); ctx.arc(x, this.y(l, x, now), 1.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.cols[l.b]},${(0.35 + 0.5 * d.u) * (1 - 0.6 * Math.max(-this.em[l.b], 0))})`; ctx.fill();
      }

      // end nodes, dotted trails, names
      const show = clamp01((this.progress - 0.85) / 0.15);
      const nodeY = this.leads.map(l => this.y(l, this.ex, now));
      this.leads.forEach((l, b) => {
        const y = nodeY[b], c = this.cols[b], e = this.em[b], up = Math.max(e, 0), dim = 1 - 0.55 * Math.max(-e, 0);
        ctx.fillStyle = `rgba(${c},${show * dim})`;
        ctx.beginPath(); ctx.arc(this.ex, y, 6 + 2.5 * up, 0, Math.PI * 2); ctx.fill();
        if (up > 0.05) { ctx.strokeStyle = `rgba(${c},${0.35 * up * show})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(this.ex, y, 13 + 3 * up, 0, Math.PI * 2); ctx.stroke(); }
        const flow = REDUCE ? 0 : this.t * 3;
        [[1, 2.4, .8], [2, 2, .6], [3, 1.6, .45], [4, 1.2, .3]].forEach(([n, r, al]) => {
          const pulse = up * 0.5 * (1 + Math.sin(flow - n));
          ctx.fillStyle = `rgba(${c},${Math.min(1, al + pulse) * show * dim})`;
          ctx.beginPath(); ctx.arc(this.ex + 4 + SETTINGS.trailGap * n, y, r + up * 0.6, 0, Math.PI * 2); ctx.fill();
        });
        if (this.p.names) {
          ctx.font = this.nameFont(); ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
          ctx.fillStyle = `rgba(${up > 0.05 ? c : ink},${show * (0.85 * dim + 0.15 * up)})`;
          ctx.fillText(this.p.names[b], this.ex + SETTINGS.trailGap * 4 + 18 + 3 * up, y + 1);
        }
      });

      // side labels (hero): "Resilience" above the top node, "Progression" below the bottom one
      if (this.p.groups) {
        ctx.font = `500 12px Jost, 'Avenir Next', sans-serif`; ctx.textAlign = 'center';
        if ('letterSpacing' in ctx) ctx.letterSpacing = '2.5px';
        const upA = clamp01(Math.min(this.em[0], this.em[1])), dnA = clamp01(Math.min(this.em[2], this.em[3]));
        if (upA > 0.02) { ctx.fillStyle = `rgba(${this.cols[0]},${upA})`; ctx.textBaseline = 'bottom'; ctx.fillText(this.p.groups.up.toUpperCase(), this.ex, nodeY[0] - 16 - 4 * upA); }
        if (dnA > 0.02) { ctx.fillStyle = `rgba(${this.cols[2]},${dnA})`; ctx.textBaseline = 'top'; ctx.fillText(this.p.groups.down.toUpperCase(), this.ex, nodeY[3] + 16 + 4 * dnA); }
        if (this.originEm > 0.02) { ctx.textAlign = 'left'; ctx.fillStyle = `rgba(${ink},${this.originEm})`; ctx.textBaseline = 'top'; ctx.fillText(this.p.groups.origin.toUpperCase(), this.ox - 6, this.oy + 22); }
        if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
      }

      // origin node (+ ring when highlighted)
      const oe = this.originEm;
      ctx.fillStyle = `rgba(${ink},${0.08 + 0.08 * oe})`;
      ctx.beginPath(); ctx.arc(this.ox, this.oy, 11 + 6 * oe, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgb(${ink})`;
      ctx.beginPath(); ctx.arc(this.ox, this.oy, 6 + 1.5 * oe, 0, Math.PI * 2); ctx.fill();
    }

    start() { if (this.running || REDUCE) { if (REDUCE) this.frame(); return; } this.running = true; requestAnimationFrame(this.loop); }
    loop(now) {
      if (!this.visible || document.hidden) { this.running = false; return; }
      this.t += 0.016;
      if (this.progress < 1) { const k = Math.min(1, (now - this.t0) / SETTINGS.drawIn); this.progress = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
      const m = this.mouse;
      m.x += (m.tx - m.x) * 0.14; m.y += (m.ty - m.y) * 0.14;
      if (m.tx < -1e3) { m.x = m.y = -1e4; }
      this.ripples = this.ripples.filter(r => now - r.t < 2500);
      this.frame();
      requestAnimationFrame(this.loop);
    }
  }

  /* Boot every <canvas data-strings="…"> on the page */
  document.querySelectorAll('canvas[data-strings]').forEach(c => {
    c.__strings = new Strings(c, PRESETS[c.dataset.strings] || PRESETS.page);
  });
})();
