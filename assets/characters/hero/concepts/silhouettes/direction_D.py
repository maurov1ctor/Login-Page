#!/usr/bin/env python3
"""Direção D = cabelo H2 (tigela média desgrenhada) + corpo da direção C (esguio viajante), escolha do usuário.
Correções da crítica da v3 aplicadas ao corpo de C:
- mangas bufantes (massa do conceito do usuário) com punho e mão;
- vão de 2 px entre manga e tronco (antes 1 px);
- lanterna legível: carregada na mão direita, separada 2-3 px da perna (antes fundia com bolsa/mão).
Uso: python3 direction_D.py [pasta-do-elenco-exportado]
"""
import os, sys, importlib.util
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("ms", os.path.join(HERE, "make_silhouettes.py"))
ms = importlib.util.module_from_spec(spec); spec.loader.exec_module(ms)
BLACK = ms.BLACK

# v3: a geometria agora vem da fonte única ../hero_D_parts.py (separada por material), a mesma usada no conceito em cor.
_p = importlib.util.spec_from_file_location("parts", os.path.join(HERE, "..", "hero_D_parts.py"))
parts = importlib.util.module_from_spec(_p); _p.loader.exec_module(parts)
D_S = [(k, d) for _, k, d in parts.PARTS_S]
D_E = [(k, d) for _, k, d in parts.PARTS_E]


def draw(items):
    im = Image.new("RGBA", (64, 64), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    for kind, pts in items:
        if kind == "rr":
            d.rounded_rectangle(pts[:4], radius=pts[4], fill=BLACK)
        elif kind == "r":
            d.rectangle(pts, fill=BLACK)
        elif kind == "e":
            d.ellipse(pts, fill=BLACK)
        elif kind == "px":
            for x, y in pts:
                d.point((x, y), fill=BLACK)
        else:
            d.polygon(pts, fill=BLACK)
    return im


def main(cast_dir):
    try:
        f = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 15)
        fs = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 12)
    except OSError:
        f = fs = ImageFont.load_default()
    d_s, d_e = draw(D_S), draw(D_E)
    d_s.save(os.path.join(HERE, "hero_sil_D_S.png")); d_e.save(os.path.join(HERE, "hero_sil_D_E.png"))
    c_s, c_e = (Image.open(os.path.join(HERE, "history", "hero_sil_D_%s_v2.png" % v)) for v in "SE")
    S = 5
    W = 4 * (64 * S + 12) + 60
    b = Image.new("RGBA", (W, 64 * S + 330), (236, 230, 216, 255)); dr = ImageDraw.Draw(b)
    dr.text((20, 8), "Antes: D v2", fill=(90, 80, 110, 255), font=f)
    dr.text((20 + 2 * (64 * S + 12) + 30, 8), "Agora: D v3 (sem ponta do cachecol na frente, fio caído para o lado, ombros e mangas)", fill=(30, 24, 40, 255), font=f)
    for i, im in enumerate([c_s, c_e, d_s, d_e]):
        x = 20 + i * (64 * S + 12) + (30 if i > 1 else 0)
        b.alpha_composite(im.resize((64 * S, 64 * S), Image.NEAREST), (x, 32))
        dr.text((x, 34 + 64 * S), "frente" if i % 2 == 0 else "lado", fill=(90, 80, 110, 255), font=fs)
    y = 64 * S + 60
    dr.text((20, y), "Elenco em 2x (silhuetas): D e moradores atuais", fill=(30, 24, 40, 255), font=fs); y += 18
    row = [("D", d_s), ("D lado", d_e)]
    if cast_dir:
        for n in ["hero_S_0", "npc_lia_S_0", "npc_caio_S_0", "npc_joaquim_S_0", "npc_guard_S_0", "npc_rosa_S_0", "npc_tito_S_0"]:
            p = os.path.join(cast_dir, n + ".png")
            if os.path.exists(p):
                row.append((n.replace("npc_", "").replace("_S_0", ""), ms.sil(Image.open(p))))
    for i, (n, im) in enumerate(row):
        b.alpha_composite(im.resize((128, 128), Image.NEAREST), (20 + i * 136, y))
        dr.text((24 + i * 136, y + 128), n, fill=(90, 80, 110, 255), font=fs)
    y += 150
    dr.rectangle([20, y, W - 20, y + 84], fill=(156, 132, 105, 255))
    dr.text((26, y + 2), "tamanho real de jogo (1x)", fill=(40, 30, 24, 255), font=fs)
    for i, (n, im) in enumerate(row):
        b.alpha_composite(im, (30 + i * 72, y + 18))
    out = os.path.join(HERE, "hero_direction_D_board.png"); b.save(out); print("board:", out)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else None)
