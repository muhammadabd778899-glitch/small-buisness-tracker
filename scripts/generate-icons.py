"""Render the app icon set from one vector-style definition.

Run from the repository root with Pillow installed:

    python scripts/generate-icons.py

Writes public/icons/icon-512.png, icon-192.png, maskable-512.png and
apple-touch-icon.png. The mark is a white growth chart (three ascending bars
and an arrow) on the brand orange tile.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "public" / "icons"
MASTER = 2048
ORANGE_TOP = (249, 128, 68)
ORANGE_BOTTOM = (232, 84, 27)


def vertical_gradient(size: int, top: tuple[int, int, int], bottom: tuple[int, int, int]) -> Image.Image:
    gradient = Image.new("RGB", (1, size))
    pixels = gradient.load()
    for y in range(size):
        ratio = y / max(size - 1, 1)
        pixels[0, y] = tuple(round(top[c] + (bottom[c] - top[c]) * ratio) for c in range(3))
    return gradient.resize((size, size), Image.Resampling.NEAREST).convert("RGBA")


def draw_glyph(draw: ImageDraw.ImageDraw, size: int, scale: float) -> None:
    """Draw the chart mark centred inside a size x size canvas."""
    white = (255, 255, 255, 255)
    bar_width = 104
    gap = 48
    group_width = bar_width * 3 + gap * 2
    base_y = 748
    heights = (150, 240, 330)
    radius = 40

    left = (1024 - group_width) / 2
    cx, cy = size / 2, size / 2

    def place(x: float, y: float) -> tuple[float, float]:
        return cx + (x - 512) * scale, cy + (y - 512) * scale

    for index, height in enumerate(heights):
        x0 = left + index * (bar_width + gap)
        x1 = x0 + bar_width
        y0 = base_y - height
        px0, py0 = place(x0, y0)
        px1, py1 = place(x1, base_y)
        draw.rounded_rectangle(
            [px0, py0, px1, py1],
            radius=radius * scale,
            fill=white,
        )

    stroke = 54
    points = [(330, 500), (520, 380), (668, 292)]
    placed = [place(x, y) for x, y in points]
    draw.line(placed, fill=white, width=round(stroke * scale), joint="curve")
    for point in placed:
        r = stroke * scale / 2
        draw.ellipse([point[0] - r, point[1] - r, point[0] + r, point[1] + r], fill=white)

    tip = place(700, 272)
    back = place(636, 268)
    corner = place(684, 336)
    draw.polygon([tip, back, corner], fill=white)


def render(size: int, *, maskable: bool) -> Image.Image:
    canvas = vertical_gradient(size, ORANGE_TOP, ORANGE_BOTTOM)
    background = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    mask = Image.new("L", (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    if maskable:
        mask_draw.rectangle([0, 0, size, size], fill=255)
        glyph_scale = 0.86
    else:
        radius = round(size * 0.21875)
        mask_draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
        glyph_scale = 1.16
    background.paste(canvas, (0, 0), mask)
    draw_glyph(ImageDraw.Draw(background), size, glyph_scale)
    return background


def save(image: Image.Image, name: str, target: int) -> None:
    resized = image.resize((target, target), Image.Resampling.LANCZOS)
    path = OUT_DIR / name
    resized.save(path, "PNG", optimize=True)
    print(f"wrote {path.relative_to(ROOT)} ({target}x{target})")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    icon = render(MASTER, maskable=False)
    maskable = render(MASTER, maskable=True)
    save(icon, "icon-512.png", 512)
    save(icon, "icon-192.png", 192)
    save(maskable, "maskable-512.png", 512)
    save(icon, "apple-touch-icon.png", 180)


if __name__ == "__main__":
    main()
