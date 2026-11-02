import os
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict, Any, Generator, Tuple
from app.core.file_filter import FileFilter
from app.core.hashing import calculate_file_hash
from app.core.language_detector import detect_file_language, is_supported_code_file


class ScannedFileInfo:
    def __init__(
        self,
        relative_path: str,
        absolute_path: str,
        filename: str,
        extension: str,
        language: str,
        file_size: int,
        content_hash: str,
        line_count: int,
        last_modified: datetime,
        is_code_file: bool,
    ):
        self.relative_path = relative_path
        self.absolute_path = absolute_path
        self.filename = filename
        self.extension = extension
        self.language = language
        self.file_size = file_size
        self.content_hash = content_hash
        self.line_count = line_count
        self.last_modified = last_modified
        self.is_code_file = is_code_file


def count_file_lines(file_path: Path) -> int:
    """Efficient line counter reading in blocks."""
    lines = 0
    try:
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(1024 * 64), b""):
                lines += chunk.count(b"\n")
    except Exception:
        pass
    return lines


class ProjectScanner:
    def __init__(self, root_path: str | Path, custom_ignored_dirs: List[str] | None = None):
        self.root_path = Path(root_path).resolve()
        self.filter = FileFilter(self.root_path, custom_ignored_dirs=custom_ignored_dirs)

    def scan(self) -> Generator[ScannedFileInfo, None, None]:
        """Walks project directory and yields ScannedFileInfo for each valid file."""
        if not self.root_path.exists() or not self.root_path.is_dir():
            raise ValueError(f"Project root does not exist or is not a directory: {self.root_path}")

        for root, dirs, files in os.walk(self.root_path, topdown=True, followlinks=False):
            current_dir_path = Path(root)
            try:
                rel_dir = current_dir_path.relative_to(self.root_path).as_posix()
            except ValueError:
                rel_dir = ""

            # Filter directories in-place to prevent descending into ignored folders
            dirs[:] = [
                d for d in dirs
                if not self.filter.should_ignore_dir(d, f"{rel_dir}/{d}" if rel_dir != "." else d)
            ]

            for file_name in files:
                file_path = current_dir_path / file_name
                try:
                    rel_file = file_path.relative_to(self.root_path).as_posix()
                except ValueError:
                    continue

                if self.filter.should_ignore_file(file_path, rel_file):
                    continue

                try:
                    stat = file_path.stat()
                    file_size = stat.st_size
                    last_mod = datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc)
                    content_hash = calculate_file_hash(file_path)
                    language = detect_file_language(file_path)
                    is_code = is_supported_code_file(file_path)
                    lines = count_file_lines(file_path)

                    yield ScannedFileInfo(
                        relative_path=rel_file,
                        absolute_path=str(file_path),
                        filename=file_name,
                        extension=file_path.suffix.lower(),
                        language=language,
                        file_size=file_size,
                        content_hash=content_hash,
                        line_count=lines,
                        last_modified=last_mod,
                        is_code_file=is_code,
                    )
                except Exception:
                    # Skip unreadable or locked files gracefully
                    continue

