#!/usr/bin/env python3
"""HD-2D character pipeline — technical tools (Pillow + numpy).

Subcommands
  validate  PNG technical validation against the project sprite standard (exit 1 on errors)
  palette   extract / group the palette of one or more PNGs, optional swatch image
  preview   review board: native, zoom, silhouette, backgrounds, gameplay size
  anim      animation checks (baseline, size drift, jitter) + GIF + onion skin
  sheet     pack frames into a sprite sheet (+ JSON metadata) or unpack one
  blockout  turn a high-res concept into a 64x64 *reference underlay* (never final art)
  guide     draw the 64x64 proportion guide used by the visual bible

Technical validation is NOT artistic approval. See references/quality-checklist.md.
"""
import argparse, colorsys, json, math, os, signal, sys
from PIL import Image, ImageDraw, PngImagePlugin
import numpy as np

# Game post-process quantizes each channel to 48 levels (game/game.js, post shader).
POST_LEVELS = 48
DEFAULT_SIZE = (64, 64)


def load_rgba(path):
    im = Image.open(path)
    im.load()
    return im, np.array(im.convert("RGBA"))


def opaque_mask(a):
    return a[..., 3] > 0


def unique_colors(a):
    m = opaque_mask(a)
    cols = a[m][:, :3]
    if not len(cols):
        return {}
    keys, counts = np.unique(cols, axis=0, return_counts=True)
    return {tuple(int(v) for v in k): int(c) for k, c in zip(keys, counts)}


def font(size=11):
    """Fonte com acentos (DejaVu) quando existir; senão a fonte padrão do Pillow."""
    from PIL import ImageFont
    for f in ("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", "/usr/share/fonts/dejavu/DejaVuSans.ttf"):
        if os.path.exists(f):
            return ImageFont.truetype(f, size)
    return ImageFont.load_default()


def hexc(c):
    return "#%02x%02x%02x" % tuple(c[:3])


def parse_size(s):
    w, h = s.lower().split("x")
    return int(w), int(h)


def parse_range(s):
    a, b = s.split("-")
    return int(a), int(b)


def load_palette(path):
    """Accepts JSON {"ramps": {name: [hex,...]}} or a GIMP .gpl file."""
    cols = set()
    if path.endswith(".json"):
        data = json.load(open(path))
        for ramp in data.get("ramps", {}).values():
            for h in ramp:
                h = h.lstrip("#"); cols.add(tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)))
    else:
        for line in open(path):
            p = line.split()
            if len(p) >= 3 and all(x.isdigit() for x in p[:3]):
                cols.add(tuple(int(x) for x in p[:3]))
    return cols


