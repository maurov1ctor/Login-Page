#!/usr/bin/env python3
"""Fase D — conceito em cor do protagonista sobre a silhueta D v3 (fonte: ../hero_D_parts.py).
3 variações de paleta/material, todas respeitando as cores fixadas pelo usuário
(cabelo preto, cachecol caramelo, suéter creme, mangas marrons, punhos pretos, calça oliva, botas caramelo).

Isto é CONCEITO (pintura por regiões com sombreado automático + detalhes à mão), não o sprite final:
o sprite 64x64 final (fase G) é redesenhado pixel a pixel a partir do conceito aprovado.
Uso: python3 concept_color.py
"""
import os, importlib.util
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
_s = importlib.util.spec_from_file_location("parts", os.path.join(HERE, "..", "hero_D_parts.py"))
parts = importlib.util.module_from_spec(_s); _s.loader.exec_module(parts)

H = lambda h: tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))

# rampas escuro → claro (hue shift: sombras frias/arroxeadas, luzes quentes)
PALETTES = {
    "V1": ("V1 — Fiel à referência", {
        "hair": ["#0b0910", "#17121e", "#262030", "#3e3550"], "skin": ["#b8786a", "#e0a890", "#f2c8ac", "#fbe2cc"],
        "scarf": ["#6e4f30", "#9c7448", "#c49a64", "#dcbc88"], "sweater": ["#9c8a74", "#c2b096", "#d6c6aa", "#e6d8c0"],
        "sleeve": ["#4e3424", "#6e4a32", "#8e6444", "#a87e58"], "cuff": ["#141016", "#221c24", "#2e2830", "#3a3440"],
        "pants": ["#2c2c22", "#41402f", "#565440", "#6c6a52"], "boot": ["#6a4c32", "#946c48", "#b88e60", "#d4ae80"],
        "sole": ["#8e867c", "#b0a89c", "#c8c0b4", "#dcd6cc"], "metal": ["#3a2c20", "#6a5236", "#9a7a4e", "#c8a670"],
        "glass": ["#c86a20", "#f0a040", "#ffd27a", "#fff4c8"], "strap": ["#1e1614", "#2e2420", "#3e322c", "#4e4038"],
        "bag": ["#3a3624", "#5a5636", "#7a7650", "#969268"],
    }),
    "V2": ("V2 — Viajante do crepúsculo", {
        "hair": ["#0a0a16", "#141830", "#222a48", "#3a4670"], "skin": ["#ac6e66", "#d8a08a", "#f0c4a8", "#fadcc4"],
        "scarf": ["#6a3420", "#9a5230", "#c8743c", "#e89a58"], "sweater": ["#8a7a74", "#b8aa9e", "#d0c4b8", "#e2d8cc"],
        "sleeve": ["#3e2622", "#5e3a30", "#7e5240", "#9a6a52"], "cuff": ["#100e18", "#1c1a28", "#2a2636", "#383446"],
        "pants": ["#1e2a22", "#2e3e30", "#40543e", "#566a50"], "boot": ["#6e4a26", "#9a6a34", "#c48e48", "#e0b068"],
        "sole": ["#8c847a", "#ada498", "#c6beb2", "#dad4ca"], "metal": ["#1e2026", "#363a44", "#565c68", "#7e8694"],
        "glass": ["#b85a20", "#e88a38", "#ffc464", "#fff0c0"], "strap": ["#1a1418", "#2a2028", "#3a2e36", "#4a3c44"],
        "bag": ["#3a3a2a", "#5a5a40", "#7a7a58", "#949470"],
    }),
    "V3": ("V3 — Leitura máxima (contraste de valor)", {
        "hair": ["#08070c", "#141018", "#221c2a", "#4a3e5c"], "skin": ["#b4705e", "#e0a486", "#f4caa8", "#fde6cc"],
        "scarf": ["#7a4e24", "#b07434", "#d89a48", "#f2c070"], "sweater": ["#a08c72", "#c8b698", "#dccca8", "#ecdfc4"],
        "sleeve": ["#4a2e1c", "#704428", "#965c34", "#b47844"], "cuff": ["#0e0c10", "#1a161c", "#28222a", "#363038"],
        "pants": ["#24261c", "#36382a", "#4a4c38", "#5e604a"], "boot": ["#74522e", "#a07642", "#c89a5a", "#e6be7c"],
        "sole": ["#988e80", "#bcb2a4", "#d4ccbe", "#e6e0d4"], "metal": ["#2c3a36", "#4a6a5e", "#7aa08c", "#b6d4c0"],
        "glass": ["#c87a28", "#f0a848", "#ffd890", "#fff8e0"], "strap": ["#1a1210", "#2a201c", "#3a2e28", "#4a3c34"],
        "bag": ["#34341f", "#54542f", "#747446", "#90905c"],
    }),
}
EYE = {"V1": ("#140c14", "#4a5878", "#9aa8c8"), "V2": ("#0e0c1a", "#3e5a8a", "#8ab0e0"), "V3": ("#0c080c", "#3a4a6a", "#a8b8d8")}
BLUSH, MOUTH = "#e88c88", "#9a4a48"


