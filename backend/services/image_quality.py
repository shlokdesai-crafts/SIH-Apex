"""
services/image_quality.py
──────────────────────────
Pillow-based image quality analysis (Python 3.14 compatible, no OpenCV/numpy needed).

  • Brightness  – mean grayscale value via PIL.ImageStat  (0–255)
  • Sharpness   – Laplacian-approximation via PIL.ImageFilter.Kernel
                  (variance of the filtered image → higher = sharper)

Thresholds are constants at the top; tune them as real-world data grows.
When OpenCV wheels become available for Python 3.14, swap this module for
the OpenCV version without touching routes/ or models/.
"""

import io
import statistics
from PIL import Image, ImageFilter, ImageStat

# ── Thresholds ────────────────────────────────────────────────────────────────
BRIGHTNESS_MIN  = 40.0   # mean grayscale below this → "too dark"
BRIGHTNESS_MAX  = 230.0  # mean grayscale above this → "overexposed"
BLUR_THRESHOLD  = 200.0  # Laplacian variance below this → "blurry"
                          # (Calibrated: clear crop images >= 259.17, blurry test images <= 127.59)


def analyze_quality(image_bytes: bytes) -> dict:
    """
    Run brightness and blur detection on raw image bytes using Pillow.

    Returns a dict with all quality metrics and boolean pass/fail flags.
    Returns decode_error=True if the image cannot be opened.
    """
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("L")  # grayscale
    except Exception:
        return {
            "brightness_score": 0.0,
            "blur_score":       0.0,
            "resolution":       "unknown",
            "is_bright_enough": False,
            "is_not_overexposed": True,
            "is_sharp_enough":  False,
            "decode_error":     True,
        }

    w, h = img.size

    # ── Brightness (mean of grayscale channel) ────────────────────────────────
    stat       = ImageStat.Stat(img)
    brightness = stat.mean[0]          # 0-255

    # ── Sharpness (Laplacian approximation) ───────────────────────────────────
    # 3×3 Laplacian kernel: highlights edges; we measure variance of result.
    laplacian_kernel = ImageFilter.Kernel(
        size=(3, 3),
        kernel=[ 0,  1,  0,
                 1, -4,  1,
                 0,  1,  0],
        scale=1,
        offset=128,
    )
    lap_img    = img.filter(laplacian_kernel)
    lap_stat   = ImageStat.Stat(lap_img)
    blur_score = lap_stat.var[0]       # variance of Laplacian output

    return {
        "brightness_score":    round(brightness, 2),
        "blur_score":          round(blur_score, 2),
        "resolution":          f"{w}x{h}",
        "is_bright_enough":    brightness >= BRIGHTNESS_MIN,
        "is_not_overexposed":  brightness <= BRIGHTNESS_MAX,
        "is_sharp_enough":     blur_score  >= BLUR_THRESHOLD,
        "decode_error":        False,
    }


def quality_errors(metrics: dict) -> list[str]:
    """
    Convert quality metrics dict into human-readable error messages.
    Called by the route so error formatting stays centralised here.
    """
    errs: list[str] = []

    if metrics.get("decode_error"):
        errs.append(
            "Could not analyse image quality. "
            "The image may be in an unsupported colour format."
        )
        return errs

    if not metrics["is_bright_enough"]:
        errs.append(
            f"Image is too dark (brightness: {metrics['brightness_score']:.0f}/255). "
            "Please retake the photo in better lighting or move outdoors."
        )

    if not metrics["is_not_overexposed"]:
        errs.append(
            f"Image is overexposed (brightness: {metrics['brightness_score']:.0f}/255). "
            "Avoid direct sunlight on the lens and retake."
        )

    if not metrics["is_sharp_enough"]:
        errs.append(
            f"Image appears blurry (sharpness score: {metrics['blur_score']:.1f}). "
            "Hold the camera steady, tap to focus, and retake."
        )

    return errs

