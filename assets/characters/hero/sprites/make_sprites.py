#!/usr/bin/env python3
"""Fase G — sprites 64x64 do protagonista (5 direções desenhadas + caminhada de 3 quadros).

Base: geometria aprovada (../concepts/hero_D_parts.py) e pintura do conceito (../concepts/color/concept_color.py).
Sobre ela, passes de pixel art feitos aqui:
  - cabelo com mechas: brilho em arco e 3 separações escuras (sem a "grade de pontos" do conceito);
  - limpeza de pixels soltos de sombreado; redução à paleta de produção (31 cores);
  - detalhes à mão (olhos 2x3, boca, blush, alça, bolsa, cinto, cordões, rasgo, barra, sola);
  - contorno para dentro (alfa = silhueta).
Direções desenhadas: S, SE, E, NE, N. W/SW/NW = espelho de E/SE/NE (decisão do usuário).
Quadros: 0 = parado, 1 e 2 = passos (o motor adiciona o balanço vertical; não desenhar bob aqui).
Uso: python3 make_sprites.py
"""
import os, copy, importlib.util
import numpy as np
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
_s = importlib.util.spec_from_file_location("cc", os.path.join(HERE, "..", "concepts", "color", "concept_color.py"))
cc = importlib.util.module_from_spec(_s); _s.loader.exec_module(cc)
parts = cc.parts
cc.HAIR_DOTS = False
H = cc.H
F = dict(cc.FINAL); F["turtle"] = F["cuff"]; F["glass"] = cc.GLASS_OFF   # sprite de dia (lanterna apagada)
PROD = [l.strip() for l in open(os.path.join(HERE, "..", "model_sheets", "hero_palette_production.hex")) if l.strip()]
PAL = np.array([H("#" + h) for h in PROD], float)


# ------------------------------------------------------------------ transformações de geometria
def moved(item, dx=0, dy=0):
    m, k, d = item
    if k in ("e", "r"): d = [d[0] + dx, d[1] + dy, d[2] + dx, d[3] + dy]
    elif k == "rr": d = [d[0] + dx, d[1] + dy, d[2] + dx, d[3] + dy, d[4]]
    else: d = [(x + dx, y + dy) for x, y in d]
    return (m, k, d)


def cx_of(item):
    m, k, d = item
    if k in ("e", "r", "rr"): return (d[0] + d[2]) / 2
    return sum(x for x, _ in d) / len(d)


LEGS = ("pants", "boot")
def leg_side(item, left):
    """True se a parte pertence à perna/pé do lado esquerdo (left) ou direito da tela."""
    m, k, d = item
    if m not in LEGS and not (m == "skin" and k == "r" and (d[1] >= 54 if k == "r" else False)):
        return False
    return (cx_of(item) < 32) == left


def arm_side(item, left):
    m, k, d = item
    if m in ("sleeve", "cuff", "metal", "glass") or (m == "skin" and k == "r" and d[1] < 54 and d[1] >= 44):
        return (cx_of(item) < 32) == left
    return False


def walk_front(plist, f):
    """Frente/costas/diagonais: quadro 1 levanta o pé da esquerda da tela e balança os braços; quadro 2 o contrário."""
    if f == 0: return plist
    left = f == 1
    out = []
    for it in plist:
        if leg_side(it, left):
            m, k, d = it
            if m == "pants" and k == "p":   # encurta a perna: só a barra sobe
                d = [(x, y - 2 if y >= 50 else y) for x, y in d]; it = (m, k, d)
            else:
                it = moved(it, 0, -2)
        elif leg_side(it, not left):
            pass
        elif arm_side(it, not left) or (it[0] == "sleeve" and (cx_of(it) < 32) != left):
            it = moved(it, 0, -1)      # braço vai para a frente (sobe), já com o corpo 1 px abaixo
        elif arm_side(it, left) or (it[0] == "sleeve" and (cx_of(it) < 32) == left):
            it = moved(it, 0, 3)       # braço vai para trás (desce 2) + corpo 1
        elif it[0] not in ("pants",):
            it = moved(it, 0, 1)       # corpo desce 1 px no passo
        out.append(it)
    return out


