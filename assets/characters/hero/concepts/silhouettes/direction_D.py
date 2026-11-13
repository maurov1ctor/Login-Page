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

# v2 (após crítica da D v1): lanterna sempre na MÃO DIREITA (frente: lado esquerdo da tela);
# ponta do cachecol na frente vai para o outro lado, curta e alta (não funde com a manga);
# manga bufante com volume no cotovelo/antebraço + punho franzido + mão; tronco reto (vão de 2 px em toda a altura);
# lanterna com alça, tampa, corpo e base; topo do cabelo: só o fio + degrau raso de 2 px (sem "copa de chapéu").
D_S = [
    ("rr", [19, 5, 40, 20, 5]), ("rr", [26, 7, 45, 20, 5]),        # topo com degrau raso à direita
    ("p", [(19, 17), (17, 20), (17, 24), (20, 24), (22, 19)]),     # mecha comprida abrindo para fora
    ("r", [41, 19, 45, 21]), ("p", [(45, 16), (48, 18), (47, 20), (45, 20)]),   # mecha curta + mecha virada para fora
    ("r", [32, 2, 33, 4]),                                          # fio do topo (ficha)
    ("e", [23, 9, 41, 26]),
    ("e", [19, 24, 45, 32]), ("p", [(43, 26), (53, 21), (57, 23), (52, 26), (46, 28)]),   # cachecol + ponta curta e alta
    ("r", [23, 30, 41, 44]),                                        # tronco com bordas retas
    ("p", [(23, 30), (19, 31), (17, 33), (21, 33)]), ("r", [17, 31, 20, 37]), ("e", [13, 37, 20, 45]),
    ("r", [14, 45, 19, 46]), ("r", [15, 47, 18, 49]),               # braço direito do personagem: manga, punho, mão
    ("r", [16, 50, 17, 51]), ("r", [15, 52, 18, 52]), ("r", [14, 53, 19, 56]), ("r", [14, 57, 19, 57]),   # lanterna
    ("p", [(41, 30), (45, 31), (47, 33), (43, 33)]), ("r", [44, 31, 47, 37]), ("e", [44, 37, 51, 45]),
    ("r", [45, 45, 50, 46]), ("r", [46, 47, 49, 49]),               # braço esquerdo
    ("p", [(23, 44), (31, 44), (30, 56), (24, 56)]), ("p", [(33, 44), (41, 44), (40, 56), (34, 56)]),
    ("r", [25, 56, 29, 58]), ("r", [35, 56, 39, 58]),
    ("e", [21, 57, 31, 63]), ("e", [33, 57, 43, 63]), ("r", [21, 60, 31, 63]), ("r", [33, 60, 43, 63]),
]
D_E = [
    ("rr", [20, 5, 40, 20, 6]), ("rr", [24, 7, 42, 20, 5]),        # canto de trás mais redondo, degrau raso
    ("r", [20, 19, 23, 24]), ("r", [26, 19, 28, 22]), ("p", [(20, 15), (16, 18), (17, 20), (20, 20)]), ("r", [20, 15, 22, 20]),   # fecha o furo de 1 px no canto da nuca   # nuca: mechas com cortes de 2 px
    ("r", [42, 12, 43, 15]), ("r", [31, 2, 32, 4]),                 # franja menor (não lê como aba de boné)
    ("e", [27, 9, 42, 26]), ("p", [(41, 16), (44, 18), (41, 20)]),
    ("e", [24, 23, 42, 31]), ("p", [(25, 26), (10, 28), (5, 34), (14, 33), (26, 30)]),
    ("p", [(25, 30), (39, 30), (40, 44), (24, 44)]),
    ("r", [31, 31, 34, 35]), ("e", [32, 34, 41, 42]),              # manga bufante passa 1-2 px do tronco no cotovelo
    ("r", [41, 37, 42, 39]), ("e", [42, 37, 45, 40]),              # punho + mão direita à frente
    ("r", [43, 41, 44, 43]), ("r", [42, 44, 45, 44]), ("r", [42, 45, 46, 48]), ("r", [42, 49, 46, 49]),   # lanterna
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
    c_s, c_e = (Image.open(os.path.join(HERE, "history", "hero_sil_D_%s_v1.png" % v)) for v in "SE")
    S = 5
    W = 4 * (64 * S + 12) + 60
    b = Image.new("RGBA", (W, 64 * S + 330), (236, 230, 216, 255)); dr = ImageDraw.Draw(b)
    dr.text((20, 8), "Antes: D v1", fill=(90, 80, 110, 255), font=f)
    dr.text((20 + 2 * (64 * S + 12) + 30, 8), "Agora: D v2 (lanterna na mão direita, mangas com punho, cachecol solto da manga)", fill=(30, 24, 40, 255), font=f)
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
