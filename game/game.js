// Monster Quest — protótipo 2.5D (direção de arte "diorama HD")
// Mundo 3D (Three.js) com arquitetura e chão em texturas de pixel art; personagens são sprites (billboards)
// iluminados como o cenário (normais para cima → recebem as sombras das casas e projetam a própria sombra).
// Render em baixa resolução + pós-processo com profundidade de campo real (buffer de profundidade),
// bloom, color grading dourado, vinheta e dithering sutil.
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  if (!window.THREE) { $('err').style.display = 'flex'; return; }

  // ================= PALETAS (hue shift: sombras frias/marrons → luzes quentes) =================
  const P = {
    out: '#1a1218',
    stone: ['#3d342f', '#6e6256', '#968a7a', '#b8ab96', '#d6cab2'],
    cob:   ['#3a2e28', '#5e4b3e', '#7f6853', '#9c8469', '#b8a080', '#d4bd98'],
    mosaic:['#9c8866', '#b8a47e', '#cfbe98', '#e0d2b0'],
    plaster:['#a8926f', '#c9b48e', '#e3d3b4', '#f0e4c8'],
    timber:['#2b1f1a', '#4a3428', '#6b4c38'],
    green: ['#1f3324', '#2f5236', '#3f6b45', '#5a8a5a', '#86b07a'],
    roof:  ['#1b2a20', '#2b4530', '#3d6342', '#5a8556', '#8ab27a'],
    grass: ['#33361f', '#474d25', '#626a2f', '#7f873a', '#a2a64a'],
    leafG: ['#13261d', '#1f3d29', '#2f5a33', '#477a3c', '#6e9e48', '#a3c45e'],
    leafO: ['#2e1416', '#5a2318', '#8c3a1c', '#c25e22', '#e38a32', '#f6c25a'],
    leafY: ['#3a2a14', '#6a4a1a', '#9a7020', '#c99a2c', '#e8c24a', '#f8e48a'],
    cyp:   ['#0d1a16', '#14281f', '#1e3a28', '#2d5133', '#44703f'],
    bark:  ['#2a1a1e', '#4a2e2a', '#6e4434', '#946044'],
    wood:  ['#2b1d18', '#4f3426', '#7a5038', '#a8744e'],
    red:   ['#3a1020', '#6e1a2a', '#a82a32', '#d8483e', '#f2804e'],
    amber: ['#4a2a1a', '#8a4f22', '#c98a2c', '#f2c45a', '#fbe9a0'],
    steel: ['#2a2a34', '#4a4c5a', '#767a88', '#a8adb8', '#dfe3ea'],
    skin:  ['#7a4038', '#b8725e', '#e2a585', '#f6cfae'],
    lav:   ['#2e1f4a', '#4e3480', '#7a56b8', '#a988e0'],
    pink:  ['#6e2246', '#b44470', '#e87896', '#ffbcc8'],
  };
  const HC = { // protagonista (baseado na arte de referência do usuário)
    hair: ['#0e0b12', '#1d1722', '#2e2533', '#4a3d4e'], skin: ['#a8685a', '#d99a82', '#f2c4a6', '#fbe0c8'],
    cream: ['#8f7a68', '#c9b39a', '#e8d8c0', '#f7ecd9'], tan: ['#5e4330', '#8a6545', '#b08a60', '#d1ad7e'],
    pants: ['#24221c', '#3b3a2e', '#55523f', '#6e6a50'], boot: ['#4a3322', '#8a6545', '#c9a477', '#e8cfa6'],
    strap: '#2a1f1c', neck: '#1a1418', eye: '#34343f', iris: '#8a90a0',
  };
  const U = 16; // texels por unidade do mundo

  // ================= RNG / ruído =================
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
  const sm = t => t * t * (3 - 2 * t);
  function noise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = sm(x - xi), yf = sm(y - yi);
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
  }
  const BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);
  const bayer = (x, y) => BAY[(y & 3) * 4 + (x & 3)];
  const rgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const clampi = (v, n) => Math.max(0, Math.min(n - 1, Math.floor(v)));

  // ================= Pintor de pixel art =================
  class Pix {
    constructor(w, h) { this.w = w; this.h = h; this.d = new Array(w * h).fill(null); }
    set(x, y, c) { x = Math.floor(x); y = Math.floor(y); if (x < 0 || y < 0 || x >= this.w || y >= this.h) return; this.d[y * this.w + x] = c; }
    get(x, y) { x = Math.floor(x); y = Math.floor(y); return (x < 0 || y < 0 || x >= this.w || y >= this.h) ? null : this.d[y * this.w + x]; }
    rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); return this; }
    ell(cx, cy, rx, ry, c) {
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy <= 1) this.set(x, y, c);
      }
      return this;
    }
    ball(cx, cy, rx, ry, r) {
      this.ell(cx, cy, rx, ry, r[0]);
      this.ell(cx - rx * 0.08, cy - ry * 0.1, rx * 0.9, ry * 0.86, r[1]);
      if (r[2]) this.ell(cx - rx * 0.2, cy - ry * 0.24, rx * 0.66, ry * 0.6, r[2]);
      if (r[3]) this.ell(cx - rx * 0.34, cy - ry * 0.42, rx * 0.3, ry * 0.26, r[3]);
      return this;
    }
    line(x0, y0, x1, y1, c, t = 1) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) | 0; for (let i = 0; i <= n; i++) { const k = n ? i / n : 0; this.rect(Math.round(x0 + (x1 - x0) * k), Math.round(y0 + (y1 - y0) * k), t, t, c); } return this; }
    outline(c = P.out) {
      const add = [];
      for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++)
        if (!this.get(x, y) && (this.get(x + 1, y) || this.get(x - 1, y) || this.get(x, y + 1) || this.get(x, y - 1))) add.push(x, y);
      for (let i = 0; i < add.length; i += 2) this.set(add[i], add[i + 1], c);
      return this;
    }
    mirror() { const m = new Pix(this.w, this.h); for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) m.d[y * this.w + x] = this.d[y * this.w + (this.w - 1 - x)]; return m; }
    transpose() { const m = new Pix(this.h, this.w); for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) m.set(y, x, this.get(x, y)); return m; }
    canvas() {
      const c = document.createElement('canvas'); c.width = this.w; c.height = this.h; const g = c.getContext('2d');
      this.d.forEach((col, i) => { if (col) { g.fillStyle = col; g.fillRect(i % this.w, (i / this.w) | 0, 1, 1); } });
      return c;
    }
    tex(repeat) {
      const t = new THREE.CanvasTexture(this.canvas());
      t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
      if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
      return t;
    }
  }

  // ================= PROTAGONISTA =================
  function drawHero(view, f) {
    const p = new Pix(32, 46);
    if (view === 'side') {
      const st = [0, 3, -3][f], sw = [0, 2, -2][f];
      p.rect(13 - st, 31, 4, 10, HC.pants[1]); p.ball(15 - st, 42, 3.6, 2.4, HC.boot);
      p.rect(9, 26, 5, 5, HC.pants[1]); p.rect(9, 26, 5, 2, HC.pants[2]);
      p.ball(16, 25, 6.5, 6, HC.cream); p.rect(10, 29, 12, 2, HC.strap);
      p.rect(16 + st, 31, 4, 10, HC.pants[2]); p.rect(16 + st, 31, 1, 10, HC.pants[3]); p.ball(18.5 + st, 42, 3.8, 2.4, HC.boot);
      p.line(12, 20, 19, 28, HC.strap);
      p.rect(15 + sw, 21, 4, 4, HC.cream[2]); p.rect(15 + sw, 24, 4, 5, HC.tan[2]); p.rect(15 + sw, 24, 1, 5, HC.tan[3]);
      p.rect(15 + sw, 29, 4, 1, HC.neck); p.rect(15 + sw, 30, 4, 2, HC.skin[2]);
      p.ball(16, 19, 7.5, 3.4, HC.tan);
      p.rect(15, 15, 5, 2, HC.neck);
      p.ball(18.5, 11, 5.8, 6.4, HC.skin.slice(1));
      p.ball(14, 7.5, 7.8, 6.2, HC.hair); p.rect(8, 9, 5, 7, HC.hair[1]); p.rect(9, 15, 3, 2, HC.hair[0]);
      [[17, 3], [19, 4], [21, 5], [22, 7]].forEach(([x, l], i) => p.rect(x, 5 + (i % 2), 2, l, HC.hair[1]));
      [[7, 3], [10, 1], [13, 0], [17, 1], [20, 2]].forEach(([x, y]) => p.rect(x, y, 2, 2, HC.hair[1]));
      p.rect(12, 4, 2, 1, HC.hair[3]); p.set(16, 3, HC.hair[3]);
      p.rect(20, 12, 2, 2, HC.eye); p.set(21, 12, HC.iris); p.set(24, 13, HC.skin[1]); p.set(22, 15, '#a8645a');
      return p.outline();
    }
    const back = view === 'back', lf = f === 1 ? 1 : 0, rf = f === 2 ? 1 : 0;
    p.rect(10, 31, 5, 10 - lf, HC.pants[2]); p.rect(10, 31, 1, 10 - lf, HC.pants[3]); p.rect(14, 31, 1, 10 - lf, HC.pants[1]);
    p.rect(17, 31, 5, 10 - rf, HC.pants[2]); p.rect(17, 31, 1, 10 - rf, HC.pants[3]); p.rect(21, 31, 1, 10 - rf, HC.pants[1]);
    p.rect(10, 39 - lf, 5, 1, HC.pants[1]); p.rect(17, 39 - rf, 5, 1, HC.pants[1]);
    if (!back) { p.rect(11, 35, 3, 2, HC.skin[2]); p.set(11, 35, HC.cream[3]); p.set(13, 36, HC.cream[3]); }
    p.ball(12.5, 42 - lf, 3.6, 2.5, HC.boot); p.ball(19.5, 42 - rf, 3.6, 2.5, HC.boot);
    const arm = (x, dy, dark) => {
      p.rect(x, 21 + dy, 4, 4, HC.cream[dark ? 1 : 2]); p.rect(x, 25 + dy, 4, 5, HC.tan[dark ? 1 : 2]);
      p.rect(x + (dark ? 3 : 0), 25 + dy, 1, 5, HC.tan[dark ? 0 : 3]); p.rect(x, 29 + dy, 4, 1, HC.neck); p.rect(x, 30 + dy, 4, 2, HC.skin[2]);
    };
    arm(5, f === 2 ? 1 : 0, false); arm(23, f === 1 ? 1 : 0, true);
    p.ball(16, 25, 8.5, 6.2, HC.cream); p.rect(9, 28, 14, 1, HC.cream[1]);
    p.rect(9, 29, 14, 2, HC.strap); if (!back) p.rect(15, 29, 2, 2, '#8a8a96');
    if (!back) { p.line(22, 19, 11, 28, HC.strap); p.rect(5, 27, 6, 5, HC.pants[1]); p.rect(5, 27, 6, 2, HC.pants[2]); p.set(8, 29, '#8a8a96'); }
    else { p.line(10, 19, 21, 28, HC.strap); p.rect(21, 27, 6, 5, HC.pants[1]); p.rect(21, 27, 6, 2, HC.pants[2]); }
    p.rect(13, 15, 6, 2, HC.neck);
    p.ball(16, 19, 9, 3.6, HC.tan);
    if (!back) { p.ball(16, 22, 4, 2.6, HC.tan.slice(1)); p.rect(17, 21, 1, 4, HC.tan[0]); }
    if (!back) {
      p.ball(16, 11, 6.8, 6.6, HC.skin.slice(1));
      p.ball(16, 6.5, 9, 5.8, HC.hair);
      [[9, 7], [11, 3], [13, 2], [15, 3], [17, 2], [19, 3], [21, 2]].forEach(([x, l]) => p.rect(x, 8, 2, l, HC.hair[x % 4 ? 1 : 2]));
      p.rect(8, 8, 2, 9, HC.hair[1]); p.rect(22, 8, 2, 8, HC.hair[1]); p.rect(7, 13, 2, 3, HC.hair[0]); p.rect(23, 14, 2, 2, HC.hair[0]);
      p.rect(12, 12, 2, 2, HC.eye); p.set(12, 12, HC.iris); p.rect(18, 12, 2, 2, HC.eye); p.set(19, 12, HC.iris);
      p.rect(15, 15, 2, 1, '#a8645a'); p.set(11, 14, HC.skin[1]); p.set(20, 14, HC.skin[1]);
    } else {
      p.ball(16, 9.5, 8.6, 8, HC.hair); p.rect(9, 13, 14, 4, HC.hair[1]); p.rect(11, 16, 2, 2, HC.hair[0]); p.rect(19, 16, 2, 2, HC.hair[0]);
    }
    [[7, 4], [9, 1], [12, 0], [16, 0], [19, 1], [22, 2], [24, 5]].forEach(([x, y]) => p.rect(x, y, 2, 2, HC.hair[1]));
    p.rect(11, 3, 3, 1, HC.hair[3]); p.set(18, 2, HC.hair[3]);
    return p.outline();
  }

  // ================= NPCs (originais) =================
  function drawGuard() {
    const p = new Pix(36, 48);
    p.rect(30, 2, 2, 44, P.wood[2]); p.rect(30, 2, 1, 44, P.wood[3]); p.ell(31, 3, 2.5, 4, P.steel[3]); p.set(30, 1, P.steel[4]);
    p.ball(13, 44, 3.6, 2.4, P.wood); p.ball(22, 44, 3.6, 2.4, P.wood);
    p.rect(11, 33, 5, 9, P.wood[1]); p.rect(19, 33, 5, 9, P.wood[1]);
    p.ball(17.5, 28, 9, 7, P.red.slice(1)); p.rect(9, 31, 17, 2, P.wood[0]); p.rect(16, 31, 3, 2, P.amber[3]);
    p.ball(17.5, 24, 7, 4.5, P.steel.slice(1));
    p.ball(7, 27, 3, 4, P.steel.slice(1)); p.ball(28, 27, 3, 4, P.steel.slice(1)); p.rect(27, 30, 4, 2, P.skin[2]);
    p.ball(17.5, 13, 6.5, 6, P.skin.slice(1)); p.rect(14, 14, 2, 2, P.out); p.rect(20, 14, 2, 2, P.out); p.rect(15, 18, 5, 1, P.skin[0]);
    p.ball(17.5, 9, 8, 5, P.steel.slice(1)); p.rect(9, 11, 17, 2, P.steel[1]); p.rect(16, 3, 3, 8, P.steel[3]);
    p.ell(17.5, 2.5, 4, 2.5, P.red[3]); p.ell(16.5, 2, 2, 1.3, P.red[4]);
    return p.outline();
  }
  function drawMerchant() {
    const p = new Pix(32, 42), W3 = ['#8a7a72', '#cfc3bb', '#f2ece4'];
    p.ball(16, 34, 10, 8, P.wood.slice(1)); p.rect(10, 26, 12, 14, P.plaster[3]); p.rect(10, 26, 12, 1, P.plaster[1]);
    p.ball(16, 24, 8, 5, W3); p.ball(7, 27, 2.6, 4, W3); p.ball(25, 27, 2.6, 4, W3.slice(0, 2));
    p.ball(16, 13, 6.5, 6.4, P.skin.slice(1)); p.rect(13, 14, 2, 2, P.out); p.rect(18, 14, 2, 2, P.out); p.rect(15, 18, 3, 1, '#a8505a');
    p.rect(9, 12, 2, 8, P.wood[2]); p.rect(21, 12, 2, 8, P.wood[2]);
    p.ball(16, 8, 9, 5.5, P.red.slice(1)); p.rect(22, 10, 4, 6, P.red[2]); p.set(12, 6, P.red[4]);
    return p.outline();
  }
  function drawKid() {
    const p = new Pix(26, 34), B = ['#1e2f5e', '#2f4f86', '#4776ad'];
    p.ball(9, 31, 3, 2, P.wood); p.ball(17, 31, 3, 2, P.wood);
    p.rect(8, 23, 4, 7, B[1]); p.rect(14, 23, 4, 7, B[1]);
    p.ball(13, 20, 6.5, 5, B); p.rect(10, 15, 6, 4, P.amber[3]); p.rect(9, 15, 1, 6, B[1]); p.rect(16, 15, 1, 6, B[1]);
    p.ball(4.5, 19, 2.2, 3, P.amber.slice(2)); p.ball(21.5, 19, 2.2, 3, P.amber.slice(1));
    p.ball(13, 9, 6.5, 6, P.skin.slice(1)); p.rect(10, 10, 2, 2, P.out); p.rect(15, 10, 2, 2, P.out); p.set(12, 13, '#a8505a'); p.set(9, 12, P.pink[2]); p.set(17, 12, P.pink[2]);
    p.ball(13, 5, 7, 3.6, P.green.slice(1)); p.rect(13, 6, 9, 2, P.green[1]);
    return p.outline();
  }

  // ================= VEGETAÇÃO / PROPS (sprites) =================
  function drawTree(r) {
    const p = new Pix(52, 70);
    p.rect(23, 44, 6, 24, P.bark[1]); p.rect(23, 44, 2, 24, P.bark[2]); p.rect(28, 44, 1, 24, P.bark[0]);
    p.rect(19, 66, 14, 2, P.bark[1]); p.line(26, 50, 16, 40, P.bark[1], 2); p.line(27, 48, 36, 38, P.bark[1], 2);
    const ramp = r.slice(1, 5);
    [[26, 18, 13, 11], [16, 26, 11, 10], [37, 24, 11, 10], [18, 37, 12, 9], [35, 37, 12, 9], [26, 32, 14, 11], [26, 10, 9, 7]].forEach(b => p.ball(b[0], b[1], b[2], b[3], ramp));
    for (let i = 0; i < 40; i++) { const x = 8 + rnd() * 30, y = 4 + rnd() * 28; if (p.get(x, y)) p.set(x, y, r[5]); }
    for (let i = 0; i < 40; i++) { const x = 8 + rnd() * 36, y = 32 + rnd() * 14; if (p.get(x, y) && p.get(x, y) !== P.bark[1]) p.set(x, y, r[1]); }
    return p.outline();
  }
  function drawCypress() {
    const p = new Pix(26, 76), r = P.cyp;
    p.rect(11, 68, 4, 7, P.bark[1]);
    for (let y = 2; y < 70; y++) {
      const k = (y - 2) / 68, w = Math.max(1, Math.round(11 * Math.sin(Math.min(1, k * 1.25) * Math.PI * 0.62) * (k > 0.92 ? 0.85 : 1)));
      for (let x = 13 - w; x <= 13 + w; x++) {
        const s = (x - 13) / w + (noise(x * 0.6, y * 0.35) - 0.5) * 0.7;
        p.set(x, y, r[s < -0.45 ? 3 : s < 0.1 ? 2 : s < 0.6 ? 1 : 0]);
      }
    }
    for (let i = 0; i < 30; i++) { const x = 6 + rnd() * 8, y = 6 + rnd() * 60; if (p.get(x, y)) p.set(x, y, r[4]); }
    return p.outline();
  }
  function drawBush(r) {
    const p = new Pix(28, 18), q = r.slice(1, 5);
    p.ball(7, 11, 6, 5, q); p.ball(20, 11, 6, 5, q); p.ball(14, 9, 8, 6, q);
    for (let i = 0; i < 10; i++) { const x = 4 + rnd() * 18, y = 4 + rnd() * 8; if (p.get(x, y)) p.set(x, y, r[5]); }
    return p.outline();
  }
  function drawTuft(tall) {
    const w = tall ? 22 : 14, h = tall ? 22 : 10, p = new Pix(w, h), n = tall ? 10 : 6, r = tall ? P.grass : P.grass.slice(1);
    for (let i = 0; i < n; i++) {
      const x0 = 1 + Math.round(i * (w - 3) / (n - 1)), bh = tall ? 11 + rnd() * 10 : 4 + rnd() * 5, lean = (rnd() - 0.5) * (tall ? 5 : 3);
      for (let y = 0; y < bh; y++) {
        const k = y / bh, x = Math.round(x0 + lean * k * k), ci = Math.min(r.length - 1, Math.floor(k * r.length));
        p.set(x, h - 1 - y, r[ci]); if (tall && y < bh * 0.6) p.set(x + 1, h - 1 - y, r[Math.max(0, ci - 1)]);
      }
    }
    return tall ? p.outline('#1f2414') : p;
  }
  function drawLavender() {
    const p = new Pix(14, 16);
    for (let i = 0; i < 5; i++) { const x = 2 + i * 2.5, t = 2 + (i % 2) * 2; p.rect(x, t + 5, 1, 16 - t - 5, P.grass[2]); for (let y = t; y < t + 6; y++) p.set(x + (y % 2 ? 1 : 0), y, P.lav[(y - t) < 2 ? 3 : 2]); }
    return p.outline('#1f1830');
  }
  function drawRoses() {
    const p = new Pix(16, 12);
    p.ball(8, 7, 7, 4.5, P.leafG.slice(1, 5));
    [[4, 5], [8, 3], [12, 5], [6, 8], [11, 8]].forEach(([x, y], i) => { p.rect(x, y, 2, 2, i % 2 ? P.pink[2] : P.red[3]); p.set(x, y, i % 2 ? P.pink[3] : P.red[4]); });
    return p.outline();
  }
  function drawBanner() {
    const p = new Pix(14, 34);
    p.rect(0, 0, 14, 2, P.wood[1]);
    for (let y = 2; y < 30; y++) for (let x = 1; x < 13; x++) p.set(x, y, x < 3 ? P.green[3] : x > 10 ? P.green[1] : P.green[2]);
    for (let x = 1; x < 13; x++) for (let y = 30; y < 34; y++) if (y - 30 < 4 - Math.abs(x - 7) * 0.7) p.set(x, y, P.green[2]);
    p.rect(1, 4, 12, 1, P.amber[3]); p.rect(1, 26, 12, 1, P.amber[3]);
    p.ell(7, 14, 3.5, 4, P.amber[3]); p.ell(7, 15, 2, 2.5, P.amber[4]); p.rect(6, 8, 2, 3, P.amber[3]); p.rect(4, 19, 6, 2, P.amber[2]);
    return p.outline();
  }
  function drawSign() {
    const p = new Pix(20, 22);
    p.rect(9, 10, 2, 12, P.wood[1]);
    p.rect(1, 2, 18, 9, P.wood[3]); p.rect(1, 9, 18, 2, P.wood[2]); p.rect(3, 4, 13, 1, P.wood[1]); p.rect(3, 7, 9, 1, P.wood[1]);
    return p.outline();
  }
  function drawBubble() {
    const p = new Pix(13, 14);
    p.ball(6.5, 6.5, 6, 6, P.amber.slice(1)); p.set(6, 13, P.amber[2]);
    ['.###.', '#...#', '#####', '#...#', '#...#'].forEach((row, y) => [...row].forEach((ch, x) => { if (ch === '#') p.set(4 + x, 4 + y, P.wood[0]); }));
    return p.outline();
  }
  function glowTex(inner, outer) {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, inner); gr.addColorStop(0.35, outer); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
  }

  // ================= TEXTURAS DE ARQUITETURA =================
  function bricks(r, tall = 6, wide = 12) {
    const W = wide * 2, H = tall * 4, p = new Pix(W, H);
    for (let row = 0; row < 4; row++) {
      const off = row % 2 ? wide / 2 : 0;
      for (let b = -1; b < 3; b++) {
        const x0 = b * wide + off, tone = 1 + Math.floor(hash(b + row * 7, row) * 3);
        for (let y = 0; y < tall; y++) for (let x = 0; x < wide; x++) {
          const X = (x0 + x + W) % W, Y = row * tall + y;
          let c = r[tone];
          if (y === 0 || x === 0) c = r[0]; else if (y === 1 || x === 1) c = r[Math.min(4, tone + 1)]; else if (y === tall - 1 || x === wide - 1) c = r[Math.max(1, tone - 1)];
          if (hash(X * 3, Y * 5) < 0.05) c = r[Math.max(1, tone - 1)];
          p.set(X, Y, c);
        }
      }
    }
    return p.tex(true);
  }
  function shingles(r) {
    const p = new Pix(16, 16);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const row = y >> 2, yy = y & 3, xx = (x + (row % 2) * 4) & 7;
      let c = r[2]; if (yy === 0) c = r[3]; if (yy === 3) c = r[1]; if (xx === 0) c = r[0]; if (yy === 3 && (xx === 1 || xx === 7)) c = r[0];
      if (hash(x * 2, y * 3) < 0.06) c = r[4];
      p.set(x, y, c);
    }
    return p.transpose().tex(true); // fileiras correm ao longo da cumeeira
  }
  function planks(r) {
    const p = new Pix(16, 16);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const k = x & 3; p.set(x, y, k === 0 ? r[0] : k === 1 ? r[3] : hash(x, y) < 0.15 ? r[1] : r[2]); }
    return p.tex(true);
  }
  // UVs da caixa em escala real (textura repete por unidade em vez de esticar)
  function boxUV(geo, w, h, d, tile) {
    const uv = geo.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) { const k = f * 4 + i; uv.setXY(k, uv.getX(k) * dims[f][0] / tile, uv.getY(k) * dims[f][1] / tile); }
    return geo;
  }

  function facade(w, hW, o) {
    const W = Math.round(w * U), H = Math.round(hW * U), p = new Pix(W, H), em = new Pix(W, H);
    const PL = P.plaster, T = P.timber, SB = 9, G = P.green;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const n = hash(x * 1.3, y * 2.1); let c = PL[2];
      if (n < 0.1) c = PL[1]; else if (n > 0.94) c = PL[3];
      if (y > H * 0.7 && hash(x, y * 3) < (y - H * 0.7) / (H * 0.3) * 0.5) c = PL[1];
      p.set(x, y, c);
    }
    for (let y = H - SB; y < H; y++) for (let x = 0; x < W; x++) {
      const yy = y - (H - SB), row = (yy / 4.5) | 0, bx = ((x + row * 5) / 9) | 0, ex = (x + row * 5) % 9, ey = yy % 4.5;
      p.set(x, y, ex < 1 || ey < 1 ? P.stone[0] : P.stone[1 + ((hash(bx, row) * 3) | 0)]);
    }
    const beam = (x, y, w2, h2) => { p.rect(x, y, w2, h2, T[1]); p.rect(x, y, w2, 1, T[2]); p.rect(x, y + h2 - 1, w2, 1, T[0]); };
    const post = (x, y0, y1) => { p.rect(x, y0, 3, y1 - y0, T[1]); p.rect(x, y0, 1, y1 - y0, T[2]); p.rect(x + 2, y0, 1, y1 - y0, T[0]); };
    const mid = Math.round(H * 0.46);
    post(0, 0, H - SB); post(W - 3, 0, H - SB);
    (o.posts || []).forEach(x => post(x, 0, mid));
    const brace = [0, ...(o.posts || []), W - 3];
    for (let i = 0; i < brace.length - 1; i++) {
      const a = brace[i] + 3, b = brace[i + 1];
      if (b - a > 14 && !(o.upWin || []).some(c => c > a && c < b)) { p.line(a, mid - 1, b - 2, 3, T[1], 2); p.line(a, 3, b - 2, mid - 1, T[1], 2); }
    }
    beam(0, 0, W, 3); beam(0, mid, W, 3); beam(0, H - SB - 2, W, 2);
    const win = (cx, ty, hgt = 14) => {
      const r = 6;
      for (let y = ty - 1; y < ty + hgt + 1; y++) for (let x = cx - r - 1; x < cx + r + 1; x++) {
        const ay = y - ty; if (ay < r && Math.hypot(x + 0.5 - cx, ay - r + 0.5) > r + 1) continue;
        const inner = !(x === cx - r - 1 || x === cx + r || y === ty + hgt || (ay < r ? Math.hypot(x + 0.5 - cx, ay - r + 0.5) > r : y === ty - 1));
        p.set(x, y, inner ? (y > ty + hgt * 0.55 ? '#c98a4e' : '#3a3040') : T[0]);
        if (inner) em.set(x, y, y > ty + hgt * 0.55 ? '#7a4a20' : '#2a1a10');
      }
      p.rect(cx - 1, ty, 2, hgt, T[1]); p.rect(cx - r, ty + 7, 2 * r, 1, T[1]); p.set(cx - 3, ty + 3, '#6a6080');
      [-1, 1].forEach(s => { const sx = s < 0 ? cx - r - 7 : cx + r + 2; p.rect(sx, ty + 1, 5, hgt - 1, G[2]); p.rect(sx, ty + 1, 1, hgt - 1, G[3]); p.rect(sx + 4, ty + 1, 1, hgt - 1, G[1]); for (let y = ty + 3; y < ty + hgt; y += 3) p.rect(sx + 1, y, 3, 1, G[1]); });
      p.rect(cx - r - 2, ty + hgt + 1, 2 * r + 4, 3, T[1]); p.rect(cx - r - 2, ty + hgt + 1, 2 * r + 4, 1, T[2]);
      for (let x = cx - r - 1; x < cx + r + 2; x++) { if (hash(x, ty) < 0.7) p.set(x, ty + hgt, hash(x, 1) < 0.5 ? P.leafG[3] : P.leafG[2]); if (hash(x, ty + 3) < 0.35) p.set(x, ty + hgt - 1, [P.pink[2], P.red[3], P.lav[3], P.amber[3]][(hash(x, 9) * 4) | 0]); }
    };
    const door = cx => {
      const dw = 10, top = H - SB - 26;
      for (let y = top - 2; y < H - 1; y++) for (let x = cx - dw - 2; x < cx + dw + 2; x++) {
        const ay = y - top, cy = dw + 2;
        const outer = ay >= cy || Math.hypot(x + 0.5 - cx, ay - cy) <= dw + 2, inner = ay >= cy || Math.hypot(x + 0.5 - cx, ay - cy) <= dw;
        if (!outer) continue;
        if (!inner || x < cx - dw || x >= cx + dw) { p.set(x, y, (((x + y) >> 2) % 2) ? P.stone[3] : P.stone[2]); continue; }
        const k = ((x - cx + dw) / 4) | 0, sx = (x - cx + dw) % 4;
        p.set(x, y, sx === 0 ? G[0] : sx === 1 ? G[3] : k % 2 ? G[2] : G[1]);
      }
      [top + 10, top + 22].forEach(y => p.rect(cx - dw, y, 2 * dw, 2, '#2a2a30'));
      p.ell(cx + 5, top + 17, 1.5, 1.5, P.amber[3]);
      p.rect(cx - dw - 3, H - 2, 2 * dw + 6, 2, P.stone[3]);
    };
    (o.upWin || []).forEach(cx => win(cx, 6));
    (o.lowWin || []).forEach(cx => win(cx, mid + 7, 12));
    if (o.door != null) door(o.door);
    return { map: p.tex(), em: em.tex() };
  }
  function gableTex(w, gh) {
    const W = Math.round(w * U), H = Math.round(gh * U), p = new Pix(W, H), T = P.timber;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) p.set(x, y, hash(x * 1.7, y * 2.3) < 0.1 ? P.plaster[1] : P.plaster[2]);
    const cx = W >> 1;
    p.rect(cx - 1, 0, 3, H, T[1]); p.rect(0, H - 3, W, 3, T[1]); p.rect(0, H - 3, W, 1, T[2]);
    p.line(4, H - 3, cx - 2, H * 0.35, T[1], 2); p.line(W - 5, H - 3, cx + 2, H * 0.35, T[1], 2);
    const wy = Math.round(H * 0.42);
    p.ell(cx, wy, 6, 6, T[0]); p.ell(cx, wy, 5, 5, '#3a3040'); p.rect(cx, wy - 5, 1, 10, T[1]); p.rect(cx - 5, wy, 10, 1, T[1]); p.set(cx - 2, wy - 2, '#6a6080');
    const t = p.tex(true); t.repeat.set(1 / w, 1 / gh); t.offset.set(0.5, 0); // UV da tampa do Extrude = coordenadas da forma
    return t;
  }

  // ================= MUNDO: layout =================
  const TERRACE_Z = -2, TERRACE_H = 1.5, STAIR = { x: 2, z0: -2, z1: 1 };
  const HOUSES = [
    { x: -8, z: -8.5, w: 7, d: 5, hW: 3.4, gh: 3.2, o: { posts: [36, 73], upWin: [18, 56, 92], lowWin: [18, 92], door: 56 }, name: 'Casa do Ferreiro', lines: ['Lá dentro, um martelo bate em ritmo constante.', 'A porta está trancada por enquanto.'] },
    { x: 8.5, z: -9, w: 6, d: 5, hW: 3.2, gh: 2.8, o: { posts: [46], upWin: [22, 72], lowWin: [76], door: 24 }, name: 'Pousada Raposa Dourada', lines: ['Um aroma de pão quente escapa pela porta.', '"Volte quando a pousada abrir, viajante!"'] },
    { x: -12.5, z: 4.5, w: 5.5, d: 5, hW: 3.2, gh: 2.8, o: { posts: [43], upWin: [21, 66], door: 66, lowWin: [21] }, name: 'Casa da Herbalista', lines: ['Ervas secas pendem da janela.', 'Ninguém atende... talvez ela esteja colhendo flores.'] },
  ];
  const FOUNTAIN = { x: 0, z: 5.2 };
  const STALL = { x: 7.5, z: 5.2 };
  const GARDEN = { x0: 11.6, x1: 17.2, z0: 1, z1: 10 };
  const BOUNDS = { x0: -17, x1: 17, z0: -14.5, z1: 10.2 };
  function groundY(x, z) {
    if (z < TERRACE_Z) return TERRACE_H;
    if (Math.abs(x) < STAIR.x && z < STAIR.z1) return TERRACE_H * (1 - (z - STAIR.z0) / (STAIR.z1 - STAIR.z0));
    return 0;
  }
  const solids = [], circles = [], interact = [];

  // ================= CHÃO: calçamento de pedras procedural (Voronoi) =================
  const G = { x0: -24, z0: -22, w: 48, h: 40 };
  function makeGround() {
    const NW = G.w * U, NH = G.h * U, c = document.createElement('canvas'); c.width = NW; c.height = NH;
    const g = c.getContext('2d'), img = g.createImageData(NW, NH), D = img.data;
    const COB = P.cob.map(rgb), MOS = P.mosaic.map(rgb), GR = P.grass.map(rgb), MORT = rgb('#2a211c'), LEAF = P.leafO.slice(2, 6).map(rgb);
    const cell = 0.42;
    for (let py = 0; py < NH; py++) for (let px = 0; px < NW; px++) {
      const x = G.x0 + (px + 0.5) / U, z = G.z0 + (py + 0.5) / U, dth = bayer(px, py) - 0.5;
      const town = Math.abs(x) < 17.8 && z > -15.6 && z < 11.4;
      const garden = x > GARDEN.x0 - 0.2 && z > GARDEN.z0 && z < GARDEN.z1 + 1.4;
      let col;
      if (town && !garden) {
        const gx = x / cell, gz = z / cell; let d1 = 9, d2 = 9, id = 0, vx = 0, vz = 0;
        const fx = Math.floor(gx), fz = Math.floor(gz);
        for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
          const cx = fx + i, cz = fz + j, ox = cx + 0.15 + 0.7 * hash(cx, cz), oz = cz + 0.15 + 0.7 * hash(cx + 17.3, cz - 3.1);
          const dx = gx - ox, dz = gz - oz, d = dx * dx + dz * dz;
          if (d < d1) { d2 = d1; d1 = d; id = hash(cx * 0.7, cz * 1.3); vx = dx; vz = dz; } else if (d < d2) d2 = d;
        }
        const edge = Math.sqrt(d2) - Math.sqrt(d1);
        if (edge < 0.1) col = MORT;
        else {
          const fr = Math.hypot(x - FOUNTAIN.x, z - FOUNTAIN.z), ang = Math.atan2(z - FOUNTAIN.z, x - FOUNTAIN.x);
          const star = fr < 1.9 + 1.4 * Math.pow(Math.abs(Math.cos(ang * 4)), 3), ring = fr > 3.7 && fr < 4.2, mosaic = fr < 4.4 && (star || ring);
          let v = (mosaic ? 1.6 : 2.2) + id * 1.6 - (vx + vz) * 1.6 + (edge < 0.2 ? -0.9 : 0) + (noise(x * 0.25, z * 0.25) - 0.5) * 1.2 + dth * 0.8;
          if (z < TERRACE_Z + 0.6 && z > TERRACE_Z - 0.2) v -= 1;
          col = mosaic ? MOS[clampi(v, MOS.length)] : COB[clampi(v, COB.length)];
        }
      } else {
        const n = noise(x * 0.4, z * 0.4) * 0.6 + noise(x * 1.6, z * 1.6) * 0.4;
        col = GR[clampi(n * 4.4 + dth, GR.length)];
        if (hash(px * 1.3, py * 0.7) < 0.012) col = LEAF[(hash(px, py) * 4) | 0];
      }
      const i = (py * NW + px) * 4; D[i] = col[0]; D[i + 1] = col[1]; D[i + 2] = col[2]; D[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c); t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
    return t;
  }

  // ================= RENDERER / CENA =================
  const canvas = $('game');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const FOG = new THREE.Color('#7d6650');
  scene.background = FOG; scene.fog = new THREE.Fog(FOG, 26, 52);

  const camera = new THREE.PerspectiveCamera(30, 1, 1, 120);
  const CAM_OFF = new THREE.Vector3(0, 12.5, 15.5), CAM_DIST = CAM_OFF.length(), PITCH = Math.atan2(CAM_OFF.y, CAM_OFF.z);
  camera.position.copy(CAM_OFF); camera.lookAt(0, 0, 0);
  const camQ = camera.quaternion.clone();

  scene.add(new THREE.HemisphereLight('#ffe2b8', '#5a4030', 0.58));
  const sun = new THREE.DirectionalLight('#ffd29a', 1.05);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -17, right: 17, top: 17, bottom: -17, near: 1, far: 70 });
  sun.shadow.bias = -0.0015; sun.shadow.normalBias = 0.04;
  scene.add(sun, sun.target);
  const SUN_OFF = new THREE.Vector3(-11, 18, -9);

  const T = { time: { value: 0 }, player: { value: new THREE.Vector3() } };
  const std = (o = {}) => new THREE.MeshPhongMaterial(Object.assign({ shininess: 0, specular: 0x000000 }, o));

  // ---------- sprites iluminados (Lambert com normal para cima = mesma luz do chão) ----------
  function spriteMat(tex, o = {}) {
    const m = new THREE.MeshLambertMaterial({ map: tex, alphaTest: 0.5 });
    if (o.amp) {
      m.onBeforeCompile = sh => {
        sh.uniforms.uTime = T.time; sh.uniforms.uPlayer = T.player;
        sh.vertexShader = 'uniform float uTime; uniform vec3 uPlayer;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
          #ifdef USE_INSTANCING
            vec4 bw = modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          #else
            vec4 bw = modelMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          #endif
          float hk = ${o.hang ? '(1.0 - uv.y)' : 'uv.y'}; hk *= hk;
          float ph = bw.x * 0.37 + bw.z * 0.53;
          float sw = sin(uTime * 1.7 + ph) * 0.6 + sin(uTime * 2.9 + ph * 1.3) * 0.25 + sin(uTime * 0.6 + bw.x * 0.1) * 0.5;
          transformed.x += sw * ${o.amp.toFixed(3)} * hk;
          ${o.push ? 'vec2 dd = bw.xz - uPlayer.xz; transformed.x += sign(dd.x) * max(0.0, 1.0 - length(dd) / 1.2) * 0.5 * uv.y;' : ''}
        `);
      };
      m.customProgramCacheKey = () => 'sw' + o.amp + !!o.push + !!o.hang;
    }
    return m;
  }
  const depthMat = tex => new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5 });
  function spriteGeo(w, h) {
    const geo = new THREE.PlaneGeometry(w, h); geo.translate(0, h / 2, 0);
    const n = geo.attributes.normal; for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0);
    return geo;
  }
  const tmpM = new THREE.Matrix4(), tmpP = new THREE.Vector3(), tmpS = new THREE.Vector3(), tmpC = new THREE.Color();
  function instanced(pix, list, o = {}) {
    if (!list.length) return null;
    const tex = pix.tex ? pix.tex() : pix, w = tex.image.width / U, h = tex.image.height / U;
    const mesh = new THREE.InstancedMesh(spriteGeo(w, h), spriteMat(tex, o), list.length);
    list.forEach((it, i) => {
      const s = it.s || 1; tmpP.set(it.x, it.y != null ? it.y : groundY(it.x, it.z), it.z); tmpS.set(s, s, s);
      tmpM.compose(tmpP, camQ, tmpS); mesh.setMatrixAt(i, tmpM);
      tmpC.setScalar(it.tint || 1); mesh.setColorAt(i, tmpC);
    });
    mesh.castShadow = !!o.shadow; mesh.receiveShadow = true; mesh.customDepthMaterial = depthMat(tex);
    mesh.frustumCulled = false; scene.add(mesh); return mesh;
  }
  function single(pix, x, z, o = {}) {
    const tex = pix.tex ? pix.tex() : pix, w = tex.image.width / U, h = tex.image.height / U;
    const m = new THREE.Mesh(spriteGeo(w, h), spriteMat(tex, o));
    m.position.set(x, o.y != null ? o.y : groundY(x, z), z); m.quaternion.copy(camQ);
    m.castShadow = o.shadow !== false; m.receiveShadow = true; m.customDepthMaterial = depthMat(tex);
    scene.add(m); return m;
  }
  const halos = [];
  function halo(x, y, z, size, color, pulse = 0, op = 0.5) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({
      map: glowTex('rgba(255,255,255,0.9)', 'rgba(255,255,255,0.22)'), color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: op }));
    m.position.set(x, y, z); m.quaternion.copy(camQ); m.renderOrder = 5; scene.add(m); halos.push({ m, pulse, ph: rnd() * 6 }); return m;
  }

  // ---------- chão (praça baixa e terraço) ----------
  const groundTex = makeGround();
  function groundPlane(x0, z0, x1, z1, y) {
    const geo = new THREE.PlaneGeometry(x1 - x0, z1 - z0); geo.rotateX(-Math.PI / 2); geo.translate((x0 + x1) / 2, y, (z0 + z1) / 2);
    const pos = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) - G.x0) / G.w, 1 - (pos.getZ(i) - G.z0) / G.h);
    const m = new THREE.Mesh(geo, std({ map: groundTex })); m.receiveShadow = true; scene.add(m); return m;
  }
  groundPlane(G.x0, TERRACE_Z, G.x0 + G.w, G.z0 + G.h, 0);
  groundPlane(G.x0, G.z0, G.x0 + G.w, TERRACE_Z, TERRACE_H);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), std({ color: P.grass[1] })); floor.rotation.x = -Math.PI / 2; floor.position.y = -0.02; scene.add(floor);

  const stoneTex = bricks(P.stone), stoneLight = bricks(['#5e544a', '#a89c88', '#c2b59e', '#d8ccb4', '#ece2cc'], 4, 8);
  function box(w, h, d, x, y, z, tex, tile = 1.5, extra = {}) {
    const geo = boxUV(new THREE.BoxGeometry(w, h, d), w, h, d, tile);
    const m = new THREE.Mesh(geo, std(Object.assign({ map: tex }, extra))); m.position.set(x, y, z);
    m.castShadow = m.receiveShadow = true; scene.add(m); return m;
  }

  // muro de arrimo + escadaria
  [[-17.8, -STAIR.x], [STAIR.x, 17.8]].forEach(([a, b]) => {
    box(b - a, TERRACE_H, 0.5, (a + b) / 2, TERRACE_H / 2, TERRACE_Z - 0.25, stoneTex);
    solids.push({ x0: a, x1: b, z0: TERRACE_Z - 0.5, z1: TERRACE_Z + 0.05 });
  });
  const steps = 6;
  for (let i = 0; i < steps; i++) {
    const top = TERRACE_H - i * (TERRACE_H / steps), d = (STAIR.z1 - STAIR.z0) / steps, z = STAIR.z0 + d * (i + 0.5);
    box(STAIR.x * 2, top, d, 0, top / 2, z, stoneLight, 1);
  }
  [-1, 1].forEach(s => {
    box(0.5, TERRACE_H + 0.15, STAIR.z1 - STAIR.z0 + 0.5, s * (STAIR.x + 0.25), (TERRACE_H + 0.15) / 2, (STAIR.z0 + STAIR.z1) / 2 - 0.25, stoneTex);
    solids.push({ x0: s > 0 ? STAIR.x : -STAIR.x - 0.5, x1: s > 0 ? STAIR.x + 0.5 : -STAIR.x, z0: STAIR.z0 - 0.5, z1: STAIR.z1 });
  });
  box(36, 2.6, 0.6, 0, TERRACE_H + 1.3, -15.3, stoneTex);

  // ---------- balaustradas ----------
  const balPts = [[0.15, 0], [0.15, 0.08], [0.09, 0.15], [0.14, 0.3], [0.17, 0.42], [0.09, 0.6], [0.07, 0.66], [0.12, 0.72], [0.12, 0.78]].map(([r, y]) => new THREE.Vector2(r, y));
  const balGeo = new THREE.LatheGeometry(balPts, 8); balGeo.translate(0, 0.1, 0);
  const balMat = std({ color: '#d8ccb4' }), railMat = std({ map: stoneLight });
  const balList = [];
  function railing(x0, z0, x1, z1, y) {
    const len = Math.hypot(x1 - x0, z1 - z0), ang = Math.atan2(z1 - z0, x1 - x0), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    [[0.16, 0.9, 0.36], [0.1, 0.05, 0.3]].forEach(([h, yy, d]) => {
      const m = new THREE.Mesh(boxUV(new THREE.BoxGeometry(len, h, d), len, h, d, 1), railMat);
      m.position.set(cx, y + yy + h / 2 - 0.02, cz); m.rotation.y = -ang; m.castShadow = m.receiveShadow = true; scene.add(m);
    });
    const n = Math.floor(len / 0.34);
    for (let i = 1; i < n; i++) { const k = i / n; balList.push([x0 + (x1 - x0) * k, y, z0 + (z1 - z0) * k]); }
    const posts = Math.max(1, Math.round(len / 3.2));
    for (let i = 0; i <= posts; i++) {
      const k = i / posts, px = x0 + (x1 - x0) * k, pz = z0 + (z1 - z0) * k;
      box(0.42, 1.15, 0.42, px, y + 0.575, pz, stoneLight, 1);
      box(0.52, 0.12, 0.52, px, y + 1.2, pz, stoneLight, 1);
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), balMat); ball.position.set(px, y + 1.38, pz); ball.castShadow = true; scene.add(ball);
    }
  }
  railing(-17.6, TERRACE_Z - 0.25, -STAIR.x - 0.3, TERRACE_Z - 0.25, TERRACE_H);
  railing(STAIR.x + 0.3, TERRACE_Z - 0.25, 17.6, TERRACE_Z - 0.25, TERRACE_H);
  railing(-17.6, 11.1, 17.6, 11.1, 0); // primeiro plano (desfocado pela profundidade de campo)
  const balInst = new THREE.InstancedMesh(balGeo, balMat, balList.length);
  balList.forEach(([x, y, z], i) => { tmpM.makeTranslation(x, y, z); balInst.setMatrixAt(i, tmpM); });
  balInst.castShadow = balInst.receiveShadow = true; scene.add(balInst);

  // ---------- casas em enxaimel com telhado verde ----------
  const roofTex = shingles(P.roof), chimneys = [];
  function makeHouse(h) {
    const fr = facade(h.w, h.hW, h.o), sd = facade(h.d, h.hW, { upWin: [Math.round(h.d * U / 2)] });
    const wm = t => std({ map: t.map, emissive: '#ffffff', emissiveMap: t.em, emissiveIntensity: 0.6 });
    const plain = std({ color: P.plaster[2] });
    const walls = new THREE.Mesh(new THREE.BoxGeometry(h.w, h.hW, h.d), [wm(sd), wm(sd), plain, plain, wm(fr), plain]);
    walls.position.set(h.x, h.hW / 2 + groundY(h.x, h.z), h.z); walls.castShadow = walls.receiveShadow = true; scene.add(walls);
    const base = walls.position.y + h.hW / 2;
    const sh = new THREE.Shape(); sh.moveTo(-h.w / 2, 0); sh.lineTo(h.w / 2, 0); sh.lineTo(0, h.gh); sh.lineTo(-h.w / 2, 0);
    const gg = new THREE.ExtrudeGeometry(sh, { depth: h.d, bevelEnabled: false }); gg.translate(0, 0, -h.d / 2);
    const gable = new THREE.Mesh(gg, [std({ map: gableTex(h.w, h.gh) }), plain]); gable.position.set(h.x, base, h.z); gable.castShadow = gable.receiveShadow = true; scene.add(gable);
    const ov = 0.55, half = h.w / 2, tanA = h.gh / half, run = half + ov, rise = h.gh + ov * tanA, L = Math.hypot(run, rise), ang = Math.atan2(rise, run), D = h.d + 0.9;
    [-1, 1].forEach(s => {
      const m = new THREE.Mesh(boxUV(new THREE.BoxGeometry(L, 0.16, D), L, 0.16, D, 1), std({ map: roofTex })); m.castShadow = m.receiveShadow = true;
      m.position.set(h.x + s * run / 2, base + h.gh - rise / 2 + 0.08, h.z); m.rotation.z = -s * ang; scene.add(m);
      [-1, 1].forEach(e => {
        const t = new THREE.Mesh(new THREE.BoxGeometry(L, 0.22, 0.12), std({ color: P.timber[1] }));
        t.position.set(h.x + s * run / 2, base + h.gh - rise / 2 + 0.1, h.z + e * D / 2); t.rotation.z = -s * ang; scene.add(t);
      });
    });
    const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.22, h.d + 1), std({ color: P.roof[1] })); ridge.position.set(h.x, base + h.gh + 0.18, h.z); scene.add(ridge);
    box(0.7, 1.6, 0.7, h.x + h.w * 0.25, base + h.gh * 0.75 + 0.6, h.z - h.d * 0.15, stoneTex, 1);
    chimneys.push([h.x + h.w * 0.25, base + h.gh * 0.75 + 1.5, h.z - h.d * 0.15]);
    solids.push({ x0: h.x - h.w / 2, x1: h.x + h.w / 2, z0: h.z - h.d / 2, z1: h.z + h.d / 2 });
    const doorX = h.x - h.w / 2 + h.o.door / U;
    interact.push({ x: doorX, z: h.z + h.d / 2 + 0.4, h: groundY(h.x, h.z) + 2.6, name: h.name, lines: h.lines });
  }
  HOUSES.forEach(makeHouse);

  // ---------- fonte central ----------
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.85, 0.6, 20), std({ map: stoneLight }));
  basin.position.set(FOUNTAIN.x, 0.3, FOUNTAIN.z); basin.castShadow = basin.receiveShadow = true; scene.add(basin);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.72, 0.12, 6, 24), std({ color: '#e0d4bc' })); rim.rotation.x = Math.PI / 2; rim.position.set(FOUNTAIN.x, 0.62, FOUNTAIN.z); scene.add(rim);
  const waterMat = new THREE.ShaderMaterial({
    uniforms: { uTime: T.time },
    vertexShader: 'varying vec2 vUv; varying vec3 vW; void main(){ vUv=uv; vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }',
    fragmentShader: `uniform float uTime; varying vec2 vUv; varying vec3 vW;
      void main(){ float r = length(vUv-0.5)*2.0;
        vec3 c = mix(vec3(0.16,0.34,0.42), vec3(0.32,0.58,0.62), floor((1.0-r)*3.0)/3.0);
        float rip = sin(r*18.0 - uTime*3.0); c = mix(c, vec3(0.75,0.9,0.85), step(0.92, rip)*0.6);
        c += vec3(1.0,0.85,0.6) * step(0.95, sin(vW.x*6.0+uTime)*sin(vW.z*8.0-uTime*1.4)) * 0.4;
        gl_FragColor = vec4(c,1.0); }` });
  const wDisk = new THREE.Mesh(new THREE.CircleGeometry(1.62, 24), waterMat); wDisk.rotation.x = -Math.PI / 2; wDisk.position.set(FOUNTAIN.x, 0.55, FOUNTAIN.z); scene.add(wDisk);
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 1.5, 10), std({ map: stoneLight })); col.position.set(FOUNTAIN.x, 1.1, FOUNTAIN.z); col.castShadow = true; scene.add(col);
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.3, 0.3, 14), std({ color: '#d8ccb4' })); bowl.position.set(FOUNTAIN.x, 1.85, FOUNTAIN.z); bowl.castShadow = true; scene.add(bowl);
  circles.push({ x: FOUNTAIN.x, z: FOUNTAIN.z, r: 1.95 });
  interact.push({ x: FOUNTAIN.x, z: FOUNTAIN.z + 2.1, h: 2.6, name: 'Fonte', lines: ['A água é cristalina e reflete o sol da tarde.', 'Dizem que quem joga uma moeda aqui encontra um parceiro fiel.'] });

  // ---------- barraca do mercado, barris e caixotes ----------
  const woodTex = planks(P.wood), S = STALL;
  box(3.4, 1, 1.2, S.x, 0.5, S.z, woodTex, 1);
  [[-1.6, -0.5], [1.6, -0.5], [-1.6, 0.6], [1.6, 0.6]].forEach(([dx, dz]) => box(0.14, 2.6, 0.14, S.x + dx, 1.3, S.z + dz, woodTex, 1));
  const aw = new Pix(16, 16); for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) aw.set(x, y, (x >> 2) % 2 ? P.plaster[3] : P.green[2]);
  const awn = new THREE.Mesh(boxUV(new THREE.BoxGeometry(3.8, 0.08, 2.2), 3.8, 0.08, 2.2, 1), std({ map: aw.tex(true) }));
  awn.position.set(S.x, 2.65, S.z + 0.15); awn.rotation.x = 0.28; awn.castShadow = awn.receiveShadow = true; scene.add(awn);
  [[P.red[3], -1.1], [P.amber[3], -0.4], ['#7fa04a', 0.3], [P.lav[2], 1.0]].forEach(([c, dx]) => { for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 5), std({ color: c })); b.position.set(S.x + dx + (i % 2) * 0.22, 1.1 + (i > 1 ? 0.12 : 0), S.z + 0.2 + (i % 2 ? 0.15 : -0.1)); b.castShadow = true; scene.add(b); } });
  solids.push({ x0: S.x - 1.8, x1: S.x + 1.8, z0: S.z - 0.7, z1: S.z + 0.7 });
  const barrelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.9, 10);
  [[S.x + 2.5, S.z - 0.3], [S.x + 2.4, S.z + 0.6], [-9.2, 6.9], [-8.6, 7.5], [5.5, -4.2]].forEach(([x, z]) => {
    const b = new THREE.Mesh(barrelGeo, std({ map: woodTex })); b.position.set(x, groundY(x, z) + 0.45, z); b.castShadow = b.receiveShadow = true; scene.add(b);
    [0.2, 0.7].forEach(y => { const r = new THREE.Mesh(new THREE.TorusGeometry(0.41, 0.03, 4, 12), std({ color: '#2a2a30' })); r.rotation.x = Math.PI / 2; r.position.set(x, groundY(x, z) + y, z); scene.add(r); });
    circles.push({ x, z, r: 0.45 });
  });
  [[-10.2, 7.4, 0.8], [S.x - 2.4, S.z + 0.2, 0.7], [-4.4, -5.0, 0.8], [11.5, -5.8, 0.7]].forEach(([x, z, s]) => {
    box(s, s, s, x, groundY(x, z) + s / 2, z, woodTex, 0.5); circles.push({ x, z, r: s * 0.6 });
  });

  // ---------- pilares com lanterna e estandartes ----------
  const bannerPix = drawBanner(), lanterns = [];
  [[-3.4, 1.6], [3.4, 1.6], [-6.5, -3.2], [6.5, -3.2]].forEach(([x, z]) => {
    const y = groundY(x, z);
    box(0.7, 0.5, 0.7, x, y + 0.25, z, stoneLight, 1);
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 2.6, 10), std({ map: stoneLight })); c.position.set(x, y + 1.8, z); c.castShadow = true; scene.add(c);
    box(0.6, 0.18, 0.6, x, y + 3.15, z, stoneLight, 1);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.42, 0.34), std({ color: P.amber[3], emissive: P.amber[2], emissiveIntensity: 0.9 })); lamp.position.set(x, y + 3.45, z); scene.add(lamp);
    const capm = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.3, 4), std({ color: P.timber[0] })); capm.position.set(x, y + 3.8, z); capm.rotation.y = Math.PI / 4; scene.add(capm);
    halo(x, y + 3.45, z + 0.05, 2.2, '#ffb45e', 0.08, 0.35);
    const L = new THREE.PointLight('#ffb45e', 0.55, 5, 2); L.position.set(x, y + 3.2, z + 0.3); scene.add(L); lanterns.push(L);
    single(bannerPix, x + 0.55, z + 0.05, { y: y + 2.95 - 34 / U, amp: 0.1, hang: true });
    circles.push({ x, z, r: 0.45 });
  });

  // ---------- vegetação ----------
  const lists = { g: [], o: [], y: [], c: [] }, bushes0 = [];
  const inTown = (x, z) => Math.abs(x) < 18.2 && z > -16 && z < 11.8;
  for (let gx = -40; gx <= 40; gx += 2.5) for (let gz = -46; gz <= 30; gz += 2.5) {
    const x = gx + (rnd() - 0.5) * 2, z = gz + (rnd() - 0.5) * 2;
    if (inTown(x, z) || z > 11.5) continue;
    const r = rnd(), it = { x, z, s: 0.9 + rnd() * 0.4, tint: Math.max(0.55, 1 - Math.max(0, Math.abs(x) - 19) * 0.03) };
    (r < 0.35 ? lists.o : r < 0.55 ? lists.y : r < 0.8 ? lists.g : lists.c).push(it);
  }
  [[-14.5, -12.5, 'o'], [-2.5, -13, 'y'], [3.5, -12.8, 'g'], [14.5, -12, 'o'], [-15.5, -4.5, 'y'], [15.6, -4, 'g'], [-16, 9.5, 'o']].forEach(([x, z, k]) => { lists[k].push({ x, z, s: 1 }); circles.push({ x, z, r: 0.5 }); });
  [[-17.6, 12.4], [17.4, 12.6]].forEach(([x, z]) => lists.c.push({ x, z, s: 1.05, tint: 0.7, y: 0 }));
  for (let x = -16; x <= 16; x += 2.2) bushes0.push({ x: x + (rnd() - 0.5), z: 12.2 + rnd() * 1.5, s: 0.9, tint: 0.75 });
  instanced(drawTree(P.leafG), lists.g, { amp: 0.1, shadow: true }); instanced(drawTree(P.leafO), lists.o, { amp: 0.1, shadow: true });
  instanced(drawTree(P.leafY), lists.y, { amp: 0.1, shadow: true }); instanced(drawCypress(), lists.c, { amp: 0.05, shadow: true });

  const tufts = [], talls = [], lav = [], roses = [], bushes = { g: [], o: [] };
  for (let x = GARDEN.x0 + 0.3; x < GARDEN.x1; x += 0.8) for (let z = GARDEN.z0 + 0.3; z < GARDEN.z1; z += 0.65)
    talls.push({ x: x + (rnd() - 0.5) * 0.4, z: z + (rnd() - 0.5) * 0.3, s: 0.85 + rnd() * 0.35 });
  for (let i = 0; i < 260; i++) { const x = -17.5 + rnd() * 35, z = -15 + rnd() * 26; if (Math.abs(x) > 16.6) tufts.push({ x, z, s: 0.9 }); }
  HOUSES.forEach(h => { const zf = h.z + h.d / 2 + 0.35, doorX = h.x - h.w / 2 + h.o.door / U; for (let x = h.x - h.w / 2 + 0.4; x < h.x + h.w / 2 - 0.3; x += 0.55) { if (Math.abs(x - doorX) < 1.1) continue; (rnd() < 0.5 ? lav : roses).push({ x, z: zf + (rnd() - 0.5) * 0.15 }); } });
  for (let z = GARDEN.z0; z < GARDEN.z1 + 1; z += 0.9) if (z < 4.6 || z > 6.4) { bushes.g.push({ x: GARDEN.x0 - 0.5, z, s: 0.8 }); circles.push({ x: GARDEN.x0 - 0.5, z, r: 0.45 }); }
  [[-16, -9], [-16, 0.5], [16.2, -1], [-13, 10], [5, 10.2], [-4.5, 10.3], [12, -13.5], [-9, -13.6]].forEach(([x, z], i) => { (i % 2 ? bushes.o : bushes.g).push({ x, z, s: 1 }); circles.push({ x, z, r: 0.7 }); });
  instanced(drawTuft(true), talls, { amp: 0.14, push: true });
  instanced(drawTuft(false), tufts, { amp: 0.08, push: true });
  instanced(drawLavender(), lav, { amp: 0.06 });
  instanced(drawRoses(), roses);
  instanced(drawBush(P.leafG), bushes.g.concat(bushes0), { amp: 0.04, shadow: true });
  instanced(drawBush(P.leafO), bushes.o, { amp: 0.04, shadow: true });

  single(drawSign(), GARDEN.x0 - 0.6, 4.2);
  circles.push({ x: GARDEN.x0 - 0.6, z: 4.2, r: 0.4 });
  interact.push({ x: GARDEN.x0 - 0.6, z: 4.4, h: 1.9, name: 'Placa', lines: ['Jardim Selvagem', 'Cuidado: monstros se escondem no mato alto!'] });

  // ---------- moradores ----------
  const npcs = [];
  function addNPC(pix, x, z, name, lines, iz) {
    const m = single(pix, x, z); npcs.push({ m, ph: rnd() * 6 }); circles.push({ x, z, r: 0.55 });
    interact.push({ x, z: iz != null ? iz : z, h: groundY(x, z) + pix.h / U + 0.4, name, lines });
  }
  addNPC(drawGuard(), 3.1, -3.0, 'Guarda Bento', ['Alto lá! Ah, é você. Bem-vindo a Vila Âmbar.', 'O terraço leva à pousada e à casa do ferreiro.', 'Fique longe do Jardim Selvagem sem um parceiro!']);
  addNPC(drawMerchant(), S.x, S.z - 0.9, 'Dona Rosa', ['Frutas frescas! Maçãs, laranjas e uvas da serra!', 'Quando a loja abrir, venda aqui o que encontrar na jornada.'], S.z + 1.1);
  addNPC(drawKid(), -2.6, 7.6, 'Tito', ['Você vai ser um domador de monstros?!', 'Eu vi uma criatura de fogo no jardim ontem! Juro!']);

  // ---------- luz: feixes de sol, poeira, folhas e fumaça ----------
  function shaftTex() {
    const c = document.createElement('canvas'); c.width = 64; c.height = 256; const g = c.getContext('2d'), img = g.createImageData(64, 256);
    for (let x = 0; x < 64; x++) { const a = (0.35 + 0.65 * noise(x * 0.18, 3)) * Math.sin(Math.PI * x / 63); for (let y = 0; y < 256; y++) { const i = (y * 64 + x) * 4; img.data[i] = img.data[i + 1] = img.data[i + 2] = 255; img.data[i + 3] = 255 * a * Math.pow(1 - y / 256, 1.3); } }
    g.putImageData(img, 0, 0); return new THREE.CanvasTexture(c);
  }
  const shafts = [], sTex = shaftTex();
  [[-12, -6], [-3, -9], [6, -3], [13, 3], [-6, 6]].forEach(([x, z], i) => {
    const geo = new THREE.PlaneGeometry(3 + i % 2, 18); geo.translate(0, -9, 0);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: sTex, color: '#ffd9a0', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0.12 }));
    m.position.set(x, 13, z); m.quaternion.copy(camQ); m.rotateZ(0.55); m.renderOrder = 6; scene.add(m); shafts.push({ m, ph: i * 1.7 });
  });
  function particles(n, mode, fn, color, size, additive = true) {
    const g = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), sd = new Float32Array(n);
    for (let i = 0; i < n; i++) { pos.set(fn(i), i * 3); sd[i] = rnd() * 100; }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('seed', new THREE.BufferAttribute(sd, 1));
    const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      uniforms: { uTime: T.time, uColor: { value: new THREE.Color(color) }, uSize: { value: size }, uMode: { value: mode } },
      vertexShader: `attribute float seed; uniform float uTime, uSize, uMode; varying float vA;
        void main(){ vec3 p = position; float t = uTime + seed;
          if (uMode < 0.5) { p += vec3(sin(t*0.3)*0.6, sin(t*0.5)*0.3, cos(t*0.25)*0.6); vA = 0.25 + 0.75*smoothstep(0.3,1.0,sin(t*1.3)*0.5+0.5); }
          else if (uMode < 1.5) { float k = fract(t*0.06); p.y -= k*8.0; p.x += sin(t*1.4)*0.7 + k*3.0; p.z += cos(t*1.1)*0.4; vA = smoothstep(0.0,0.08,k)*(1.0-smoothstep(0.85,1.0,k)); }
          else { float k = fract(t*0.9); float a = seed*6.283; p += vec3(cos(a)*k*0.95, 0.15 + k*0.45 - k*k*1.55, sin(a)*k*0.95); vA = 1.0 - k*0.6; }
          gl_PointSize = uSize; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`,
      fragmentShader: 'uniform vec3 uColor; varying float vA; void main(){ gl_FragColor = vec4(uColor, vA); }' });
    const pts = new THREE.Points(g, m); pts.frustumCulled = false; scene.add(pts);
  }
  particles(160, 0, () => [-15 + rnd() * 30, 0.4 + rnd() * 4.5, -12 + rnd() * 22], '#ffe2a8', 1.5);
  particles(46, 1, () => [-18 + rnd() * 30, 6 + rnd() * 3, -14 + rnd() * 24], '#d8742a', 2, false);
  particles(40, 2, () => [FOUNTAIN.x, 1.95, FOUNTAIN.z], '#cfeff0', 1.5);

  const puffTex = glowTex('rgba(255,255,255,0.95)', 'rgba(255,255,255,0.5)');
  const puffs = Array.from({ length: 30 }, () => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: puffTex, transparent: true, depthWrite: false, opacity: 0 }));
    m.quaternion.copy(camQ); m.visible = false; scene.add(m); return { m, life: 0 };
  });
  function puff(x, y, z, o) {
    const p = puffs.find(q => q.life <= 0); if (!p) return;
    Object.assign(p, o, { max: o.life }); p.m.position.set(x, y, z); p.m.material.color.set(o.color); p.m.visible = true;
  }

  // ---------- protagonista ----------
  const heroPix = {};
  ['front', 'back', 'side'].forEach(v => heroPix[v] = [0, 1, 2].map(f => drawHero(v, f)));
  heroPix.left = heroPix.side.map(p => p.mirror());
  const heroTex = {}; Object.keys(heroPix).forEach(k => heroTex[k] = heroPix[k].map(p => p.tex()));
  const heroMat = spriteMat(heroTex.back[0]), heroDepth = depthMat(heroTex.back[0]);
  const hero = new THREE.Mesh(spriteGeo(2, 46 / U), heroMat);
  hero.castShadow = true; hero.receiveShadow = true; hero.customDepthMaterial = heroDepth; scene.add(hero);
  const bubble = single(drawBubble(), 0, 0, { shadow: false }); bubble.visible = false; bubble.renderOrder = 10; bubble.material.depthTest = false;

  const player = { x: 0, y: 0, z: 8.6, vx: 0, vz: 0, view: 'back', frame: 0, anim: 0, dustT: 0, grassAcc: 0 };
  const input = { x: 0, z: 0, run: false };
  function collide() {
    const R = 0.36;
    circles.forEach(c => { const dx = player.x - c.x, dz = player.z - c.z, d = Math.hypot(dx, dz), m = c.r + R; if (d < m && d > 1e-4) { player.x = c.x + dx / d * m; player.z = c.z + dz / d * m; } });
    solids.forEach(b => {
      const x0 = b.x0 - R, x1 = b.x1 + R, z0 = b.z0 - R, z1 = b.z1 + R;
      if (player.x > x0 && player.x < x1 && player.z > z0 && player.z < z1) {
        const pen = [player.x - x0, x1 - player.x, player.z - z0, z1 - player.z], i = pen.indexOf(Math.min(...pen));
        if (i === 0) player.x = x0; else if (i === 1) player.x = x1; else if (i === 2) player.z = z0; else player.z = z1;
      }
    });
    player.x = Math.max(BOUNDS.x0, Math.min(BOUNDS.x1, player.x)); player.z = Math.max(BOUNDS.z0, Math.min(BOUNDS.z1, player.z));
  }

  // ---------- diálogo ----------
  const msgBox = $('msg'), txtEl = $('txt'), nameEl = $('name'), moreEl = $('more');
  let paused = false, queue = [], typing = null, after = null;
  function say(lines, name = '', done = null) { queue = [].concat(lines); nameEl.textContent = name; after = done; paused = true; nextLine(); }
  function nextLine() {
    if (!queue.length) { msgBox.style.display = 'none'; paused = false; typing = null; const cb = after; after = null; if (cb) cb(); return; }
    const full = queue.shift(); msgBox.style.display = 'block'; txtEl.textContent = ''; moreEl.style.visibility = 'hidden';
    let i = 0; typing = { full, timer: setInterval(() => { txtEl.textContent = full.slice(0, ++i); if (i >= full.length) finishTyping(); }, 24) };
  }
  function finishTyping() { if (!typing || typing.done) return; clearInterval(typing.timer); txtEl.textContent = typing.full; typing = { done: true }; moreEl.style.visibility = 'visible'; }
  function nearest() { let best = null, bd = 1.8; interact.forEach(o => { const d = Math.hypot(o.x - player.x, o.z - player.z); if (d < bd) { bd = d; best = o; } }); return best; }
  function pressA() { if (paused) { if (typing && !typing.done) finishTyping(); else nextLine(); return; } const o = nearest(); if (o) say(o.lines, o.name); }

  // ================= PÓS-PROCESSAMENTO (profundidade de campo pelo depth buffer) =================
  let rt = null;
  const post = new THREE.ShaderMaterial({
    uniforms: { tDiffuse: { value: null }, tDepth: { value: null }, res: { value: new THREE.Vector2(4, 4) }, uNear: { value: camera.near }, uFar: { value: camera.far }, uFocus: { value: CAM_DIST } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `uniform sampler2D tDiffuse, tDepth; uniform vec2 res; uniform float uNear, uFar, uFocus; varying vec2 vUv;
      float lin(float d){ float z = d * 2.0 - 1.0; return 2.0 * uNear * uFar / (uFar + uNear - z * (uFar - uNear)); }
      float coc(vec2 uv){ float z = lin(texture2D(tDepth, uv).x); float dz = z - uFocus; return clamp((abs(dz) - (dz < 0.0 ? 2.0 : 4.0)) / (dz < 0.0 ? 4.0 : 11.0), 0.0, 1.0); }
      float b2(vec2 a){ a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
      float b4(vec2 a){ return b2(0.5 * a) * 0.25 + b2(a); }
      void main(){
        vec2 px = 1.0 / res;
        vec3 c = texture2D(tDiffuse, vUv).rgb;
        float k = coc(vUv);
        if (k > 0.01) {
          vec3 acc = c; float wsum = 1.0;
          for (int i = 0; i < 20; i++) {
            float fi = float(i); float r = sqrt((fi + 0.5) / 20.0) * 4.5 * k; float a = fi * 2.39996;
            vec2 uv = vUv + vec2(cos(a), sin(a)) * px * r;
            float w = max(coc(uv), 0.15);
            acc += texture2D(tDiffuse, uv).rgb * w; wsum += w;
          }
          c = acc / wsum;
        }
        vec3 glow = vec3(0.0);
        for (int i = 0; i < 12; i++) { float a = float(i) * 0.5236, r = 2.0 + mod(float(i), 3.0) * 3.0; glow += max(texture2D(tDiffuse, vUv + vec2(cos(a), sin(a)) * px * r).rgb - 0.68, 0.0); }
        c += glow / 12.0 * vec3(1.6, 1.35, 1.0);
        float l = dot(c, vec3(0.299, 0.587, 0.114));
        c = mix(vec3(l), c, 0.9);
        c = mix(c * vec3(0.86, 0.8, 0.86) + vec3(0.035, 0.02, 0.03), c, smoothstep(0.0, 0.5, l));
        c = mix(c, c * vec3(1.1, 1.0, 0.82), smoothstep(0.45, 1.0, l));
        vec2 q = (vUv - 0.5) * vec2(1.05, 1.25); c *= 1.0 - dot(q, q) * 1.05;
        c = floor(c * 48.0 + (b4(gl_FragCoord.xy) - 0.5) * 0.5 + 0.5) / 48.0;
        gl_FragColor = vec4(c, 1.0);
      }` });
  const postScene = new THREE.Scene(), postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), post));

  const screenEl = $('screen');
  let W = 0, H = 0, PIX = 2, upp = 1 / U;
  function resize() {
    const r = screenEl.getBoundingClientRect();
    PIX = Math.max(2, Math.round(r.height / 270));
    W = Math.max(64, Math.floor(r.width / PIX)); H = Math.max(64, Math.floor(r.height / PIX));
    renderer.setSize(W, H, false);
    if (rt) rt.dispose();
    rt = new THREE.WebGLRenderTarget(W, H, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
    rt.depthTexture = new THREE.DepthTexture(W, H); rt.depthTexture.type = THREE.UnsignedIntType;
    post.uniforms.tDiffuse.value = rt.texture; post.uniforms.tDepth.value = rt.depthTexture; post.uniforms.res.value.set(W, H);
    canvas.style.width = W * PIX + 'px'; canvas.style.height = H * PIX + 'px';
    const visH = H / U;
    camera.fov = 2 * Math.atan(visH / 2 / CAM_DIST) * 180 / Math.PI; camera.aspect = W / H; camera.updateProjectionMatrix();
    upp = visH / H;
  }
  addEventListener('resize', resize); resize();

  // ================= LOOP =================
  const camT = new THREE.Vector3(player.x, 0, Math.min(6.8, player.z));
  let last = performance.now(), smokeT = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; const t = now / 1000; T.time.value = t;
    let ix = input.x, iz = input.z; const il = Math.hypot(ix, iz);
    if (paused || il < 0.01) ix = iz = 0; else { ix /= il; iz /= il; }
    const speed = input.run ? 6 : 3.4, k = 1 - Math.exp(-dt * 14);
    player.vx += (ix * speed - player.vx) * k; player.vz += (iz * speed - player.vz) * k;
    const px0 = player.x, pz0 = player.z;
    player.x += player.vx * dt; player.z += player.vz * dt; collide();
    player.y += (groundY(player.x, player.z) - player.y) * (1 - Math.exp(-dt * 20));
    const moved = Math.hypot(player.x - px0, player.z - pz0), moving = Math.hypot(player.vx, player.vz) > 0.4 && il > 0.01 && !paused;
    if (moving) {
      if (Math.abs(player.vx) > Math.abs(player.vz) * 0.9) player.view = player.vx < 0 ? 'left' : 'side';
      else player.view = player.vz > 0 ? 'front' : 'back';
      player.anim += dt * (input.run ? 10 : 6.5); player.frame = 1 + (Math.floor(player.anim) % 2);
      player.dustT -= dt;
      if (input.run && player.dustT <= 0) { player.dustT = 0.1; puff(player.x - player.vx * 0.05, player.y + 0.15, player.z + 0.1, { life: 0.5, vy: 0.6, vx: 0, grow: 1.4, size: 0.5, op: 0.5, color: '#e0cba8' }); }
      if (player.x > GARDEN.x0 && player.z > GARDEN.z0 && player.z < GARDEN.z1) { player.grassAcc += moved; if (player.grassAcc > 1.2) { player.grassAcc = 0; if (rnd() < 0.14) encounter(); } }
    } else { player.frame = 0; player.anim = 0; }
    const tex = heroTex[player.view][player.frame]; heroMat.map = tex; heroDepth.map = tex;
    const bounce = moving ? Math.abs(Math.sin(player.anim * Math.PI)) : 0, breathe = moving ? 0 : Math.sin(t * 2.6) * 0.02;
    hero.position.set(player.x, player.y + bounce * 0.08, player.z);
    hero.quaternion.copy(camQ); hero.rotateZ(-player.vx * 0.025);
    hero.scale.set(1 + bounce * 0.04 - breathe, 1 - bounce * 0.04 + breathe, 1);
    T.player.value.set(player.x, player.y, player.z);

    npcs.forEach(n => n.m.scale.set(1 - Math.sin(t * 2.2 + n.ph) * 0.02, 1 + Math.sin(t * 2.2 + n.ph) * 0.025, 1));
    shafts.forEach(s => s.m.material.opacity = 0.09 + Math.sin(t * 0.4 + s.ph) * 0.04);
    halos.forEach(h => { const s = 1 + Math.sin(t * 3 + h.ph) * h.pulse; h.m.scale.set(s, s, 1); });
    lanterns.forEach((L, i) => L.intensity = 0.55 + Math.sin(t * 9 + i * 2) * 0.05);

    smokeT -= dt;
    if (smokeT <= 0) { smokeT = 0.5; chimneys.forEach(c => puff(c[0], c[1], c[2], { life: 3.4, vy: 0.5, vx: 0.2, grow: 1.8, size: 0.6, op: 0.3, color: '#d8c8b8' })); }
    puffs.forEach(p => {
      if (p.life <= 0) return; p.life -= dt; const a = 1 - p.life / p.max;
      p.m.position.y += p.vy * dt; p.m.position.x += p.vx * dt; p.m.scale.setScalar(p.size * (1 + a * p.grow)); p.m.material.opacity = p.op * (1 - a);
      if (p.life <= 0) p.m.visible = false;
    });

    const near = paused ? null : nearest();
    bubble.visible = !!near; if (near) bubble.position.set(near.x, near.h + Math.sin(t * 5) * 0.08, near.z);

    camT.x += (player.x + player.vx * 0.25 - camT.x) * (1 - Math.exp(-dt * 5));
    camT.y += (player.y - camT.y) * (1 - Math.exp(-dt * 5));
    camT.z += (Math.min(6.8, player.z + player.vz * 0.2) - camT.z) * (1 - Math.exp(-dt * 5));
    const zs = upp / Math.sin(PITCH), sx = Math.round(camT.x / upp) * upp, sz = Math.round(camT.z / zs) * zs;
    camera.position.set(sx + CAM_OFF.x, camT.y + CAM_OFF.y, sz + CAM_OFF.z);
    sun.position.set(sx + SUN_OFF.x, SUN_OFF.y, sz + SUN_OFF.z); sun.target.position.set(sx, 0, sz); sun.target.updateMatrixWorld();

    renderer.setRenderTarget(rt); renderer.render(scene, camera);
    renderer.setRenderTarget(null); renderer.render(postScene, postCam);
    requestAnimationFrame(frame);
  }
  function encounter() {
    const f = $('flash'); f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); paused = true;
    setTimeout(() => say(['Um monstro selvagem saltou do mato alto!', '(A batalha chega na próxima etapa.)']), 700);
  }

  // ================= CONTROLES =================
  const dpad = $('dpad'), arms = [...dpad.querySelectorAll('.arm')];
  let dpadId = null; const keyDir = { x: 0, z: 0 };
  function setPad(x, z) {
    input.x = x; input.z = z;
    arms.forEach(a => a.classList.toggle('on', (a.dataset.d === 'left' && x < -0.3) || (a.dataset.d === 'right' && x > 0.3) || (a.dataset.d === 'up' && z < -0.3) || (a.dataset.d === 'down' && z > 0.3)));
  }
  function dpadMove(e) {
    const r = dpad.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    if (Math.hypot(dx, dy) < 12) return setPad(0, 0);
    const a = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4);
    setPad(Math.round(Math.cos(a) * 100) / 100, Math.round(Math.sin(a) * 100) / 100);
  }
  dpad.addEventListener('pointerdown', e => { dpadId = e.pointerId; dpad.setPointerCapture(e.pointerId); dpadMove(e); });
  dpad.addEventListener('pointermove', e => { if (e.pointerId === dpadId) dpadMove(e); });
  const dpadEnd = e => { if (e.pointerId === dpadId) { dpadId = null; setPad(keyDir.x, keyDir.z); } };
  dpad.addEventListener('pointerup', dpadEnd); dpad.addEventListener('pointercancel', dpadEnd);
  const btnA = $('btnA'), btnB = $('btnB');
  btnA.addEventListener('pointerdown', e => { e.preventDefault(); pressA(); });
  msgBox.addEventListener('pointerdown', pressA);
  btnB.addEventListener('pointerdown', e => { btnB.setPointerCapture(e.pointerId); input.run = true; btnB.classList.add('on'); });
  const bUp = () => { input.run = false; btnB.classList.remove('on'); };
  btnB.addEventListener('pointerup', bUp); btnB.addEventListener('pointercancel', bUp);
  const held = new Set();
  const KEYS = { arrowleft: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0], arrowup: [0, -1], w: [0, -1], arrowdown: [0, 1], s: [0, 1] };
  function keyUpdate() { keyDir.x = 0; keyDir.z = 0; held.forEach(k => { keyDir.x += KEYS[k][0]; keyDir.z += KEYS[k][1]; }); if (dpadId === null) setPad(keyDir.x, keyDir.z); }
  addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (KEYS[k]) { held.add(k); keyUpdate(); e.preventDefault(); }
    else if (k === 'enter' || k === ' ' || k === 'z') { if (!e.repeat) pressA(); e.preventDefault(); }
    else if (k === 'x' || k === 'shift') { input.run = true; btnB.classList.add('on'); }
  });
  addEventListener('keyup', e => { const k = e.key.toLowerCase(); if (KEYS[k]) { held.delete(k); keyUpdate(); } else if (k === 'x' || k === 'shift') bUp(); });

  window.__mq = { player, heroPix };
  setTimeout(() => say(['Bem-vindo a Vila Âmbar!', 'D-pad: andar. B: correr. A: conversar e ler.', 'Suba a escadaria para explorar o terraço.'], ''), 4600);
  requestAnimationFrame(frame);
})();