# --------------------------------------------------------------------------- validate
def validate_one(path, args):
    errors, warns, info = [], [], {}
    try:
        with Image.open(path) as probe:
            probe.verify()
        im, a = load_rgba(path)
    except Exception as e:  # noqa
        return {"file": path, "errors": ["PNG ilegível/corrompido: %s" % e], "warnings": [], "info": {}}
    if im.format != "PNG":
        errors.append("formato %s (esperado PNG)" % im.format)
    stage = (im.info or {}).get("hd2d:stage")
    if stage == "blockout":
        errors.append("arquivo marcado como BLOCKOUT (referência de redução automática) — não é arte final")
    h, w = a.shape[:2]
    info["size"] = "%dx%d" % (w, h)
    if args.size and (w, h) != args.size:
        errors.append("tamanho %dx%d (padrão %dx%d)" % (w, h, *args.size))
    alpha = a[..., 3]
    partial = int(((alpha > 0) & (alpha < 255)).sum())
    if partial:
        errors.append("%d pixels semi-transparentes (o jogo usa alphaTest 0.5: alfa deve ser 0 ou 255)" % partial)
    m = opaque_mask(a)
    if not m.any():
        errors.append("imagem totalmente transparente")
        return {"file": path, "errors": errors, "warnings": warns, "info": info}
    ys, xs = np.where(m)
    x0, x1, y0, y1 = int(xs.min()), int(xs.max()), int(ys.min()), int(ys.max())
    bw, bh = x1 - x0 + 1, y1 - y0 + 1
    info["bbox"] = [x0, y0, x1, y1]; info["occupancy"] = "%dx%d" % (bw, bh)
    if args.occ_w and not (args.occ_w[0] <= bw <= args.occ_w[1]):
        warns.append("largura ocupada %dpx fora da faixa-guia %d-%d" % (bw, *args.occ_w))
    if args.occ_h and not (args.occ_h[0] <= bh <= args.occ_h[1]):
        warns.append("altura ocupada %dpx fora da faixa-guia %d-%d" % (bh, *args.occ_h))
    if args.baseline is not None:
        base = h - 1 if args.baseline < 0 else args.baseline
        if y1 != base:
            errors.append("linha de apoio (pés) em y=%d; o pivô do motor exige y=%d (base do canvas)" % (y1, base))
    cx = (x0 + x1) / 2
    info["center_offset"] = round(cx - (w - 1) / 2, 1)
    if abs(info["center_offset"]) > args.center_tol:
        warns.append("personagem deslocado %.1fpx do centro horizontal (pivô = centro)" % info["center_offset"])
    if x0 == 0 or x1 == w - 1 or y0 == 0:
        warns.append("pixels encostando na borda do canvas (risco de corte / sem margem para animação)")
    cols = unique_colors(a)
    info["colors"] = len(cols)
    if args.max_colors and len(cols) > args.max_colors:
        errors.append("%d cores (limite %d)" % (len(cols), args.max_colors))
    if args.palette:
        pal = load_palette(args.palette)
        off = [c for c in cols if c not in pal]
        if off:
            errors.append("%d cores fora da paleta do projeto: %s" % (len(off), ", ".join(hexc(c) for c in off[:8])))
    # near-duplicate colors (wasted slots / mush after post-process quantization)
    keys = list(cols)
    step = 255 / (POST_LEVELS - 1)
    dup, mush = [], []
    for i in range(len(keys)):
        for j in range(i + 1, len(keys)):
            c1, c2 = np.array(keys[i]), np.array(keys[j])
            if np.abs(c1 - c2).max() < 4:
                dup.append((keys[i], keys[j]))
            elif (np.round(c1 / step) == np.round(c2 / step)).all():
                mush.append((keys[i], keys[j]))
    if dup:
        warns.append("%d pares de cores quase idênticas (ex.: %s/%s)" % (len(dup), hexc(dup[0][0]), hexc(dup[0][1])))
    if mush:
        warns.append("%d pares de cores que viram a MESMA cor após a posterização do jogo (48 níveis)" % len(mush))
    # orphan pixels: opaque pixel whose 4 neighbours have a different colour and that is not on the silhouette edge
    rgb = a[..., :3].astype(int)
    pad = np.pad(m, 1)
    orphans = 0
    for y, x in zip(ys, xs):
        nb = [(y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)]
        if not all(pad[ny + 1, nx + 1] for ny, nx in nb):
            continue
        if all((rgb[ny, nx] != rgb[y, x]).any() for ny, nx in nb):
            orphans += 1
    info["isolated_pixels"] = orphans
    if orphans > args.max_orphans:
        warns.append("%d pixels isolados no interior (ruído; revisar se são intencionais: olhos, brilhos)" % orphans)
    return {"file": path, "errors": errors, "warnings": warns, "info": info}


def cmd_validate(args):
    results = [validate_one(p, args) for p in args.files]
    bad = any(r["errors"] for r in results)
    if args.json:
        print(json.dumps(results, indent=2, ensure_ascii=False))
    else:
        for r in results:
            status = "FALHOU" if r["errors"] else ("AVISOS" if r["warnings"] else "OK")
            print("[%s] %s  %s" % (status, r["file"], json.dumps(r["info"], ensure_ascii=False)))
            for e in r["errors"]:
                print("   ERRO  ", e)
            for w in r["warnings"]:
                print("   aviso ", w)
    return 1 if bad else 0


