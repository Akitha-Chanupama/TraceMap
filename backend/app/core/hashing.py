import hashlib
from pathlib import Path


def calculate_file_hash(file_path: Path) -> str:
    """Computes SHA-256 hash of a file incrementally to avoid large memory allocations."""
    hasher = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()


def calculate_content_hash(content: str) -> str:
    """Computes SHA-256 hash of string content."""
    return hashlib.sha256(content.encode("utf-8")).hexdigest()
