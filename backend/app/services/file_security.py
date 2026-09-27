import os
import re
from typing import Tuple
from fastapi import HTTPException, status

# Security Constraints
MAX_FILE_SIZE_BYTES = 1024 * 1024  # 1 MB maximum for text policy files
MIN_FILE_SIZE_BYTES = 10           # Minimum 10 bytes to prevent empty/junk docs
ALLOWED_EXTENSIONS = {".txt", ".md"}
ALLOWED_MIME_TYPES = {"text/plain", "text/markdown", "application/octet-stream", "text/x-markdown"}

# Dangerous binary signatures (magic bytes) to reject immediately
BLOCKED_MAGIC_BYTES = [
    (b"\x7fELF", "Linux ELF executable"),
    (b"MZ", "Windows DOS/PE executable"),
    (b"\xfe\xed\xfa\xce", "Mach-O 32-bit binary"),
    (b"\xfe\xed\xfa\xcf", "Mach-O 64-bit binary"),
    (b"\xce\xfa\xed\xfe", "Mach-O 32-bit reverse binary"),
    (b"\xcf\xfa\xed\xfe", "Mach-O 64-bit reverse binary"),
    (b"\xca\xfe\xba\xbe", "Java bytecode class file"),
    (b"PK\x03\x04", "ZIP / JAR / Office archive"),
    (b"Rar!\x1a\x07", "RAR archive"),
    (b"\x1f\x8b", "GZIP compressed archive"),
    (b"7z\xbc\xaf\x27\x1c", "7-Zip archive"),
    (b"SQLite format 3", "SQLite database file"),
]

# Script and execution signatures in text files to disarm/reject
BLOCKED_TEXT_PREFIXES = [
    "#!/bin/",
    "#!/usr/bin/",
    "<?php",
    "<% ",
    "<script",
]

RESERVED_NAMES = {"con", "prn", "aux", "nul", "com1", "com2", "lpt1", "lpt2"}


def sanitize_filename(raw_name: str) -> str:
    """
    Strictly sanitize a filename to eliminate path traversal, null bytes,
    and dangerous shell characters.
    """
    if not raw_name or not raw_name.strip():
        return "policy_document.txt"

    # 1. Strip directory traversal tokens
    clean = os.path.basename(raw_name.strip())
    clean = clean.replace("/", "").replace("\\", "").replace("\x00", "")

    # 2. Extract base and extension
    base, ext = os.path.splitext(clean)
    ext = ext.lower()
    if ext not in ALLOWED_EXTENSIONS:
        ext = ".txt"

    # 3. Sanitize base to alphanumeric + hyphens + underscores
    base_clean = re.sub(r'[^a-zA-Z0-9_\-]', '_', base)
    base_clean = re.sub(r'_+', '_', base_clean).strip('_')

    if not base_clean or base_clean.lower() in RESERVED_NAMES:
        base_clean = "uploaded_policy"

    # 4. Limit length
    final_name = f"{base_clean[:80]}{ext}"
    return final_name


def validate_file_content(content_bytes: bytes, filename: str) -> str:
    """
    Multi-stage content validation for uploaded policy documents:
    1. Size verification.
    2. Binary magic byte inspection.
    3. UTF-8 decode verification (rejecting binary files disguised as .txt).
    4. Null byte check.
    5. Disarming of executable script tokens.
    
    Returns clean, verified UTF-8 text string.
    """
    # 1. Size check
    file_len = len(content_bytes)
    if file_len > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=getattr(status, "HTTP_413_CONTENT_TOO_LARGE", 413),
            detail=f"File exceeds maximum allowed size of {MAX_FILE_SIZE_BYTES // 1024} KB (received {file_len // 1024} KB)."
        )
    if file_len < MIN_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File content is too small or empty. Please provide a substantive policy document."
        )

    # 2. Magic byte check for executables & archives
    for magic, desc in BLOCKED_MAGIC_BYTES:
        if content_bytes.startswith(magic):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Security rejection: Uploaded file contains binary signature for {desc}. Only plain text/markdown policies are accepted."
            )

    # Detect if binary payload was decoded as Unicode in JSON body
    try:
        latin_bytes = content_bytes.decode("utf-8").encode("latin-1")
        for magic, desc in BLOCKED_MAGIC_BYTES:
            if latin_bytes.startswith(magic):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Security rejection: Uploaded file contains binary signature for {desc}. Only plain text/markdown policies are accepted."
                )
    except (UnicodeDecodeError, UnicodeEncodeError):
        pass

    # 3. UTF-8 decode validation
    try:
        text = content_bytes.decode("utf-8")
    except UnicodeDecodeError:
        try:
            # Fallback check for Latin-1
            text = content_bytes.decode("latin-1")
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Security rejection: File contains non-text or binary encoding. Only valid UTF-8 text documents are allowed."
            )

    # 4. Null byte check (typical of binary injection)
    if "\x00" in text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Security rejection: Embedded null bytes detected in file content. Potential binary injection blocked."
        )

    # 5. Check for script/executable headers
    stripped_text = text.lstrip()
    for prefix in BLOCKED_TEXT_PREFIXES:
        if stripped_text.lower().startswith(prefix.lower()):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Security rejection: File starts with executable script pattern ('{prefix}'). Executable code cannot be uploaded as a policy."
            )

    return text
