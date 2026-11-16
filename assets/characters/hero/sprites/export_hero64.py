#!/usr/bin/env python3
"""Exporta hero_{DIR}_{f}.png para game/hero64.js (paleta + 1 caractere por pixel; '.' = transparente)."""
import os, json
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
KEYS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
pal, frames = [], {}
for d in ("S", "SE", "E", "NE", "N"):
    frames[d] = []
    for f in range(3):
        im = Image.open(os.path.join(HERE, "hero_%s_%d.png" % (d, f))).convert("RGBA")
        assert im.size == (64, 64)
        s = []
        for r, g, b, a in im.get_flattened_data() if hasattr(im, "get_flattened_data") else im.getdata():
            if a < 128: s.append("."); continue
            h = "#%02x%02x%02x" % (r, g, b)
            if h not in pal: pal.append(h)
            s.append(KEYS[pal.index(h)])
        frames[d].append("".join(s))
out = os.path.join(HERE, "..", "..", "..", "..", "game", "hero64.js")
with open(out, "w") as fp:
    fp.write("// Gerado por assets/characters/hero/sprites/export_hero64.py — não editar à mão.\n")
    fp.write("// Protagonista 64x64 (24 px/unidade). W/SW/NW = espelho de E/SE/NE.\n")
    fp.write("window.HERO64 = " + json.dumps({"w": 64, "h": 64, "pal": pal, "frames": frames}) + ";\n")
print(len(pal), "cores ->", os.path.normpath(out), os.path.getsize(out), "bytes")
