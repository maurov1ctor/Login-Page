#!/usr/bin/env python3
"""Fase F — model sheet do protagonista (paleta final: V1 + brilho de cabelo da V3; lanterna acesa só à noite).
Gera: hero_model_sheet_v1.png + PNGs 64x64 de cada vista (dia/noite) e das expressões.
A geometria vem de ../concepts/hero_D_parts.py e a pintura de ../concepts/color/concept_color.py (fonte única).
Isto ainda é CONCEITO de referência; o sprite final 64x64 (fase G) é redesenhado a partir daqui.
"""
import os, importlib.util
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
_s = importlib.util.spec_from_file_location("cc", os.path.join(HERE, "..", "concepts", "color", "concept_color.py"))
cc = importlib.util.module_from_spec(_s); _s.loader.exec_module(cc)

try:
    F = lambda n: ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", n)
    FB = lambda n: ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", n)
    F(10)
except OSError:
    F = FB = lambda n: ImageFont.load_default()

INK, MUTED, BG, PANEL = (30, 24, 40, 255), (96, 86, 116, 255), (236, 230, 216, 255), (224, 216, 200, 255)
COBBLE, GRASS, NIGHT = (156, 132, 105, 255), (98, 106, 47, 255), (30, 26, 48, 255)


def up(im, s):
    return im.resize((im.size[0] * s, im.size[1] * s), Image.NEAREST)