def regions(plist, fringe):
    """Rasteriza as partes em mapas de material e de 'id de parte' (para o sombreado por região)."""
    mat = np.full((64, 64), "", dtype=object)
    pid = np.full((64, 64), -1)
    face = np.zeros((64, 64), bool)
    for i, (m, kind, d) in enumerate(plist):
        im = Image.new("L", (64, 64), 0); dr = ImageDraw.Draw(im)
        if kind == "e": dr.ellipse(d, fill=255)
        elif kind == "r": dr.rectangle(d, fill=255)
        elif kind == "rr": dr.rounded_rectangle(d[:4], radius=d[4], fill=255)
        elif kind == "px": [dr.point(p, fill=255) for p in d]
        else: dr.polygon(d, fill=255)
        mask = np.array(im) > 0
        if m == "skin" and i == 0:
            face = mask.copy()
        if m == "hair":   # franja: sobre o rosto o cabelo só cobre acima da linha da franja
            for x, fy in fringe.items():
                mask[fy:, x] &= ~face[fy:, x]
        mat[mask] = m; pid[mask] = 1000 if m == "hair" else i
    return mat, pid


def shade(mat, pid, pal):
    out = np.zeros((64, 64, 4), np.uint8)
    for i in np.unique(pid):
        if i < 0: continue
        ys, xs = np.where(pid == i)
        x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
        w, h = max(1, x1 - x0), max(1, y1 - y0)
        for y, x in zip(ys, xs):
            m = mat[y, x]; R = [H(c) for c in pal[m]]
            if m == "glass":   # vidro aceso: núcleo claro, bordas quentes
                t = abs((x - (x0 + x1) / 2) / max(1, w / 2)) + abs((y - (y0 + y1) / 2) / max(1, h / 2)) * 0.6
                k = 3 if t < 0.5 else 2 if t < 0.95 else 1
            else:
                t = (x - x0) / w * 0.55 + (y - y0) / h * 0.45          # luz de cima-esquerda
                k = 3 if t < 0.22 else 2 if t < 0.62 else 1
                right = x + 1 > 63 or pid[y, x + 1] != i; below = y + 1 > 63 or pid[y + 1, x] != i
                if right or below: k = max(0, min(k, 1) - (1 if (right and below) else 0))
                if m == "hair" and (x * 7 + y * 3) % 11 == 0 and k > 1: k -= 1   # mechas
            out[y, x, :3] = R[k]; out[y, x, 3] = 255
    return out


def separations(out, mat):
    """Linha escura entre materiais diferentes (só na borda de baixo/direita, para não pesar)."""
    for y in range(63):
        for x in range(63):
            if mat[y, x] and mat[y + 1, x] and mat[y + 1, x] != mat[y, x] and mat[y, x] not in ("glass",):
                out[y, x, :3] = (out[y, x, :3] * 0.62).astype(np.uint8)
    return out


def outline(out):
    """Contorno para DENTRO: os pixels opacos da borda viram o tom escuro do próprio material.
    Assim a forma em cor é exatamente a silhueta aprovada (vãos e espaço negativo preservados)."""
    a = out[..., 3] > 0
    res = out.copy()
    for y in range(64):
        for x in range(64):
            if not a[y, x]: continue
            edge = any(not (0 <= y + dy < 64 and 0 <= x + dx < 64) or not a[y + dy, x + dx] for dy, dx in ((1, 0), (0, 1), (0, -1), (-1, 0)))
            if edge:
                c = out[y, x, :3].astype(float)
                res[y, x, :3] = np.clip(c * 0.32 + np.array([12, 4, 18]), 0, 255).astype(np.uint8)
    return res


