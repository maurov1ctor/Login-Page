#!/usr/bin/env python3
"""Fonte editável das 3 direções de silhueta do protagonista (fase C).
Gera PNGs 64x64 (preto opaco, pés em y=63, eixo em x=32) e o quadro de comparação com o elenco atual.
Uso: python3 make_silhouettes.py [pasta-do-elenco-exportado]
"""
import os, sys
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
BLACK = (18, 14, 24, 255)


def new():
    im = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    return im, ImageDraw.Draw(im)


def shapes(d, items):
    for kind, pts in items:
        if kind == "e":
            d.ellipse(pts, fill=BLACK)
        elif kind == "r":
            d.rectangle(pts, fill=BLACK)
        else:
            d.polygon(pts, fill=BLACK)


# Cabelo v3 (pedido do usuário): corte tigela desgrenhado — topo mais reto, laterais retas até a mandíbula,
# barra recortada irregular e só 1-2 fios fora do lugar; nada de pontas espetadas nem massa redonda.
# Recorte no pescoço para o cachecol ler como forma própria.

# ---------------------------------------------------------------- A: fiel ao conceito (~2,6 cabeças)
A_S = [
    ("p", [(23, 5), (29, 4), (35, 4), (41, 5), (45, 8), (47, 13), (48, 19), (49, 25), (47, 24), (46, 28), (44, 25), (42, 28), (40, 23),
           (24, 23), (22, 28), (20, 25), (18, 28), (17, 24), (15, 25), (16, 19), (17, 13), (19, 8)]),
    ("p", [(30, 5), (32, 2), (34, 5)]), ("p", [(48, 21), (51, 20), (49, 24)]),     # 2 fios fora do lugar
    ("e", [22, 9, 42, 30]),
    ("e", [15, 29, 49, 38]),                                   # cachecol gola-tubo, mais largo que os ombros
    ("p", [(20, 35), (44, 35), (45, 48), (19, 48)]),           # suéter
    ("p", [(18, 36), (12, 47), (15, 49), (18, 42)]), ("p", [(46, 36), (52, 47), (49, 49), (46, 42)]),   # braços soltos do tronco
    ("e", [10, 46, 15, 51]), ("e", [49, 46, 54, 51]),
    ("p", [(20, 47), (31, 47), (30, 58), (21, 58)]), ("p", [(33, 47), (44, 47), (43, 58), (34, 58)]),
    ("r", [23, 58, 28, 59]), ("r", [36, 58, 41, 59]),
    ("e", [19, 57, 30, 63]), ("e", [34, 57, 45, 63]), ("r", [19, 60, 30, 63]), ("r", [34, 60, 45, 63]),
]
A_E = [
    ("p", [(19, 8), (23, 5), (31, 4), (38, 5), (43, 8), (46, 12), (46, 16), (41, 16), (38, 13), (30, 13), (28, 18), (28, 24),
           (26, 28), (24, 25), (22, 28), (20, 24), (17, 27), (16, 21), (16, 14)]),
    ("p", [(30, 5), (32, 2), (34, 5)]),
    ("e", [27, 9, 45, 30]), ("p", [(44, 18), (47, 20), (44, 22)]),
    ("e", [21, 29, 46, 38]),
    ("p", [(23, 35), (42, 35), (44, 48), (21, 48)]),
    ("r", [14, 41, 19, 48]),                                   # bolsa atrás, separada do tronco
    ("p", [(30, 36), (37, 36), (38, 47), (30, 47)]), ("e", [30, 46, 37, 51]),
    ("p", [(24, 47), (33, 47), (30, 58), (22, 58)]), ("p", [(31, 47), (40, 47), (43, 58), (35, 58)]),
    ("e", [20, 57, 31, 63]), ("e", [34, 57, 46, 63]), ("r", [20, 60, 31, 63]), ("r", [34, 60, 46, 63]),
]

