import fnmatch
from pathlib import Path
from typing import List, Set
from app.config import settings


class FileFilter:
    def __init__(
        self,
        project_root: Path,
        custom_ignored_dirs: List[str] | None = None,
        max_file_size: int = settings.MAX_FILE_SIZE_BYTES,
    ):
        self.project_root = project_root.resolve()
        self.ignored_dirs: Set[str] = set(settings.DEFAULT_IGNORED_DIRS)
        if custom_ignored_dirs:
            self.ignored_dirs.update(custom_ignored_dirs)
        self.ignored_extensions: Set[str] = set(settings.DEFAULT_IGNORED_EXTENSIONS)
        self.max_file_size = max_file_size
        self.gitignore_patterns: List[str] = self._load_gitignore()

    def _load_gitignore(self) -> List[str]:
        gitignore_path = self.project_root / ".gitignore"
        patterns: List[str] = []
        if gitignore_path.exists() and gitignore_path.is_file():
            try:
                with open(gitignore_path, "r", encoding="utf-8", errors="ignore") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#"):
                            # Normalize path separators
                            clean_line = line.replace("\\", "/").rstrip("/")
                            patterns.append(clean_line)
            except Exception:
                pass
        return patterns

    def should_ignore_dir(self, dir_name: str, rel_path: str = "") -> bool:
        if dir_name in self.ignored_dirs:
            return True
        if dir_name.startswith(".") and dir_name != ".":
            return True
        
        # Check against gitignore patterns
        if rel_path:
            norm_rel = rel_path.replace("\\", "/")
            for pattern in self.gitignore_patterns:
                if fnmatch.fnmatch(norm_rel, pattern) or fnmatch.fnmatch(dir_name, pattern):
                    return True
        return False

    def should_ignore_file(self, file_path: Path, rel_path: str) -> bool:
        # Check extension
        ext = file_path.suffix.lower()
        if ext in self.ignored_extensions:
            return True
        
        # Check hidden or secret files
        secret_names = {"id_rsa", "id_dsa", "id_ecdsa", "id_ed25519"}
        if (
            file_path.name in secret_names
            or file_path.name.startswith(".env")
            or file_path.name.endswith((".key", ".pem", ".p12", ".pfx", ".cert", ".crt"))
        ):
            return True

        # Check file size if file exists on disk
        if file_path.exists():
            try:
                if file_path.stat().st_size > self.max_file_size:
                    return True
            except OSError:
                pass

        # Check gitignore patterns
        norm_rel = rel_path.replace("\\", "/")
        for pattern in self.gitignore_patterns:
            if fnmatch.fnmatch(norm_rel, pattern) or fnmatch.fnmatch(file_path.name, pattern):
                return True

        return False