def details(img, view, pal, eye):
    d = ImageDraw.Draw(img)
    S = lambda m, k: H(pal[m][k])
    if view == "S":
        for x0 in (26, 35):          # olhos 2x3: cílio escuro, íris, brilho
            d.rectangle([x0, 16, x0 + 1, 18], fill=H(eye[0])); d.point((x0, 17), fill=H(eye[1])); d.point((x0 + 1, 18), fill=H(eye[1])); d.point((x0, 16), fill=H(eye[2]))
        d.point((31, 21), fill=H(MOUTH)); d.point((32, 21), fill=H(MOUTH))
        d.point((24, 20), fill=H(BLUSH)); d.point((25, 20), fill=H(BLUSH)); d.point((38, 20), fill=H(BLUSH)); d.point((39, 20), fill=H(BLUSH))
        d.rectangle([23, 43, 41, 44], fill=S("strap", 0)); d.point((32, 43), fill=S("metal", 3))   # cinto + fivela
        d.rectangle([35, 50, 37, 51], fill=S("skin", 2)); d.point((35, 50), fill=S("sweater", 3)); d.point((37, 51), fill=S("sweater", 3))  # rasgo joelho esq.
        d.rectangle([36, 45, 40, 48], fill=S("bag", 0)); d.rectangle([37, 45, 40, 47], fill=S("bag", 2)); d.rectangle([37, 45, 40, 45], fill=S("bag", 3))   # bolsa na lateral da coxa
        d.line([(23, 31), (38, 45)], fill=S("strap", 1), width=2)                   # alça (por cima do cinto) chegando na bolsa
        d.line([(30, 32), (30, 36)], fill=S("sweater", 0)); d.line([(34, 32), (34, 35)], fill=S("sweater", 0))   # cordões
        d.rectangle([24, 53, 30, 54], fill=S("pants", 3)); d.rectangle([34, 53, 40, 54], fill=S("pants", 3))   # barra dobrada (2 linhas)
        d.rectangle([21, 62, 31, 63], fill=S("sole", 2)); d.rectangle([33, 62, 43, 63], fill=S("sole", 1))
    else:
        d.rectangle([37, 16, 38, 18], fill=H(eye[0])); d.point((38, 17), fill=H(eye[1])); d.point((37, 16), fill=H(eye[2]))
        d.point((40, 22), fill=H(MOUTH)); d.point((38, 20), fill=H(BLUSH)); d.point((39, 20), fill=H(BLUSH))
        d.line([(33, 31), (25, 40)], fill=S("strap", 1), width=2)                   # alça até a bolsa no quadril de trás
        d.rectangle([25, 43, 39, 44], fill=S("strap", 0))
        d.rectangle([24, 53, 29, 54], fill=S("pants", 3)); d.rectangle([35, 53, 40, 54], fill=S("pants", 3))
        d.rectangle([20, 62, 31, 63], fill=S("sole", 2)); d.rectangle([35, 62, 47, 63], fill=S("sole", 1))
    return img


def render(view, key):
    plist = parts.PARTS_S if view == "S" else parts.PARTS_E
    fringe = parts.FRINGE_S if view == "S" else parts.FRINGE_E
    pal = dict(PALETTES[key][1]); pal["turtle"] = pal["cuff"]
    mat, pid = regions(plist, fringe)
    out = separations(shade(mat, pid, pal), mat)
    img = Image.fromarray(out)
    img = details(img, view, pal, EYE[key])
    return Image.fromarray(outline(np.array(img)))


def board(imgs):
    try:
        f = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 15)
        fs = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 12)
    except OSError:
        f = fs = ImageFont.load_default()
    S = 5
    colw = 2 * 64 * S + 30
    W = 3 * colw + 40
    Hh = 30 + 64 * S + 24 + 70 + 130
    b = Image.new("RGBA", (W, Hh), (236, 230, 216, 255)); d = ImageDraw.Draw(b)
    bgs = [(156, 132, 105), (98, 106, 47), (30, 26, 48)]
    for c, key in enumerate(PALETTES):
        x = 20 + c * colw
        d.text((x, 8), PALETTES[key][0], fill=(30, 24, 40, 255), font=f)
        for j, v in enumerate("SE"):
            b.alpha_composite(imgs[(key, v)].resize((64 * S, 64 * S), Image.NEAREST), (x + j * (64 * S + 8), 30))
        # paleta
        y = 30 + 64 * S + 8
        for r, (m, ramp) in enumerate(PALETTES[key][1].items()):
            for k, col in enumerate(ramp):
                xx = x + (r % 7) * 82 + k * 18; yy = y + (r // 7) * 22
                d.rectangle([xx, yy, xx + 15, yy + 15], fill=H(col) + (255,))
        # tamanho de jogo em 3 fundos
        y += 56
        d.text((x, y), "tamanho real de jogo (1x) — calçamento, grama, noite", fill=(60, 50, 70, 255), font=fs)
        for k, bg in enumerate(bgs):
            t = Image.new("RGBA", (150, 80), bg + (255,))
            t.alpha_composite(imgs[(key, "S")], (10, 10)); t.alpha_composite(imgs[(key, "E")], (76, 10))
            b.alpha_composite(t, (x + k * 160, y + 18))
    out = os.path.join(HERE, "hero_color_concepts_board.png"); b.save(out); return out


if __name__ == "__main__":
    imgs = {}
    for key in PALETTES:
        for v in "SE":
            imgs[(key, v)] = render(v, key)
            imgs[(key, v)].save(os.path.join(HERE, "hero_color_%s_%s.png" % (key, v)))
    print("board:", board(imgs))
