// Monster Quest — Etapa 1: mapa, personagem, joystick touch, colisão e encontros na grama alta.
(() => {
  const TILE = 16, VIEW_W = 15, VIEW_H = 10;      // viewport em tiles (240x160)
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const msgBox = document.getElementById('msg');

  // Legenda: . grama | , grama alta (encontros) | # árvore | ~ água | = caminho | H casa
  const MAP = [
    "########################",
    "#......................#",
    "#..,,,,....~~~~........#",
    "#..,,,,....~~~~..HH....#",
    "#..,,,,............HH..#",
    "#..........=====.......#",
    "#..........=...=.......#",
    "#....#.....=...=..,,,,.#",
    "#....#.....=...=..,,,,.#",
    "#..........=...=..,,,,.#",
    "#..,,,.....=...=.......#",
    "#..,,,.....=...=..~~...#",
    "#..,,,.....=====..~~...#",
    "#......................#",
    "#...##..............##.#",
    "#......................#",
    "########################",
  ];
  const MAP_H = MAP.length, MAP_W = MAP[0].length;
  const tileAt = (x, y) => (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) ? '#' : MAP[y][x];
  const SOLID = new Set(['#', '~', 'H']);

  // ---------- Sprites procedurais (trocáveis por imagens depois) ----------
  function makeTile(draw) {
    const c = document.createElement('canvas'); c.width = c.height = TILE;
    draw(c.getContext('2d')); return c;
  }
  const px = (g, col, x, y, w = 1, h = 1) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const TILES = {
    '.': makeTile(g => { px(g,'#5fb34a',0,0,16,16); [[2,3],[9,2],[5,10],[12,12],[13,6]].forEach(([x,y]) => px(g,'#7cd05f',x,y,2,1)); }),
    ',': makeTile(g => { px(g,'#3f8f37',0,0,16,16); for (let i=0;i<4;i++) for (let j=0;j<4;j++) { px(g,'#2c6b29',i*4+1,j*4+1,1,3); px(g,'#67c25a',i*4+2,j*4,1,3); } }),
    '#': makeTile(g => { px(g,'#5fb34a',0,0,16,16); px(g,'#5a3a1e',6,10,4,6); px(g,'#1f5c2a',1,1,14,11); px(g,'#2f8a3d',3,2,10,8); px(g,'#55b85a',5,3,3,2); }),
    '~': makeTile(g => { px(g,'#2f7fd1',0,0,16,16); px(g,'#6fb4f0',2,4,5,1); px(g,'#6fb4f0',9,10,5,1); }),
    '=': makeTile(g => { px(g,'#d8b878',0,0,16,16); [[3,3],[10,6],[6,12],[13,13]].forEach(([x,y]) => px(g,'#bf9c5c',x,y,2,2)); }),
    'H': makeTile(g => { px(g,'#c0443a',0,0,16,6); px(g,'#e0e0e0',0,6,16,10); px(g,'#4a90e2',3,8,4,4); px(g,'#5a3a1e',10,8,4,8); }),
  };
  const PLAYER = {}; // frames por direção
  ['down','up','left','right'].forEach(dir => {
    PLAYER[dir] = [0,1].map(step => makeTile(g => {
      px(g,'#d33',3,1,10,4);                       // boné
      px(g,'#f3c9a0',4,5,8,5);                     // rosto
      if (dir === 'up') { px(g,'#d33',3,1,10,6); } else { px(g,'#222',5,7,1,1); px(g,'#222',10,7,1,1); }
      px(g,'#2a5bd7',3,10,10,4);                   // roupa
      const o = step ? 1 : 0;
      px(g,'#333',4+o,14,3,2); px(g,'#333',9-o,14,3,2); // pés alternando
    }));
  });

  // ---------- Estado ----------
  const player = { x: 5, y: 5, px: 5*TILE, py: 5*TILE, dir: 'down', moving: false, step: 0, t: 0 };
  const MOVE_MS = 150;
  let input = { dx: 0, dy: 0 };
  let paused = false, messageQueue = [], onMsgDone = null;

  // ---------- Mensagens ----------
  function say(lines, done) {
    messageQueue = [].concat(lines); onMsgDone = done || null; paused = true; nextMsg();
  }
  function nextMsg() {
    if (!messageQueue.length) { msgBox.style.display = 'none'; paused = false; const cb = onMsgDone; onMsgDone = null; if (cb) cb(); return; }
    msgBox.textContent = messageQueue.shift(); msgBox.style.display = 'block';
  }

  // ---------- Movimento ----------
  function tryMove(dx, dy) {
    player.dir = dx < 0 ? 'left' : dx > 0 ? 'right' : dy < 0 ? 'up' : 'down';
    const nx = player.x + dx, ny = player.y + dy;
    if (SOLID.has(tileAt(nx, ny))) return;
    player.from = { x: player.px, y: player.py };
    player.x = nx; player.y = ny; player.moving = true; player.t = 0; player.step ^= 1;
  }
  function onArrive() {
    if (tileAt(player.x, player.y) === ',' && Math.random() < 0.15) {
      // Etapa 3 vai iniciar a batalha de verdade aqui.
      say(['Um monstro selvagem apareceu!', '(A batalha será implementada na Etapa 3.)']);
    }
  }

  let last = performance.now();
  function frame(now) {
    const dt = now - last; last = now;
    if (!paused) {
      if (player.moving) {
        player.t += dt;
        const k = Math.min(1, player.t / MOVE_MS);
        player.px = player.from.x + (player.x*TILE - player.from.x) * k;
        player.py = player.from.y + (player.y*TILE - player.from.y) * k;
        if (k >= 1) { player.moving = false; onArrive(); }
      }
      if (!player.moving && !paused && (input.dx || input.dy)) {
        // prioridade ao eixo dominante do joystick
        if (Math.abs(input.dx) >= Math.abs(input.dy)) tryMove(Math.sign(input.dx), 0);
        else tryMove(0, Math.sign(input.dy));
      }
    }
    render();
    requestAnimationFrame(frame);
  }

  function render() {
    // câmera centrada no jogador, limitada ao mapa
    let camX = Math.round(player.px + TILE/2 - canvas.width/2);
    let camY = Math.round(player.py + TILE/2 - canvas.height/2);
    camX = Math.max(0, Math.min(MAP_W*TILE - canvas.width, camX));
    camY = Math.max(0, Math.min(MAP_H*TILE - canvas.height, camY));
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const x0 = Math.floor(camX/TILE), y0 = Math.floor(camY/TILE);
    for (let ty = y0; ty <= y0 + VIEW_H + 1; ty++)
      for (let tx = x0; tx <= x0 + VIEW_W + 1; tx++) {
        const ch = tileAt(tx, ty);
        ctx.drawImage(TILES[ch === '#' && (tx<0||ty<0||tx>=MAP_W||ty>=MAP_H) ? '#' : ch] || TILES['.'], tx*TILE - camX, ty*TILE - camY);
      }
    const frameImg = PLAYER[player.dir][player.moving ? player.step : 0];
    ctx.drawImage(frameImg, Math.round(player.px - camX), Math.round(player.py - camY));
    // redimensiona o canvas para preencher a tela mantendo pixels nítidos
    fit();
  }
  function fit() {
    const area = canvas.parentElement.getBoundingClientRect();
    const s = Math.max(1, Math.floor(Math.min(area.width / canvas.width, area.height / canvas.height) * 100) / 100);
    canvas.style.width = canvas.width * s + 'px'; canvas.style.height = canvas.height * s + 'px';
  }

  // ---------- Controles: joystick touch ----------
  const stick = document.getElementById('stick'), knob = document.getElementById('knob');
  let stickId = null;
  function stickMove(e) {
    const r = stick.getBoundingClientRect(), cx = r.left + r.width/2, cy = r.top + r.height/2;
    let dx = e.clientX - cx, dy = e.clientY - cy;
    const max = r.width/2 - 10, len = Math.hypot(dx, dy) || 1;
    if (len > max) { dx = dx/len*max; dy = dy/len*max; }
    knob.style.transform = `translate(${dx}px,${dy}px)`;
    const dead = 18;
    input.dx = Math.abs(dx) > dead ? dx : 0; input.dy = Math.abs(dy) > dead ? dy : 0;
  }
  function stickEnd() { stickId = null; knob.style.transform = ''; input.dx = input.dy = 0; }
  stick.addEventListener('pointerdown', e => { stickId = e.pointerId; stick.setPointerCapture(e.pointerId); stickMove(e); });
  stick.addEventListener('pointermove', e => { if (e.pointerId === stickId) stickMove(e); });
  stick.addEventListener('pointerup', stickEnd); stick.addEventListener('pointercancel', stickEnd);

  // botão A: avança mensagens
  const act = () => { if (paused) nextMsg(); };
  document.getElementById('btnA').addEventListener('pointerdown', act);
  msgBox.addEventListener('pointerdown', act);

  // Teclado (para testar no computador)
  const keys = {};
  const KEYMAP = { ArrowLeft:[-1,0], a:[-1,0], ArrowRight:[1,0], d:[1,0], ArrowUp:[0,-1], w:[0,-1], ArrowDown:[0,1], s:[0,1] };
  function kbUpdate() { let dx=0, dy=0; for (const k in keys) if (keys[k]) { dx += KEYMAP[k][0]; dy += KEYMAP[k][1]; } if (stickId === null) { input.dx = dx; input.dy = dy; } }
  addEventListener('keydown', e => { if (KEYMAP[e.key]) { keys[e.key] = true; kbUpdate(); e.preventDefault(); } if (e.key === 'Enter' || e.key === ' ' || e.key === 'z') act(); });
  addEventListener('keyup', e => { if (KEYMAP[e.key]) { keys[e.key] = false; kbUpdate(); } });

  say(['Bem-vindo ao Monster Quest!', 'Use o joystick para andar. Entre na grama alta para encontrar monstros.']);
  requestAnimationFrame(frame);
})();