# ---------------------------------------------------------------- B: compacto expressivo (~2,1 cabeças)
B_S = [
    ("p", [(21, 6), (28, 4), (36, 4), (43, 6), (48, 10), (51, 16), (52, 23), (53, 30), (51, 29), (50, 33), (48, 29), (46, 32), (44, 28),
           (20, 28), (18, 32), (16, 29), (14, 33), (13, 29), (11, 30), (12, 23), (13, 16), (16, 10)]),
    ("p", [(30, 5), (32, 2), (35, 5)]), ("p", [(52, 25), (55, 24), (53, 28)]),
    ("e", [18, 13, 46, 36]),
    ("e", [13, 35, 51, 44]),                                   # cachecol enorme
    ("p", [(19, 40), (45, 40), (50, 54), (14, 54)]),           # suéter em A (quase um poncho)
    ("e", [10, 49, 15, 55]), ("e", [49, 49, 54, 55]),
    ("e", [46, 43, 58, 54]),                                   # bolsa grande saltando do lado
    ("r", [22, 53, 29, 57]), ("r", [35, 53, 42, 57]),
    ("e", [16, 54, 31, 63]), ("e", [33, 54, 48, 63]), ("r", [16, 59, 31, 63]), ("r", [33, 59, 48, 63]),
]
B_E = [
    ("p", [(14, 9), (21, 5), (31, 4), (40, 5), (46, 9), (49, 14), (49, 19), (44, 19), (40, 15), (30, 15), (27, 21), (27, 28),
           (25, 33), (22, 29), (19, 33), (16, 28), (12, 31), (11, 24), (11, 15)]),
    ("p", [(29, 5), (31, 2), (34, 5)]),
    ("e", [25, 14, 47, 36]), ("p", [(46, 23), (49, 25), (46, 27)]),
    ("e", [18, 35, 46, 44]),
    ("p", [(20, 40), (42, 40), (46, 54), (16, 54)]),
    ("e", [4, 41, 18, 54]),                                    # bolsa grande nas costas
    ("e", [31, 48, 38, 55]),
    ("r", [24, 53, 31, 57]), ("r", [34, 53, 41, 57]),
    ("e", [18, 54, 32, 63]), ("e", [33, 54, 49, 63]), ("r", [18, 59, 32, 63]), ("r", [33, 59, 49, 63]),
]

# ---------------------------------------------------------------- C: esguio viajante (~3 cabeças)
C_S = [
    ("p", [(23, 6), (28, 4), (36, 4), (41, 6), (44, 10), (45, 15), (46, 22), (44, 21), (43, 25), (41, 21), (39, 23),
           (25, 21), (23, 24), (21, 21), (19, 23), (18, 17), (19, 11)]),
    ("p", [(30, 5), (32, 2), (34, 5)]),
    ("e", [24, 9, 40, 25]),
    ("e", [19, 24, 45, 32]),                                   # cachecol…
    ("p", [(21, 27), (8, 33), (5, 40), (12, 37), (23, 32)]),   # …com ponta ao vento [proposta]
    ("p", [(22, 30), (42, 30), (43, 44), (21, 44)]),
    ("p", [(20, 31), (16, 43), (19, 45), (20, 37)]), ("p", [(44, 31), (48, 43), (45, 45), (44, 37)]),
    ("e", [15, 42, 19, 47]), ("e", [45, 42, 49, 47]),
    ("r", [41, 38, 45, 43]), ("r", [43, 44, 43, 46]), ("r", [41, 46, 45, 51]),   # bolsa + lanterna pendurada [proposta]
    ("p", [(22, 44), (31, 44), (30, 56), (23, 56)]), ("p", [(33, 44), (42, 44), (41, 56), (34, 56)]),
    ("r", [24, 56, 29, 58]), ("r", [35, 56, 40, 58]),
    ("e", [21, 57, 31, 63]), ("e", [33, 57, 43, 63]), ("r", [21, 60, 31, 63]), ("r", [33, 60, 43, 63]),
]
C_E = [
    ("p", [(20, 9), (24, 6), (31, 4), (37, 5), (41, 8), (43, 12), (43, 16), (39, 15), (36, 12), (29, 12), (27, 17), (26, 22),
           (24, 20), (22, 23), (20, 19), (18, 21), (18, 14)]),
    ("p", [(30, 5), (32, 2), (34, 5)]),
    ("e", [27, 9, 43, 25]), ("p", [(42, 15), (45, 17), (42, 19)]),
    ("e", [24, 24, 43, 32]),
    ("p", [(25, 27), (10, 29), (5, 35), (14, 34), (26, 31)]),  # ponta do cachecol para trás
    ("p", [(25, 30), (39, 30), (40, 44), (24, 44)]),
    ("p", [(30, 31), (35, 31), (36, 44), (30, 44)]), ("e", [30, 43, 35, 48]),
    ("r", [41, 40, 41, 43]), ("r", [40, 43, 43, 48]),          # lanterna à frente
    ("p", [(26, 44), (32, 44), (29, 57), (22, 57)]), ("p", [(31, 44), (38, 44), (42, 57), (36, 57)]),
    ("e", [20, 57, 31, 63]), ("e", [35, 57, 47, 63]), ("r", [20, 60, 31, 63]), ("r", [35, 60, 47, 63]),
]

