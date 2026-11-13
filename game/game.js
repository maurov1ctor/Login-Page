// Monster Quest — protótipo 2.5D
// Técnica: sprites de pixel art (billboards) dentro de um mundo 3D (Three.js), câmera inclinada fixa,
// casas em 3D com texturas pixeladas, luz quente de entardecer + lanternas, névoa, sombras "blob",
// vento nos sprites (vertex shader), render em baixa resolução + pós-processo (tilt-shift, bloom,
// color grading, vinheta e dithering ordenado) para unir tudo num visual de pixel art coeso.
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  if (!window.THREE) { $('err').style.display = 'flex'; return; }

  // ================= PALETA (rampas com hue shift: sombras frias → luzes quentes) =================
  const P = {
    out: '#1b1225',
    grass: ['#183a3a', '#22524a', '#2f6e48', '#4b8f45', '#79b04a', '#b6d360'],
    moss:  ['#0f1d24', '#14302f', '#1c4236', '#275640'],
    leaf:  ['#14303a', '#1d4a48', '#2a6a4c', '#3f8c4a', '#6db152', '#a8d468'],
    leaf2: ['#2a1838', '#4a2348', '#7a3352', '#b04e52', '#dc7e5a', '#f4b46a'],
    pine:  ['#10263a', '#173a46', '#1f5450', '#2c6e55', '#4a9060'],
    bark:  ['#2a1a2e', '#4a2a35', '#6e3f3a', '#955a45'],
    dirt:  ['#3f2a3a', '#6a4446', '#94654f', '#bd8e62', '#ddb77a'],
    roofR: ['#2e1532', '#5c2140', '#8f3048', '#c2474c', '#e07a5c'],
    roofB: ['#151d3c', '#22335e', '#2f4f86', '#4776ad', '#78a8cf'],
    wall:  ['#4a3a52', '#7a6070', '#ad8f8a', '#d9bf9f', '#f3e2bf'],
    wood:  ['#2b1a2c', '#4f2e36', '#7a4a3e', '#a8704e'],
    stone: ['#262338', '#3e3a55', '#5d5a74', '#8a8a9c', '#b8bcc4'],
    red:   ['#3a1028', '#6e1a36', '#a82a3c', '#d8483e', '#f2804e'],
    skin:  ['#6b3b45', '#b06a5e', '#e0a083', '#f6cfa6'],
    blue:  ['#1a1d3e', '#28346a', '#3a5a9a', '#5a8ac4'],
    amber: ['#4a2a1a', '#8a4f22', '#c98a2c', '#f2c45a', '#fbe9a0'],
    pink:  ['#7a2850', '#c44a78', '#f08aa8', '#ffc6d2'],
    teal:  ['#1a3a4a', '#2a8a96', '#4fd1c5', '#b5fff0'],
    cream: ['#8a7a9a', '#cfc3d6', '#f6ead0'],
  };
  const U = 16; // pixels de textura por unidade do mundo (densidade única para tudo)

  // ================= RNG determinístico e ruído =================
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
  const smooth = t => t * t * (3 - 2 * t);
  function noise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = smooth(x - xi), yf = smooth(y - yi);
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
  }
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);
  const bayer = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];
  const rgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

  // ================= Pintor de pixel art =================
  class Pix {
    constructor(w, h) { this.w = w; this.h = h; this.d = new Array(w * h).fill(null); }
    set(x, y, c) { x = Math.floor(x); y = Math.floor(y); if (x < 0 || y < 0 || x >= this.w || y >= this.h) return; this.d[y * this.w + x] = c; }
    get(x, y) { return (x < 0 || y < 0 || x >= this.w || y >= this.h) ? null : this.d[y * this.w + x]; }
    rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); return this; }
    ell(cx, cy, rx, ry, c) {
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
        for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
          const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
          if (dx * dx + dy * dy <= 1) this.set(x, y, c);
        }
      return this;
    }
    // esfera sombreada: luz vindo de cima-esquerda, rampa do escuro para o claro
    ball(cx, cy, rx, ry, r) {
      this.ell(cx, cy, rx, ry, r[0]);
      this.ell(cx - rx * 0.08, cy - ry * 0.1, rx * 0.9, ry * 0.86, r[1]);
      if (r[2]) this.ell(cx - rx * 0.2, cy - ry * 0.24, rx * 0.66, ry * 0.6, r[2]);
      if (r[3]) this.ell(cx - rx * 0.34, cy - ry * 0.42, rx * 0.3, ry * 0.26, r[3]);
      return this;
    }
    outline(c = P.out) {
      const add = [];
      for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++)
        if (!this.get(x, y) && (this.get(x + 1, y) || this.get(x - 1, y) || this.get(x, y + 1) || this.get(x, y - 1))) add.push(x, y);
      for (let i = 0; i < add.length; i += 2) this.set(add[i], add[i + 1], c);
      return this;
    }
    canvas() {
      const c = document.createElement('canvas'); c.width = this.w; c.height = this.h;
      const g = c.getContext('2d');
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

  // ================= SPRITES =================
  function drawHero(view, f) {
    const p = new Pix(32, 40);
    const step = f === 0 ? 0 : (f === 1 ? -1 : 1);
    if (view === 'side') { p.ball(14 - step * 2, 36, 3, 2.5, P.wood); p.ball(18 + step * 2, 36, 3, 2.5, P.wood); }
    else { p.ball(12, 36 + (f === 1 ? -1 : 0), 3, 2.5, P.wood); p.ball(20, 36 + (f === 2 ? -1 : 0), 3, 2.5, P.wood); }
    if (view === 'side') p.ball(10, 28, 4, 5, P.amber.slice(1));
    p.ball(16, 29, 7, 6, P.blue);
    if (view === 'back') { p.ball(16, 28, 6, 6, P.amber.slice(1)); p.rect(12, 23, 1, 9, P.amber[0]); p.rect(20, 23, 1, 9, P.amber[0]); }
    if (view !== 'side') { p.ball(8.5, 29 + step * 0.5, 2.5, 3, P.blue); p.ball(23.5, 29 - step * 0.5, 2.5, 3, P.blue); }
    else p.ball(17 + step, 29, 2.5, 3, P.blue.slice(1));
    p.ball(16, 23, 8.5, 2.4, P.red.slice(1));                 // cachecol
    p.ball(view === 'side' ? 15 : 16, 13, 11, 10, P.red.slice(1)); // capuz
    const earX = view === 'side' ? [9, 20] : [8, 24];
    earX.forEach(x => { p.ell(x, 4.5, 2.6, 3.6, P.red[2]); p.ell(x - 0.5, 4, 1.8, 2.6, P.red[3]); if (view === 'front') p.ell(x, 5, 1, 2, P.pink[1]); });
    if (view === 'front') {
      p.ball(16, 15.5, 7.5, 6, P.skin.slice(1));
      p.rect(12, 14, 2, 3, P.out); p.set(12, 14, '#ffffff'); p.rect(19, 14, 2, 3, P.out); p.set(19, 14, '#ffffff');
      p.rect(10, 18, 2, 1, P.pink[2]); p.rect(21, 18, 2, 1, P.pink[2]); p.set(16, 18, P.skin[0]);
    } else if (view === 'side') {
      p.ball(20.5, 15.5, 5.5, 5.5, P.skin.slice(1));
      p.rect(22, 14, 2, 3, P.out); p.set(22, 14, '#ffffff'); p.rect(23, 18, 2, 1, P.pink[2]);
    } else {
      p.rect(16, 5, 1, 12, P.red[1]);
    }
    return p.outline().tex();
  }

  function drawNPC() { // "Musgo", um morador original da vila
    const p = new Pix(28, 30);
    p.ball(9, 27, 3, 2, P.wood); p.ball(19, 27, 3, 2, P.wood);
    p.ball(14, 18, 11, 9, ['#1e3a3a', '#2d5e4a', '#4b8f5a', '#86c06a']);
    [[6, 13], [20, 12], [11, 22], [18, 21]].forEach(([x, y]) => p.set(x, y, '#a8d468'));
    p.rect(9, 16, 3, 3, '#f6ead0'); p.rect(16, 16, 3, 3, '#f6ead0'); p.rect(10, 17, 2, 2, P.out); p.rect(17, 17, 2, 2, P.out);
    p.rect(13, 21, 2, 1, '#1e3a3a');
    p.rect(15, 6, 3, 4, P.cream[2]); p.ball(16.5, 5, 6, 3.5, P.red.slice(1)); p.set(14, 3, '#f6ead0'); p.set(18, 4, '#f6ead0');
    return p.outline().tex();
  }

  function drawTree(r) {
    const p = new Pix(48, 64);
    p.rect(21, 40, 6, 22, P.bark[1]); p.rect(21, 40, 2, 22, P.bark[2]); p.rect(26, 40, 1, 22, P.bark[0]);
    p.rect(18, 60, 12, 2, P.bark[1]); p.rect(17, 61, 2, 1, P.bark[0]); p.rect(29, 61, 2, 1, P.bark[0]);
    const ramp = r.slice(1, 5);
    [[24, 16, 12, 10], [16, 22, 10, 9], [33, 21, 10, 9], [17, 33, 11, 8], [31, 33, 11, 8], [24, 30, 13, 10]].forEach(b => p.ball(b[0], b[1], b[2], b[3], ramp));
    for (let i = 0; i < 26; i++) { const x = 8 + rnd() * 26, y = 7 + rnd() * 22; if (p.get(x | 0, y | 0)) p.set(x, y, r[5]); }
    for (let i = 0; i < 30; i++) { const x = 10 + rnd() * 30, y = 30 + rnd() * 12; if (p.get(x | 0, y | 0) && p.get(x | 0, y | 0) !== P.bark[1]) p.set(x, y, r[1]); }
    return p.outline().tex();
  }

  function drawPine() {
    const p = new Pix(40, 66), cx = 20, r = P.pine;
    p.rect(18, 52, 4, 12, P.bark[1]); p.rect(18, 52, 1, 12, P.bark[2]);
    [[3, 20, 8], [13, 32, 12], [24, 45, 15], [35, 57, 18]].forEach(([t, b, hw]) => {
      for (let y = t; y <= b; y++) {
        const k = (y - t) / (b - t), w = Math.max(1, Math.round(hw * (0.2 + 0.8 * k)));
        for (let x = cx - w; x <= cx + w; x++) {
          const s = (x - cx) / w;
          let i = s < -0.5 ? 3 : s < 0.05 ? 2 : s < 0.6 ? 1 : 0;
          if (y > b - 2) i = Math.max(0, i - 1);
          p.set(x, y, r[i]);
        }
      }
    });
    for (let i = 0; i < 18; i++) { const x = 8 + rnd() * 12, y = 8 + rnd() * 46; if (p.get(x | 0, y | 0)) p.set(x, y, r[4]); }
    return p.outline().tex();
  }

  function drawBush() {
    const p = new Pix(28, 18), r = P.leaf.slice(1, 5);
    p.ball(7, 11, 6, 5, r); p.ball(20, 11, 6, 5, r); p.ball(14, 9, 8, 6, r);
    [[9, 8], [17, 6], [21, 10], [12, 12]].forEach(([x, y]) => p.set(x, y, P.red[3]));
    return p.outline().tex();
  }
  function drawRock() {
    const p = new Pix(18, 13);
    p.ball(9, 7.5, 8, 5, P.stone.slice(1));
    for (let x = 4; x < 12; x++) if (rnd() < 0.6) p.set(x, 3 + (rnd() * 2 | 0), P.grass[3]);
    return p.outline().tex();
  }
  function drawTuft(tall) {
    const w = tall ? 22 : 14, h = tall ? 22 : 10, p = new Pix(w, h), n = tall ? 10 : 6;
    const r = tall ? P.grass.slice(1) : P.grass.slice(2);
    for (let i = 0; i < n; i++) {
      const x0 = 1 + Math.round(i * (w - 3) / (n - 1)), bh = tall ? 11 + rnd() * 10 : 4 + rnd() * 5, lean = (rnd() - 0.5) * (tall ? 5 : 3);
      for (let y = 0; y < bh; y++) {
        const k = y / bh, x = Math.round(x0 + lean * k * k), ci = Math.min(r.length - 1, Math.floor(k * r.length));
        p.set(x, h - 1 - y, r[ci]);
        if (tall && y < bh * 0.6) p.set(x + 1, h - 1 - y, r[Math.max(0, ci - 1)]);
      }
    }
    return tall ? p.outline('#132520').tex() : p.tex();
  }
  function drawFlower(r) {
    const p = new Pix(9, 13);
    p.rect(4, 5, 1, 8, P.grass[2]); p.set(3, 9, P.grass[3]); p.set(5, 10, P.grass[3]);
    p.ball(4.5, 4, 3.6, 3.2, r); p.set(4, 3, P.amber[3]);
    return p.outline().tex();
  }
  function drawMushroom() {
    const p = new Pix(11, 11);
    p.rect(4, 5, 3, 6, P.cream[2]); p.rect(4, 5, 1, 6, P.cream[1]);
    p.ball(5.5, 4, 5, 3.4, P.teal); p.set(3, 2, '#ffffff'); p.set(7, 3, '#ffffff');
    return p.outline().tex();
  }
  function drawLantern() {
    const p = new Pix(14, 38);
    p.rect(6, 10, 2, 27, P.wood[1]); p.rect(6, 10, 1, 27, P.wood[2]); p.rect(4, 35, 6, 2, P.wood[0]);
    p.rect(3, 8, 8, 2, P.wood[0]);
    p.rect(3, 11, 8, 8, P.wood[0]); p.rect(4, 12, 6, 6, P.amber[3]); p.rect(5, 13, 3, 3, P.amber[4]);
    p.rect(2, 10, 10, 1, P.stone[1]); p.rect(4, 7, 6, 1, P.stone[2]);
    return p.outline().tex();
  }
  function drawSign() {
    const p = new Pix(20, 20);
    p.rect(4, 10, 2, 10, P.wood[1]); p.rect(14, 10, 2, 10, P.wood[1]);
    p.rect(2, 3, 16, 9, P.wood[3]); p.rect(2, 10, 16, 2, P.wood[2]);
    p.rect(4, 5, 11, 1, P.wood[1]); p.rect(4, 8, 8, 1, P.wood[1]);
    return p.outline().tex();
  }
  function drawStump() {
    const p = new Pix(16, 12);
    p.rect(2, 4, 12, 7, P.bark[2]); p.rect(2, 4, 3, 7, P.bark[3]); p.rect(11, 4, 3, 7, P.bark[1]);
    p.ell(8, 4, 6, 2.2, P.amber[2]); p.ell(8, 4, 3.5, 1.2, P.wood[3]); p.set(8, 4, P.wood[2]);
    return p.outline().tex();
  }
  function drawLogs() {
    const p = new Pix(26, 12);
    [[3, 8], [8, 10], [15, 10], [21, 8], [12, 5]].forEach(([x, y]) => p.ball(x, y, 3.2, 2.4, P.stone.slice(1)));
    p.rect(6, 6, 14, 3, P.bark[2]); p.rect(6, 6, 14, 1, P.bark[3]); p.rect(9, 4, 9, 2, P.bark[1]);
    return p.outline().tex();
  }
  function drawFlame(k) {
    const p = new Pix(16, 22);
    const o = [0, 1, -1][k];
    p.ell(8, 15, 6.5, 6, P.red[3]); p.ell(8 + o, 9, 4, 8, P.red[3]); p.ell(5 - o, 10, 2, 4, P.red[4]);
    p.ell(8, 15, 4.5, 4.5, P.amber[3]); p.ell(8 + o * 0.5, 11, 2.5, 5, P.amber[3]); p.ell(8, 16, 2.5, 3, P.amber[4]);
    return p.tex();
  }
  function drawBubble() {
    const p = new Pix(13, 14);
    p.ball(6.5, 6.5, 6, 6, P.red.slice(1)); p.set(6, 13, P.red[2]);
    ['.###.', '#...#', '#####', '#...#', '#...#'].forEach((row, y) => [...row].forEach((ch, x) => { if (ch === '#') p.set(4 + x, 4 + y, '#f6ead0'); }));
    return p.outline().tex();
  }
  function glowTex(inner, outer) {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, inner); gr.addColorStop(0.35, outer); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }

  // ================= CHÃO pintado em pixel art (com dithering) =================
  const G = { x0: -24, z0: -26, w: 48, h: 48 };
  const doors = [];
  const HOUSES = [
    { x: -9, z: -5, w: 5, d: 4, roof: P.roofR, name: 'Casa da Ferreira' },
    { x: 9, z: -6, w: 5, d: 4, roof: P.roofB, name: 'Casa do Velho Pescador' },
    { x: -10, z: 9, w: 4, d: 3.5, roof: P.roofR, name: 'Celeiro' },
  ];
  HOUSES.forEach(h => doors.push([h.x, h.z + h.d / 2 + 0.2]));
  const POND = { x: 9, z: 8, rx: 3.6, rz: 2.5 };
  const MEADOW = { x0: -10, x1: 10, z0: -21, z1: -12 };
  const pathX = z => Math.sin(z * 0.15) * 1.4;
  function segDist(px, pz, ax, az, bx, bz) {
    const vx = bx - ax, vz = bz - az, t = Math.max(0, Math.min(1, ((px - ax) * vx + (pz - az) * vz) / (vx * vx + vz * vz)));
    return Math.hypot(px - ax - vx * t, pz - az - vz * t);
  }
  function pathDist(x, z) {
    let d = z > -27 && z < 20 ? Math.abs(x - pathX(z)) : 99;
    if (x > -19 && x < 19) d = Math.min(d, Math.abs(z - 3 - Math.sin(x * 0.2) * 0.7));
    doors.forEach(([dx, dz]) => d = Math.min(d, segDist(x, z, dx, dz, dx, 3)));
    return d;
  }
  const outsideClearing = (x, z) => Math.max(Math.abs(x) - 19, z - 16.5, -21.5 - z);

  function makeGround() {
    const N = G.w * U, c = document.createElement('canvas'); c.width = c.height = N;
    const g = c.getContext('2d'), img = g.createImageData(N, N), D = img.data;
    const GR = P.grass.slice(1).map(rgb), DI = P.dirt.slice(1).map(rgb), MO = P.moss.map(rgb), MUD = rgb('#1d2238');
    for (let py = 0; py < N; py++) for (let px = 0; px < N; px++) {
      const x = G.x0 + (px + 0.5) / U, z = G.z0 + (py + 0.5) / U;
      const n = noise(x * 0.35, z * 0.35) * 0.6 + noise(x * 1.3, z * 1.3) * 0.3 + noise(x * 4.1, z * 4.1) * 0.1;
      const dth = bayer(px, py) - 0.5;
      let col;
      const pondD = ((x - POND.x) / (POND.rx + 0.3)) ** 2 + ((z - POND.z) / (POND.rz + 0.3)) ** 2;
      const edge = pathDist(x, z) - (1.05 + (noise(x * 2, z * 2) - 0.5) * 0.5);
      const fire = Math.hypot(x, z) - (2.3 + (noise(x * 1.7, z * 1.7) - 0.5) * 0.6);
      const out = outsideClearing(x, z);
      if (pondD < 1) col = MUD;
      else if ((edge < 0 || fire < 0) && out < 0) {
        const e = Math.min(edge, fire);
        let v = 0.45 + n * 0.55 - (e > -0.35 ? 0.3 : 0);
        col = DI[Math.max(0, Math.min(DI.length - 1, Math.floor(v * DI.length + dth)))];
        if (hash(px, py) < 0.006) col = DI[0];
      } else {
        let v = n * 0.95 + 0.08;
        if (edge < 0.4) v -= 0.18;
        if (pondD < 1.35) v -= 0.25;
        if (x > MEADOW.x0 && x < MEADOW.x1 && z > MEADOW.z0 && z < MEADOW.z1) v -= 0.2;
        if (out > -2) {
          const k = Math.min(1, (out + 2) / 6);
          v = v * (1 - k) + (noise(x * 0.8, z * 0.8) * 0.9) * k;
          col = (k > 0.5 ? MO : GR)[Math.max(0, Math.min(3, Math.floor(v * 4 + dth)))];
        } else col = GR[Math.max(0, Math.min(GR.length - 1, Math.floor(v * GR.length + dth)))];
        const hs = hash(px * 1.7, py * 0.9);
        if (out < -1 && hs < 0.003) col = rgb(hs < 0.0015 ? P.pink[2] : P.cream[2]);
      }
      const i = (py * N + px) * 4; D[i] = col[0]; D[i + 1] = col[1]; D[i + 2] = col[2]; D[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c); t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
    return t;
  }

  // ================= RENDERER / CENA =================
  const canvas = $('game');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  const scene = new THREE.Scene();
  const FOG = new THREE.Color('#2a2140');
  scene.background = FOG; scene.fog = new THREE.Fog(FOG, 20, 40);

  const camera = new THREE.PerspectiveCamera(40, 1, 1, 120);
  const CAM_OFF = new THREE.Vector3(0, 16, 13), CAM_DIST = CAM_OFF.length();
  camera.position.copy(CAM_OFF); camera.lookAt(0, 0, 0);
  const camQ = camera.quaternion.clone();
  const PITCH = Math.atan2(CAM_OFF.y, CAM_OFF.z);

  // luzes: céu de entardecer (lilás) + sol baixo e quente + lanternas
  scene.add(new THREE.HemisphereLight('#b9a6ff', '#3a2b3f', 0.62));
  const sun = new THREE.DirectionalLight('#ffc98a', 0.85);
  sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -18, right: 18, top: 18, bottom: -18, near: 1, far: 60 });
  sun.shadow.bias = -0.002;
  scene.add(sun, sun.target);

  const T = { time: { value: 0 }, player: { value: new THREE.Vector3() } };

  // material com vento (vertex shader) para sprites e instâncias
  function spriteMat(tex, amp = 0, push = false) {
    const m = new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide });
    if (amp > 0) {
      m.onBeforeCompile = sh => {
        sh.uniforms.uTime = T.time; sh.uniforms.uPlayer = T.player;
        sh.vertexShader = 'uniform float uTime; uniform vec3 uPlayer;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
          #ifdef USE_INSTANCING
            vec4 bw = modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          #else
            vec4 bw = modelMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          #endif
          float hgt = uv.y * uv.y;
          float ph = bw.x * 0.37 + bw.z * 0.53;
          float sw = sin(uTime * 1.7 + ph) * 0.6 + sin(uTime * 2.9 + ph * 1.3) * 0.25 + sin(uTime * 0.6 + bw.x * 0.1) * 0.5;
          transformed.x += sw * ${amp.toFixed(3)} * hgt;
          ${push ? 'vec2 dd = bw.xz - uPlayer.xz; transformed.x += sign(dd.x) * max(0.0, 1.0 - length(dd) / 1.2) * 0.5 * uv.y;' : ''}
        `);
      };
      m.customProgramCacheKey = () => 'sway' + amp + push;
    }
    return m;
  }

  const lights = []; // {x,z,color:[r,g,b],r,i}
  function lightAt(x, z, out) {
    const o = out || new THREE.Color();
    o.setRGB(0.8, 0.76, 0.88);
    lights.forEach(L => {
      const k = Math.max(0, 1 - Math.hypot(x - L.x, z - L.z) / L.r);
      const s = k * k * L.i * (L.flick || 1);
      o.r += L.c[0] * s; o.g += L.c[1] * s; o.b += L.c[2] * s;
    });
    const dark = Math.max(0, Math.min(0.55, (outsideClearing(x, z) + 1) * 0.08));
    o.multiplyScalar(1 - dark);
    o.r = Math.min(o.r, 1.35); o.g = Math.min(o.g, 1.25); o.b = Math.min(o.b, 1.2);
    return o;
  }

  // billboards instanciados (uma draw call por tipo)
  const tmpM = new THREE.Matrix4(), tmpP = new THREE.Vector3(), tmpS = new THREE.Vector3(), tmpC = new THREE.Color();
  function instanced(tex, list, amp = 0, push = false) {
    if (!list.length) return null;
    const w = tex.image.width / U, h = tex.image.height / U;
    const geo = new THREE.PlaneGeometry(w, h); geo.translate(0, h / 2, 0);
    const mesh = new THREE.InstancedMesh(geo, spriteMat(tex, amp, push), list.length);
    list.forEach((o, i) => {
      const s = o.s || 1;
      tmpP.set(o.x, o.y || 0, o.z); tmpS.set(o.flip ? -s : s, s, s);
      tmpM.compose(tmpP, camQ, tmpS); mesh.setMatrixAt(i, tmpM);
      lightAt(o.x, o.z, tmpC); if (o.tint) tmpC.multiplyScalar(o.tint);
      mesh.setColorAt(i, tmpC);
    });
    mesh.frustumCulled = false;
    scene.add(mesh); return mesh;
  }
  function single(tex, x, z, y = 0) {
    const w = tex.image.width / U, h = tex.image.height / U;
    const geo = new THREE.PlaneGeometry(w, h); geo.translate(0, h / 2, 0);
    const m = new THREE.Mesh(geo, spriteMat(tex)); m.position.set(x, y, z); m.quaternion.copy(camQ);
    scene.add(m); return m;
  }

  // sombra "blob" (como em Cult of the Lamb)
  const blobTex = glowTex('rgba(20,10,30,0.75)', 'rgba(20,10,30,0.45)');
  const blobGeo = new THREE.PlaneGeometry(1, 1); blobGeo.rotateX(-Math.PI / 2);
  const blobMat = new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false });
  function blob(x, z, sx, sz) { const b = new THREE.Mesh(blobGeo, blobMat); b.position.set(x, 0.02, z); b.scale.set(sx, 1, sz || sx * 0.6); b.renderOrder = 1; scene.add(b); return b; }

  // brilhos aditivos (lanternas, janelas, cogumelos)
  const halos = [];
  function halo(x, y, z, size, color, pulse = 0) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({
      map: glowTex('rgba(255,255,255,0.9)', 'rgba(255,255,255,0.25)'), color, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, fog: false, opacity: 0.55 }));
    m.position.set(x, y, z); m.quaternion.copy(camQ); m.renderOrder = 5; scene.add(m);
    halos.push({ m, base: size, pulse, ph: rnd() * 6 }); return m;
  }

  // ---------- chão ----------
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(G.w, G.h),
    new THREE.MeshPhongMaterial({ map: makeGround(), shininess: 0, specular: 0x000000 }));
  ground.rotation.x = -Math.PI / 2; ground.position.set(G.x0 + G.w / 2, 0, G.z0 + G.h / 2); ground.receiveShadow = true;
  scene.add(ground);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshPhongMaterial({ color: P.moss[1], shininess: 0, specular: 0x000000 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.01; scene.add(floor);

  // ---------- água ----------
  const water = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.ShaderMaterial({
    uniforms: { uTime: T.time },
    vertexShader: 'varying vec2 vUv; varying vec3 vW; void main(){ vUv=uv; vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }',
    fragmentShader: `uniform float uTime; varying vec2 vUv; varying vec3 vW;
      void main(){
        float r = length(vUv - 0.5) * 2.0;
        float wob = sin(atan(vUv.y-0.5, vUv.x-0.5)*7.0 + uTime*1.2)*0.03;
        vec3 deep = vec3(0.08,0.10,0.24), mid = vec3(0.12,0.26,0.45), sh = vec3(0.20,0.47,0.62), foam = vec3(0.78,0.94,0.90);
        float b = floor((r + wob) * 4.0) / 4.0;
        vec3 c = mix(deep, mid, smoothstep(0.2, 0.6, b));
        c = mix(c, sh, step(0.74, b));
        float rip = sin((vW.x * 1.3 + vW.z * 2.6) * 3.0 - uTime * 1.6) * sin(vW.x * 2.1 - uTime * 0.7);
        c = mix(c, vec3(0.55,0.80,0.85), step(0.86, rip) * 0.8);
        float sky = step(0.93, sin(vW.x * 5.0 + uTime) * sin(vW.z * 7.0 - uTime * 1.3));
        c += vec3(1.0,0.8,0.55) * sky * 0.35;
        c = mix(c, foam, step(0.93, r + wob));
        gl_FragColor = vec4(c, 1.0);
      }` }));
  water.rotation.x = -Math.PI / 2; water.scale.set(POND.rx, POND.rz, 1); water.position.set(POND.x, 0.03, POND.z); scene.add(water);
  const pad = new THREE.Mesh(new THREE.CircleGeometry(0.35, 10), new THREE.MeshBasicMaterial({ color: '#4b8f45' }));
  [[7.6, 7.4], [10.2, 8.9], [9.4, 6.6]].forEach(([x, z], i) => { const m = pad.clone(); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.05, z); m.scale.setScalar(0.8 + i * 0.2); scene.add(m); });

  // ---------- casas 3D com texturas em pixel art ----------
  function wallTex(w, kind) {
    const W = Math.round(w * U), H = 36, p = new Pix(W, H), em = new Pix(W, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (y >= H - 5) p.set(x, y, ((x + (y % 2) * 4) % 8 === 0 || y === H - 5) ? P.stone[1] : P.stone[2 + (hash(x, y) < 0.3 ? 1 : 0)]);
      else p.set(x, y, hash(x * 3, y * 7) < 0.07 ? P.wall[2] : (y < 3 ? P.wall[2] : P.wall[3]));
    }
    p.rect(0, 0, W, 2, P.wood[1]); p.rect(0, H - 6, W, 1, P.wood[0]); p.rect(0, 0, 2, H - 5, P.wood[1]); p.rect(W - 2, 0, 2, H - 5, P.wood[1]);
    const win = x => {
      const y = 9;
      p.rect(x - 1, y - 1, 12, 12, P.wood[0]); p.rect(x, y, 10, 10, P.amber[3]); p.rect(x + 1, y + 1, 3, 3, P.amber[4]);
      p.rect(x + 4, y, 2, 10, P.wood[1]); p.rect(x, y + 4, 10, 2, P.wood[1]); p.rect(x - 2, y + 10, 14, 2, P.wood[2]);
      em.rect(x, y, 10, 10, '#ffb050'); em.rect(x + 4, y, 2, 10, '#000000'); em.rect(x, y + 4, 10, 2, '#000000');
    };
    if (kind === 'front') {
      const dx = Math.round(W / 2 - 6);
      p.rect(dx - 1, 11, 14, 20, P.wood[0]); p.rect(dx, 12, 12, 19, P.wood[2]); p.rect(dx + 4, 12, 1, 19, P.wood[1]); p.rect(dx + 8, 12, 1, 19, P.wood[1]);
      p.rect(dx + 3, 14, 6, 3, P.amber[3]); em.rect(dx + 3, 14, 6, 3, '#ff9a40'); p.set(dx + 9, 22, P.amber[4]);
      if (W >= 70) { win(6); win(W - 16); } else win(3);
    } else if (kind === 'side') win(Math.round(W / 2 - 5));
    return { map: p.tex(), em: em.tex() };
  }
  function shingles(r) {
    const p = new Pix(16, 16);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const row = y >> 2, yy = y & 3, xx = (x + (row % 2) * 4) & 7;
      let c = r[2];
      if (yy === 0) c = r[3]; if (yy === 3) c = r[1]; if (xx === 0) c = r[0];
      if (yy === 3 && (xx === 1 || xx === 7)) c = r[0];
      p.set(x, y, c);
    }
    return p.tex(true);
  }
  const solids = []; // caixas de colisão
  function makeHouse(h) {
    const mat = t => new THREE.MeshPhongMaterial({ map: t.map, emissive: '#ffffff', emissiveMap: t.em, shininess: 0, specular: 0x000000 });
    const f = wallTex(h.w, 'front'), s = wallTex(h.d, 'side'), b = wallTex(h.w, 'back'), s2 = wallTex(h.d, 'side');
    const top = new THREE.MeshPhongMaterial({ color: P.wall[2] });
    const walls = new THREE.Mesh(new THREE.BoxGeometry(h.w, 2.25, h.d), [mat(s2), mat(s), top, top, mat(f), mat(b)]);
    walls.position.set(h.x, 1.125, h.z); walls.castShadow = walls.receiveShadow = true; scene.add(walls);
    const ov = 0.45, rh = 1.9, shape = new THREE.Shape();
    shape.moveTo(-(h.d / 2 + ov), 0); shape.lineTo(h.d / 2 + ov, 0); shape.lineTo(0, rh); shape.lineTo(-(h.d / 2 + ov), 0);
    const rg = new THREE.ExtrudeGeometry(shape, { depth: h.w + 0.6, bevelEnabled: false });
    rg.translate(0, 0, -(h.w + 0.6) / 2); rg.rotateY(Math.PI / 2);
    const roofM = new THREE.Mesh(rg, new THREE.MeshPhongMaterial({ map: shingles(h.roof), shininess: 0, specular: 0x000000 }));
    roofM.position.set(h.x, 2.2, h.z); roofM.castShadow = roofM.receiveShadow = true; scene.add(roofM);
    const ridge = new THREE.Mesh(new THREE.BoxGeometry(h.w + 0.7, 0.18, 0.22), new THREE.MeshPhongMaterial({ color: P.wood[1] }));
    ridge.position.set(h.x, 2.2 + rh, h.z); scene.add(ridge);
    const ch = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.3, 0.55), new THREE.MeshPhongMaterial({ map: shingles(P.stone.slice(0, 4)) }));
    ch.position.set(h.x + h.w * 0.28, 3.4, h.z - 0.5); ch.castShadow = true; scene.add(ch);
    chimneys.push([h.x + h.w * 0.28, 4.1, h.z - 0.5]);
    solids.push({ x0: h.x - h.w / 2, x1: h.x + h.w / 2, z0: h.z - h.d / 2, z1: h.z + h.d / 2 });
    halo(h.x, 1.5, h.z + h.d / 2 + 0.05, 2.2, '#ffa040', 0.08);
  }
  const chimneys = [];
  HOUSES.forEach(makeHouse);

  // ---------- vegetação e objetos ----------
  const circles = []; // colisores circulares
  const inHouse = (x, z, m = 1) => solids.some(b => x > b.x0 - m && x < b.x1 + m && z > b.z0 - m && z < b.z1 + m + 0.6);
  const inPond = (x, z, m = 0) => ((x - POND.x) / (POND.rx + m)) ** 2 + ((z - POND.z) / (POND.rz + m)) ** 2 < 1;
  const busy = (x, z) => inHouse(x, z) || inPond(x, z, 0.8) || pathDist(x, z) < 1.6 || Math.hypot(x, z) < 3.2;

  const treeTex = [drawTree(P.leaf), drawTree(P.leaf), drawTree(P.leaf2)], pineTex = drawPine();
  const treeLists = [[], [], []], pines = [];
  for (let gx = -40; gx <= 40; gx += 2.3) for (let gz = -44; gz <= 34; gz += 2.3) {
    const x = gx + (rnd() - 0.5) * 1.8, z = gz + (rnd() - 0.5) * 1.8;
    const out = outsideClearing(x, z);
    if (out < -0.5 && !(out < -0.5 && rnd() < 0.035 && !busy(x, z) && !(x > MEADOW.x0 - 1 && x < MEADOW.x1 + 1 && z < MEADOW.z1 + 1))) continue;
    if (Math.abs(x - pathX(z)) < 1.8 && z < -20) continue; // a trilha norte segue pela floresta
    const s = 0.85 + rnd() * 0.45, tint = z > 17 ? 0.55 : (out > 4 ? 0.85 : 1);
    const o = { x, z, s, flip: rnd() < 0.5, tint };
    const roll = rnd();
    if (roll < 0.38) pines.push(o); else treeLists[roll < 0.82 ? (rnd() < 0.5 ? 0 : 1) : 2].push(o);
    circles.push({ x, z, r: 0.45 * s });
    if (out > -6 && out < 8) blob(x, z + 0.1, 2.2 * s, 1.1 * s);
  }
  treeLists.forEach((l, i) => instanced(treeTex[i], l, 0.12));
  instanced(pineTex, pines, 0.09);

  const tufts = [], talls = [], flowers = [[], [], []], bushes = [], rocks = [], mush = [];
  for (let i = 0; i < 900; i++) {
    const x = -20 + rnd() * 40, z = -22 + rnd() * 39;
    if (busy(x, z) && rnd() < 0.85) continue;
    if (inPond(x, z, 0.2) || inHouse(x, z, 0.2) || pathDist(x, z) < 1.1) continue;
    tufts.push({ x, z, s: 0.8 + rnd() * 0.5, flip: rnd() < 0.5 });
  }
  for (let x = MEADOW.x0 + 0.3; x < MEADOW.x1; x += 0.85) for (let z = MEADOW.z0 + 0.3; z < MEADOW.z1; z += 0.7) {
    const jx = x + (rnd() - 0.5) * 0.5, jz = z + (rnd() - 0.5) * 0.4;
    if (Math.abs(jx - pathX(jz)) < 1.1) continue;
    talls.push({ x: jx, z: jz, s: 0.85 + rnd() * 0.35, flip: rnd() < 0.5 });
  }
  for (let i = 0; i < 160; i++) {
    const x = -18 + rnd() * 36, z = -20 + rnd() * 36;
    if (busy(x, z) || inPond(x, z, 0.5)) continue;
    flowers[i % 3].push({ x, z, s: 1, flip: rnd() < 0.5 });
  }
  for (let i = 0; i < 70; i++) {
    const a = rnd() * Math.PI * 2, x = Math.cos(a) * (17 + rnd() * 3), z = Math.sin(a) * (17 + rnd() * 3) - 2;
    if (outsideClearing(x, z) < -3 || z > 15) continue;
    (rnd() < 0.6 ? bushes : rocks).push({ x, z, s: 0.9 + rnd() * 0.4, flip: rnd() < 0.5 });
    if (rnd() < 0.3) mush.push({ x: x + 0.8, z: z + 0.5, s: 1 });
  }
  [[POND.x - 3.9, POND.z + 0.5], [POND.x + 3.8, POND.z - 0.6], [POND.x - 1.5, POND.z + 2.7], [POND.x + 2, POND.z + 2.6], [POND.x, POND.z - 2.8]].forEach(([x, z]) => rocks.push({ x, z, s: 0.7 + rnd() * 0.4 }));
  rocks.forEach(o => { circles.push({ x: o.x, z: o.z, r: 0.45 * o.s }); blob(o.x, o.z + 0.05, 1.2 * o.s); });
  bushes.forEach(o => { circles.push({ x: o.x, z: o.z, r: 0.7 * o.s }); blob(o.x, o.z + 0.05, 1.8 * o.s); });
  instanced(drawTuft(false), tufts, 0.08, true);
  instanced(drawTuft(true), talls, 0.14, true);
  [P.pink.slice(0, 4), P.cream, P.amber.slice(1)].forEach((r, i) => instanced(drawFlower(r), flowers[i], 0.06, true));
  instanced(drawBush(), bushes, 0.05);
  instanced(drawRock(), rocks);
  instanced(drawMushroom(), mush);
  mush.forEach(o => halo(o.x, 0.35, o.z, 1.3, '#4fd1c5', 0.25));

  // fogueira no centro da vila
  const FIRE = { x: 0, z: 0 };
  single(drawLogs(), 0, 0.1);
  const flames = [0, 1, 2].map(drawFlame);
  const flame = single(flames[0], 0, 0.15, 0.2); flame.material.fog = false;
  halo(0, 0.9, 0.2, 4.5, '#ff8a3a', 0.15);
  circles.push({ x: 0, z: 0, r: 1.0 });
  const fireLight = new THREE.PointLight('#ff8a3a', 1.5, 8, 2); fireLight.position.set(0, 1.2, 0.3); scene.add(fireLight);
  lights.push({ x: 0, z: 0, c: [1, 0.5, 0.2], r: 6, i: 0.38 });
  const stumpTex = drawStump();
  [[-2.4, -1.2], [2.4, -1.1], [-2.1, 1.7], [2.2, 1.8]].forEach(([x, z]) => { single(stumpTex, x, z); blob(x, z + 0.05, 1.1); circles.push({ x, z, r: 0.45 }); });

  // lanternas
  const lanternTex = drawLantern();
  [[2.4, -9], [-2.2, 6.5], [6.5, 1.7], [-6.8, 1.6]].forEach(([x, z]) => {
    single(lanternTex, x, z); blob(x, z + 0.05, 0.8);
    const L = new THREE.PointLight('#ffb45e', 0.85, 6, 2); L.position.set(x, 1.6, z + 0.2); scene.add(L);
    halo(x, 1.55, z + 0.05, 2.6, '#ffb45e', 0.1);
    lights.push({ x, z, c: [1, 0.66, 0.32], r: 4.5, i: 0.3 });
    circles.push({ x, z, r: 0.3 });
  });
  // placas
  const signTex = drawSign();
  const interact = [];
  const signs = [
    { x: 2.6, z: -11.2, lines: ['Rota 1 — Campos Sussurrantes.', 'Monstros selvagens vivem na grama alta. Ande com cuidado!'] },
    { x: -2.8, z: 2.0, lines: ['Vila Brasa', 'A fogueira nunca se apaga. Aqui todo viajante é bem-vindo.'] },
  ];
  signs.forEach(s => { single(signTex, s.x, s.z); blob(s.x, s.z + 0.05, 1.2); circles.push({ x: s.x, z: s.z, r: 0.5 }); interact.push({ x: s.x, z: s.z, h: 1.5, name: 'Placa', lines: s.lines }); });
  HOUSES.forEach((h, i) => interact.push({ x: h.x, z: h.z + h.d / 2 + 0.3, h: 2.7, name: h.name,
    lines: [['A porta está trancada. Dá para ouvir um martelo batendo lá dentro.'], ['Ninguém atende. Tem cheiro de peixe assado no ar...'], ['O celeiro está fechado. Algo se mexe no feno!']][i] }));
  interact.push({ x: FIRE.x, z: FIRE.z, h: 1.8, name: 'Fogueira', lines: ['As chamas dançam e estalam.', 'Você se sente aquecido e pronto para a aventura.'] });

  // NPC
  const npcTex = drawNPC();
  const NPC = { x: 3.4, z: 0.6 };
  const npc = single(npcTex, NPC.x, NPC.z); blob(NPC.x, NPC.z + 0.05, 1.4);
  circles.push({ x: NPC.x, z: NPC.z, r: 0.6 });
  interact.push({ x: NPC.x, z: NPC.z, h: 2.3, name: 'Musgo', lines: ['Ah, um rosto novo na Vila Brasa!', 'Eu sou o Musgo. Cuido da fogueira há muitas estações.', 'Se procura monstros, siga a trilha ao norte até os Campos Sussurrantes.'] });

  // vaga-lumes e brasas (partículas no shader)
  function particles(n, spread, fn, color, size) {
    const g = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), sd = new Float32Array(n);
    for (let i = 0; i < n; i++) { const p = fn(i); pos.set(p, i * 3); sd[i] = rnd() * 100; }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('seed', new THREE.BufferAttribute(sd, 1));
    const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime: T.time, uColor: { value: new THREE.Color(color) }, uSize: { value: size }, uMode: { value: spread } },
      vertexShader: `attribute float seed; uniform float uTime, uSize, uMode; varying float vA;
        void main(){
          vec3 p = position; float t = uTime + seed;
          if (uMode < 0.5) { p += vec3(sin(t*0.7)*0.8, sin(t*1.3)*0.35, cos(t*0.5)*0.8); vA = smoothstep(0.2, 1.0, sin(t*2.3)*0.5+0.5); }
          else { float k = fract(t*0.35); p += vec3(sin(t*3.0)*0.25*k, k*3.2, cos(t*2.0)*0.2*k); vA = 1.0 - k; }
          gl_PointSize = uSize; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }`,
      fragmentShader: 'uniform vec3 uColor; varying float vA; void main(){ gl_FragColor = vec4(uColor * vA, vA); }' });
    const pts = new THREE.Points(g, m); pts.frustumCulled = false; scene.add(pts);
  }
  particles(90, 0, () => { const a = rnd() * Math.PI * 2, r = 6 + rnd() * 14; return [Math.cos(a) * r, 0.6 + rnd() * 2.2, Math.sin(a) * r - 3]; }, '#e8ff9a', 2);
  particles(18, 1, () => [FIRE.x + (rnd() - 0.5) * 0.6, 0.6, FIRE.z + 0.2], '#ffb050', 2);

  // fumaça das chaminés e poeira dos passos (pool de sprites)
  const puffTex = glowTex('rgba(255,255,255,0.95)', 'rgba(255,255,255,0.5)');
  const puffs = Array.from({ length: 26 }, () => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: puffTex, transparent: true, depthWrite: false, opacity: 0 }));
    m.quaternion.copy(camQ); m.visible = false; scene.add(m); return { m, life: 0, max: 1, vy: 0, vx: 0, grow: 1 };
  });
  function puff(x, y, z, o) {
    const p = puffs.find(q => q.life <= 0); if (!p) return;
    Object.assign(p, { life: o.life, max: o.life, vy: o.vy, vx: o.vx || 0, grow: o.grow, size: o.size, op: o.op });
    p.m.position.set(x, y, z); p.m.material.color.set(o.color); p.m.visible = true;
  }

  // ---------- jogador ----------
  const heroTex = {};
  ['front', 'back', 'side'].forEach(v => heroTex[v] = [0, 1, 2].map(f => drawHero(v, f)));
  const heroGeo = new THREE.PlaneGeometry(2, 2.5); heroGeo.translate(0, 1.25, 0);
  const heroMat = spriteMat(heroTex.front[0]);
  const hero = new THREE.Mesh(heroGeo, heroMat); scene.add(hero);
  const heroShadow = blob(0, 0, 1.3, 0.7);
  const bubble = single(drawBubble(), 0, 0); bubble.visible = false; bubble.renderOrder = 10; bubble.material.depthTest = false;

  const player = { x: 0.6, z: 4.6, vx: 0, vz: 0, view: 'front', flip: false, anim: 0, frame: 0, dustT: 0, grassAcc: 0 };
  const input = { x: 0, z: 0, run: false };

  function collide() {
    const R = 0.38;
    circles.forEach(c => {
      const dx = player.x - c.x, dz = player.z - c.z, d = Math.hypot(dx, dz), m = c.r + R;
      if (d < m && d > 1e-4) { player.x = c.x + dx / d * m; player.z = c.z + dz / d * m; }
    });
    solids.forEach(b => {
      const x0 = b.x0 - R, x1 = b.x1 + R, z0 = b.z0 - R, z1 = b.z1 + R;
      if (player.x > x0 && player.x < x1 && player.z > z0 && player.z < z1) {
        const pen = [player.x - x0, x1 - player.x, player.z - z0, z1 - player.z], i = pen.indexOf(Math.min(...pen));
        if (i === 0) player.x = x0; else if (i === 1) player.x = x1; else if (i === 2) player.z = z0; else player.z = z1;
      }
    });
    if (inPond(player.x, player.z, 0.35)) {
      const a = Math.atan2((player.z - POND.z) / (POND.rz + 0.35), (player.x - POND.x) / (POND.rx + 0.35));
      player.x = POND.x + Math.cos(a) * (POND.rx + 0.36); player.z = POND.z + Math.sin(a) * (POND.rz + 0.36);
    }
    player.x = Math.max(-18.4, Math.min(18.4, player.x));
    player.z = Math.max(-21.5, Math.min(14.5, player.z));
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
  function nearest() {
    let best = null, bd = 1.9;
    interact.forEach(o => { const d = Math.hypot(o.x - player.x, o.z - player.z); if (d < bd) { bd = d; best = o; } });
    return best;
  }
  function pressA() {
    if (paused) { if (typing && !typing.done) finishTyping(); else nextLine(); return; }
    const o = nearest(); if (o) say(o.lines, o.name);
  }

  // ================= PÓS-PROCESSAMENTO =================
  const rt = new THREE.WebGLRenderTarget(4, 4, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
  const post = new THREE.ShaderMaterial({
    uniforms: { tDiffuse: { value: rt.texture }, res: { value: new THREE.Vector2(4, 4) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 res; varying vec2 vUv;
      float b2(vec2 a){ a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
      float b4(vec2 a){ return b2(0.5 * a) * 0.25 + b2(a); }
      void main(){
        vec2 px = 1.0 / res;
        vec3 c = texture2D(tDiffuse, vUv).rgb;
        // tilt-shift: borrão acima e abaixo da faixa de foco (efeito miniatura/diorama)
        float bl = smoothstep(0.16, 0.5, abs(vUv.y - 0.5));
        if (bl > 0.0) {
          vec3 acc = c;
          for (int i = 0; i < 8; i++) { float a = float(i) * 0.785; acc += texture2D(tDiffuse, vUv + vec2(cos(a), sin(a)) * px * bl * 2.2).rgb; }
          c = mix(c, acc / 9.0, bl);
        }
        // bloom barato: vizinhos brilhantes vazam luz
        vec3 glow = vec3(0.0);
        for (int i = 0; i < 12; i++) {
          float a = float(i) * 0.5236, r = 2.0 + mod(float(i), 3.0) * 2.5;
          vec3 s = texture2D(tDiffuse, vUv + vec2(cos(a), sin(a)) * px * r).rgb;
          glow += max(s - 0.72, 0.0);
        }
        c += glow / 12.0 * 1.7;
        // color grading: sombras puxadas para violeta, luzes para o âmbar
        float l = dot(c, vec3(0.299, 0.587, 0.114));
        c = mix(c * vec3(0.84, 0.8, 1.1) + vec3(0.03, 0.01, 0.06), c, smoothstep(0.0, 0.55, l));
        c = mix(c, c * vec3(1.07, 1.0, 0.88), smoothstep(0.55, 1.0, l));
        // vinheta
        vec2 q = (vUv - 0.5) * vec2(1.1, 1.3);
        c *= 1.0 - dot(q, q) * 0.85;
        // dithering ordenado + posterização = coesão de pixel art
        c = floor(c * 32.0 + (b4(gl_FragCoord.xy) - 0.5) * 0.6 + 0.5) / 32.0;
        gl_FragColor = vec4(c, 1.0);
      }` });
  const postScene = new THREE.Scene(), postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), post));

  // ================= TAMANHO / ESCALA DE PIXEL =================
  const screenEl = $('screen');
  let W = 0, H = 0, PIX = 2, upp = 1 / U;
  function resize() {
    const r = screenEl.getBoundingClientRect();
    PIX = Math.max(2, Math.round(r.height / 260));
    W = Math.floor(r.width / PIX); H = Math.floor(r.height / PIX);
    renderer.setSize(W, H, false); rt.setSize(W, H); post.uniforms.res.value.set(W, H);
    canvas.style.width = W * PIX + 'px'; canvas.style.height = H * PIX + 'px';
    // escolhe o FOV para que 1 texel de sprite = 1 pixel de tela (pixel art nítida)
    const visH = H / U;
    camera.fov = 2 * Math.atan(visH / 2 / CAM_DIST) * 180 / Math.PI; camera.aspect = W / H; camera.updateProjectionMatrix();
    upp = visH / H;
  }
  addEventListener('resize', resize); resize();

  // ================= LOOP =================
  const camT = new THREE.Vector3(player.x, 0, player.z);
  let last = performance.now(), flameT = 0, smokeT = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const t = now / 1000; T.time.value = t;

    // movimento livre com aceleração suave
    let ix = input.x, iz = input.z; const il = Math.hypot(ix, iz);
    if (paused || il < 0.01) { ix = iz = 0; } else { ix /= il; iz /= il; }
    const speed = input.run ? 6.2 : 3.6, k = 1 - Math.exp(-dt * 14);
    player.vx += (ix * speed - player.vx) * k; player.vz += (iz * speed - player.vz) * k;
    const prevX = player.x, prevZ = player.z;
    player.x += player.vx * dt; player.z += player.vz * dt; collide();
    const moved = Math.hypot(player.x - prevX, player.z - prevZ), sp = Math.hypot(player.vx, player.vz), moving = sp > 0.4 && il > 0.01 && !paused;
    if (moving) {
      if (Math.abs(player.vx) > Math.abs(player.vz) * 0.9) { player.view = 'side'; player.flip = player.vx < 0; }
      else { player.view = player.vz > 0 ? 'front' : 'back'; player.flip = false; }
      player.anim += dt * (input.run ? 11 : 7);
      player.frame = 1 + (Math.floor(player.anim) % 2);
      player.dustT -= dt;
      if (input.run && player.dustT <= 0) { player.dustT = 0.09; puff(player.x - player.vx * 0.05, 0.15, player.z + 0.1, { life: 0.5, vy: 0.6, grow: 1.4, size: 0.5, op: 0.55, color: '#d9c3a0' }); }
      // encontros na grama alta
      if (player.x > MEADOW.x0 && player.x < MEADOW.x1 && player.z > MEADOW.z0 && player.z < MEADOW.z1) {
        player.grassAcc += moved;
        if (player.grassAcc > 1.2) { player.grassAcc = 0; if (rnd() < 0.14) encounter(); }
      }
    } else { player.frame = 0; player.anim = 0; }
    heroMat.map = heroTex[player.view][player.frame];

    // squash & stretch + inclinação (sensação "viva" estilo Cult of the Lamb)
    const bounce = moving ? Math.abs(Math.sin(player.anim * Math.PI)) : 0;
    const breathe = moving ? 0 : Math.sin(t * 3) * 0.025;
    hero.position.set(player.x, bounce * 0.12, player.z);
    hero.quaternion.copy(camQ); hero.rotateZ(-player.vx * 0.035);
    hero.scale.set((player.flip ? -1 : 1) * (1 + bounce * 0.05 - breathe), 1 - bounce * 0.06 + breathe, 1);
    lightAt(player.x, player.z, heroMat.color);
    heroShadow.position.set(player.x, 0.02, player.z + 0.05); heroShadow.scale.set(1.3 - bounce * 0.2, 1, 0.7 - bounce * 0.1);
    T.player.value.set(player.x, 0, player.z);

    // NPC respirando
    npc.scale.set(1 - Math.sin(t * 2.4) * 0.03, 1 + Math.sin(t * 2.4) * 0.04, 1);
    lightAt(NPC.x, NPC.z, npc.material.color);

    // fogo
    flameT += dt; if (flameT > 0.11) { flameT = 0; flame.material.map = flames[(Math.random() * 3) | 0]; }
    const fl = 0.85 + Math.sin(t * 13) * 0.08 + Math.sin(t * 7.3) * 0.07;
    fireLight.intensity = 1.5 * fl; lights[0].flick = fl;
    flame.scale.set(1, 0.9 + fl * 0.15, 1);

    // fumaça
    smokeT -= dt;
    if (smokeT <= 0) { smokeT = 0.45; chimneys.forEach(c => puff(c[0], c[1], c[2], { life: 3.2, vy: 0.55, vx: 0.18, grow: 1.6, size: 0.6, op: 0.35, color: '#b8a8c8' })); }
    puffs.forEach(p => {
      if (p.life <= 0) return;
      p.life -= dt; const a = 1 - p.life / p.max;
      p.m.position.y += p.vy * dt; p.m.position.x += p.vx * dt;
      p.m.scale.setScalar(p.size * (1 + a * p.grow)); p.m.material.opacity = p.op * (1 - a);
      if (p.life <= 0) p.m.visible = false;
    });
    halos.forEach(h => { const s = h.base * (1 + Math.sin(t * 3 + h.ph) * h.pulse); h.m.scale.set(s / h.base, s / h.base, 1); });

    // balão de interação
    const near = paused ? null : nearest();
    bubble.visible = !!near;
    if (near) bubble.position.set(near.x, near.h + Math.sin(t * 5) * 0.08, near.z);

    // câmera: segue suave com antecipação e encaixa no grid de pixels (evita tremido)
    camT.x += (player.x + player.vx * 0.25 - camT.x) * (1 - Math.exp(-dt * 5));
    camT.z += (player.z + player.vz * 0.2 - camT.z) * (1 - Math.exp(-dt * 5));
    const zs = upp / Math.sin(PITCH);
    const sx = Math.round(camT.x / upp) * upp, sz = Math.round(camT.z / zs) * zs;
    camera.position.set(sx + CAM_OFF.x, CAM_OFF.y, sz + CAM_OFF.z);
    sun.position.set(sx - 9, 15, sz - 7); sun.target.position.set(sx, 0, sz); sun.target.updateMatrixWorld();

    renderer.setRenderTarget(rt); renderer.render(scene, camera);
    renderer.setRenderTarget(null); renderer.render(postScene, postCam);
    requestAnimationFrame(frame);
  }

  function encounter() {
    const f = $('flash'); f.classList.remove('on'); void f.offsetWidth; f.classList.add('on');
    paused = true;
    setTimeout(() => say(['Um monstro selvagem saltou da grama alta!', '(A batalha chega na próxima etapa.)']), 700);
  }

  // ================= CONTROLES =================
  const dpad = $('dpad'), arms = [...dpad.querySelectorAll('.arm')];
  let dpadId = null;
  const keyDir = { x: 0, z: 0 };
  function setPad(x, z) {
    input.x = x; input.z = z;
    arms.forEach(a => a.classList.toggle('on', (a.dataset.d === 'left' && x < -0.3) || (a.dataset.d === 'right' && x > 0.3) || (a.dataset.d === 'up' && z < -0.3) || (a.dataset.d === 'down' && z > 0.3)));
  }
  function dpadMove(e) {
    const r = dpad.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    if (Math.hypot(dx, dy) < 12) return setPad(0, 0);
    const a = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4); // 8 direções
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
  addEventListener('keyup', e => {
    const k = e.key.toLowerCase();
    if (KEYS[k]) { held.delete(k); keyUpdate(); } else if (k === 'x' || k === 'shift') bUp();
  });

  setTimeout(() => say(['Bem-vindo à Vila Brasa!', 'D-pad: andar em 8 direções. B: correr. A: conversar e ler.', 'Fale com o Musgo perto da fogueira.'], ''), 4600);
  requestAnimationFrame(frame);
})();
