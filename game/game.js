// Monster Quest — visual estilo GBA (240x160, tiles 16px): cidade maior, casas, texturas, sprite do jogador,
// caminhada/corrida, D-pad + A/B, caixa de texto com digitação.
(() => {
  const T = 16, S = 4, VW = 15, VH = 10;                 // tile, escala interna, viewport em tiles
  const canvas = document.getElementById('game');
  canvas.width = VW * T * S; canvas.height = VH * T * S;
  const ctx = canvas.getContext('2d');
  const msgBox = document.getElementById('msg'), txtEl = document.getElementById('txt'), bezel = document.getElementById('bezel');

  // ---------------- utilidades de desenho ----------------
  const mk = draw => { const c = document.createElement('canvas'); c.width = c.height = T; draw(c.getContext('2d')); return c; };
  const px = (g, col, x, y, w = 1, h = 1) => { g.fillStyle = col; g.fillRect(x, y, w, h); };

  // ---------------- texturas ----------------
  const GRASS = [0, 1].map(v => mk(g => {
    px(g, '#78c850', 0, 0, 16, 16);
    (v ? [[1,3],[8,1],[4,9],[11,12],[14,6]] : [[3,1],[10,4],[1,10],[7,13],[12,9]]).forEach(([x, y]) => {
      px(g, '#58a838', x, y, 3, 1); px(g, '#a0e078', x + 1, y - 1, 1, 1);
    });
  }));
  const grassBase = (g, v = 0) => g.drawImage(GRASS[v], 0, 0);

  const TALL = mk(g => {
    px(g, '#489030', 0, 0, 16, 16);
    for (const ox of [0, 8]) for (const oy of [0, 8]) {
      px(g, '#2c6820', ox + 1, oy + 3, 6, 5);
      px(g, '#68b848', ox + 1, oy + 2, 1, 2); px(g, '#68b848', ox + 3, oy + 1, 1, 3); px(g, '#68b848', ox + 5, oy + 2, 1, 2);
      px(g, '#88d860', ox + 2, oy + 4, 1, 2); px(g, '#88d860', ox + 5, oy + 4, 1, 2);
    }
  });

  const TREE = mk(g => {
    grassBase(g);
    px(g, '#503818', 6, 12, 4, 4); px(g, '#785028', 7, 12, 2, 4);
    const rows = { 1:[5,10], 2:[3,12], 3:[2,13], 4:[1,14], 5:[1,14], 6:[1,14], 7:[1,14], 8:[1,14], 9:[1,14], 10:[2,13], 11:[3,12], 12:[5,10] };
    for (const y in rows) { const [a, b] = rows[y]; px(g, '#183820', a, +y, b - a + 1, 1); }
    for (const y in rows) { const [a, b] = rows[y]; if (y > 1 && y < 12) px(g, '#2c8838', a + 1, +y, b - a - 1, 1); }
    px(g, '#1c6028', 4, 10, 8, 1); px(g, '#1c6028', 5, 11, 6, 1);
    px(g, '#58c060', 3, 3, 4, 2); px(g, '#58c060', 9, 2, 3, 1); px(g, '#58c060', 3, 6, 2, 2); px(g, '#80e088', 4, 3, 2, 1);
  });

  const WATER = [0, 1].map(f => mk(g => {
    px(g, '#3890f8', 0, 0, 16, 16);
    px(g, '#80c0ff', 2 + f * 3, 4, 5, 1); px(g, '#80c0ff', 9 - f * 3, 11, 5, 1); px(g, '#2070d0', 1 + f * 2, 8, 3, 1);
  }));

  const PATH = mk(g => {
    px(g, '#e0c890', 0, 0, 16, 16);
    [[2,3],[10,2],[6,8],[13,10],[3,13]].forEach(([x, y]) => { px(g, '#c8a868', x, y, 2, 1); px(g, '#f0e0b0', x, y - 1, 1, 1); });
  });

  const FLOWERS = [0, 1].map(f => mk(g => {
    grassBase(g, 1);
    [[3,4,'#f878a0'],[10,3,'#f8f8f8'],[6,10,'#f8d038'],[12,11,'#f878a0']].forEach(([x, y, c]) => {
      const dy = f ? 1 : 0;
      px(g, '#388828', x, y + 2 + dy, 1, 2); px(g, c, x - 1, y + dy, 3, 3); px(g, '#f8e068', x, y + 1 + dy, 1, 1);
    });
  }));

  const FENCE = mk(g => {
    grassBase(g);
    px(g, '#a09878', 0, 9, 16, 2); px(g, '#f0ead8', 0, 7, 16, 2);
    for (const x of [1, 10]) { px(g, '#f0ead8', x, 3, 4, 11); px(g, '#a09878', x + 3, 3, 1, 11); px(g, '#fff', x, 3, 4, 1); }
  });

  const SIGN = mk(g => {
    grassBase(g);
    px(g, '#503818', 7, 9, 2, 6);
    px(g, '#503818', 2, 2, 12, 8); px(g, '#d8a860', 3, 3, 10, 6); px(g, '#905828', 4, 5, 8, 1); px(g, '#905828', 4, 7, 6, 1);
  });

  const ROOF_RED  = { l:'#e05040', m:'#c03830', d:'#802018', h:'#f07868' };
  const ROOF_BLUE = { l:'#4a78d8', m:'#3558b8', d:'#1c3078', h:'#7aa0f0' };
  const roof = (kind, c) => mk(g => {
    px(g, c.m, 0, 0, 16, 16);
    for (let y = 0; y < 16; y += 4) {
      px(g, c.l, 0, y, 16, 2); px(g, c.d, 0, y + 3, 16, 1);
      const off = (y / 4) % 2 ? 4 : 0; for (let x = off; x < 16; x += 8) px(g, c.d, x, y, 1, 3);
    }
    if (kind[0] === 't') { px(g, c.d, 0, 0, 16, 1); px(g, c.h, 0, 1, 16, 1); }
    if (kind[0] === 'b') px(g, c.d, 0, 14, 16, 2);
    if (kind[1] === 'l') px(g, c.d, 0, 0, 2, 16);
    if (kind[1] === 'r') px(g, c.d, 14, 0, 2, 16);
  });
  const wallBase = g => {
    px(g, '#f0e4c0', 0, 0, 16, 16);
    for (let y = 3; y < 14; y += 4) px(g, '#dccca0', 0, y, 16, 1);
    px(g, '#a09070', 0, 14, 16, 2); px(g, '#7a6c50', 0, 14, 16, 1);
  };
  const WALL = mk(wallBase);
  const WINDOW = mk(g => {
    wallBase(g);
    px(g, '#604830', 2, 2, 12, 10); px(g, '#88c8f8', 3, 3, 10, 8); px(g, '#e8f4ff', 7, 3, 2, 8); px(g, '#e8f4ff', 3, 6, 10, 1);
    px(g, '#c8f0ff', 4, 4, 2, 1); px(g, '#604830', 1, 12, 14, 1);
  });
  const DOOR = mk(g => {
    wallBase(g);
    px(g, '#503018', 2, 0, 12, 16); px(g, '#a86830', 3, 1, 10, 15); px(g, '#8a5226', 4, 3, 3, 4); px(g, '#8a5226', 9, 3, 3, 4);
    px(g, '#8a5226', 4, 9, 3, 5); px(g, '#8a5226', 9, 9, 3, 5); px(g, '#f0d050', 10, 8, 2, 2); px(g, '#7a6c50', 0, 15, 16, 1);
  });

  const TILE_IMG = {
    ',': TALL, T: TREE, '=': PATH, f: FENCE, S: SIGN, w: WALL, n: WINDOW, D: DOOR,
    a: roof('tl', ROOF_RED),  b: roof('tm', ROOF_RED),  c: roof('tr', ROOF_RED),
    d: roof('bl', ROOF_RED),  e: roof('bm', ROOF_RED),  g: roof('br', ROOF_RED),
    h: roof('tl', ROOF_BLUE), i: roof('tm', ROOF_BLUE), j: roof('tr', ROOF_BLUE),
    k: roof('bl', ROOF_BLUE), l: roof('bm', ROOF_BLUE), m: roof('br', ROOF_BLUE),
  };

  // ---------------- sprite do jogador (estilo GBA, 16x16) ----------------
  const OUT = '#202028', RED = '#d83030', DRED = '#8c1818', HAIR = '#2a2a34', SKIN = '#f8c898',
        JACKET = '#3860a8', PANTS = '#303060', SHOE = '#e8e8e8', PACK = '#d8a838', DARK = '#202028';
  function playerFrame(dir, f) {
    const draw = (g, d) => {
      const sh = []; const add = (x, y, w, h, c) => sh.push([x, y, w, h, c]);
      if (d === 'down') {
        add(4,2,8,6,HAIR); add(5,5,6,4,SKIN); add(4,1,8,4,RED); add(4,4,8,1,DRED); add(7,2,2,2,'#fff');
        add(6,6,1,1,DARK); add(9,6,1,1,DARK);
        add(5,9,6,4,JACKET); add(7,9,2,3,'#e8e8f0'); add(3,9,2,3,JACKET); add(11,9,2,3,JACKET); add(3,12,2,1,SKIN); add(11,12,2,1,SKIN);
      } else if (d === 'up') {
        add(4,1,8,8,HAIR); add(4,1,8,4,RED); add(5,9,6,4,PACK); add(5,9,1,4,'#a07818'); add(10,9,1,4,'#a07818');
        add(3,9,2,3,JACKET); add(11,9,2,3,JACKET); add(3,12,2,1,SKIN); add(11,12,2,1,SKIN);
      } else {
        add(4,2,7,7,HAIR); add(7,5,5,4,SKIN); add(4,1,8,4,RED); add(9,4,4,1,DRED); add(10,6,1,1,DARK);
        add(2,9,4,4,PACK); add(5,9,5,4,JACKET); add(6,9,3,4,'#2e4a84'); add(7,12,2,1,SKIN);
      }
      // pernas
      if (d === 'left' || d === 'right') {
        if (f === 0) { add(6,13,4,2,PANTS); add(6,15,5,1,SHOE); }
        else if (f === 1) { add(4,13,3,2,PANTS); add(4,15,3,1,SHOE); add(9,13,3,2,PANTS); add(9,14,3,1,SHOE); }
        else { add(5,13,3,2,PANTS); add(5,14,3,1,SHOE); add(9,13,3,2,PANTS); add(9,15,3,1,SHOE); }
      } else {
        if (f === 1) { add(5,13,3,1,PANTS); add(5,14,3,1,SHOE); add(8,13,3,2,PANTS); add(8,15,3,1,SHOE); }
        else if (f === 2) { add(5,13,3,2,PANTS); add(5,15,3,1,SHOE); add(8,13,3,1,PANTS); add(8,14,3,1,SHOE); }
        else { add(5,13,3,2,PANTS); add(8,13,3,2,PANTS); add(5,15,3,1,SHOE); add(8,15,3,1,SHOE); }
      }
      g.fillStyle = OUT; sh.forEach(([x, y, w, h]) => g.fillRect(x - 1, y - 1, w + 2, h + 2));
      sh.forEach(([x, y, w, h, c]) => { g.fillStyle = c; g.fillRect(x, y, w, h); });
    };
    if (dir === 'left') {
      const right = mk(g => draw(g, 'right'));
      return mk(g => { g.translate(16, 0); g.scale(-1, 1); g.drawImage(right, 0, 0); });
    }
    return mk(g => draw(g, dir));
  }
  const PLAYER = {};
  ['down', 'up', 'left', 'right'].forEach(d => PLAYER[d] = [0, 1, 2].map(f => playerFrame(d, f)));

  // ---------------- mapa (36 x 32) ----------------
  const W = 36, H = 32;
  const M = Array.from({ length: H }, () => Array(W).fill('.'));
  const set = (x, y, c) => { if (x >= 0 && y >= 0 && x < W && y < H) M[y][x] = c; };
  const rect = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) set(x + i, y + j, c); };
  const house = (x, y, blue) => {
    const r = blue ? ['hiiij', 'klllm'] : ['abbbc', 'deeeg'];
    r.forEach((row, j) => [...row].forEach((ch, i) => set(x + i, y + j, ch)));
    [...'nwDwn'].forEach((ch, i) => set(x + i, y + 2, ch));
  };

  rect(3, 3, 30, 6, ',');                                  // rota com grama alta
  rect(0, 0, W, 2, 'T'); rect(0, H - 2, W, 2, 'T'); rect(0, 0, 2, H, 'T'); rect(W - 2, 0, 2, H, 'T');
  rect(0, 2, W, 1, 'T'); rect(2, 2, 1, 8, 'T'); rect(W - 3, 2, 1, 8, 'T');
  [[6,5],[10,7],[24,4],[29,6],[13,4]].forEach(([x, y]) => set(x, y, 'T'));
  for (let x = 2; x < W - 2; x++) if (x !== 17 && x !== 18) set(x, 10, 'f');
  rect(17, 2, 2, 28, '=');                                 // caminho principal
  rect(7, 18, 21, 2, '='); rect(7, 26, 21, 2, '=');       // caminhos horizontais
  rect(7, 15, 1, 3, '='); rect(27, 15, 1, 3, '='); rect(7, 25, 1, 1, '='); rect(27, 25, 1, 1, '=');
  house(5, 12, false); house(25, 12, true); house(5, 22, true); house(25, 22, false);
  rect(11, 21, 5, 4, '~'); rect(20, 21, 4, 4, '~');
  [[5,15],[6,15],[9,15],[5,16],[9,16],[25,15],[26,15],[29,15],[25,16],[29,16],[12,13],[13,13],[21,13],[22,13],[20,16],[14,16],[10,20],[11,28]].forEach(([x, y]) => set(x, y, 'F'));
  rect(3, 12, 1, 5, 'T'); rect(32, 12, 1, 5, 'T'); rect(3, 21, 1, 4, 'T'); rect(32, 21, 1, 4, 'T');
  rect(2, 28, 6, 2, 'T'); rect(28, 28, 6, 2, 'T');
  set(16, 11, 'S'); set(16, 17, 'S'); set(19, 3, 'S');

  const SOLID = new Set(['T', '~', 'f', 'S', 'a','b','c','d','e','g','h','i','j','k','l','m','w','n','D']);
  const tileAt = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 'T' : M[y][x];
  const TEXTS = {
    '16,11': ['PLACA: Rota 1 ao norte.', 'Cuidado com os monstros na grama alta!'],
    '16,17': ['PLACA: Centro da cidade.', 'Casas à esquerda e à direita.'],
    '19,3':  ['PLACA: Estrada fechada para obras.', '(Novas rotas chegam em breve.)'],
    '7,14':  ['A porta está trancada.'], '27,14': ['Ninguém atende... a porta está trancada.'],
    '7,24':  ['A porta está trancada.'], '27,24': ['Parece que não tem ninguém em casa.'],
  };

  // ---------------- estado ----------------
  const player = { x: 17, y: 16, px: 17 * T, py: 16 * T, dir: 'down', moving: false, step: 0, t: 0, dur: 267, turnT: 0 };
  const input = { dx: 0, dy: 0, run: false };
  let paused = false, queue = [], afterMsg = null, typing = null;

  // ---------------- caixa de texto ----------------
  function say(lines, done) { queue = [].concat(lines); afterMsg = done || null; paused = true; nextLine(); }
  function nextLine() {
    if (!queue.length) { msgBox.style.display = 'none'; paused = false; typing = null; const cb = afterMsg; afterMsg = null; if (cb) cb(); return; }
    const full = queue.shift(); msgBox.style.display = 'block'; txtEl.textContent = ''; document.getElementById('more').style.visibility = 'hidden';
    let i = 0; typing = { full, timer: setInterval(() => {
      txtEl.textContent = full.slice(0, ++i);
      if (i >= full.length) finishTyping();
    }, 28) };
  }
  function finishTyping() { if (!typing) return; clearInterval(typing.timer); txtEl.textContent = typing.full; typing = { done: true }; document.getElementById('more').style.visibility = 'visible'; }
  function pressA() {
    if (paused) { if (typing && !typing.done) finishTyping(); else nextLine(); return; }
    if (player.moving) return;
    const d = { up: [0,-1], down: [0,1], left: [-1,0], right: [1,0] }[player.dir];
    const t = TEXTS[(player.x + d[0]) + ',' + (player.y + d[1])];
    if (t) say(t);
  }

  // ---------------- movimento ----------------
  const DIRS = { up: [0,-1], down: [0,1], left: [-1,0], right: [1,0] };
  function wantedDir() {
    if (!input.dx && !input.dy) return null;
    return Math.abs(input.dx) >= Math.abs(input.dy) ? (input.dx < 0 ? 'left' : 'right') : (input.dy < 0 ? 'up' : 'down');
  }
  function onArrive() {
    if (tileAt(player.x, player.y) === ',' && Math.random() < 0.12) {
      say(['Um monstro selvagem apareceu!', '(A batalha será implementada na Etapa 3.)']);
    }
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(64, now - last); last = now;
    if (!paused) {
      if (player.moving) {
        player.t += dt;
        const k = Math.min(1, player.t / player.dur);
        player.px = player.from.x + (player.x * T - player.from.x) * k;
        player.py = player.from.y + (player.y * T - player.from.y) * k;
        if (k >= 1) { player.moving = false; onArrive(); }
      }
      if (!player.moving && !paused) {
        const d = wantedDir();
        if (d) {
          if (d !== player.dir) { player.dir = d; player.turnT = 90; }       // vira antes de andar
          else if (player.turnT > 0) player.turnT -= dt;
          else {
            const [dx, dy] = DIRS[d], nx = player.x + dx, ny = player.y + dy;
            if (!SOLID.has(tileAt(nx, ny))) {
              player.from = { x: player.px, y: player.py }; player.x = nx; player.y = ny;
              player.moving = true; player.t = 0; player.step ^= 1; player.dur = input.run ? 133 : 267;
            }
          }
        } else player.turnT = 0;
      }
    }
    render(now);
    requestAnimationFrame(frame);
  }

  function render(now) {
    const af = Math.floor(now / 450) % 2;
    let camX = Math.round(player.px + T / 2 - VW * T / 2), camY = Math.round(player.py + T / 2 - VH * T / 2);
    camX = Math.max(0, Math.min(W * T - VW * T, camX)); camY = Math.max(0, Math.min(H * T - VH * T, camY));
    ctx.setTransform(S, 0, 0, S, 0, 0); ctx.imageSmoothingEnabled = false;
    const x0 = Math.floor(camX / T), y0 = Math.floor(camY / T);
    for (let ty = y0; ty <= y0 + VH; ty++) for (let tx = x0; tx <= x0 + VW; tx++) {
      const ch = tileAt(tx, ty); let img;
      if (ch === '.') img = GRASS[(tx * 7 + ty * 13) % 5 < 2 ? 1 : 0];
      else if (ch === '~') img = WATER[af];
      else if (ch === 'F') img = FLOWERS[af];
      else img = TILE_IMG[ch] || TREE;
      ctx.drawImage(img, tx * T - camX, ty * T - camY);
    }
    const f = player.moving ? 1 + player.step : 0;
    ctx.drawImage(PLAYER[player.dir][f], Math.round(player.px - camX), Math.round(player.py - camY) - (player.moving ? 1 : 0));
    // grama alta cobre os pés do jogador
    const cx = Math.floor((player.px + T / 2) / T), cy = Math.floor((player.py + T / 2) / T);
    if (tileAt(cx, cy) === ',') ctx.drawImage(TALL, 0, 8, T, 8, cx * T - camX, cy * T - camY + 8, T, 8);
    fit();
  }
  let lastFit = '';
  function fit() {
    const a = document.getElementById('screen').getBoundingClientRect();
    const availW = a.width - 20 - 16, availH = a.height - 18 - 16;
    const s = Math.min(availW / (VW * T), availH / (VH * T));
    const w = Math.floor(VW * T * s), key = w + 'x' + s;
    if (key === lastFit) return; lastFit = key;
    canvas.style.width = w + 'px'; canvas.style.height = Math.floor(VH * T * s) + 'px';
    msgBox.style.fontSize = Math.max(8, 8 * s) + 'px';
  }

  // ---------------- controles ----------------
  const dpad = document.getElementById('dpad'), arms = [...dpad.querySelectorAll('.arm')];
  let dpadId = null;
  function setDir(d) {
    input.dx = d === 'left' ? -1 : d === 'right' ? 1 : 0; input.dy = d === 'up' ? -1 : d === 'down' ? 1 : 0;
    arms.forEach(a => a.classList.toggle('on', a.dataset.d === d));
  }
  function dpadMove(e) {
    const r = dpad.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    if (Math.hypot(dx, dy) < 14) return setDir(null);
    setDir(Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down'));
  }
  dpad.addEventListener('pointerdown', e => { dpadId = e.pointerId; dpad.setPointerCapture(e.pointerId); dpadMove(e); });
  dpad.addEventListener('pointermove', e => { if (e.pointerId === dpadId) dpadMove(e); });
  const dpadEnd = e => { if (e.pointerId === dpadId) { dpadId = null; setDir(null); } };
  dpad.addEventListener('pointerup', dpadEnd); dpad.addEventListener('pointercancel', dpadEnd);

  const btnA = document.getElementById('btnA'), btnB = document.getElementById('btnB');
  btnA.addEventListener('pointerdown', e => { e.preventDefault(); pressA(); });
  msgBox.addEventListener('pointerdown', pressA);
  btnB.addEventListener('pointerdown', e => { btnB.setPointerCapture(e.pointerId); input.run = true; btnB.classList.add('on'); });
  const bUp = () => { input.run = false; btnB.classList.remove('on'); };
  btnB.addEventListener('pointerup', bUp); btnB.addEventListener('pointercancel', bUp);

  // teclado (para testar no computador): setas/WASD, Z/Enter = A, X/Shift = B
  const KEYS = { ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right', ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down' };
  const held = [];
  addEventListener('keydown', e => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (KEYS[k]) { if (!held.includes(KEYS[k])) held.push(KEYS[k]); setDir(held[held.length - 1]); e.preventDefault(); }
    else if (k === 'Enter' || k === ' ' || k === 'z') { if (!e.repeat) pressA(); e.preventDefault(); }
    else if (k === 'x' || k === 'Shift') { input.run = true; btnB.classList.add('on'); }
  });
  addEventListener('keyup', e => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (KEYS[k]) { const i = held.indexOf(KEYS[k]); if (i >= 0) held.splice(i, 1); setDir(held[held.length - 1] || null); }
    else if (k === 'x' || k === 'Shift') bUp();
  });

  say(['Bem-vindo a Monster Quest!', 'D-pad: andar.  A: falar e ler.  B: segure para correr.', 'Entre na grama alta ao norte para achar monstros!']);
  requestAnimationFrame(frame);
})();
