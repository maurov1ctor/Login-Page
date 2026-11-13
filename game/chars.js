// Personagens em pixel art desenhados à mão (24x32), estilo "chibi" de RPG clássico:
// cabeça grande, cabelo em mechas com 3 tons, olhos pequenos, sombreado em 3 tons e contorno colorido (sel-out).
// Letras = slots de cor; cada personagem define sua paleta. '.' = transparente.
function buildChars(Pix) {
  const W = 24;
  const g = rows => rows.map(r => { if (r.length > W) throw new Error('linha longa: ' + r); return r.padEnd(W, '.'); });

  // ---------------- PROTAGONISTA ----------------
  const HERO_HEAD_F = [
    '......o..oo..o..o.......',
    '.....oho.ohoohooho......',
    '....ohhoohHhhHhohho.....',
    '...ohHhhhHHhhhhHhhho....',
    '..ohhhHHhhhhhhhhHhhhoo..',
    '..okhhhhhhhhhhhhhhhhhho.',
    '.ohkhhkhhhkhhhhkhhkhhko.',
    '..okhkSkhkSSkhkSSkhkhko.',
    '..okkkSSSSSSSSSSSSSkkho.',
    '...okSSSeeSSSSeeSSSSkko.',
    '...okSSSewSSSSewSSSdkko.',
    '...ohSnSSSSSSSSSSnSdkko.',
    '....okdsSSSSllSSSsdko...',
    '.....oodsssssssssddoo...',
  ];
  const HERO_HEAD_B = [
    '......o..oo..o..o.......',
    '.....oho.ohoohooho......',
    '....ohhoohHhhHhohho.....',
    '...ohHhhhHHhhhhHhhho....',
    '..ohhhHHhhhhhhhhHhhhoo..',
    '..okhhhhhhhhhhhhhhhhhho.',
    '.ohhhhhhhhhhhhhhhhhhhko.',
    '..ohhHhhhhhhhhhHhhhhkko.',
    '..ohhhhhhhhhhhhhhhhkkko.',
    '...okhhhhkhhhhhhkhhkkko.',
    '...okkhhhkkhhhhkkhkkkko.',
    '...okkkhkhkkhkkhkkkkkko.',
    '....okkkkkkkkkkkkkkkko..',
    '....oko.okokkokokoko....',
  ];
  const HERO_HEAD_S = [
    '.......o..oo.o..........',
    '......ohoohhoho.........',
    '....oohhHhhHhhhoo.......',
    '...ohhHHhhhhhhhhho......',
    '..ohhhhhhhhhhhhhHho.....',
    '.ohhhhhhhhhhhhhhhhho....',
    'ohkhhhhhhhhhhkhkhkhko...',
    '.ohkhhhhhhhhkhSkSkSko...',
    'ohkkhhhhhhhkSSSSSSSSo...',
    '.okkkhhhhhhkSSSSSeeSSo..',
    '..okkhhhhhkSSSSSSewSSSo.',
    '..okkkhhhkdSSSSSSSSnSo..',
    '...okkkkkdsSSSSSSSSlo...',
    '....oookkodssssssssoo...',
  ];
  const HERO_BODY_F = [
    '......oBBBBBbbbbbo......',
    '....oBBBBBbbbbbbbbpo....',
    '...oAAbBbbbbbbbbbpAao...',
    '.oAAAAAAAAbBbpAAAMMaaqo.',
    '.oAAAAAAAAbbbpAMMaaaqqo.',
    '.oAAAAAAAAAppMMAaaqaqqo.',
    '.oBBbAAAAAAMMAAaaaqbppo.',
    '.oCCCCcoAMMAAAaaaaqbppo.',
    '.oCccccoMAAAAaaaaqqbppo.',
    '.oCcccroaaaaaaaaaqqSSdo.',
    '.orrrrroMMMMmMMMMMMSddo.',
    '.ooooooCCCCcCCccro......',
    '......oCCCccoCccro......',
    '......oCSAccoCccro......',
    '......oCCCccoCccro......',
    '......oTTTttoTttuo......',
    '.....oTTTttuoTTttuo.....',
    '.....oooooooooooooo.....',
  ];
  const HERO_BODY_B = [
    '......oBBBBBbbbbbo......',
    '....oBBBBBbbbbbbbbpo....',
    '...oAABBbbbbbbbbbpAao...',
    '.oAAAAMMAAAAAAAaaaqaaqo.',
    '.oAAAAAAMMAAAAAaaaqaqqo.',
    '.oAAAAAAAAMMAAAaaaqaqqo.',
    '.oBBbAAAAAAAMMAaaaqbppo.',
    '.oBBbAAAAAAAAAMMoCCCCco.',
    '.oBBbAAAAAAAAAAMoCcccco.',
    '.oSSdaaaaaaaaaaaoCccrco.',
    '..ooMMMMMMMMMMMMorrrrro.',
    '......oCCCCcCCccrooooo..',
    '......oCCCccoCccro......',
    '......oCCCccoCccro......',
    '......oCCCccoCccro......',
    '......oTTTttoTttuo......',
    '.....oTTTttuoTTttuo.....',
    '.....oooooooooooooo.....',
  ];
  const HERO_BODY_S = [
    '........oBBBBBbbbo......',
    '.......oBBBBBbbbbbpo....',
    '......oAABBbbbbbbpAo....',
    '.....oAAAoAAAaoMaqo.....',
    '.....oAAAoAAAaoaaqo.....',
    '.....oAAAoAAAaoaaqo.....',
    '...oCCCCooBBBboaaqo.....',
    '...oCcccMoBBBboaaqo.....',
    '...oCccccoBBbpoaqqo.....',
    '...oCccroo SSSdoaqqo....'.replace(' ', ''),
    '...oooooMMMMMMMMMMo.....',
    '.......oCCCCcccro.......',
    '.......oCCCCcccro.......',
    '.......oCCCCcccro.......',
    '.......oCCCCcccro.......',
    '.......oTTTTtttuo.......',
    '.......oTTTTttttuuo.....',
    '.......oooooooooooo.....',
  ];
  const SIDE_STRIDE = [ // substitui as 7 últimas linhas (pernas) na passada lateral
    '......oCCCccCCCcro......',
    '.....oCCCcro.oCCcro.....',
    '.....oCCcro...oCCcro....',
    '....oCCcro.....oCCcro...',
    '....oTTtuo.....oTTTuo...',
    '...oTTttuo.....oTTTttuo.',
    '...ooooooo.....oooooooo.',
  ];

  // ---------------- NPCs: cabeça base + corpo base + cabelo/chapéu por estilo ----------------
  const HEAD_F = [
    '........................',
    '........................',
    '........oooooooo........',
    '......ooSSSSSSSSoo......',
    '.....oSSSSSSSSSSSSo.....',
    '....oSSSSSSSSSSSSSso....',
    '....oSSSSSSSSSSSSSso....',
    '....oSSSSSSSSSSSSSso....',
    '....oSSSSSSSSSSSSSdo....',
    '....oSSSeeSSSSeeSSdo....',
    '....oSSSewSSSSewSSdo....',
    '....oSnSSSSSSSSSnSdo....',
    '.....odsSSSllSSSsdo.....',
    '......oodssssssdoo......',
  ];
  const HEAD_B = HEAD_F.map(r => r.replace(/[ewln]/g, 'S'));
  const HEAD_S = [
    '........................',
    '........................',
    '.........oooooo.........',
    '.......ooSSSSSSoo.......',
    '......oSSSSSSSSSSo......',
    '.....oSSSSSSSSSSSSo.....',
    '.....oSSSSSSSSSSSSSo....',
    '.....oSSSSSSSSSSSSSo....',
    '.....oSSSSSSSSSSSSSo....',
    '.....odSSSSSSSSeeSSo....',
    '.....odSSSSSSSSewSSSo...',
    '.....odSSSSSSSSSSnSo....',
    '......odsSSSSSSSSlo.....',
    '.......oodssssssoo......',
  ];
  const TUNIC_F = [
    '......ooAAAAAAAAoo......',
    '.....oAAAAAAAAAAaao.....',
    '...ooAAAAAAAAAAAAaaoo...',
    '.oAAABBbAAAAAAAAbbpaaqo.',
    '.oAAABBbAAAAAAAAbbpaqqo.',
    '.oAAABBbAAAAAAAAbbpaqqo.',
    '.oAAABBbAAAAAAAAbbpaqqo.',
    '.oaaqBBbAAAAAAAAbbpaqqo.',
    '.oSSdBBbAAAAAAAAbbpSddo.',
    '...oMMMMMMmMMMMMMMMo....',
    '....oAAAAAAAAAAaaaqo....',
    '....oaaaaaaaaaaaqqqo....',
    '......oCCCccoCccro......',
    '......oCCCccoCccro......',
    '......oTTTttoTttuo......',
    '......oTTTttoTttuo......',
    '.....oTTTttuoTTttuo.....',
    '.....oooooooooooooo.....',
  ];
  const TUNIC_B = TUNIC_F.map((r, i) => i >= 3 && i <= 8 ? r.slice(0, 5) + 'BBBBBBBBBBBBbp' + r.slice(19) : r).map(r => r.replace('m', 'M'));
  const TUNIC_S = [
    '........ooAAAAAoo.......',
    '.......oAAAAAAAaao......',
    '......oBAAAAAAAAbpo.....',
    '.....oBBoAAAaoAbpo......',
    '.....oBBoAAAaoAbpo......',
    '.....oBBoAAAaoAbpo......',
    '.....oBBoAAAaoAbpo......',
    '.....oBBoSSSdoAbpo......',
    '.....oBBbAAAAAbpo.......',
    '.....oMMMMMMMMMMo.......',
    '.....oAAAAAAAaaqo.......',
    '.....oaaaaaaaqqqo.......',
    '.......oCCCCcccro.......',
    '.......oCCCCcccro.......',
    '.......oTTTTtttuo.......',
    '.......oTTTTtttuo.......',
    '.......oTTTTttttuuo.....',
    '.......oooooooooooo.....',
  ];
  const DRESS_F = TUNIC_F.slice(0, 10).concat([
    '....oAAAAAAAAAAaaaqo....',
    '...oAAAAAAAAAAAaaaqqo...',
    '...oAAAAAAAAAAaaaaqqo...',
    '..oAAAAAAAAAAAaaaaqqqo..',
    '..oaaaaaaaaaaaaaaaqqqo..',
    '..oooooooooooooooooooo..',
    '.......oTTtoTTto........',
    '.......oooo.oooo........',
  ]);
  const DRESS_B = TUNIC_B.slice(0, 10).concat(DRESS_F.slice(10));
  const DRESS_S = TUNIC_S.slice(0, 10).concat([
    '.....oAAAAAAAaaqo.......',
    '....oAAAAAAAAAaaqqo.....',
    '....oAAAAAAAAAAaaqqo....',
    '...oAAAAAAAAAAAaaqqqo...',
    '...oaaaaaaaaaaaaaqqqo...',
    '...ooooooooooooooooo....',
    '........oTTtoTTto.......',
    '........oooo.oooo.......',
  ]);

  const HAIR = {
    long: {
      f: ['........................', '........oooooooo........', '......oohhHHHHhhoo......', '.....ohHHHhhhhHHHho.....', '....oXXXXXXXXXXXXXXo....',
        '....ohhhhhhkkhhhhhhho...', '...ohhhhhkk..kkhhhhho...', '...ohhhkk......kkhhho...', '...ohhk..........khho...', '...ohk............kho...',
        '...ohk............kho...', '...ohh............hho...', '...ohh............hho...', '...ohhh..........hhho...', '...ohhho........ohhho...',
        '...ohhko........okhho...', '...okkko........okkko...', '....ooo..........ooo....'],
      b: ['........................', '........oooooooo........', '......oohhHHHHhhoo......', '.....ohHHHhhhhHHHho.....', '....oXXXXXXXXXXXXXXo....',
        '....ohhhhhhhhhhhhhhho...', '...ohhhhhhhhhhhhhhhho...', '...ohhHhhhhhhhhhhhkho...', '...ohhhhhhhhhhhhhhkho...', '...ohhhhhhhhhhhhhhkho...',
        '...ohhhhhhhhhhhhhhkho...', '...ohhhhhhhhhhhhhhkho...', '...ohhhhhhhhhhhhhhkho...', '...ohhkhhhhhhhhhkhkho...', '...ohhkhhhhhhhhhkhkho...',
        '...okkhkkhhhhkkhkkko....', '....ookookkkkookkoo.....'],
      s: ['........................', '........oooooo..........', '......oohhHHHhoo........', '.....ohHHHhhhhHHho......', '....oXXXXXXXXXXXXo......',
        '....ohhhhhhhhhhhhhko....', '....ohhhhhhhhhkhkk.o....', '....ohhhhhhhhk.k........', '....ohhhhhhhk...........', '....ohhhhhhk............',
        '....ohhhhhhk............', '....ohhhhhhk............', '....ohhhhhhk............', '....ohhhhhhk............', '....ohhhhhhko...........',
        '....ohhhhhko............', '....okhkkko.............', '.....oooo...............'],
    },
    hat: {
      f: ['........................', '........oooooooo........', '......ooYYYYYYyyoo......', '.....oYYYYYYYyyyyyo.....', '.....oXXXXXXXXXXXXo.....',
        '...ooYYYYYYYYyyyyyyoo...', '.ooYYYYYYYYYyyyyyyyyzzo.', '..oooozzzzzzzzzzzzoooo..', '....okhkhhkhhkhhkhko....', '....ok............ko....',
        '....ok............ko....'],
      b: ['........................', '........oooooooo........', '......ooYYYYYYyyoo......', '.....oYYYYYYYyyyyyo.....', '.....oXXXXXXXXXXXXo.....',
        '...ooYYYYYYYYyyyyyyoo...', '.ooYYYYYYYYYyyyyyyyyzzo.', '..oooozzzzzzzzzzzzoooo..', '....okhhhhhhhhhhhhko....', '....okhhhhhhhhhhhkko....',
        '....okhhhhhhhhhhhkko....', '....okkhhhhhhhhhkkko....', '.....okkkkkkkkkkkko.....', '......oooooooooooo......'],
      s: ['........................', '.......oooooooo.........', '......oYYYYYYyyo........', '.....oYYYYYYyyyyo.......', '.....oXXXXXXXXXXo.......',
        '...ooYYYYYYYYyyyyoo.....', '..oYYYYYYYYYYyyyyyyzo...', '...ooozzzzzzzzzzzooo....', '.....ohhhhhhkh..........', '.....ohhhhhhk...........',
        '.....ohhhhhk............', '.....ohhhhk.............', '......okkko.............'],
    },
    old: {
      f: ['', '', '', '', '', '...ohhho........ohhho...', '...ohhh..........hhho...', '...ohhh..........hhho...', '...ohhh.HHH..HHH.hhho...', '...ohh............hho...',
        '...ohh............hho...', '...ohhHHH......HHHhho...', '....ohHHHHHhhHHHHHho....', '....ohHHHHHHHHHHHhho....', '.....ohHHHHHHHHHhho.....',
        '......ohHHHHHHhhho......', '.......oohhhhhhoo.......'],
      b: ['', '', '', '', '', '...ohhho........ohhho...', '...ohhhSSSSSSSSSShhho...', '...ohhhhhhhhhhhhhhhho...', '...ohhhhhhhhhhhhhhhho...', '...ohhhhhhhhhhhhhhkho...',
        '...ohhhhhhhhhhhhhhkho...', '...ohhhhhhhhhhhhhkkho...', '....okhhhhhhhhhhhkko....', '.....okkkkkkkkkkkko.....'],
      s: ['', '', '', '', '', '', '.....ohhh...............', '.....ohhhh..............', '.....ohhhh....HHH.......', '.....ohhhh..............',
        '.....ohhhh..............', '.....ohhh.......HHo.....', '......oh.....HHHHHo.....', '.......o...HHHHHHo......', '..........oHHHHHo.......',
        '...........ooooo........'],
    },
    helmet: {
      f: ['...........oo...........', '..........oXXo..........', '.......ooooXXoooo.......', '.....ooGGGGGGGGgggoo....', '....oGGGGGGGGGggggggo...',
        '....oGGGGGGgggggggvvo...', '...oggggggggggggggvvvo..', '...ooooooooooooooooooo..', '....ov............vo....', '....ov............vo....',
        '....ov............vo....', '.....o............o.....'],
    },
    kerchief: {
      f: ['........................', '........oooooooo........', '......ooXXXXXXxxoo......', '.....oXXXXXXXXxxxxo.....', '....oXXXWXXXXWXxxxxo....',
        '....oxxxxxxxxxxxxxxxo...', '...ohhoooooooooooohhho...', '...ohh............hho...', '...ohh............hho...', '...ohh............hho...',
        '...ohh............hho...', '...ohh............hho...', '....oh............ho....', '.....o............o.....'],
    },
    cap: {
      f: ['........................', '........................', '........oooooooo........', '......ooXXXXXXxxoo......', '.....oXXXXXXXXxxxxo.....',
        '.....oXXXXXXXxxxxxxooo..', '....ooxxxxxxxxxxxxxxxxo.', '....ohhhkhhhkhhhhooooo..', '....ohk..........kho....', '....oh............ho....'],
    },
  };

  const BASE_PAL = { o: '#20141c', S: '#f6d2b4', s: '#e2a888', d: '#b87a66', n: '#eaa0a0', l: '#a8564e', e: '#1e1420', w: '#7a6a5a', W: '#f6f0e4' };
  function overlay(base, top) {
    const out = base.slice();
    top.forEach((row, y) => {
      if (!row) return;
      const b = (out[y] || '.'.repeat(W)).split('');
      row.padEnd(W, '.').split('').forEach((ch, x) => { if (ch !== '.') b[x] = ch; });
      out[y] = b.join('');
    });
    return out;
  }
  // levanta um pé (metade esquerda ou direita) para a passada
  function liftLeg(rows, from, left) {
    const out = rows.map(r => r.split(''));
    const x0 = left ? 0 : 12, x1 = left ? 12 : 24;
    for (let y = from; y < rows.length; y++) for (let x = x0; x < x1; x++) out[y][x] = y + 1 < rows.length ? rows[y + 1][x] : '.';
    return out.map(r => r.join(''));
  }
  // contorno colorido: cada pixel de contorno pega um tom escuro do material vizinho
  function hex(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
  function selOut(rows, pal) {
    const p = new Pix(W, rows.length), at = (x, y) => (rows[y] || '')[x] || '.';
    for (let y = 0; y < rows.length; y++) for (let x = 0; x < W; x++) {
      const ch = at(x, y);
      if (ch === '.') continue;
      if (ch !== 'o') { p.set(x, y, pal[ch] || '#ff00ff'); continue; }
      let n = null;
      for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) { const c = at(x + dx, y + dy); if (c !== '.' && c !== 'o' && pal[c]) { n = pal[c]; break; } }
      if (!n) { p.set(x, y, pal.o); continue; }
      const [r, g2, b] = hex(n);
      const outer = [[0, -1], [-1, 0], [1, 0], [0, 1]].some(([dx, dy]) => at(x + dx, y + dy) === '.');
      const k = outer ? 0.28 : 0.45;
      p.set(x, y, '#' + [r * k + 10, g2 * k + 4, b * k + 16].map(v => Math.min(255, v | 0).toString(16).padStart(2, '0')).join(''));
    }
    return p;
  }

  const HERO_PAL = Object.assign({}, BASE_PAL, {
    H: '#4a3d58', h: '#241c2c', k: '#120c16', w: '#8c94ac',
    A: '#f4e8d2', a: '#d8c6a8', q: '#a8927a', B: '#d6b07a', b: '#b08850', p: '#7e5e38',
    C: '#6e6a4c', c: '#55523b', r: '#3a3828', T: '#d8b07e', t: '#a8804e', u: '#6e5034', M: '#3a2a24', m: '#9a9aa6',
  });
  function hero(view, f) {
    let rows;
    if (view === 'front') rows = HERO_HEAD_F.concat(HERO_BODY_F);
    else if (view === 'back') rows = HERO_HEAD_B.concat(HERO_BODY_B);
    else rows = HERO_HEAD_S.concat(f === 1 ? HERO_BODY_S.slice(0, 11).concat(SIDE_STRIDE) : HERO_BODY_S);
    rows = g(rows);
    if (view !== 'side' && f) rows = liftLeg(rows, 25, f === 1);
    return selOut(rows, HERO_PAL);
  }
  function npc(cfg, view, f) {
    const body = cfg.dress ? { front: DRESS_F, back: DRESS_B, side: DRESS_S }[view] : { front: TUNIC_F, back: TUNIC_B, side: TUNIC_S }[view];
    const head = { front: HEAD_F, back: HEAD_B, side: HEAD_S }[view];
    let rows = g(head.concat(body));
    if (view === 'side' && f === 1 && !cfg.dress) rows = rows.slice(0, 25).concat(SIDE_STRIDE.slice(1));
    const hair = HAIR[cfg.style][view === 'front' ? 'f' : view === 'back' ? 'b' : 's'];
    if (hair) rows = overlay(rows, hair);
    if (view !== 'side' && f) rows = liftLeg(rows, cfg.dress ? 30 : 26, f === 1);
    if (cfg.kid) rows = rows.slice(0, 15).concat(rows.slice(18, 22), rows.slice(25));
    const p = selOut(rows, Object.assign({}, BASE_PAL, cfg.pal));
    if (cfg.spear) { p.rect(21, 3, 1, 28, '#7a5038'); p.rect(22, 3, 1, 28, '#4f3426'); p.rect(21, 0, 2, 3, '#e6eaf0'); p.set(21, 0, '#ffffff'); p.rect(20, 25, 3, 2, '#e2a888'); }
    return p;
  }
  return { hero, npc };
}
if (typeof module !== 'undefined') module.exports = buildChars;
const NPC_CFG = {
  lia: { style: 'long', dress: true, pal: { X: '#c2343a', H: '#c87a48', h: '#8a4428', k: '#5a2418', A: '#f2cc4a', a: '#c9a42c', q: '#8a6a1a', B: '#f2cc4a', b: '#c9a42c', p: '#8a6a1a', M: '#7a3a22', m: '#f6e09a', T: '#8a5a3a', t: '#6a4028', u: '#4a2a1a', w: '#5a8a6a' } },
  caio: { style: 'hat', pal: { Y: '#f0d488', y: '#c9a24a', z: '#8a6a2a', X: '#b03a2e', H: '#7a5038', h: '#4a2e22', k: '#2a1a14', A: '#78a8cf', a: '#4776ad', q: '#2f4f86', B: '#a8744e', b: '#7a5038', p: '#4f3426', C: '#5a4a3a', c: '#3e342a', r: '#2a241e', T: '#6a4a32', t: '#4a3222', u: '#2e1e14', M: '#2b1d18', m: '#c9a24a', w: '#6a5040' } },
  joaquim: { style: 'old', pal: { H: '#f0f0f6', h: '#c0c0cc', k: '#8a8a98', S: '#eec4a2', A: '#e8dcc0', a: '#c8b896', q: '#9a8a6a', B: '#6a4a3a', b: '#4a3228', p: '#2e1e18', C: '#5a5048', c: '#403830', r: '#2a2420', T: '#5a3a28', t: '#3e281c', u: '#28180e', M: '#2b1d18', m: '#c9a24a', w: '#5a6a8a' } },
  guard: { style: 'helmet', spear: true, pal: { G: '#e6eaf0', g: '#a8adb8', v: '#5a5e6c', X: '#d8483e', A: '#c8443a', a: '#9a2a2e', q: '#5e1a22', B: '#c8ccd6', b: '#8a8e9c', p: '#4a4c5a', C: '#4a3a30', c: '#33281f', r: '#201812', T: '#4a3a30', t: '#33281f', u: '#1a120c', M: '#3a2a24', m: '#e8c050', w: '#4a5a7a' } },
  rosa: { style: 'kerchief', dress: true, pal: { X: '#d8483e', x: '#9a2a2e', H: '#8a5a3a', h: '#5a3a26', k: '#3a2418', A: '#f2ece4', a: '#cfc3bb', q: '#8a7a72', B: '#a8744e', b: '#7a5038', p: '#4f3426', M: '#7a5038', m: '#f2c45a', T: '#6a4a32', t: '#4a3222', u: '#2e1e14', w: '#6a4a3a' } },
  tito: { style: 'cap', kid: true, pal: { X: '#6aa058', x: '#3e7038', H: '#a86a3a', h: '#7a4628', k: '#4a2a18', A: '#f2c45a', a: '#c98a2c', q: '#8a4f22', B: '#4776ad', b: '#2f4f86', p: '#1e2f5e', C: '#4776ad', c: '#2f4f86', r: '#1e2f5e', T: '#7a5038', t: '#4f3426', u: '#2b1d18', M: '#2f4f86', m: '#f2c45a', w: '#6a4a3a' } },
};