def main():
    v = {}
    for view in "SEN":
        for night in (False, True):
            im = cc.render(view, "F", night=night)
            v[(view, night)] = im
            im.save(os.path.join(HERE, "hero_ms_%s_%s.png" % (view, "noite" if night else "dia")))
    v[("W", False)] = v[("E", False)].transpose(Image.FLIP_LEFT_RIGHT)
    expr = {e: cc.render("S", "F", expr=e, night=False) for e in ("neutral", "happy", "surprised")}
    for e, im in expr.items():
        im.save(os.path.join(HERE, "hero_ms_expr_%s.png" % e))

    W, H = 1800, 1240
    b = Image.new("RGBA", (W, H), BG); d = ImageDraw.Draw(b)
    d.text((24, 16), "Protagonista — model sheet v1", fill=INK, font=FB(26))
    d.text((24, 50), "Direção D (cabelo H2 + corpo C) · paleta V1 com brilho de cabelo da V3 · canvas 64×64, pés em y=63 · CONCEITO de referência para a fase G", fill=MUTED, font=F(14))

    # 1) turnaround de dia
    S = 5; y0 = 84
    d.text((24, y0), "Turnaround (dia — lanterna apagada)", fill=INK, font=FB(16))
    for i, (key, lab) in enumerate([("S", "frente"), ("E", "lado (direita)"), ("N", "costas"), ("W", "lado (esquerda) = espelho")]):
        x = 24 + i * (64 * S + 14)
        d.rectangle([x - 4, y0 + 26, x + 64 * S + 3, y0 + 30 + 64 * S], fill=PANEL)
        b.alpha_composite(up(v[(key, False)], S), (x, y0 + 28))
        d.text((x, y0 + 34 + 64 * S), lab, fill=MUTED, font=F(13))
    d.text((24, y0 + 54 + 64 * S), "Atenção: o lado esquerdo é o direito espelhado — a alça e a bolsa trocam de lado no espelho (decisão pendente: aceitar ou desenhar à parte).", fill=(150, 60, 50, 255), font=F(12))

    # 2) noite
    xn = 24 + 4 * (64 * S + 14) + 6
    d.text((xn, y0), "Noite (lanterna acesa)", fill=INK, font=FB(16))
    t = Image.new("RGBA", (64 * 3 * 2 + 30, 64 * 3 + 20), NIGHT)
    t.alpha_composite(up(v[("S", True)], 3), (6, 10)); t.alpha_composite(up(v[("E", True)], 3), (64 * 3 + 20, 10))
    b.alpha_composite(t, (xn, y0 + 28))

    # 3) expressões (close do rosto)
    y1 = y0 + 90 + 64 * S
    d.text((24, y1), "Rosto e expressões", fill=INK, font=FB(16))
    for i, (e, lab) in enumerate([("neutral", "neutro"), ("happy", "feliz"), ("surprised", "surpreso")]):
        crop = expr[e].crop((16, 0, 48, 30))
        x = 24 + i * (32 * 8 + 18)
        d.rectangle([x - 4, y1 + 26, x + 32 * 8 + 3, y1 + 30 + 30 * 8], fill=PANEL)
        b.alpha_composite(up(crop, 8), (x, y1 + 28))
        d.text((x, y1 + 34 + 30 * 8), lab, fill=MUTED, font=F(13))

    # 4) detalhes
    xd = 24 + 3 * (32 * 8 + 18) + 10
    d.text((xd, y1), "Detalhes (6×)", fill=INK, font=FB(16))
    det = [("fio desajeitado", "S", (30, 0, 44, 8)), ("gola alta + cachecol", "S", (18, 21, 46, 33)), ("alça + bolsa", "S", (32, 40, 42, 50)),
           ("mão direita + lanterna", "S", (12, 44, 21, 58)), ("rasgo, barra, bota", "S", (32, 48, 44, 63)), ("bolsa nas costas (perfil)", "E", (18, 38, 30, 48))]
    cx, cy, rowh = xd, y1 + 28, 0
    for lab, view, box in det:
        crop = up(v[(view, False)].crop(box), 6)
        if cx + max(crop.size[0], int(d.textlength(lab, font=F(12)))) > W - 20:
            cx = xd; cy += rowh + 26; rowh = 0
        d.rectangle([cx - 3, cy - 3, cx + crop.size[0] + 2, cy + crop.size[1] + 2], fill=PANEL)
        b.alpha_composite(crop, (cx, cy))
        d.text((cx, cy + crop.size[1] + 4), lab, fill=MUTED, font=F(12))
        cx += max(crop.size[0], int(d.textlength(lab, font=F(12)))) + 22; rowh = max(rowh, crop.size[1])

    # 5) paleta
    y2 = y1 + 70 + 30 * 8
    d.text((24, y2), "Paleta final (escuro → claro)", fill=INK, font=FB(16))
    pal = dict(cc.FINAL); pal["glass (noite)"] = pal.pop("glass"); pal["glass (dia)"] = cc.GLASS_OFF
    names = {"hair": "cabelo", "skin": "pele", "scarf": "cachecol", "sweater": "suéter", "sleeve": "mangas", "cuff": "punho/gola",
             "pants": "calça", "boot": "botas", "sole": "sola", "metal": "metal", "strap": "alça/cinto", "bag": "bolsa"}
    for i, (k, ramp) in enumerate(pal.items()):
        col, row = i % 3, i // 3
        x, y = 24 + col * 340, y2 + 28 + row * 40
        d.text((x, y + 6), names.get(k, k), fill=INK, font=F(13))
        for j, h in enumerate(ramp):
            d.rectangle([x + 100 + j * 58, y, x + 100 + j * 58 + 54, y + 22], fill=cc.H(h) + (255,))
            d.text((x + 100 + j * 58, y + 24), h, fill=MUTED, font=F(9))

    # 6) regras + escala de jogo
    xr = 24 + 3 * 340 + 10
    d.text((xr, y2), "Regras de identidade", fill=INK, font=FB(16))
    rules = ["Lanterna sempre na mão DIREITA; acesa só à noite.",
             "Alça: ombro direito → quadril esquerdo; bolsa oliva no quadril esquerdo.",
             "Rasgo no joelho ESQUERDO (só aparece de frente).",
             "Gola alta preta sob o cachecol gola-tubo caramelo.",
             "Ponta do cachecol ao vento só no perfil e diagonais (decisão 1A).",
             "Cabelo: tigela desgrenhada; 1 fio caído para o lado.",
             "Mangas marrons em balão, punho preto, mão pequena.",
             "Barra dobrada (2 linhas) + tornozelo visível + bota de sola clara."]
    for i, r in enumerate(rules):
        d.text((xr, y2 + 30 + i * 20), "• " + r, fill=INK, font=F(12))
    ys = y2 + 30 + len(rules) * 20 + 14
    d.text((xr, ys), "Tamanho real de jogo (1×)", fill=INK, font=FB(14))
    for i, (bg, night) in enumerate([(COBBLE, False), (GRASS, False), (NIGHT, True)]):
        t = Image.new("RGBA", (150, 74), bg)
        t.alpha_composite(v[("S", night)], (8, 6)); t.alpha_composite(v[("E", night)], (80, 6))
        b.alpha_composite(t, (xr + i * 160, ys + 22))

    out = os.path.join(HERE, "hero_model_sheet_v1.png"); b.save(out); print("model sheet:", out)


if __name__ == "__main__":
    main()