def walk_side(plist, f):
    """Perfil: quadro 0 pernas juntas, 1 passada (geometria aprovada), 2 passada trocada."""
    base = [it for it in plist if not (it[0] in LEGS or (it[0] == "skin" and it[1] == "r" and it[2][1] >= 54))]
    if f == 0:
        legs = [("pants", "p", [(27, 44), (32, 44), (32, 54), (27, 54)]), ("skin", "r", [28, 55, 31, 58]),
                ("boot", "e", [24, 57, 34, 63]), ("boot", "r", [24, 60, 34, 63]),
                ("pants", "p", [(31, 44), (37, 44), (37, 54), (31, 54)]), ("skin", "r", [32, 55, 35, 58]),
                ("boot", "e", [30, 57, 41, 63]), ("boot", "r", [30, 60, 41, 63])]
    elif f == 1:   # passada aberta (v2: 4-6 px entre as botas)
        legs = [("pants", "p", [(26, 44), (32, 44), (27, 54), (20, 54)]), ("skin", "r", [21, 55, 25, 58]),
                ("boot", "e", [17, 57, 28, 63]), ("boot", "r", [17, 60, 28, 63]),
                ("pants", "p", [(31, 44), (38, 44), (44, 54), (38, 54)]), ("skin", "r", [40, 55, 44, 58]),
                ("boot", "e", [38, 57, 50, 63]), ("boot", "r", [38, 60, 50, 63])]
    else:   # perna de longe à frente (desenhada primeiro), perna de perto atrás
        legs = [("pants", "p", [(30, 44), (36, 44), (43, 54), (37, 54)]), ("skin", "r", [39, 55, 43, 58]),
                ("boot", "e", [37, 57, 49, 63]), ("boot", "r", [37, 60, 49, 63]),
                ("pants", "p", [(27, 44), (33, 44), (27, 54), (20, 54)]), ("skin", "r", [21, 55, 25, 58]),
                ("boot", "e", [17, 57, 28, 63]), ("boot", "r", [17, 60, 28, 63])]
    if f:   # corpo desce 1 px; braço balança (f1 para trás, f2 para a frente); ponta do cachecol tremula
        sw = -1 if f == 1 else 1
        nb = []
        for it in base:
            if arm_side(it, False) or it[0] == "sleeve": it = moved(it, sw, 1)
            elif it[0] == "scarf" and it[1] == "p": it = (it[0], it[1], [(x, y + (f if x < 20 else 1)) for x, y in it[2]])
            else: it = moved(it, 0, 1)
            nb.append(it)
        base = nb
    i = next(i for i, it in enumerate(base) if it[0] == "metal")   # pernas antes da lanterna
    return base[:i] + legs + base[i:]


def diag_SE():
    pl = []
    for it in parts.PARTS_S:
        if it[0] == "skin" and it[1] == "e" and it[2][1] == 9:
            it = moved(it, 2, 0)                                       # rosto vira para a direita da tela
        pl.append(it)
    i = next(i for i, it in enumerate(pl) if it[0] == "scarf")
    pl.insert(i + 1, ("scarf", "p", [(21, 27), (13, 29), (10, 34), (16, 32), (22, 31)]))   # ponta do cachecol aparece atrás
    fringe = {x + 2: y for x, y in parts.FRINGE_S.items()}
    return pl, fringe


def diag_NE():
    pl = list(parts.PARTS_N)
    i = next(i for i, it in enumerate(pl) if it[0] == "turtle")
    pl.insert(i, ("skin", "p", [(44, 14), (45, 15), (45, 19), (44, 20)]))   # v2.1: lasca de 1-2 px na borda do cabelo                     # nesga da bochecha à direita
    j = next(j for j, it in enumerate(pl) if it[0] == "scarf")
    pl.insert(j + 1, ("scarf", "p", [(21, 27), (13, 29), (10, 34), (16, 32), (22, 31)]))
    return pl, {x: 17 for x in range(40, 46)}


def arms_in(plist):
    """v2 (crítica): mangas encostadas no ombro — cada braço 1 px para dentro e 1 px para cima."""
    out = []
    for it in plist:
        if arm_side(it, True) or (it[0] == "sleeve" and cx_of(it) < 32): it = moved(it, 1, -1)
        elif arm_side(it, False) or (it[0] == "sleeve" and cx_of(it) >= 32): it = moved(it, -1, -1)
        out.append(it)
    return out


def turn_3q(plist):
    """v2 (crítica): diagonal de verdade. Nas duas diagonais (SE e NE) o lado direito da tela é o de trás:
    braço de trás recua 3 px e passa para trás do tronco; tronco e ombro estreitam 2 px; perna de trás sobe 1 px e entra 2 px."""
    back_arm, rest = [], []
    for it in plist:
        m, k, d = it
        if (arm_side(it, False) or (m == "sleeve" and cx_of(it) >= 32)):
            back_arm.append(moved(it, -5, 0)); continue   # v2.1: só 3-4 px da manga de trás à mostra
        if m == "sweater" and k == "r" and d[2] - d[0] > 10: it = (m, k, [d[0], d[1], d[2] - 2, d[3]])
        elif m == "sweater" and k == "p" and cx_of(it) > 32: it = moved(it, -2, 0)
        elif m == "scarf" and k == "e": it = (m, k, [d[0] + 1, d[1], d[2] - 1, d[3]])
        elif leg_side(it, False): it = moved(it, -2, -1)
        rest.append(it)
    i = next(i for i, it in enumerate(rest) if it[0] == "sweater")
    return rest[:i] + back_arm + rest[i:]


