import os
import uuid
import base64
from pathlib import Path

from fastapi import UploadFile, HTTPException
from pypdf import PdfReader
import docx

from app.config import settings

ALLOWED_IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
ALLOWED_DOC_EXT = {".pdf", ".docx", ".txt"}
ALLOWED_EXT = ALLOWED_IMAGE_EXT | ALLOWED_DOC_EXT


def _ensure_upload_dir():
    Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)


def validate_and_classify(filename: str, size_bytes: int) -> str:
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: images (jpg, png, webp, gif) or documents (pdf, docx, txt).",
        )
    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    if size_bytes > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Max size is {settings.max_upload_size_mb}MB.",
        )
    return "image" if ext in ALLOWED_IMAGE_EXT else "document"


async def save_upload(file: UploadFile) -> tuple[str, str, str]:
    """
    Saves the uploaded file to disk.
    Returns (saved_filename, attachment_type, original_filename).
    """
    _ensure_upload_dir()

    contents = await file.read()
    attachment_type = validate_and_classify(file.filename, len(contents))

    ext = Path(file.filename).suffix.lower()
    safe_name = f"{uuid.uuid4().hex}{ext}"
    saved_path = os.path.join(settings.upload_dir, safe_name)

    with open(saved_path, "wb") as f:
        f.write(contents)

    return safe_name, attachment_type, file.filename


def get_full_path(saved_filename: str) -> str:
    return os.path.join(settings.upload_dir, saved_filename)


def extract_document_text(path: str) -> str:
    """Extracts plain text from PDF, DOCX, or TXT files."""
    ext = Path(path).suffix.lower()

    if ext == ".txt":
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()

    if ext == ".pdf":
        reader = PdfReader(path)
        return "\n".join(page.extract_text() or "" for page in reader.pages)

    if ext == ".docx":
        d = docx.Document(path)
        return "\n".join(p.text for p in d.paragraphs)

    raise ValueError(f"No text extractor for {ext}")


def image_to_data_url(path: str) -> str:
    """Base64-encodes an image file into a data: URL for the vision model."""
    ext = Path(path).suffix.lower().lstrip(".")
    mime = "jpeg" if ext == "jpg" else ext
    with open(path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("utf-8")
    return f"data:image/{mime};base64,{b64}"