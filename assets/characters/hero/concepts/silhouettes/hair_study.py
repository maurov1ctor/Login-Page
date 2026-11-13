#!/usr/bin/env python3
"""Estudo só de cabelo (corte tigela desgrenhado) — 3 variações na mesma cabeça/corpo (corpo da direção A).
Aplica a crítica da v3: topo achatado, laterais verticais, degrau que mostra bochecha/mandíbula,
desgrenhado feito com MECHAS de 2-5 px (não pixels soltos), franja passando da testa na lateral.
Uso: python3 hair_study.py
"""
import os, importlib.util
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("ms", os.path.join(HERE, "make_silhouettes.py"))
ms = importlib.util.module_from_spec(spec); spec.loader.exec_module(ms)
BLACK = ms.BLACK

# corpo da direção A (tudo depois do rosto) — inalterado neste estudo
A_S_BODY = ms.A_S[[i for i, it in enumerate(ms.A_S) if it == ("e", [22, 9, 42, 30])][0] + 1:]
A_E_BODY = ms.A_E[[i for i, it in enumerate(ms.A_E) if it[0] == "p" and it[1] == [(44, 18), (47, 20), (44, 22)]][0] + 1:]
FACE_S = [("e", [22, 9, 42, 30])]
FACE_E = [("e", [27, 9, 43, 30]), ("p", [(43, 18), (45, 20), (43, 22)])]
TOP_STRAND = [("r", [32, 2, 33, 4])]          # fio espetado do topo (ficha: [usuário]), 2 px de largura

VARIANTS = {
    "H1": ("H1 — tigela reta", [
        ("rr", [16, 5, 48, 23, 4]),
        ("r", [16, 22, 19, 25]), ("r", [45, 22, 48, 24]),                    # 1 mecha por lado na barra
    ], [
        ("rr", [17, 5, 44, 23, 5]), ("r", [17, 22, 20, 26]), ("r", [22, 22, 24, 24]),   # nuca reta com 2 mechas
        ("r", [44, 12, 46, 16]),                                                         # franja passa da testa
    ]),
    "H2": ("H2 — tigela média", [
        ("rr", [16, 5, 48, 23, 6]),
        ("p", [(35, 6), (37, 3), (41, 3), (42, 6)]),                          # tufo fora do centro
        ("r", [16, 22, 19, 26]), ("r", [20, 22, 21, 24]), ("r", [45, 22, 48, 24]),   # um lado mais comprido
        ("p", [(48, 19), (51, 21), (50, 23), (48, 23)]),                      # mecha virada para fora
    ], [
        ("rr", [17, 5, 44, 23, 6]), ("p", [(34, 6), (36, 3), (40, 3), (41, 6)]),
        ("r", [17, 22, 20, 27]), ("r", [22, 22, 24, 25]), ("p", [(17, 18), (14, 21), (15, 23), (17, 23)]),
        ("r", [44, 12, 46, 16]),
    ]),
    "H3": ("H3 — tigela solta (mais desgrenhada)", [
        ("rr", [16, 6, 48, 22, 7]),
        ("p", [(22, 7), (23, 3), (28, 4), (29, 7)]), ("p", [(35, 6), (38, 2), (42, 4), (42, 7)]),
        ("p", [(16, 16), (12, 19), (13, 22), (16, 22)]),
        ("r", [16, 21, 18, 26]), ("r", [19, 21, 21, 24]), ("r", [44, 21, 46, 25]), ("r", [47, 21, 48, 23]),
    ], [
        ("rr", [17, 6, 44, 22, 7]), ("p", [(23, 6), (25, 2), (29, 3), (30, 6)]), ("p", [(33, 6), (36, 3), (40, 4), (40, 7)]),
        ("p", [(17, 15), (12, 17), (13, 21), (17, 20)]),
        ("r", [17, 21, 19, 27]), ("r", [21, 21, 23, 25]), ("r", [44, 11, 46, 16]),
    ]),
}


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


def main():
    try:
        f = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 15)
        fs = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 12)
    except OSError:
        f = fs = ImageFont.load_default()
    S = 4
    imgs = {}
    for k, (title, hs, he) in VARIANTS.items():
        imgs[(k, "S")] = draw(hs + TOP_STRAND + FACE_S + A_S_BODY)
        imgs[(k, "E")] = draw(he + TOP_STRAND + FACE_E + A_E_BODY)
        for v in "SE":
            imgs[(k, v)].save(os.path.join(HERE, "hair_%s_%s.png" % (k, v)))
    W = 3 * (2 * 64 * S + 36) + 30
    H = 30 + 64 * S + 24 + 30 + 64 * 2 + 30 + 90
    b = Image.new("RGBA", (W, H), (236, 230, 216, 255)); d = ImageDraw.Draw(b)
    x = 20
    for k, (title, _, _) in VARIANTS.items():
        d.text((x, 8), title, fill=(30, 24, 40, 255), font=f)
        for i, v in enumerate("SE"):
            b.alpha_composite(imgs[(k, v)].resize((64 * S, 64 * S), Image.NEAREST), (x + i * (64 * S + 6), 30))
        x += 2 * 64 * S + 36
    y = 30 + 64 * S + 20
    d.text((20, y), "cabeças em 2x (frente / lado)", fill=(30, 24, 40, 255), font=fs); y += 18
    for i, k in enumerate(VARIANTS):
        for j, v in enumerate("SE"):
            head = imgs[(k, v)].crop((0, 0, 64, 40)).resize((128, 80), Image.NEAREST)
            b.alpha_composite(head, (20 + i * 300 + j * 136, y))
    y += 80 + 24
    d.rectangle([20, y, W - 20, y + 80], fill=(156, 132, 105, 255))
    d.text((26, y + 2), "tamanho real de jogo (1x)", fill=(40, 30, 24, 255), font=fs)
    for i, k in enumerate(VARIANTS):
        for j, v in enumerate("SE"):
            b.alpha_composite(imgs[(k, v)], (30 + i * 160 + j * 70, y + 14))
    out = os.path.join(HERE, "hair_study_board.png"); b.save(out); print("board:", out)


if __name__ == "__main__":
    main()
