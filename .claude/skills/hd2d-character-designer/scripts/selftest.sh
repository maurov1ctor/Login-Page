#!/usr/bin/env bash
# Autoteste do pipeline: exporta os sprites atuais do jogo e exercita todas as ferramentas.
# Uso: bash .claude/skills/hd2d-character-designer/scripts/selftest.sh   (não altera arquivos do projeto)
set -u
DIR="$(cd "$(dirname "$0")" && pwd)"; T="$(mktemp -d)"; PY="python3 $DIR/hd2d_tools.py"; fail=0
ok(){ echo "  ok   $1"; }; ko(){ echo "  FAIL $1"; fail=1; }
echo "pasta temporária: $T"
node "$DIR/export_runtime_sprites.js" "$T/exp" --pad64 >/dev/null && ok "export dos sprites do jogo" || ko "export"
$PY validate "$T/exp/pad64/hero_S_0.png" --max-colors 64 --occ-w 1-64 --occ-h 1-64 >/dev/null && ok "validate aceita sprite com pés em y=63" || ko "validate positivo"
$PY validate "$T/exp/hero_S_0.png" >/dev/null && ko "validate deveria recusar 32x40" || ok "validate recusa tamanho errado"
python3 - "$T" <<'PY'
import sys; from PIL import Image
t=sys.argv[1]; im=Image.open(t+'/exp/pad64/hero_S_0.png').convert('RGBA')
a=im.copy(); a.putpixel((30,40),(200,100,100,128)); a.save(t+'/semi.png')
b=Image.new('RGBA',(64,64)); b.paste(im.crop((0,0,64,62)),(0,0)); b.save(t+'/float.png')
PY
$PY validate "$T/semi.png" --max-colors 64 >/dev/null && ko "semitransparência" || ok "validate recusa semitransparência"
$PY validate "$T/float.png" --max-colors 64 >/dev/null && ko "pés flutuando" || ok "validate recusa pés fora de y=63"
$PY blockout "$T/exp/portrait_hero_neutral.png" --out "$T/blk.png" >/dev/null && ok "blockout gera referência" || ko "blockout"
$PY validate "$T/blk.png" --max-colors 64 >/dev/null && ko "blockout aceito como final" || ok "validate recusa blockout como arte final"
$PY preview "$T/exp/pad64/hero_S_0.png" --out "$T/board.png" >/dev/null && ok "preview" || ko "preview"
$PY palette "$T/exp/hero_S_0.png" --out "$T/sw.png" >/dev/null && ok "palette" || ko "palette"
$PY anim "$T"/exp/pad64/hero_S_{0,1,0,2}.png --gif "$T/w.gif" --onion "$T/o.png" >/dev/null && ok "anim (gif + onion)" || ko "anim"
$PY sheet "$T"/exp/pad64/hero_S_{0,1,2}.png --cols 3 --out "$T/s.png" --meta "$T/s.json" >/dev/null && \
$PY sheet --unpack "$T/s.png" --frame 64x64 --outdir "$T/un" >/dev/null && \
python3 -c "from PIL import Image,ImageChops;import sys;a=Image.open('$T/exp/pad64/hero_S_2.png').convert('RGBA');b=Image.open('$T/un/frame_002.png').convert('RGBA');sys.exit(0 if ImageChops.difference(a,b).getbbox() is None else 1)" \
  && ok "sheet pack/unpack idêntico" || ko "sheet roundtrip"
$PY guide --out "$T/g.png" >/dev/null && ok "guide" || ko "guide"
[ $fail = 0 ] && echo "TODOS OS TESTES PASSARAM" || echo "HÁ FALHAS"; exit $fail
