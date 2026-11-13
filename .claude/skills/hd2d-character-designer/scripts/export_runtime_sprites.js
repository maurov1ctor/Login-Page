#!/usr/bin/env node
// Exporta para PNG os sprites e retratos que hoje são gerados em tempo de execução por game/sprites2.js.
// Uso: node export_runtime_sprites.js <pasta-de-saída> [--pad64]
//   --pad64  também grava cópias centralizadas num canvas 64x64 (pés na última linha), para testar o padrão novo.
// Requer o Playwright pré-instalado no ambiente (require('playwright')). Não altera nenhum arquivo do jogo.
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const out = path.resolve(process.argv[2] || 'exported_sprites');
const pad64 = process.argv.includes('--pad64');
const repo = path.resolve(__dirname, '../../../..');
const src = fs.readFileSync(path.join(repo, 'game/sprites2.js'), 'utf8');

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent('<body></body>');
  await page.addScriptTag({ content: `
    class Pix { constructor(w,h){this.w=w;this.h=h;this.d=new Array(w*h).fill(null);}
      set(x,y,c){x=Math.floor(x);y=Math.floor(y);if(x<0||y<0||x>=this.w||y>=this.h)return;this.d[y*this.w+x]=c;}
      get(x,y){x=Math.floor(x);y=Math.floor(y);return(x<0||y<0||x>=this.w||y>=this.h)?null:this.d[y*this.w+x];}
      rect(x,y,w,h,c){for(let j=0;j<h;j++)for(let i=0;i<w;i++)this.set(x+i,y+j,c);}
      mirror(){const m=new Pix(this.w,this.h);for(let y=0;y<this.h;y++)for(let x=0;x<this.w;x++)m.d[y*this.w+x]=this.d[y*this.w+(this.w-1-x)];return m;}
      canvas(){const c=document.createElement('canvas');c.width=this.w;c.height=this.h;const g=c.getContext('2d');this.d.forEach((col,i)=>{if(col){g.fillStyle=col;g.fillRect(i%this.w,(i/this.w)|0,1,1);}});return c;} }
  ` });
  await page.addScriptTag({ content: src });
  const files = await page.evaluate((pad64) => {
    const SP = buildSprites2(Pix), res = [];
    const push = (name, pix) => {
      res.push([name + '.png', pix.canvas().toDataURL('image/png')]);
      if (pad64) {
        const c = document.createElement('canvas'); c.width = 64; c.height = 64;
        c.getContext('2d').drawImage(pix.canvas(), Math.floor((64 - pix.w) / 2), 64 - pix.h);
        res.push(['pad64/' + name + '.png', c.toDataURL('image/png')]);
      }
    };
    ['S', 'SE', 'E', 'NE', 'N', 'SW', 'W', 'NW'].forEach(d => [0, 1, 2].forEach(f => push(`hero_${d}_${f}`, SP.hero(d, f))));
    Object.keys(SP.NPC32).forEach(n => ['S', 'N', 'E'].forEach(v => [0, 1, 2].forEach(f => push(`npc_${n}_${v}_${f}`, SP.npc(n, v, f)))));
    ['hero', 'lia', 'caio', 'joaquim', 'guard', 'rosa', 'tito'].forEach(n => ['neutral', 'happy', 'surprised'].forEach(e => push(`portrait_${n}_${e}`, SP.portrait(n, e))));
    return res;
  }, pad64);
  for (const [name, url] of files) {
    const f = path.join(out, name);
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, Buffer.from(url.split(',')[1], 'base64'));
  }
  await browser.close();
  console.log(`exportados ${files.length} PNGs em ${out}`);
})().catch(e => { console.error(e); process.exit(1); });