def nape(plist):
    """v2 (crítica): mechas da nuca por cima do cachecol, 3 delas descendo 2 px abaixo da base."""
    clumps = [it for it in plist if it[0] == "hair" and it[1] == "r" and it[2][1] >= 18]
    rest = [it for it in plist if it not in clumps]
    out = []
    for j, (m, k, d) in enumerate(clumps):
        out.append((m, k, [d[0], d[1], d[2], d[3] + (2 if j in (1, 2, 4) else 0)]))
    i = next(i for i, it in enumerate(rest) if it[0] == "scarf")
    return rest[:i + 1] + out + rest[i + 1:]


_S, _N = arms_in(parts.PARTS_S), nape(arms_in(parts.PARTS_N))
_se, _sef = diag_SE(); _ne, _nef = diag_NE()
VIEWS = {
    "S": (_S, parts.FRINGE_S, "front"),
    "SE": (turn_3q(arms_in(_se)), _sef, "front"),
    "E": (parts.PARTS_E, parts.FRINGE_E, "side"),
    "NE": (turn_3q(nape(arms_in(_ne))), _nef, "back"),
    "N": (_N, parts.FRINGE_N, "back"),
}
DROP = (36, 39, 48, 56)   # v2 (crítica): 63 -> 59 px tirando 2 linhas do tronco e 2 das pernas (cabeça intacta)


# ------------------------------------------------------------------ passes de pixel art
def quantize(a):
    m = a[..., 3] > 0
    rgb = a[..., :3].reshape(-1, 3).astype(float)
    idx = ((rgb[:, None, :] - PAL[None]) ** 2).sum(2).argmin(1)
    q = PAL[idx].reshape(a.shape[0], a.shape[1], 3).astype(np.uint8)
    out = np.dstack([q, a[..., 3]]); out[~m] = 0
    return out


def clean(a, mat):
    """Remove pixels soltos de sombreado: pixel cujos 4 vizinhos (do mesmo material) têm todos a mesma outra cor."""
    out = a.copy()
    for y in range(1, 63):
        for x in range(1, 63):
            if not a[y, x, 3] or mat[y, x] in ("glass", "", "skin"): continue
            nb = [a[y + dy, x + dx] for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1))]
            if all(n[3] for n in nb) and all((n[:3] == nb[0][:3]).all() for n in nb) and not (nb[0][:3] == a[y, x, :3]).all():
                out[y, x] = nb[0]
    return out


