// Monster Quest — sprites v2 (32x40, vista 3/4, 8 direções) e retratos (48x48) para os diálogos.
// Sprites: desenhados à mão em grade de letras (slots de cor) + contorno colorido automático.
// Retratos: rosto sombreado + mechas de cabelo desenhadas como "tufos" afinados (curvas) com 4 tons.
function buildSprites2(Pix) {
  const W = 32;
  const fit = (rows, w = W) => rows.map(r => { if (r.length > w) throw new Error('linha longa (' + r.length + '): ' + r); return r.padEnd(w, '.'); });
  const hex = c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
  const toHex = a => '#' + a.map(v => Math.max(0, Math.min(255, v | 0)).toString(16).padStart(2, '0')).join('');
  const dark = (c, k, add = [10, 4, 18]) => { const [r, g, b] = hex(c); return toHex([r * k + add[0], g * k + add[1], b * k + add[2]]); };

  function render(rows, pal) {
    const p = new Pix(W, rows.length), at = (x, y) => (rows[y] || '')[x] || '.';
    for (let y = 0; y < rows.length; y++) for (let x = 0; x < W; x++) {
      const ch = at(x, y); if (ch === '.') continue;
      if (ch !== 'o') { p.set(x, y, pal[ch] || '#ff00ff'); continue; }
      let n = null;
      for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) { const c = at(x + dx, y + dy); if (c !== '.' && c !== 'o' && pal[c]) { n = pal[c]; break; } }
      const outer = [[0, -1], [-1, 0], [1, 0], [0, 1]].some(([dx, dy]) => at(x + dx, y + dy) === '.');
      p.set(x, y, n ? dark(n, outer ? 0.3 : 0.5) : pal.o);
    }
    return p;
  }
  function liftLeg(rows, from, left) {
    const out = rows.map(r => r.split('')), x0 = left ? 0 : 16, x1 = left ? 16 : 32;
    for (let y = from; y < rows.length; y++) for (let x = x0; x < x1; x++) out[y][x] = y + 1 < rows.length ? rows[y + 1][x] : '.';
    return out.map(r => r.join(''));
  }
  function hairBehind(rows, y0, y1, left, right, L = 'h', D = 'k', E = 'K') {
    const out = rows.map(r => r.split(''));
    for (let y = y0; y <= y1; y++) {
      const tail = y > y1 - 2;
      [[left, [ 'o', E, L, D ]], [right, [D, L, E, 'o']]].forEach(([x0, seq]) => seq.forEach((c, i) => { const x = x0 + i; if (out[y][x] === '.' && !(tail && (i === 0 || i === 3))) out[y][x] = c; }));
    }
    return out.map(r => r.join(''));
  }

  // ======================= PROTAGONISTA =======================
  const HERO_S = [
    '..............oo.o..............',
    '..........o..ohKoKo..o..........',
    '.........oKooKhhhhKooKo.........',
    '........oKhKKhhhhhhKKhKo........',
    '.......oKhhhhHHHhhhhhhhKo.......',
    '......oKhhhHHhhhhHHhhhhhKo......',
    '.....oKhhhHhhhhhhhhHhhhhhKo.....',
    '.....oKhhhhhhhhhhhhhhhhhhKo.....',
    '....oKKhhhhhhkhhhhhkhhhhhKKo....',
    '....oKhhhkhhkkhhhhkkhhkhhhKo....',
    '...oKKhhkkhkkSkhhkSkkhkkhhKKo...',
    '...oKhhkkSkkSSSkkSSSkkSkkhhKo...',
    '...oKhkkSSSSSSSSSSSSSSSSkkhKo...',
    '...oKkkSSSSSSSSSSSSSSSSSSkkKo...',
    '...oKkSSSeeeSSSSSSSSeeeSSSkKo...',
    '...oKkSSSeijSSSSSSSSeijSSSkKo...',
    '....oKSnSSSSSSSSSSSSSSSSnSKo....',
    '.....oKdSSSSSSSllSSSSSSSdKo.....',
    '......oodsSSSSSSSSSSSSsdoo......',
    '........oodssssssssssdoo........',
    '.........oBBBBBbbbbbbbo.........',
    '.......oBBBBBBbbbbbbbbbpo.......',
    '.....oAABbBbbbbbbbbbbbppaao.....',
    '....oAAAApBBbbbbbbbbbppaaaqo....',
    '....oAAAAAAABBbpAAAAaMMaaaqo....',
    '....oAAAAAAABbbpAAAMMaaaaqqo....',
    '....oAAAaAAAbbppAMMAaaqaaqqo....',
    '....oBBBbAAAApMMAAaaaaqbbppo....',
    '....oBBBbAAAAMMAAAaaaaqbbppo....',
    '...oCCCCCcoMMAAAAaaaaaqbbppo....',
    '...oCcccccMAAAAAaaaaaqqbbppo....',
    '...oCcccrcoaaaaaaaaaqqqSSsdo....',
    '...orrrrrroMMMMMmMMMMMMsddo.....',
    '...ooooooooCCCCCcCCcccro........',
    '..........oCCCCcoCCccro.........',
    '..........oCSAccoCCccro.........',
    '..........oCCCccoCccrro.........',
    '..........oTTTttoTTttuo.........',
    '.........oTTTttuoTTttuuo........',
    '.........oooooooooooooo.........',
  ];
  const HERO_N = HERO_S.slice(0, 10).concat([
    '...oKKhhhhhhhhhhhhhhhhhhhKKo....',
    '...oKhhhHhhhhhhhhhhhHhhhhhKo....',
    '...oKhhhhhhhhhhhhhhhhhhhhkKo....',
    '...oKkhhhhhhkhhhhhhkhhhhhkKo....',
    '...oKkkhhhhkkhhhhhkkhhhhkkKo....',
    '...oKkkkhhkkkkhhhkkkkhhkkkKo....',
    '....oKkkkkkkkkkkkkkkkkkkkKo.....',
    '.....oKKkkKkkkKKkkkKkkkKKo......',
    '......ooKKoKKKooKKKoKKoo........',
    '........oodssssssssssdoo........',
    '.........oBBBBBbbbbbbbo.........',
    '.......oBBBBBBbbbbbbbbbpo.......',
    '.....oAABBBbbbbbbbbbbbppaao.....',
    '....oAAAApBBbbbbbbbbbppaaaqo....',
    '....oAAAAAMMAAAAAAAAaaaqaaqo....',
    '....oAAAAAAAMMAAAAAAaaaqaqqo....',
    '....oAAAaAAAAAMMAAAAaaaqaqqo....',
    '....oBBBbAAAAAAAMMAAaaaqbppo....',
    '....oBBBbAAAAAAAAAMMaaaqbppo....',
    '....oBBBbAAAAAAAAAAAMoCCCCCco...',
    '....oBBBbAAAAAAAAAAaMoCccccco...',
    '....oSSsdaaaaaaaaaaaqoCcccrco...',
    '....oSddoMMMMMMMMMMMooorrrrro...',
    '..........oCCCCCcCCccoooooo.....',
    '..........oCCCCcoCCccro.........',
    '..........oCCCCcoCCccro.........',
    '..........oCCCccoCccrro.........',
    '..........oTTTttoTTttuo.........',
    '.........oTTTttuoTTttuuo........',
    '.........oooooooooooooo.........',
  ]);
  const HERO_E = [
    '...............oo.o.............',
    '...........o..ohKoKo............',
    '..........oKooKhhhhKoo..........',
    '........ooKhKKhhhhhhKKo.........',
    '.......oKhhhhhHHHhhhhhKo........',
    '......oKhhhhHHhhhhHhhhhKo.......',
    '.....oKhhhhHhhhhhhhhHhhhKo......',
    '....oKhhhhhhhhhhhhhhhhhhhKo.....',
    '...oKhhhhhhhhhhhhhhhhkhhhhKo....',
    '..oKKhhhhhhhhhhhhhkhhkkhhkKo....',
    '..oKhhhhhhhhhhhhkkSkkSkkhkKo....',
    '.oKKhhhhhhhhhhhkSSSSSSSkkKKo....',
    '..oKhhhhhhhhhhkSSSSSSSSSSKo.....',
    '.oKKkhhhhhhhhkSSSSSSSSSSSSo.....',
    '..oKkkhhhhhhkSSSSSSSSeeeSSSo....',
    '..oKkkkhhhhkdSSSSSSSSeijSSSSo...',
    '...oKkkkkkkdSSSSSSSSSSSSnSSo....',
    '....oKKkkKkodsSSSSSSSSSSSlSo....',
    '.....ooKKooodssSSSSSSSSSsoo.....',
    '...........oodssssssssoo........',
    '............oBBBBBbbbbo.........',
    '..........oBBBBBBbbbbbpo........',
    '.........oAABBBbbbbbbppAo.......',
    '........oAAAAApbbbbppaqo........',
    '........oAAAAoAAAAoMaaqo........',
    '........oAAAAoAAAaoaaaqo........',
    '........oAAAAoAAAaoaaaqo........',
    '...oCCCCcMAAAoBBBboaaaqo........',
    '...oCccccMAAAoBBBboaaaqo........',
    '...oCccccc.AAoBBbpoaaqqo........',
    '...oCcccrcaaaoSSSdoaaqqo........',
    '...orrrrroMMMoSddoMMMMo.........',
    '..........oCCCCCCcccro..........',
    '..........oCCCCCCcccro..........',
    '..........oCCCCCCcccro..........',
    '..........oCCCCCcccrro..........',
    '..........oCCCCCcccrro..........',
    '..........oTTTTTtttuuo..........',
    '..........oTTTTTTtttuuuo........',
    '..........oooooooooooooo........',
  ];
  const E_STRIDE = [
    '.........oCCCCcoCCCccro.........',
    '........oCCCcro..oCCccro........',
    '.......oCCCcro....oCCccro.......',
    '......oCCCcro......oCCcrro......',
    '......oTTTtuo......oTTTtuo......',
    '.....oTTTttuo......oTTTTttuo....',
    '.....ooooooo.......ooooooooo....',
  ];
  const swapRows = (base, from, rows) => base.slice(0, from).concat(rows, base.slice(from + rows.length));
  const HERO_SE = swapRows(HERO_S, 10, [
    '...oKKhhhkkhkkhkkSkkSkkhkhKKo...',
    '...oKhhhkkhkkSkkSSSkSSkkSkKo....',
    '...oKhhkkkSSSSSSSSSSSSSSSkKo....',
    '...oKhkkSSSSSSSSSSSSSSSSSSKo....',
    '...oKkkSSSSSeeeSSSSSeeeSSSKo....',
    '...oKkkSSSSSeijSSSSSeijSSSSo....',
    '....oKkdSSnSSSSSSSSSSSSnSSo.....',
    '.....oKkdSSSSSSSSSllSSSSSo......',
    '......oodssSSSSSSSSSSSSsoo......',
  ]);
  const HERO_NE = swapRows(HERO_N, 12, [
    '...oKhhhhhhhhhhhhhhhhhhhkSKo....',
    '...oKkhhhhhhkhhhhhhkhhhkSSKo....',
    '...oKkkhhhhkkhhhhhkkhhkSSSo.....',
    '...oKkkkhhkkkkhhhkkkkhkdSSo.....',
    '....oKkkkkkkkkkkkkkkkkkdso......',
  ]);
  const HERO_PAL = {
    o: '#1a1018', K: '#0e0b14', k: '#1c1724', h: '#2e2638', H: '#5a4e70',
    S: '#f6d2b4', s: '#e6b090', d: '#c08470', n: '#ee9c98', l: '#a8564e', e: '#160e16', i: '#4a5878', j: '#9aa8c8',
    A: '#f4e8d2', a: '#d8c6a8', q: '#a8927a', B: '#d6b07a', b: '#b08850', p: '#7e5e38',
    C: '#6e6a4c', c: '#55523b', r: '#3a3828', T: '#d8b07e', t: '#a8804e', u: '#6e5034', M: '#3a2a24', m: '#a8a8b4',
  };
  const HERO = { S: HERO_S, SE: HERO_SE, E: HERO_E, NE: HERO_NE, N: HERO_N };
  function hero(dir, f = 0) {
    const mir = dir === 'W' || dir === 'SW' || dir === 'NW', base = { W: 'E', SW: 'SE', NW: 'NE' }[dir] || dir;
    let rows = fit(HERO[base]);
    if (f && base === 'E') rows = f === 1 ? swapRows(rows, 33, E_STRIDE) : rows;
    else if (f) rows = liftLeg(rows, 33, f === 1);
    const p = render(rows, HERO_PAL);
    return mir ? p.mirror() : p;
  }

  // ======================= MENINA (cabelo azul-marinho) =======================
  const GIRL_S = [
    '..............oo................',
    '...........ooKhhKoo.............',
    '.........ooKhhhhhhhKoo..........',
    '........oKhhhHHHhhhhhhKo........',
    '.......oKhhHHhhhhHHhhhhKo.......',
    '......oKhhHhhhhhhhhhHhhhKo......',
    '.....oKhhhhhhhhhhhhhhhhhhKo.....',
    '.....oKhhhhhkhhhhhhkhhhhhKo.....',
    '....oKhhhhhkkhhhhhkkhhhhhhKo....',
    '....oKhhhkkhkkhhhkkhkkhhhhKo....',
    '...oKhhhkkSkkhhhkkSSkkkhhhhKo...',
    '...oKhhkkSSSkkhkkSSSSSkkhhhKo...',
    '...oKhkkSSSSSSSSSSSSSSSSkkhKo...',
    '...oKhkSSSSSSSSSSSSSSSSSSkhKo...',
    '...oKhkSSSeeeSSSSSSSSeeeSSkhKo..',
    '...oKhkSSSeijSSSSSSSSeijSSkhKo..',
    '...oKhkSnSSSSSSSSSSSSSSSnSkhKo..',
    '...oKhhkdSSSSSSllSSSSSSdkhhKo...',
    '...oKhhkoodsSSSSSSSSSsdookhhKo..',
    '...oKhhko.oodssssssdoo.okhhKo...',
    '............odSSSSdo............',
    '...........oXXxXXxXXo...........',
    '.......ooAAAoSSSSSoAAAoo........',
    '.....oAAAAAAAAAAAAAAAAAAaao.....',
    '....oAAAAoAAAAAAAAAAAaaoaaqo....',
    '....oAAAAoAAAAAAAAAAaaaoaaqo....',
    '....oAAAaoAAAAAAAAAaaaqoaqqo....',
    '....oAAAaoaaaaaaaaaaaqqoaqqo....',
    '....oAAAaooSSSSSSSSSsddoaqqo....',
    '....oAAAao.oSSSSdSSsdo.oaqqo....',
    '....oSSsdooCCCCCCCCccrooSsdo....',
    '....oddoo.oCCCCCcCCccro.oodo....',
    '..........oCCCcrooCCcro.........',
    '..........oSSsdo.oSSdo..........',
    '..........oSSsdo.oSSdo..........',
    '..........oTTtuo.oTtuo..........',
    '..........oTTtuo.oTtuo..........',
    '..........oTTtuo.oTtuo..........',
    '.........oTTTtuo.oTTtuo.........',
    '.........ooooooo.ooooooo........',
  ];
  const GIRL_PAL = {
    o: '#10101c', K: '#141a33', k: '#232c52', h: '#33407a', H: '#5a6eb4',
    S: '#f8dcc8', s: '#ecbca4', d: '#cc9484', n: '#f2a4a8', l: '#b0606a', e: '#14182c', i: '#2f6ab0', j: '#7ac8f8',
    X: '#8a7ab0', x: '#d8ccf0', A: '#f8f6fc', a: '#d8d4e6', q: '#9a94b4',
    C: '#262a44', c: '#1a1d32', r: '#10121f', T: '#2e2836', t: '#1e1a26', u: '#100e16',
  };
  function girl(f = 0) {
    let rows = hairBehind(fit(GIRL_S), 18, 31, 2, 26);
    if (f) rows = liftLeg(rows, 33, f === 1);
    return render(rows, GIRL_PAL);
  }

  // ======================= ELFO (cabelo verde, orelhas pontudas) =======================
  const ELF_S = [
    '...........o..oo.o..............',
    '.........o.oKhoKhKo.o...........',
    '........oKoKhhhhhhKoKo..........',
    '.......oKhKhhhHHhhhhKhKo........',
    '......oKhhhHHhhhhHHhhhhKo.......',
    '.....oKhhhHhhhhhhhhhHhhhKo......',
    '.....oKhhhhhhhhhhhhhhhhhhKo.....',
    '....oKKhhhhhkhhhhhhkhhhhhKKo....',
    '....oKhhhkhhkkhhhhkkhhkhhhKo....',
    '...oKKhhkkhkkSkhhkSkkhkkhhKKo...',
    '...oKhhkkSkkSSSkkSSSkkSkkhhKo...',
    '...oKhkkSSSSSSSSSSSSSSSSkkhKo...',
    '..ooKkkSSSSSSSSSSSSSSSSSSkkKoo..',
    'ooSSoKSSSeeeSSSSSSSSeeeSSSKoSSoo',
    '.odsSoSSSeijSSSSSSSSeijSSSoSsdo.',
    '..oddonSSSSSSSSSSSSSSSSSSnoddo..',
    '...oo.oKdSSSSSSllSSSSSSdKo.oo...',
    '.......oKdsSSSSSSSSSSSsdKo......',
    '........oodssssssssssdoo........',
    '.........oooddssssddooo.........',
    '..........oBBBBBBBBBBo..........',
    '........ooAAAbBBBBBBbAAAoo......',
    '......ooAAAAAAbbbbbbAAAAaaoo....',
    '.....oAAAAAAAAAAAAAAAAAAMaaao...',
    '....oAAAAoAAAAAAAAAAAAMaoaaqo...',
    '....oAAAAoAAAAAAAAAAMAAaoaaqo...',
    '....oAAAAoAAAAAAAAMAAAAaoaaqo...',
    '....oAAAAoAAAAAAMAAAAAaaoaqqo...',
    '....oAAAaoAAAAMAAAAAAaaaoaqqo...',
    '....oAAAaoAAMAAAAAAAaaaqoaqqo...',
    '....oaaqqoaAAAAAAAAaaaqqoqqqqo..',
    '....ooSSoaaaaaaaaaaaqqqqoSSoo...',
    '..........ooooooooooooooo.......',
    '...........oSSSdo.oSSdo.........',
    '...........oXXXXo.oXXXo.........',
    '...........oSSSdo.oSSdo.........',
    '...........oCCCco.oCCco.........',
    '...........oCCCco.oCCco.........',
    '..........oTTTtuo.oTTtuo........',
    '..........oooooooooooooo........',
  ];
  const ELF_PAL = {
    o: '#10181a', K: '#1e3a34', k: '#3a6a5a', h: '#5a9a84', H: '#9ad0b8',
    S: '#f6d8c0', s: '#e8b89c', d: '#c88e78', n: '#f0a0a0', l: '#a8605a', e: '#2a1a10', i: '#a8682a', j: '#f0b050',
    A: '#2c3e3a', a: '#1e2c2a', q: '#141e1c', B: '#b88048', b: '#8a5a32', p: '#5a3a22', M: '#a87040',
    X: '#141414', C: '#1a1a1e', c: '#101014', r: '#08080a', T: '#8a6040', t: '#6a4628', u: '#3e2814',
  };
  function elf(f = 0) { let rows = fit(ELF_S); if (f) rows = liftLeg(rows, 33, f === 1); return render(rows, ELF_PAL); }

  // ======================= MORADORES 32x40 (cabeça por estilo + corpo base) =======================
  const BODY = {
    tunicS: [
      '..........ooAAAAAAAAAAoo........',
      '........ooAAAAAAAAAAAAAAoo......',
      '......ooAAAAAAAAAAAAAAAAaaoo....',
      '....oAAAABBbAAAAAAAAbbpaaaqo....',
      '....oAAAABBbAAAAAAAAbbpaaaqo....',
      '....oAAAABBbAAAAAAAAbbpaaaqo....',
      '....oAAAaBBbAAAAAAAAbbpaaqqo....',
      '....oAAAaBBbAAAAAAAAbbpaaqqo....',
      '....oaaaqBBbAAAAAAAAbbpaqqqo....',
      '....oSSsdBBbAAAAAAAAbbpSsddo....',
      '....osddoMMMMMMmMMMMMMMosddo....',
      '.........oAAAAAAAAAAAaaqo.......',
      '.........oaaaaaaaaaaaaqqo.......',
      '..........oCCCCcoCCccro.........',
      '..........oCCCCcoCCccro.........',
      '..........oCCCccoCccrro.........',
      '..........oTTTttoTTttuo.........',
      '..........oTTTttoTTttuo.........',
      '.........oTTTttuoTTttuuo........',
      '.........oooooooooooooo.........',
    ],
    tunicE: [
      '............ooAAAAAAoo..........',
      '..........ooAAAAAAAAaaoo........',
      '........oBBAAAAAAAAAAbpo........',
      '........oBBAAoAAAAobbpqo........',
      '........oBBAAoAAAAobbpqo........',
      '........oBBAAoAAAaobbpqo........',
      '........oBBAAoAAAaobbpqo........',
      '........oBBAAoAAAaobbpqo........',
      '........oBBAAoSSSdobbpqo........',
      '........oMMMMMMMMMMMMMMo........',
      '........oAAAAAAAAAAaaqqo........',
      '........oaaaaaaaaaaaqqqo........',
    ],
    dressSkirtS: [
      '........oAAAAAAAAAAAAAAaaqo.....',
      '.......oAAAAAAAAAAAAAAAaaaqo....',
      '.......oAAAAAAAAAAAAAAaaaaqo....',
      '......oAAAAAAAAAAAAAAAaaaaqqo...',
      '......oaaaaaaaaaaaaaaaaaqqqqo...',
      '......oooooooooooooooooooooo....',
      '..........oTTtoo.oTTto..........',
      '..........oTTtuo.oTTtuo.........',
      '..........ooooo..ooooo..........',
    ],
    dressSkirtE: [
      '........oAAAAAAAAAAAAaaqo.......',
      '.......oAAAAAAAAAAAAAaaqqo......',
      '.......oAAAAAAAAAAAAAAaaqqo.....',
      '......oAAAAAAAAAAAAAAAaaqqqo....',
      '......oaaaaaaaaaaaaaaaaaqqqo....',
      '......ooooooooooooooooooooo.....',
      '..........oTTtooTTto............',
      '..........oTTtuoTTtuo...........',
      '..........oooooooooo............',
    ],
  };
  BODY.tunicN = BODY.tunicS.map((r, i) => (i >= 3 && i <= 9) ? r.slice(0, 9) + 'BBBBBBBBBBBbbp' + r.slice(23) : r).map(r => r.replace('m', 'M'));
  const LEGS_E = HERO_E.slice(32);
  const HEADS = {
    long: {
      S: GIRL_S.slice(0, 20).map((r, i) => i === 5 ? '......oXXXXXXXXXXXXXXXXXXo......' : r),
      N: ['..............oo................', '...........ooKhhKoo.............', '.........ooKhhhhhhhKoo..........', '........oKhhhHHHhhhhhhKo........', '.......oKhhHHhhhhHHhhhhKo.......',
        '......oXXXXXXXXXXXXXXXXXXo......', '.....oKhhhhhhhhhhhhhhhhhhKo.....', '.....oKhhhHhhhhhhhhhhHhhhKo.....', '....oKhhhhhhhhhhhhhhhhhhhhKo....', '....oKhhhhhhhhhhhhhhhhhhhhKo....',
        '...oKhhhhhhhhhhhhhhhhhhhhhhKo...', '...oKhhhhkhhhhhhhhhhhkhhhhhKo...', '...oKhhhkkhhhhhhhhhhkkhhhhhKo...', '...oKhhhkhhhhhhhhhhhhkhhhhhKo...', '...oKhhkkhhhhhhhhhhhhkkhhhkKo...',
        '...oKhhkhhhhhhhhhhhhhhkhhhkKo...', '...oKhkkhhhhhhhhhhhhhhkkhhkKo...', '...oKhkhhhhhhhhhhhhhhhhkhhkKo...', '...oKkkhhhhhhhhhhhhhhhhkkhkKo...', '...oKkhhhhhhhhhhhhhhhhhhkkKo....'],
      E: ['..............oo................', '...........ooKhhKoo.............', '.........ooKhhhhhhhKo...........', '........oKhhhHHHhhhhKo..........', '.......oKhhHHhhhhHHhhhKo........',
        '......oXXXXXXXXXXXXXXXXo........', '.....oKhhhhhhhhhhhhhhhkkKo......', '.....oKhhhhhhhhhhhhhkSkSkKo.....', '....oKhhhhhhhhhhhhhkSSSSSSo.....', '....oKhhhhhhhhhhhhkSSSSSSSSo....',
        '...oKhhhhhhhhhhhhkSSSSSSSSSo....', '...oKhhhhhhhhhhhkSSSSSSSSSSo....', '...oKhhhhhhhhhhhkSSSSSSSSSSSo...', '...oKhhhhhhhhhhkdSSSSSSSSSSSo...', '...oKhhhhhhhhhhkdSSSSSSeeeSSo...',
        '...oKhhhhhhhhhhkdSSSSSSeijSSSo..', '...oKhhhhhhhhhhkdSSSSSSSSSnSo...', '...oKhhhhhhhhhhkodSSSSSSSSlSo...', '...oKhhhhhhhhhhko.odsSSSSssoo...', '...oKhhhhhhhhhhko...oodssoo.....'],
      backHair: ['......oKhhhhhhhhhhhhhhhhkKo.....', '......oKhhhhhhhhhhhhhhhhkKo.....', '......oKhhhkhhhhhhhhkhhhkKo.....', '......oKhhkkhhhhhhhhkkhhkKo.....', '......oKhhkhhhhhhhhhhkhhkKo.....',
        '......oKhkkhhhhhhhhhhkkhkKo.....', '......oKkkhhhhhhhhhhhhkkkKo.....', '.......oKkkKkkkKKkkkKkkKo......'],
    },
    hat: {
      S: ['................................', '...........oooooooooo...........', '.........ooYYYYYYYyyyoo.........', '........oYYYYYYYYYyyyyyo........', '........oYYYYYYYYyyyyyyo........',
        '........oXXXXXXXXXXXXXXo........', '.....oooYYYYYYYYYYyyyyyyooo.....', '...ooYYYYYYYYYYYYYyyyyyyyyyoo...', '..oYYYYYYYYYYYYYYyyyyyyyyyyyzo..', '...oozzzzzzzzzzzzzzzzzzzzzzoo...',
        '.....oKhkhhkhhkhhkhhkhhkhKo.....', '.....oKkSkkSSkkSSSkkSSkkkKo.....', '.....okSSSSSSSSSSSSSSSSSSko.....', '.....oSSSSSSSSSSSSSSSSSSSso.....', '.....oSSSeeeSSSSSSSSeeeSSso.....',
        '.....oSSSeijSSSSSSSSeijSSso.....', '.....oSnSSSSSSSSSSSSSSSSnso.....', '......odSSSSSSSllSSSSSSSdo......', '.......oodsSSSSSSSSSSSsdoo......', '.........oodssssssssdoo.........'],
      N: null,
      E: ['................................', '...........oooooooooo...........', '.........ooYYYYYYYyyyoo.........', '........oYYYYYYYYYyyyyyo........', '........oYYYYYYYYyyyyyyo........',
        '........oXXXXXXXXXXXXXXo........', '......ooYYYYYYYYYYYyyyyyoo......', '....ooYYYYYYYYYYYYYyyyyyyyoo....', '...oYYYYYYYYYYYYYYYyyyyyyyyyzo..', '....oozzzzzzzzzzzzzzzzzzzzzoo...',
        '.....oKhhhhhhhhkkSkSkSkSko......', '.....oKhhhhhhhkSSSSSSSSSSSo.....', '.....oKhhhhhhkdSSSSSSSSSSSo.....', '.....oKhhhhhkdSSSSSSSSSSSSSo....', '.....oKkhhhhkdSSSSSSSSeeeSSo....',
        '.....oKkkhhhkdSSSSSSSSeijSSSo...', '......oKkkkkodSSSSSSSSSSSnSo....', '.......oKKko.odSSSSSSSSSSlSo....', '...........oodsSSSSSSSSsoo......', '.............oodssssssoo........'],
    },
    old: {
      S: ['', '', '', '', '...........oooooooooo...........', '.........ooSSSSSSSSSSoo.........', '........oSSSSSSSSSSSSSSo........', '.......oSSSSSSSSSSSSSSSSo.......', '......oSSSSSSSSSSSSSSSSSSo......',
        '.....oHhSSSSSSSSSSSSSSSShHo.....', '....oHhhSSSSSSSSSSSSSSSShhHo....', '....oHhhSSSSSSSSSSSSSSSShhho....', '....oHhhSHHHSSSSSSSSHHHSShho....', '....oHhhSSSSSSSSSSSSSSSSShho....',
        '....ohhkSSSeeeSSSSSSeeeSSkho....', '....ohhkSSSeijSSSSSSeijSSkho....', '....ohkHHHSSSSSSSSSSSSHHHkko....', '.....okHHHHHHHhhHHHHHHHhko......', '.....okHHHHHHHHHHHHHHHHHko......', '......okHHHHHHHHHHHHHHHko.......'],
      N: ['', '', '', '', '...........oooooooooo...........', '.........ooSSSSSSSSSSoo.........', '........oSSSSSSSSSSSSSSo........', '.......oSSSSSSSSSSSSSSSSo.......', '......oSSSSSSSSSSSSSSSSSSo......',
        '.....oHhSSSSSSSSSSSSSSSShHo.....', '....oHhhhSSSSSSSSSSSSSShhhHo....', '....oHhhhhhhhhhhhhhhhhhhhhHo....', '....oHhhhhhhhhhhhhhhhhhhhhho....', '....ohhhhhhhhhhhhhhhhhhhhhko....',
        '....ohhhhhhhhhhhhhhhhhhhhkko....', '....okhhhhhhhhhhhhhhhhhhkkko....', '.....okkhhhhhhhhhhhhhhhkkko.....', '......okkkkkkkkkkkkkkkkkko......', '.......oooodssssssssdoooo.......', '.........oodssssssssdoo.........'],
      E: ['', '', '', '', '............oooooooo............', '..........ooSSSSSSSSoo..........', '.........oSSSSSSSSSSSSo.........', '........oSSSSSSSSSSSSSSo........', '.......oSSSSSSSSSSSSSSSSo.......',
        '......oHhSSSSSSSSSSSSSSSo.......', '.....oHhhhSSSSSSSSSSSSSSSo......', '.....oHhhhhSSSSSSSSSSSSSSo......', '.....oHhhhhSSSSSSSHHHSSSSSo.....', '.....ohhhhhdSSSSSSSSSSSSSSo.....',
        '.....ohhhhkdSSSSSSSSeeeSSSo.....', '.....okhhhkdSSSSSSSSeijSSSSo....', '......okkkkdSSSSSSSHHHHHSSo.....', '.......oooodSSSSHHHHHHHHHo......', '...........odSHHHHHHHHHHo.......', '............oHHHHHHHHHHo........'],
      beardS: ['.......okHHHHHHHHHHHHHko........', '........okHHHHHHHHHHHko.........', '.........okkHHHHHHHkko..........', '...........oookkkooo............'],
      beardE: ['.............oHHHHHHHHo.........', '..............okHHHHko..........', '...............oooooo...........'],
    },
    helmet: {
      S: ['...............oo...............', '..............oXXo..............', '.............oXxXXo.............', '..........oooXXXXXxooo..........', '........ooGGGGGGGGGGGGgoo.......',
        '.......oGGGGGGGGGGGGGgggggo.....', '......oGGGGGGGGGGGGgggggggvo....', '......oGGGGGGGGGGgggggggggvo....', '.....ogggggggggggggggggggvvvo...', '.....ovvvvvvvvvvvvvvvvvvvvvvo...',
        '.....oGgoooooooooooooooooggvo...', '.....oGgoSSSSSSSSSSSSSSSoggvo...', '.....oGgSSSSSSSSSSSSSSSSSgvo....', '.....oGgSSSSSSSSSSSSSSSSSgvo....', '.....oGgSeeeSSSSSSSSeeeSSgvo....',
        '.....oGgSeijSSSSSSSSeijSSgvo....', '.....ogvSnSSSSSSSSSSSSSnSvvo....', '......oovdSSSSSSllSSSSSdvoo.....', '........oodsSSSSSSSSSsdoo.......', '..........oodssssssdoo..........'],
    },
    kerchief: {
      S: ['................................', '...........oooooooooo...........', '.........ooXXXXXXXxxxoo.........', '........oXXXWXXXXXXxxxxo........', '.......oXXXXXXXXWXXxxxxxo.......',
        '......oXXWXXXXXXXXXxxWxxxo......', '......oXXXXXXXXXXXXxxxxxxo......', '.....oxxxxxxxxxxxxxxxxxxxxo.....', '.....oKhhoooooooooooooohhKo.....', '.....oKhhSSSSSSSSSSSSSSShhKo....',
        '.....oKhSSSSSSSSSSSSSSSSShKo....', '.....oKhSSSSSSSSSSSSSSSSShKo....', '.....oKhSSSSSSSSSSSSSSSSShKo....', '.....oKhSSSSSSSSSSSSSSSSShKo....', '.....oKhSSeeeSSSSSSSeeeSShKo....',
        '.....oKhSSeijSSSSSSSeijSShKo....', '.....oKhSnSSSSSSSSSSSSSnShKo....', '......oKdSSSSSSllSSSSSSSdKo.....', '.......oodsSSSSSSSSSSSsdoo......', '.........oodssssssssdoo.........'],
    },
    cap: {
      S: ['................................', '................................', '...........oooooooooo...........', '.........ooXXXXXXXxxxoo.........', '........oXXXXXXXXXxxxxxo........',
        '.......oXXXXXXXXXXxxxxxxo.......', '.......oXXXXXXXXXxxxxxxxxooo....', '......ooxxxxxxxxxxxxxxxxxxxxxo..', '.....oKhhkhhkhhkhhkhhkhoooooo...', '.....oKkSkkSSkkSSkkSSkkKo.......',
        '.....oSSSSSSSSSSSSSSSSSSo.......', '.....oSSSeeeSSSSSSSeeeSSo.......', '.....oSSSeijSSSSSSSeijSSo.......', '.....oSnSSSSSSSSSSSSSSnSo.......', '......odSSSSSSllSSSSSdo.........',
        '.......oodsSSSSSSSSsdoo.........', '.........oodssssssdoo...........'],
    },
  };
  HEADS.hat.N = HEADS.hat.S.slice(0, 10).concat(['.....oKhhhhhhhhhhhhhhhhhhKo.....', '.....oKhhhhhhhhhhhhhhhhhhKo.....', '.....oKkhhhhhhhhhhhhhhhhkKo.....', '.....oKkkhhhhhhhhhhhhhhkkKo.....', '.....oKkkkhhhhhhhhhhhhkkkKo.....',
    '......oKkkkkkkkkkkkkkkkkKo......', '......oKKkkKkkkKKkkkKkkKKo......', '.......ooKoodSSSSSSdooKoo.......', '.........odssssssssssdo.........', '.........oodssssssssdoo.........']);
  const NPC32 = {
    lia: { style: 'long', dress: true, pal: { K: '#5a2418', k: '#8a4428', h: '#b4663c', H: '#e09a62', X: '#c2343a', A: '#f2cc4a', a: '#c9a42c', q: '#8a6a1a', B: '#f2cc4a', b: '#c9a42c', p: '#8a6a1a', M: '#7a3a22', m: '#f6e09a', T: '#8a5a3a', t: '#6a4028', u: '#4a2a1a', i: '#3a7a5a', j: '#8ad0a0' } },
    caio: { style: 'hat', pal: { Y: '#f0d488', y: '#c9a24a', z: '#8a6a2a', X: '#b03a2e', H: '#9a6a48', h: '#6a4430', k: '#4a2e22', K: '#2a1a14', A: '#78a8cf', a: '#4776ad', q: '#2f4f86', B: '#a8744e', b: '#7a5038', p: '#4f3426', C: '#5a4a3a', c: '#3e342a', r: '#2a241e', T: '#6a4a32', t: '#4a3222', u: '#2e1e14', M: '#2b1d18', m: '#c9a24a', i: '#6a4a30', j: '#b08860' } },
    joaquim: { style: 'old', pal: { H: '#f2f2f8', h: '#c4c4d0', k: '#8a8a98', K: '#5a5a68', S: '#efc6a6', s: '#dca68a', d: '#b47e6a', A: '#e8dcc0', a: '#c8b896', q: '#9a8a6a', B: '#6a4a3a', b: '#4a3228', p: '#2e1e18', C: '#5a5048', c: '#403830', r: '#2a2420', T: '#5a3a28', t: '#3e281c', u: '#28180e', M: '#2b1d18', m: '#c9a24a', i: '#4a5a7a', j: '#8a9ac0' } },
    guard: { style: 'helmet', pal: { G: '#e6eaf0', g: '#a8adb8', v: '#5a5e6c', X: '#d8483e', x: '#9a2a2e', A: '#c8443a', a: '#9a2a2e', q: '#5e1a22', B: '#c8ccd6', b: '#8a8e9c', p: '#4a4c5a', C: '#4a3a30', c: '#33281f', r: '#201812', T: '#4a3a30', t: '#33281f', u: '#1a120c', M: '#3a2a24', m: '#e8c050', i: '#3a4a6a', j: '#7a8ab0' }, spear: true },
    rosa: { style: 'kerchief', dress: true, pal: { X: '#d8483e', x: '#9a2a2e', W: '#f6f0e4', H: '#a8704a', h: '#7a4a32', k: '#5a3a26', K: '#3a2418', A: '#f2ece4', a: '#cfc3bb', q: '#8a7a72', B: '#f2ece4', b: '#cfc3bb', p: '#8a7a72', M: '#a8744e', m: '#f2c45a', T: '#6a4a32', t: '#4a3222', u: '#2e1e14', i: '#6a4a3a', j: '#a88060' } },
    tito: { style: 'cap', kid: true, pal: { X: '#6aa058', x: '#3e7038', H: '#c8884a', h: '#a86a3a', k: '#7a4628', K: '#4a2a18', A: '#f2c45a', a: '#c98a2c', q: '#8a4f22', B: '#4776ad', b: '#2f4f86', p: '#1e2f5e', C: '#4776ad', c: '#2f4f86', r: '#1e2f5e', T: '#7a5038', t: '#4f3426', u: '#2b1d18', M: '#2f4f86', m: '#f2c45a', i: '#6a4a30', j: '#b08860' } },
  };
  const NPC_BASE = { o: '#1a1018', S: '#f6d2b4', s: '#e6b090', d: '#c08470', n: '#ee9c98', l: '#a8564e', e: '#160e16', W: '#f6f0e4' };
  function npc(name, view, f = 0) {
    const c = NPC32[name], H = HEADS[c.style], head = (H[view] || H.S).filter((r, i) => i < 20);
    while (head.length < 20) head.push('');
    let body;
    if (view === 'E') body = c.dress ? BODY.tunicE.concat(BODY.dressSkirtE) : BODY.tunicE.concat(f === 1 ? HERO_E.slice(32, 33).concat(E_STRIDE) : LEGS_E);
    else { const t = view === 'N' ? BODY.tunicN : BODY.tunicS; body = c.dress ? t.slice(0, 11).concat(BODY.dressSkirtS) : t; }
    let rows = fit(head.map(r => r || '').concat(body));
    if (c.style === 'long') rows = hairBehind(rows, 18, 31, 2, 26);
    if (c.style === 'long' && view === 'N') rows = rows.map((r, y) => y >= 20 && y < 28 ? [...r].map((ch, x) => H.backHair[y - 20][x] !== '.' ? H.backHair[y - 20][x] : ch).join('') : r);
    if (c.style === 'long' && view === 'E') rows = hairBehind(rows, 20, 30, 3, 40);
    if (c.style === 'old' && view !== 'N') { const bd = view === 'E' ? H.beardE : H.beardS; rows = rows.map((r, y) => y >= 20 && y < 20 + bd.length ? [...r].map((ch, x) => bd[y - 20][x] && bd[y - 20][x] !== '.' ? bd[y - 20][x] : ch).join('') : r); }
    if (view !== 'E' && f) rows = liftLeg(rows, c.dress ? 37 : 33, f === 1);
    if (c.kid) rows = rows.slice(0, 17).concat(rows.slice(20, 24), rows.slice(26, 31), rows.slice(33));
    const p = render(rows, Object.assign({}, HERO_PAL, NPC_BASE, c.pal));
    if (c.spear) { p.rect(27, 3, 1, 36, '#7a5038'); p.rect(28, 3, 1, 36, '#4f3426'); p.rect(27, 0, 2, 4, '#e6eaf0'); p.set(27, 0, '#ffffff'); p.rect(25, 28, 4, 2, '#e6b090'); }
    return p;
  }

  // ======================= RETRATOS 48x48 =======================
  const PN = 48;
  const quad = (a, c, b, t) => { const u = 1 - t; return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]; };
  const h2 = (x, y) => { const v = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453; return v - Math.floor(v); };
  // mecha de cabelo: curva quadrática que afina da raiz à ponta; lado voltado à luz mais claro, bordas escuras
  function clump(p, root, tip, w, bend, R) {
    const dx = tip[0] - root[0], dy = tip[1] - root[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    const ctrl = [(root[0] + tip[0]) / 2 + nx * bend, (root[1] + tip[1]) / 2 + ny * bend], steps = Math.ceil(L * 4);
    for (let s = 0; s <= steps; s++) {
      const t = s / steps, [x, y] = quad(root, ctrl, tip, t), [x2, y2] = quad(root, ctrl, tip, Math.min(1, t + 0.02));
      let tx = x2 - x, ty = y2 - y; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
      const hw = Math.max(0.5, w * Math.pow(1 - t, 0.9));
      for (let u = -hw; u <= hw + 0.01; u += 0.3) {
        const k = u / hw, side = -ty * k * -1 + tx * k * 0; // normal (-ty, tx): k<0 → lado esquerdo do traço
        const lightSide = (-ty * k) < 0; // pixel à esquerda (x menor) recebe luz
        let c = Math.abs(k) > 0.78 ? (lightSide ? R[1] : R[0]) : lightSide ? (Math.abs(k) > 0.3 ? R[2] : R[1]) : R[1];
        if (t > 0.8 && !lightSide) c = R[0];
        p.set(x - ty * u, y + tx * u, c);
      }
    }
  }
  function ellipseFill(p, cx, cy, rx, ry, fn) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy <= 1) { const c = fn(dx, dy, x, y); if (c) p.set(x, y, c); }
    }
  }
  // massa de cabelo atrás da cabeça, com textura de fios verticais
  function hairMass(p, R, o) {
    const fn = (dx, dy, x, y) => { const l = -dx * 0.7 - dy * 0.45 + (h2(x, 0) - 0.5) * 0.5; return l > 0.45 ? R[2] : l > -0.25 ? R[1] : R[0]; };
    ellipseFill(p, 24, o.cy || 21, o.rx || 16.5, o.ry || 15.5, fn);
    if (o.long) for (let y = 21; y < 48; y++) {
      const k = (y - 21) / 27, wl = 7 - k * 2;
      for (let x = 0; x < wl; x++) { const xl = 8 + x - k * 2, xr = 40 - x + k * 2; const f = (h2(Math.round(xl), 1) - 0.5) * 0.6;
        p.set(xl, y, x < 1.2 ? R[0] : f > 0.1 ? R[2] : R[1]); p.set(xr, y, x < 1.2 ? R[0] : f > 0.2 ? R[1] : R[0]); }
    }
  }
  function halo(p, R, cy = 19, rx = 12, ry = 10, a0 = -2.7, a1 = -0.55) { // anel de brilho no topo da cabeça
    for (let a = a0; a < a1; a += 0.015) { const x = 24 + Math.cos(a) * rx, y = cy + Math.sin(a) * ry; if (h2(Math.round(x), 7) > 0.25) { p.set(x, y, R[3]); if (h2(Math.round(x), 9) > 0.5) p.set(x, y + 1, R[2]); } }
  }
  function face(p, K) {
    const cx = 24, cy = 27, rx = 11.5, ry = 11.5;
    for (let y = cy - 13; y <= cy + 13; y++) for (let x = cx - 13; x <= cx + 13; x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
      const jaw = dy > 0.2 ? 1 + Math.pow(dy - 0.2, 1.5) * 1.25 : 1, r = (dx * jaw) ** 2 + dy * dy;
      if (r > 1) continue;
      const l = -dx * 0.55 - dy * 0.2 + 0.25;
      p.set(x, y, (r > 0.86 && dx > 0.1) || l < -0.4 ? K.d : l > 0.02 ? K.S : K.s);
    }
    for (let y = 37; y < 45; y++) for (let x = 20; x <= 28; x++) p.set(x, y, y < 40 ? K.d : x > 26 ? K.s : K.S);
  }
  const EYE_L = {
    neutral: ['.eeeeee.', 'eeeeeeee', 'eIwwIIIE', 'EIwPPPIE', 'EIiPPPiE', 'EijjjjiE', '.EIIIIE.', '..eeee..'],
    happy: ['........', '........', '........', '.eeeeee.', 'e......e', '........', '........', '........'],
    surprised: ['.eeeeee.', 'eEEEEEEe', 'EEwIIIEE', 'EEIPPIEE', 'EEiPPiEE', 'EEijjiEE', '.EEEEEE.', '..eeee..'],
  };
  const EYE_R = {
    neutral: ['.eeeeee.', 'eeeeeeee', 'EIwwIIIe', 'EIwPPPIE', 'EiPPPiIE', 'EijjjjiE', '.EIIIIE.', '..eeee..'],
    happy: EYE_L.happy, surprised: EYE_L.surprised,
  };
  const MOUTH = { neutral: ['.ll.'], happy: ['l..l', '.ll.'], surprised: ['.l.', 'l.l', '.l.'] };
  function stamp(p, grid, x0, y0, map) { grid.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.' && map[ch]) p.set(x0 + x, y0 + y, map[ch]); })); }
  function features(p, K, expr) {
    const map = { e: K.lash, E: '#f6f2f2', I: K.irisD, i: K.iris, j: K.irisL, P: K.pupil, w: '#ffffff' };
    stamp(p, EYE_L[expr], 13, 25, map); stamp(p, EYE_R[expr], 27, 25, map);
    const by = expr === 'surprised' ? 21 : 22;
    p.rect(14, by, 5, 1, K.brow); p.rect(29, by, 5, 1, K.brow);
    p.set(24, 33, K.s); p.set(25, 34, K.d);
    stamp(p, MOUTH[expr], 23, 37, { l: K.mouth });
    p.rect(12, 34, 3, 1, K.blush); p.rect(33, 34, 3, 1, K.blush);
  }
  function outlinePix(p) {
    const add = [];
    for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) {
      if (p.get(x, y)) continue;
      const n = [[0, 1], [1, 0], [-1, 0], [0, -1]].map(([dx, dy]) => p.get(x + dx, y + dy)).find(Boolean);
      if (n) add.push([x, y, dark(n, 0.32)]);
    }
    add.forEach(([x, y, c]) => p.set(x, y, c));
    return p;
  }
  function bangs(p, R, n, y0, y1, spread, seed) { // franja: mechas lado a lado caindo sobre a testa
    for (let i = 0; i < n; i++) {
      const k = i / (n - 1), x = 11 + k * 26, ry = y0 + Math.pow(Math.abs(k - 0.5) * 2, 2) * 3;
      const tipY = y1 + (h2(i, seed) - 0.5) * 4, slant = (k - 0.5) * spread + (h2(i + 3, seed) - 0.5) * 2;
      clump(p, [x, ry], [x + slant, tipY], 2.6 + h2(i, seed + 1) * 1.2, (h2(i, seed + 2) - 0.5) * 3, R);
    }
  }
  const SKIN = { S: '#fbe2cc', s: '#efc2a8', d: '#d09a86', blush: '#f4a8aa', mouth: '#b25e62' };
  const PORTRAITS = {
    hero: {
      hair: ['#0c0a12', '#1e1828', '#352c48', '#6e6290'], K: Object.assign({}, SKIN, { lash: '#120c14', irisD: '#262c44', iris: '#4a5a80', irisL: '#9eaed0', pupil: '#0c0a12', brow: '#1e1828' }),
      mass: { rx: 16.5, ry: 15 },
      draw(p, R) {
        // mechas espetadas no topo e laterais (bagunçado)
        [[[18, 8], [10, 1], 3, 2], [[23, 7], [21, 0], 3, -1], [[28, 8], [33, 1], 3, -2], [[31, 10], [40, 6], 3, -1], [[16, 11], [7, 8], 3, 1]].forEach(([a, b, w, bd]) => clump(p, a, b, w, bd, R));
        clump(p, [13, 16], [9, 35], 4, -3, R); clump(p, [35, 16], [39, 35], 4, 3, R);
        clump(p, [11, 22], [5, 30], 2, -1, R); clump(p, [37, 22], [43, 29], 2, 1, R);
      },
      bang: [9, 11, 22, 6, 3],
      clothes(p) {
        ellipseFill(p, 24, 56, 24, 14, (dx) => dx < -0.3 ? '#f4e8d2' : dx < 0.35 ? '#d8c6a8' : '#a8927a');
        ellipseFill(p, 24, 44, 14, 4.5, (dx, dy) => dy < -0.3 ? (dx < 0 ? '#d6b07a' : '#b08850') : dx < 0.3 ? '#b08850' : '#7e5e38');
        for (let i = 0; i < 6; i++) p.set(31 - i, 46 + i, '#3a2a24');
      },
    },
    girl: {
      hair: ['#10152c', '#1f2850', '#34428a', '#6a82cc'], K: Object.assign({}, SKIN, { lash: '#121628', irisD: '#163464', iris: '#2f6ab0', irisL: '#7ac8f8', pupil: '#0c1430', brow: '#1f2850' }),
      mass: { rx: 17, ry: 15.5, long: true },
      draw(p, R) {
        clump(p, [13, 16], [9, 46], 4.5, -3, R); clump(p, [35, 16], [39, 46], 4.5, 3, R);
        clump(p, [15, 18], [14, 42], 3, -1, R); clump(p, [33, 18], [34, 42], 3, 1, R);
        clump(p, [11, 24], [3, 21], 1.4, 2, R); clump(p, [37, 24], [45, 22], 1.4, -2, R); clump(p, [10, 30], [4, 34], 1.2, -1, R);
      },
      bang: [8, 10, 22, 4, 7],
      clothes(p) {
        ellipseFill(p, 24, 57, 23, 14, (dx) => dx < -0.3 ? '#f8f6fc' : dx < 0.35 ? '#e2deee' : '#a8a2c4');
        p.rect(20, 41, 9, 2, '#8a7ab0'); p.rect(20, 41, 9, 1, '#b4a6dc'); p.rect(23, 43, 3, 2, '#d8ccf0'); p.set(24, 43, '#8a7ab0');
      },
    },
    elf: {
      hair: ['#183630', '#2f5e50', '#4e927c', '#a4dcc4'], K: Object.assign({}, SKIN, { lash: '#2a1a10', irisD: '#5a3018', iris: '#a8682a', irisL: '#f0b050', pupil: '#2a1408', brow: '#2f5e50' }),
      mass: { rx: 16, ry: 14.5 }, ears: true,
      draw(p, R) {
        [[[18, 8], [11, 0], 3, 2], [[23, 7], [24, -1], 3, 0], [[29, 8], [36, 1], 3, -2], [[32, 11], [43, 9], 2.5, -1], [[15, 11], [5, 10], 2.5, 1], [[26, 7], [30, -1], 2, 1]].forEach(([a, b, w, bd]) => clump(p, a, b, w, bd, R));
        clump(p, [13, 16], [10, 33], 3.5, -2, R); clump(p, [35, 16], [38, 33], 3.5, 2, R);
      },
      bang: [8, 10, 22.5, 7, 11],
      clothes(p) {
        ellipseFill(p, 24, 56, 24, 14, (dx) => dx < -0.3 ? '#2c3e3a' : dx < 0.35 ? '#1e2c2a' : '#141e1c');
        ellipseFill(p, 24, 43, 10, 4.5, (dx) => dx < 0 ? '#b88048' : dx < 0.4 ? '#8a5a32' : '#5a3a22');
        p.rect(12, 46, 4, 2, '#b88048'); p.rect(33, 45, 3, 3, '#8a5a32');
      },
    },
  };

  // ---------- retratos dos moradores ----------
  const ramp = (R, dx, dy) => { const l = -dx * 0.6 - dy * 0.45; return l > 0.45 ? R[3] : l > 0.05 ? R[2] : l > -0.4 ? R[1] : R[0]; };
  const clip = (yMax, R) => (dx, dy, x, y) => y <= yMax ? ramp(R, dx, dy) : null;
  const SHIRT = (p, R, cx = 24) => ellipseFill(p, cx, 56, 24, 14, (dx) => dx < -0.3 ? R[2] : dx < 0.35 ? R[1] : R[0]);
  Object.assign(PORTRAITS, {
    lia: {
      hair: ['#4a1c14', '#7a3a22', '#b4663c', '#eaa472'], K: Object.assign({}, SKIN, { lash: '#2a1410', irisD: '#1e4a34', iris: '#3a7a5a', irisL: '#8ad0a0', pupil: '#10241a', brow: '#7a3a22' }),
      mass: { rx: 17, ry: 15.5, long: true },
      draw: PORTRAITS.girl.draw, bang: [8, 10, 22, 4, 21],
      top(p) { for (let x = 10; x <= 38; x++) { const y = 10.5 + Math.pow((x - 24) / 14, 2) * 5; p.set(x, y, '#c2343a'); p.set(x, y + 1, '#8a2028'); } },
      clothes(p) { SHIRT(p, ['#c9a42c', '#f2cc4a', '#fbe58a']); ellipseFill(p, 24, 43, 8, 3, () => '#f6f0e4'); },
    },
    caio: {
      hair: ['#2a1a14', '#4a2e22', '#6a4432', '#9a6a48'], K: Object.assign({}, SKIN, { lash: '#1e140e', irisD: '#3a2414', iris: '#6a4a30', irisL: '#b08860', pupil: '#1a0e08', brow: '#4a2e22' }),
      mass: { rx: 15.5, ry: 13.5 }, noHalo: true, bang: [8, 14, 22, 3, 5],
      draw(p, R) { clump(p, [13, 18], [11, 32], 3, -2, R); clump(p, [35, 18], [37, 32], 3, 2, R); },
      top(p) {
        const Y = ['#8a6a2a', '#c9a24a', '#f0d488', '#fff0b8'];
        ellipseFill(p, 24, 10, 11.5, 7.5, clip(15, Y));
        for (let x = 13; x <= 35; x++) { p.set(x, 13, '#b03a2e'); p.set(x, 14, '#7a2420'); }
        ellipseFill(p, 24, 16, 22, 4.2, (dx, dy) => dy < -0.2 ? Y[2] : dy < 0.4 ? Y[1] : Y[0]);
        for (let x = 3; x < 46; x += 3) p.set(x, 16 + (x % 2), Y[0]);
      },
      clothes(p) { SHIRT(p, ['#2f4f86', '#4776ad', '#78a8cf']); ellipseFill(p, 12, 50, 7, 9, () => '#7a5038'); ellipseFill(p, 36, 50, 7, 9, () => '#4f3426'); },
    },
    joaquim: {
      hair: ['#5a5a68', '#8a8a98', '#c4c4d0', '#f2f2f8'], K: Object.assign({}, SKIN, { S: '#f2cdb0', s: '#e0ad90', d: '#b88068', lash: '#2a2024', irisD: '#2a3448', iris: '#4a5a7a', irisL: '#8a9ac0', pupil: '#121018', brow: '#f2f2f8' }),
      bald: true, noHalo: true,
      draw(p, R) { clump(p, [13, 19], [9, 31], 3.5, -2, R); clump(p, [35, 19], [39, 31], 3.5, 2, R); clump(p, [12, 24], [8, 28], 2, -1, R); clump(p, [36, 24], [40, 28], 2, 1, R); },
      extra(p, K) {
        const Wt = ['#8a8a98', '#c4c4d0', '#e8e8f0', '#ffffff'];
        p.rect(12, 21, 8, 2, Wt[2]); p.rect(28, 21, 8, 2, Wt[1]); p.rect(12, 21, 8, 1, Wt[3]);
        ellipseFill(p, 24, 41, 12, 8.5, (dx, dy) => ramp(Wt, dx, dy));
        ellipseFill(p, 24, 35.5, 7, 1.8, (dx) => dx < 0 ? Wt[2] : Wt[1]);
        for (let i = 0; i < 8; i++) p.set(15 + i * 2.3, 44 + (i % 3), Wt[0]);
      },
      clothes(p) { SHIRT(p, ['#9a8a6a', '#c8b896', '#e8dcc0']); ellipseFill(p, 11, 50, 7, 9, () => '#6a4a3a'); ellipseFill(p, 37, 50, 7, 9, () => '#4a3228'); },
    },
    guard: {
      hair: ['#3a3c48', '#767a88', '#c8ccd6', '#f4f6fa'], K: Object.assign({}, SKIN, { lash: '#1a1418', irisD: '#22304a', iris: '#3a4a6a', irisL: '#7a8ab0', pupil: '#0e0e16', brow: '#4a3226' }),
      noHalo: true,
      top(p, R) {
        clump(p, [24, 9], [33, -1], 3.5, -3, ['#5e1a22', '#9a2a2e', '#d8483e', '#f2804e']); clump(p, [26, 9], [38, 3], 3, -2, ['#5e1a22', '#9a2a2e', '#d8483e', '#f2804e']);
        ellipseFill(p, 24, 19, 14.5, 12, clip(21, R));
        for (let x = 9; x <= 39; x++) { p.set(x, 21, R[1]); p.set(x, 22, R[0]); }
        [[9, 13], [35, 39]].forEach(([a, b], i) => { for (let y = 22; y < 34; y++) for (let x = a; x <= b; x++) p.set(x, y, x === (i ? b : a) ? R[0] : i ? R[1] : R[2]); });
        p.rect(23, 11, 2, 10, R[3]);
      },
      clothes(p) { SHIRT(p, ['#5e1a22', '#9a2a2e', '#c8443a']); ellipseFill(p, 9, 48, 9, 6, (dx, dy) => ramp(['#4a4c5a', '#8a8e9c', '#c8ccd6', '#eef0f4'], dx, dy)); ellipseFill(p, 39, 48, 9, 6, (dx, dy) => ramp(['#4a4c5a', '#8a8e9c', '#c8ccd6', '#eef0f4'], dx, dy)); },
    },
    rosa: {
      hair: ['#3a2418', '#5a3a26', '#8a5a3a', '#b07a52'], K: Object.assign({}, SKIN, { lash: '#24140e', irisD: '#3a2414', iris: '#6a4a3a', irisL: '#a88060', pupil: '#1a0e08', brow: '#5a3a26' }),
      mass: { rx: 15.5, ry: 14 }, noHalo: true, bang: [6, 17, 22, 3, 13],
      draw(p, R) { clump(p, [14, 20], [12, 37], 3, -2, R); clump(p, [34, 20], [36, 37], 3, 2, R); },
      top(p) {
        const Rd = ['#5e1a22', '#9a2a2e', '#d8483e', '#f2804e'];
        ellipseFill(p, 24, 15, 15.5, 10, clip(19, Rd));
        [[17, 10], [24, 8], [31, 11], [14, 15], [21, 14], [28, 15], [35, 15], [19, 18], [30, 18]].forEach(([x, y]) => { p.set(x, y, '#f6f0e4'); p.set(x + 1, y, '#f6f0e4'); });
        ellipseFill(p, 39, 20, 3, 2.5, (dx) => dx < 0 ? Rd[2] : Rd[1]); ellipseFill(p, 42, 23, 2, 3, () => Rd[1]);
      },
      clothes(p) { SHIRT(p, ['#8a7a72', '#cfc3bb', '#f2ece4']); [17, 30].forEach(x => { for (let y = 43; y < 48; y++) p.rect(x, y, 2, 1, '#a8744e'); }); },
    },
    tito: {
      hair: ['#4a2a18', '#7a4628', '#a86a3a', '#d8a060'], K: Object.assign({}, SKIN, { lash: '#24140e', irisD: '#3a2414', iris: '#6a4a30', irisL: '#c09060', pupil: '#1a0e08', brow: '#7a4628' }),
      mass: { rx: 14.5, ry: 13 }, noHalo: true, bang: [8, 15, 22.5, 4, 17],
      draw(p, R) { clump(p, [14, 19], [10, 27], 2.5, -2, R); clump(p, [34, 19], [38, 27], 2.5, 2, R); },
      top(p) {
        const Gr = ['#1e3a1c', '#3e7038', '#6aa058', '#a8d890'];
        ellipseFill(p, 24, 14, 13.5, 8.5, clip(18, Gr));
        ellipseFill(p, 34, 19, 10, 2.6, (dx, dy) => dy < 0 ? Gr[1] : Gr[0]);
        p.rect(22, 7, 4, 2, Gr[3]);
      },
      extra(p, K) { [[13, 32], [15, 33], [17, 32], [31, 32], [33, 33], [35, 32]].forEach(([x, y]) => p.set(x, y, K.d)); },
      clothes(p) { SHIRT(p, ['#c98a2c', '#f2c45a', '#fbe08a']); [15, 32].forEach(x => p.rect(x, 41, 3, 7, '#2f4f86')); },
    },
  });
  function ear(p, side, K) { // orelha pontuda de elfo
    for (let i = 0; i < 11; i++) { const x = (side < 0 ? 13 : 35) + side * i, top = 26 - i * 0.7, h = Math.max(1, 6.5 - i * 0.55);
      for (let y = top; y < top + h; y++) p.set(x, y, i > 8 ? K.d : y < top + 1.2 ? K.S : y > top + h - 1.6 ? K.d : (i > 2 && i < 7 && y > top + 2) ? K.d : K.s); }
  }
  function portrait(name, expr = 'neutral') {
    const D = PORTRAITS[name], p = new Pix(PN, PN), R = D.hair;
    if (D.mass) hairMass(p, R, D.mass);
    D.clothes(p);
    if (D.ears) { ear(p, -1, D.K); ear(p, 1, D.K); }
    if (D.bald) ellipseFill(p, 24, 22, 12, 12, (dx, dy) => { const l = -dx * 0.55 - dy * 0.3 + 0.2; return l > 0.05 ? D.K.S : l > -0.3 ? D.K.s : D.K.d; });
    face(p, D.K);
    if (D.draw) D.draw(p, R);
    if (!D.noHalo) halo(p, R);
    features(p, D.K, expr);
    if (D.bang) { const [n, y0, y1, spread, seed] = D.bang; bangs(p, R, n, y0, y1, spread, seed); }
    if (D.top) D.top(p, R);
    if (D.extra) D.extra(p, D.K, expr);
    // sombra do cabelo sobre a testa
    for (let y = 14; y < 32; y++) for (let x = 12; x < 37; x++) { const c = p.get(x, y), up = p.get(x, y - 1); if ((c === D.K.S || c === D.K.s) && R.includes(up)) p.set(x, y, D.K.d); }
    return outlinePix(p);
  }
  return { hero, girl, elf, portrait, npc, NPC32 };
}
if (typeof module !== 'undefined') module.exports = buildSprites2;