DIRS = {
    "A": ("A — Fiel ao conceito", A_S, A_E),
    "B": ("B — Compacto expressivo", B_S, B_E),
    "C": ("C — Esguio viajante", C_S, C_E),
}


def build():
    out = {}
    for k, (_, s, e) in DIRS.items():
        for view, items in (("S", s), ("E", e)):
            im, d = new(); shapes(d, items)
            path = os.path.join(HERE, "hero_sil_%s_%s.png" % (k, view))
            im.save(path); out[(k, view)] = im
    return out


def sil(im):
    """Qualquer sprite → silhueta preta."""
    a = im.convert("RGBA")
    px = a.load()
    for y in range(a.size[1]):
        for x in range(a.size[0]):
            px[x, y] = BLACK if px[x, y][3] > 0 else (0, 0, 0, 0)
    return a


def board(sils, cast_dir):
    from PIL import ImageFont
    try:
        f = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 15)
        fs = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 12)
    except OSError:
        f = fs = ImageFont.load_default()
    S = 5
    W = 3 * (2 * 64 * S + 40) + 40
    cast = []
    if cast_dir:
        for n in ["hero_S_0", "npc_lia_S_0", "npc_caio_S_0", "npc_joaquim_S_0", "npc_guard_S_0", "npc_rosa_S_0", "npc_tito_S_0"]:
            p = os.path.join(cast_dir, n + ".png")
            if os.path.exists(p):
                cast.append((n.replace("npc_", "").replace("_S_0", ""), sil(Image.open(p))))
    H = 64 * S + 60 + 64 * 2 + 70 + 120
    b = Image.new("RGBA", (W, H), (236, 230, 216, 255))
    d = ImageDraw.Draw(b)
    x = 20
    for k, (title, _, _) in DIRS.items():
        d.text((x, 10), title, fill=(30, 24, 40, 255), font=f)
        for i, v in enumerate("SE"):
            b.alpha_composite(sils[(k, v)].resize((64 * S, 64 * S), Image.NEAREST), (x + i * (64 * S + 8), 34))
            d.text((x + i * (64 * S + 8), 34 + 64 * S + 2), "frente" if v == "S" else "lado", fill=(90, 80, 110, 255), font=fs)
        x += 2 * 64 * S + 40
    # linha do elenco em 2x
    y = 34 + 64 * S + 30
    d.text((20, y), "Elenco em 2x (silhuetas): A, B, C e moradores atuais", fill=(30, 24, 40, 255), font=f)
    y += 22
    row = [("A", sils[("A", "S")]), ("B", sils[("B", "S")]), ("C", sils[("C", "S")])] + cast
    for i, (n, im) in enumerate(row):
        b.alpha_composite(im.resize((128, 128), Image.NEAREST), (20 + i * 136, y))
        d.text((20 + i * 136 + 4, y + 128), n, fill=(90, 80, 110, 255), font=fs)
    # tamanho de jogo 1x sobre o calçamento
    y += 128 + 26
    d.rectangle([20, y, W - 20, y + 84], fill=(156, 132, 105, 255))
    d.text((26, y + 2), "tamanho real de jogo (1x)", fill=(40, 30, 24, 255), font=fs)
    for i, (n, im) in enumerate(row):
        b.alpha_composite(im, (30 + i * 72, y + 18))
    out = os.path.join(HERE, "hero_silhouettes_board.png")
    b.save(out)
    return out


if __name__ == "__main__":
    s = build()
    print("board:", board(s, sys.argv[1] if len(sys.argv) > 1 else None))
