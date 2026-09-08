"""
services/validation.py
─────────────────────
Upload validation: file type, size, resolution, and integrity checks.
All thresholds are constants at the top for easy tuning in future phases.
"""

import io
from pathlib import Path
from fastapi import UploadFile
from PIL import Image, UnidentifiedImageError

# ── Thresholds ────────────────────────────────────────────────────────────────
ALLOWED_MIME_TYPES   = {"image/jpeg", "image/jpg", "image/png"}
ALLOWED_EXTENSIONS   = {".jpg", ".jpeg", ".png"}
MAX_FILE_SIZE_MB     = 10
MAX_FILE_SIZE_BYTES  = MAX_FILE_SIZE_MB * 1024 * 1024
MIN_WIDTH, MIN_HEIGHT = 100, 100
MAX_WIDTH, MAX_HEIGHT = 8000, 8000


async def validate_upload(file: UploadFile) -> tuple[list[str], list[str], bytes]:
    """
    Validate an uploaded image file.

    Returns:
        errors   – list of blocking error strings
        warnings – list of non-blocking warning strings
        contents – raw bytes of the file (empty on early-exit errors)
    """
    errors: list[str]   = []
    warnings: list[str] = []

    # ── 1. MIME type ─────────────────────────────────────────────────────────
    content_type = (file.content_type or "").lower()
    ext = Path(file.filename or "").suffix.lower()

    if content_type not in ALLOWED_MIME_TYPES and ext not in ALLOWED_EXTENSIONS:
        errors.append(
            f"Unsupported file type '{content_type or ext}'. "
            "Please upload a JPG or PNG image."
        )
        return errors, warnings, b""

    # ── 2. Read bytes ─────────────────────────────────────────────────────────
    contents: bytes = await file.read()

    # ── 3. File size ─────────────────────────────────────────────────────────
    size_mb = len(contents) / (1024 * 1024)
    if len(contents) > MAX_FILE_SIZE_BYTES:
        errors.append(
            f"File is too large ({size_mb:.1f} MB). "
            f"Maximum allowed size is {MAX_FILE_SIZE_MB} MB."
        )
        return errors, warnings, contents

    if len(contents) == 0:
        errors.append("The uploaded file is empty. Please choose a valid image.")
        return errors, warnings, contents

    # ── 4. Image integrity & resolution ──────────────────────────────────────
    try:
        img = Image.open(io.BytesIO(contents))
        img.verify()                          # raises if corrupt
        img = Image.open(io.BytesIO(contents))  # re-open after verify()
        width, height = img.size
    except UnidentifiedImageError:
        errors.append(
            "The file could not be read as an image. "
            "It may be corrupted or in an unsupported format."
        )
        return errors, warnings, contents
    except Exception as exc:
        errors.append(f"Image validation failed: {exc}")
        return errors, warnings, contents

    if width < MIN_WIDTH or height < MIN_HEIGHT:
        errors.append(
            f"Image resolution is too low ({width}×{height} px). "
            f"Minimum required is {MIN_WIDTH}×{MIN_HEIGHT} px."
        )

    if width > MAX_WIDTH or height > MAX_HEIGHT:
        warnings.append(
            f"Image resolution is very high ({width}×{height} px). "
            "Processing may take longer than usual."
        )

    return errors, warnings, contents