# --------------------------------------------------------------------------- palette
def hue_of(c):
    h, l, s = colorsys.rgb_to_hls(*(v / 255 for v in c))
    return h * 360, l, s


def cmd_palette(args):
    total = {}
    for p in args.files:
        for c, n in unique_colors(load_rgba(p)[1]).items():
            total[c] = total.get(c, 0) + n
    cols = sorted(total, key=lambda c: (round(hue_of(c)[0] / 30) if hue_of(c)[2] > 0.12 else -1, hue_of(c)[1]))
    groups = {}
    for c in cols:
        hh, l, s = hue_of(c)
        key = "neutros" if s < 0.12 else "matiz~%03d" % (int(round(hh / 30)) * 30 % 360)
        groups.setdefault(key, []).append(c)
    out = {"total_colors": len(cols), "groups": {k: [{"hex": hexc(c), "pixels": total[c], "luma": round(hue_of(c)[1], 2)} for c in v] for k, v in groups.items()}}
    print(json.dumps(out, indent=2, ensure_ascii=False))
    if args.out:
        sw, rows = 16, len(groups)
        width = max(len(v) for v in groups.values()) * sw
        img = Image.new("RGBA", (max(width, sw), rows * sw), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        for r, v in enumerate(groups.values()):
            for i, c in enumerate(v):
                d.rectangle([i * sw, r * sw, i * sw + sw - 1, r * sw + sw - 1], fill=c + (255,))
        img.save(args.out)
        print("swatch:", args.out)
    return 0


# --------------------------------------------------------------------------- preview
BGS = {"calçamento (dia)": (156, 132, 105), "grama": (98, 106, 47), "noite": (30, 26, 48), "claro": (236, 230, 216)}


def checker(w, h, s=4):
    img = Image.new("RGBA", (w, h), (200, 200, 200, 255))
    d = ImageDraw.Draw(img)
    for y in range(0, h, s):
        for x in range(0, w, s):
            if (x // s + y // s) % 2:
                d.rectangle([x, y, x + s - 1, y + s - 1], fill=(170, 170, 170, 255))
    return img


def silhouette(im):
    a = np.array(im.convert("RGBA"))
    out = np.zeros_like(a)
    out[..., 3] = np.where(a[..., 3] > 0, 255, 0)
    out[..., :3] = 20
    return Image.fromarray(out)


def cmd_preview(args):
    im = Image.open(args.file).convert("RGBA")
    w, h = im.size
    s = args.scale
    tiles = []
    big = im.resize((w * s, h * s), Image.NEAREST)
    t = checker(w * s, h * s, s * 2); t.alpha_composite(big); tiles.append(("zoom x%d" % s, t))
    t = Image.new("RGBA", (w * s, h * s), (255, 255, 255, 255)); t.alpha_composite(silhouette(im).resize((w * s, h * s), Image.NEAREST)); tiles.append(("silhueta", t))
    for name, c in BGS.items():
        t = Image.new("RGBA", (w * s, h * s), c + (255,)); t.alpha_composite(big); tiles.append((name, t))
    # gameplay size: 1x and 2x (the game renders at 1 texel = 1 internal pixel, shown at 2-3 css px)
    gp = Image.new("RGBA", (w * s, h * s), BGS["calçamento (dia)"] + (255,))
    gp.alpha_composite(im, (4, h * s - h - 4))
    gp.alpha_composite(im.resize((w * 2, h * 2), Image.NEAREST), (w + 12, h * s - h * 2 - 4))
    tiles.append(("tamanho de jogo 1x / 2x", gp))
    pad, label = 8, 14
    W = len(tiles) * (w * s + pad) + pad
    H = h * s + pad * 2 + label
    board = Image.new("RGBA", (W, H), (24, 20, 32, 255))
    d = ImageDraw.Draw(board)
    for i, (name, t) in enumerate(tiles):
        x = pad + i * (w * s + pad)
        board.alpha_composite(t, (x, pad + label))
        d.text((x, 1), name, fill=(240, 230, 210, 255), font=font(11))
    board.save(args.out)
    print("preview:", args.out)
    return 0


# --------------------------------------------------------------------------- anim
def cmd_anim(args):
    frames = [Image.open(p).convert("RGBA") for p in args.files]
    sizes = {f.size for f in frames}
    report = {"frames": len(frames), "errors": [], "warnings": [], "per_frame": []}
    if len(sizes) > 1:
        report["errors"].append("tamanhos de quadro diferentes: %s" % sorted(sizes))
    arrs = [np.array(f) for f in frames]
    for i, a in enumerate(arrs):
        m = a[..., 3] > 0
        if not m.any():
            report["errors"].append("quadro %d vazio" % i); continue
        ys, xs = np.where(m)
        report["per_frame"].append({"frame": i, "bbox": [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())],
                                    "height": int(ys.max() - ys.min() + 1), "width": int(xs.max() - xs.min() + 1),
                                    "baseline": int(ys.max()), "center_x": round((xs.min() + xs.max()) / 2, 1)})
    pf = report["per_frame"]
    if pf:
        bases = {p["baseline"] for p in pf}
        if len(bases) > 1 and not args.allow_lift:
            report["warnings"].append("linha de apoio varia entre quadros %s (pés flutuando/afundando?)" % sorted(bases))
        hs = [p["height"] for p in pf]
        if max(hs) - min(hs) > args.max_height_delta:
            report["warnings"].append("altura do corpo varia %dpx entre quadros (proporção instável)" % (max(hs) - min(hs)))
        cxs = [p["center_x"] for p in pf]
        if max(cxs) - min(cxs) > args.max_drift:
            report["warnings"].append("centro horizontal deriva %.1fpx (jitter / deslizamento)" % (max(cxs) - min(cxs)))
        for i in range(len(arrs)):
            j = (i + 1) % len(arrs)
            if arrs[i].shape != arrs[j].shape:
                continue
            diff = (arrs[i] != arrs[j]).any(axis=2).sum()
            area = max(1, (arrs[i][..., 3] > 0).sum())
            pf[i]["changed_to_next_pct"] = round(100 * diff / area, 1)
            if diff == 0 and len(arrs) > 1:
                report["warnings"].append("quadros %d e %d idênticos" % (i, j))
    if args.gif:
        s = args.scale
        bg = BGS["calçamento (dia)"] + (255,)
        seq = []
        for f in frames:
            t = Image.new("RGBA", f.size, bg); t.alpha_composite(f)
            seq.append(t.resize((f.size[0] * s, f.size[1] * s), Image.NEAREST).convert("P", palette=Image.ADAPTIVE))
        seq[0].save(args.gif, save_all=True, append_images=seq[1:], duration=int(1000 / args.fps), loop=0, disposal=2)
        report["gif"] = args.gif
    if args.onion:
        base = Image.new("RGBA", frames[0].size, (255, 255, 255, 255))
        for k, f in enumerate(frames):
            a = np.array(f).astype(float)
            a[..., 3] *= 0.35 if k else 1.0
            base.alpha_composite(Image.fromarray(a.astype(np.uint8)))
        base.resize((base.size[0] * args.scale, base.size[1] * args.scale), Image.NEAREST).save(args.onion)
        report["onion"] = args.onion
    print(json.dumps(report, indent=2, ensure_ascii=False))
    return 1 if report["errors"] else 0


# --------------------------------------------------------------------------- sheet
def cmd_sheet(args):
    if args.unpack:
        sheet = Image.open(args.unpack).convert("RGBA")
        fw, fh = args.frame
        os.makedirs(args.outdir, exist_ok=True)
        n = 0
        for y in range(0, sheet.size[1], fh):
            for x in range(0, sheet.size[0], fw):
                tile = sheet.crop((x, y, x + fw, y + fh))
                if np.array(tile)[..., 3].any():
                    tile.save(os.path.join(args.outdir, "frame_%03d.png" % n)); n += 1
        print("quadros extraídos:", n)
        return 0
    frames = [Image.open(p).convert("RGBA") for p in args.files]
    sizes = {f.size for f in frames}
    if len(sizes) != 1:
        print("ERRO: quadros com tamanhos diferentes", sizes); return 1
    fw, fh = frames[0].size
    cols = args.cols or len(frames)
    rows = math.ceil(len(frames) / cols)
    sheet = Image.new("RGBA", (cols * fw, rows * fh), (0, 0, 0, 0))
    meta = {"frame_w": fw, "frame_h": fh, "pivot": [fw / 2, fh], "frames": []}
    for i, (f, p) in enumerate(zip(frames, args.files)):
        x, y = (i % cols) * fw, (i // cols) * fh
        sheet.paste(f, (x, y))
        meta["frames"].append({"index": i, "source": os.path.basename(p), "x": x, "y": y})
    info = PngImagePlugin.PngInfo(); info.add_text("hd2d:sheet", json.dumps({"frame": [fw, fh]}))
    sheet.save(args.out, pnginfo=info)
    if args.meta:
        json.dump(meta, open(args.meta, "w"), indent=2)
    print("sheet:", args.out, "%dx%d" % sheet.size, "quadros:", len(frames))
    return 0


# --------------------------------------------------------------------------- blockout
def cmd_blockout(args):
    src = Image.open(args.file).convert("RGBA")
    a = np.array(src)
    if args.key_bg:
        corner = a[0, 0, :3].astype(int)
        dist = np.abs(a[..., :3].astype(int) - corner).sum(axis=2)
        a[..., 3] = np.where(dist < args.key_tol, 0, a[..., 3])
        src = Image.fromarray(a)
    bbox = src.getbbox() or (0, 0, *src.size)
    src = src.crop(bbox)
    W, H = args.size
    tw, th = args.target
    sc = min(tw / src.size[0], th / src.size[1])
    small = src.resize((max(1, round(src.size[0] * sc)), max(1, round(src.size[1] * sc))), Image.BOX)
    sa = np.array(small)
    sa[..., 3] = np.where(sa[..., 3] >= 128, 255, 0)
    rgb = Image.fromarray(sa[..., :3]).quantize(colors=args.colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert("RGB")
    out = np.dstack([np.array(rgb), sa[..., 3]])
    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    canvas.paste(Image.fromarray(out.astype(np.uint8)), ((W - out.shape[1]) // 2, H - out.shape[0]))
    info = PngImagePlugin.PngInfo(); info.add_text("hd2d:stage", "blockout")
    canvas.save(args.out, pnginfo=info)
    print("blockout (REFERÊNCIA, não arte final):", args.out)
    return 0


# --------------------------------------------------------------------------- guide
def cmd_guide(args):
    W, H, s = 64, 64, args.scale
    img = Image.new("RGBA", (W * s, H * s + 40), (24, 20, 32, 255))
    d = ImageDraw.Draw(img)
    for x in range(W + 1):
        d.line([(x * s, 0), (x * s, H * s)], fill=(44, 38, 60, 255) if x % 8 else (70, 60, 96, 255))
    for y in range(H + 1):
        d.line([(0, y * s), (W * s, y * s)], fill=(44, 38, 60, 255) if y % 8 else (70, 60, 96, 255))
    zones = [("cabeça + cabelo (22-25px)", 4, 27, (242, 196, 90)), ("tronco + braços (16-18px)", 28, 45, (120, 168, 207)),
             ("pernas + pés (14-17px)", 46, 63, (106, 160, 88))]
    for name, y0, y1, c in zones:
        d.rectangle([9 * s + 2, y0 * s + 2, 55 * s - 2, (y1 + 1) * s - 3], outline=c + (255,), width=2)
        d.text((10 * s, y0 * s + 6), name, fill=c + (255,), font=font(13))
    d.line([(32 * s, 0), (32 * s, H * s)], fill=(216, 72, 62, 255), width=2)
    d.line([(0, 64 * s - 1), (W * s, 64 * s - 1)], fill=(216, 72, 62, 255), width=3)
    d.rectangle([0, 16 * s, W * s, 20 * s], outline=(246, 234, 208, 120), width=1)
    d.text((56 * s, 16 * s + 6), "olhos", fill=(246, 234, 208, 255), font=font(12))
    d.text((4, H * s + 6), "64x64 | pivô = centro inferior (x=32, y=63) | ocupação-guia 42-48 x 56-60", fill=(246, 234, 208, 255), font=font(12))
    d.text((4, H * s + 22), "cada quadrado = 1px; linhas fortes a cada 8px; linha vermelha = eixo do pivô / chão", fill=(160, 150, 190, 255), font=font(11))
    img.save(args.out)
    print("guide:", args.out)
    return 0


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sp = ap.add_subparsers(dest="cmd", required=True)
    v = sp.add_parser("validate"); v.add_argument("files", nargs="+")
    v.add_argument("--size", type=parse_size, default=DEFAULT_SIZE)
    v.add_argument("--any-size", dest="size", action="store_const", const=None)
    v.add_argument("--max-colors", type=int, default=32)
    v.add_argument("--palette")
    v.add_argument("--baseline", type=int, default=-1, help="linha dos pés; -1 = última linha do canvas")
    v.add_argument("--no-baseline", dest="baseline", action="store_const", const=None)
    v.add_argument("--occ-w", type=parse_range, default=(42, 48))
    v.add_argument("--occ-h", type=parse_range, default=(56, 60))
    v.add_argument("--center-tol", type=float, default=2.5)
    v.add_argument("--max-orphans", type=int, default=12)
    v.add_argument("--json", action="store_true")
    p = sp.add_parser("palette"); p.add_argument("files", nargs="+"); p.add_argument("--out")
    pr = sp.add_parser("preview"); pr.add_argument("file"); pr.add_argument("--out", required=True); pr.add_argument("--scale", type=int, default=6)
    an = sp.add_parser("anim"); an.add_argument("files", nargs="+"); an.add_argument("--gif"); an.add_argument("--onion")
    an.add_argument("--fps", type=float, default=7); an.add_argument("--scale", type=int, default=6)
    an.add_argument("--max-height-delta", type=int, default=2); an.add_argument("--max-drift", type=float, default=1.5)
    an.add_argument("--allow-lift", action="store_true", help="aceitar variação de linha de apoio (pulo/corrida)")
    sh = sp.add_parser("sheet"); sh.add_argument("files", nargs="*"); sh.add_argument("--out"); sh.add_argument("--meta"); sh.add_argument("--cols", type=int)
    sh.add_argument("--unpack"); sh.add_argument("--frame", type=parse_size, default=DEFAULT_SIZE); sh.add_argument("--outdir", default="frames")
    b = sp.add_parser("blockout"); b.add_argument("file"); b.add_argument("--out", required=True)
    b.add_argument("--size", type=parse_size, default=DEFAULT_SIZE); b.add_argument("--target", type=parse_size, default=(46, 58))
    b.add_argument("--colors", type=int, default=24); b.add_argument("--key-bg", action="store_true"); b.add_argument("--key-tol", type=int, default=40)
    g = sp.add_parser("guide"); g.add_argument("--out", required=True); g.add_argument("--scale", type=int, default=10)
    args = ap.parse_args()
    return {"validate": cmd_validate, "palette": cmd_palette, "preview": cmd_preview, "anim": cmd_anim,
            "sheet": cmd_sheet, "blockout": cmd_blockout, "guide": cmd_guide}[args.cmd](args)


if __name__ == "__main__":
    if hasattr(signal, "SIGPIPE"):
        signal.signal(signal.SIGPIPE, signal.SIG_DFL)  # permite `| head` sem traceback
    sys.exit(main())