def hair_pass(img, mat, kind):
    """Mechas: brilho em arco (2 tons claros, quebrado em tufos) + 3 separações escuras."""
    d = ImageDraw.Draw(img)
    R = F["hair"]
    def put(x, y, c):
        if 0 <= x < 64 and 0 <= y < 64 and mat[y, x] == "hair": d.point((x, y), fill=H(c))
    if kind == "back":   # cantos do topo chanfrados (o cabelo de costas não pode virar caixa)
        ys, xs = np.nonzero(mat == "hair")
        top = ys.min()
        for x0, sgn in ((xs.min(), 1), (xs.max(), -1)):
            for t in range(3):
                for u in range(3 - t):
                    x, y = x0 + sgn * u, top + t
                    if mat[y, x] == "hair": d.point((x, y), fill=(0, 0, 0, 0)); mat[y, x] = ""
        for x in range(21, 43):
            if (x - 21) % 5 in (3, 4): continue                 # brilhos curtos, um por mecha
            y = int(round(9 + ((x - 32) / 11) ** 2 * 4)) + ((x - 21) // 5) % 2
            put(x, y, R[3]); put(x, y + 1, R[2])
        for x0, y0, y1 in ((23, 11, 19), (29, 10, 19), (35, 11, 18), (41, 12, 18)):
            for y in range(y0, y1): put(x0 + (y - y0) // 4, y, R[0])
    elif kind == "front":
        for x in range(21, 41):
            if (x - 21) % 5 == 4: continue                      # quebra o arco em tufos
            y = int(round(8 + ((x - 29) / 11) ** 2 * 4))
            put(x, y, R[3]); put(x, y + 1, R[2])
        for x0, y0, y1 in ((22, 11, 17), (31, 10, 15), (41, 11, 18)):
            for y in range(y0, y1): put(x0 + (y - y0) // 3, y, R[0])
    else:
        for x in range(24, 38):
            if (x - 24) % 5 == 4: continue
            y = int(round(8 + ((x - 32) / 9) ** 2 * 3))
            put(x, y, R[3]); put(x, y + 1, R[2])
        for x0, y0, y1 in ((23, 10, 18), (29, 9, 16)):
            for y in range(y0, y1): put(x0 - (y - y0) // 4, y, R[0])


def face_and_details(img, view, kind, dx):
    d = ImageDraw.Draw(img)
    S = lambda m, k: H(F[m][k])
    eye = cc.EYE["V1"]
    if kind == "front":
        eyes = (26 + dx, 35 + dx) if view == "S" else (28, 36)
        for x0 in eyes:
            d.rectangle([x0, 16, x0 + 1, 18], fill=H(eye[0])); d.point((x0, 17), fill=H(eye[1])); d.point((x0 + 1, 18), fill=H(eye[1])); d.point((x0, 16), fill=H(eye[2]))
        mx = 31 if view == "S" else 33
        d.point((mx, 21), fill=H(cc.MOUTH)); d.point((mx + 1, 21), fill=H(cc.MOUTH))
        bl = (24, 38) if view == "S" else (26, 39)
        for b in bl: d.point((b, 20), fill=H(cc.BLUSH)); d.point((b + 1, 20), fill=H(cc.BLUSH))
        d.rectangle([23, 43, 41, 44], fill=S("strap", 0)); d.point((32, 43), fill=S("scarf", 3))
        d.rectangle([35, 50, 37, 51], fill=S("skin", 2)); d.point((35, 50), fill=S("sweater", 3)); d.point((37, 51), fill=S("sweater", 3))
        d.rectangle([36, 45, 41, 49], fill=S("strap", 0)); d.rectangle([37, 46, 40, 48], fill=S("pants", 3)); d.rectangle([37, 46, 40, 46], fill=S("sweater", 0))
        d.line([(23, 31), (38, 45)], fill=S("strap", 1), width=2)
        d.line([(30, 32), (30, 36)], fill=S("sweater", 0)); d.line([(34, 32), (34, 35)], fill=S("sweater", 0))
    elif kind == "back":
        d.rectangle([23, 43, 41, 44], fill=S("strap", 0))
        d.rectangle([24, 45, 28, 48], fill=S("pants", 2)); d.rectangle([24, 45, 27, 47], fill=S("pants", 3)); d.rectangle([24, 45, 27, 45], fill=S("sweater", 0))
        d.line([(41, 31), (26, 45)], fill=S("strap", 1), width=2)
        d.line([(32, 32), (32, 42)], fill=S("sweater", 1))
    else:
        d.rectangle([37, 16, 38, 18], fill=H(eye[0])); d.point((38, 17), fill=H(eye[1])); d.point((37, 16), fill=H(eye[2]))
        d.point((40, 22), fill=H(cc.MOUTH)); d.point((38, 20), fill=H(cc.BLUSH)); d.point((39, 20), fill=H(cc.BLUSH))
        d.line([(33, 31), (25, 40)], fill=S("strap", 1), width=2)
        d.rectangle([25, 43, 39, 44], fill=S("strap", 0))


def legs_details(img, mat):
    """Barra dobrada (2 linhas claras) logo acima do tornozelo e sola clara — calculado pela geometria do quadro."""
    a = np.array(img)
    d = ImageDraw.Draw(img)
    for x in range(64):
        col = [y for y in range(40, 64) if mat[y, x] == "pants"]
        if col:
            yb = max(col)
            for y in (yb - 1, yb):
                if mat[y, x] == "pants": d.point((x, y), fill=H(F["pants"][3]))
        boots = [y for y in range(50, 64) if mat[y, x] == "boot"]
        if boots:
            yb = max(boots)
            for y in (yb - 1, yb): d.point((x, y), fill=H(F["sweater"][1] if x % 2 else F["sweater"][2]))
    return img


def render(view, f):
    plist, fringe, kind = VIEWS[view]
    plist = walk_side(plist, f) if kind == "side" else walk_front(plist, f)
    mat, pid = cc.regions(plist, fringe)
    a = cc.separations(cc.shade(mat, pid, F), mat)
    a = clean(quantize(a), mat)
    img = Image.fromarray(a)
    hair_pass(img, mat, kind)
    legs_details(img, mat)
    face_and_details(img, view, kind, 0)
    a = np.array(img)
    a[mat == ""] = 0                       # detalhes à mão nunca saem da silhueta
    keep = [y for y in range(64) if y not in DROP]
    a = np.concatenate([np.zeros((len(DROP), 64, 4), np.uint8), a[keep]])
    gap = 63 - max(y for y in range(64) if a[y, :, 3].any())
    if gap: a = np.concatenate([np.zeros((gap, 64, 4), np.uint8), a[:64 - gap]])   # pé de apoio sempre em y=63
    a = cc.outline(a)
    return Image.fromarray(quantize(a))


if __name__ == "__main__":
    for view in VIEWS:
        for f in range(3):
            im = render(view, f)
            im.save(os.path.join(HERE, "hero_%s_%d.png" % (view, f)))
    print("ok: %d sprites" % (len(VIEWS) * 3))
