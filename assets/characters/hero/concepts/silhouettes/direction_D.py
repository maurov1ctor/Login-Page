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

D_S = [
    # cabelo H2 na escala da cabeça de C
    ("rr", [19, 5, 45, 20, 5]), ("p", [(34, 6), (36, 3), (39, 3), (40, 6)]),
    ("r", [19, 19, 22, 23]), ("r", [23, 19, 24, 21]), ("r", [42, 19, 45, 21]),
    ("p", [(45, 16), (48, 18), (47, 20), (45, 20)]), ("r", [32, 2, 33, 4]),
    ("e", [23, 9, 41, 26]),                                         # rosto: bochecha/mandíbula aparecem abaixo do cabelo
    ("e", [19, 24, 45, 32]), ("p", [(21, 27), (8, 33), (5, 40), (12, 37), (23, 32)]),   # cachecol + ponta ao vento
    ("p", [(23, 30), (41, 30), (42, 44), (22, 44)]),               # tronco
    ("p", [(23, 31), (19, 32), (17, 35), (21, 35)]), ("e", [13, 33, 20, 42]), ("r", [15, 42, 19, 44]), ("e", [15, 44, 19, 48]),   # manga bufante esq.
    ("p", [(41, 31), (45, 32), (47, 35), (43, 35)]), ("e", [44, 33, 51, 42]), ("r", [45, 42, 49, 44]), ("e", [45, 44, 49, 48]),   # manga bufante dir.
    ("r", [47, 49, 47, 50]), ("r", [45, 51, 49, 56]),              # lanterna na mão direita
    ("p", [(23, 44), (31, 44), (30, 56), (24, 56)]), ("p", [(33, 44), (41, 44), (40, 56), (34, 56)]),
    ("r", [25, 56, 29, 58]), ("r", [35, 56, 39, 58]),
    ("e", [21, 57, 31, 63]), ("e", [33, 57, 43, 63]), ("r", [21, 60, 31, 63]), ("r", [33, 60, 43, 63]),
]
D_E = [
    ("rr", [20, 5, 42, 20, 5]), ("p", [(31, 6), (33, 3), (37, 3), (38, 6)]),
    ("r", [20, 19, 23, 24]), ("r", [25, 19, 26, 22]), ("p", [(20, 15), (16, 18), (17, 20), (20, 20)]),
    ("r", [42, 11, 44, 15]), ("r", [31, 2, 32, 4]),                # franja passa da testa
    ("e", [27, 9, 42, 26]), ("p", [(41, 16), (44, 18), (41, 20)]),
    ("e", [24, 23, 42, 31]), ("p", [(25, 26), (10, 28), (5, 34), (14, 33), (26, 30)]),
    ("p", [(25, 30), (39, 30), (40, 44), (24, 44)]),
    ("e", [30, 32, 38, 40]), ("p", [(36, 38), (40, 37), (42, 40), (38, 41)]), ("e", [41, 38, 45, 42]),   # braço à frente segurando a lanterna
    ("r", [43, 43, 43, 44]), ("r", [42, 45, 46, 50]),
    ("p", [(26, 44), (32, 44), (29, 57), (22, 57)]), ("p", [(31, 44), (38, 44), (42, 57), (36, 57)]),
    ("e", [20, 57, 31, 63]), ("e", [35, 57, 47, 63]), ("r", [20, 60, 31, 63]), ("r", [35, 60, 47, 63]),
]


def draw(items):
    im = Image.new("RGBA", (64, 64), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    for kind, pts in items:
        if kind == "rr":
            d.rounded_rectangle(pts[:4], radius=pts[4], fill=BLACK)
        elif kind == "r":
            d.rectangle(pts, fill=BLACK)
        elif kind == "e":
            d.ellipse(pts, fill=BLACK)
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
    c_s, c_e = (Image.open(os.path.join(HERE, "hero_sil_C_%s.png" % v)) for v in "SE")
    S = 5
    W = 4 * (64 * S + 12) + 60
    b = Image.new("RGBA", (W, 64 * S + 330), (236, 230, 216, 255)); dr = ImageDraw.Draw(b)
    dr.text((20, 8), "Antes: C (v3)", fill=(90, 80, 110, 255), font=f)
    dr.text((20 + 2 * (64 * S + 12) + 30, 8), "Agora: D = cabelo H2 + corpo C (mangas bufantes, lanterna na mão)", fill=(30, 24, 40, 255), font=f)
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
