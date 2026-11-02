import os
from pathlib import Path
import pytest
from app.core.scanner import ProjectScanner, count_file_lines
from app.core.file_filter import FileFilter
from app.core.language_detector import detect_file_language, is_supported_code_file


def test_count_file_lines(tmp_path):
    f = tmp_path / "test.txt"
    f.write_text("line 1\nline 2\nline 3\n")
    assert count_file_lines(f) == 3


def test_file_filter_exclusions(tmp_path):
    root = tmp_path / "project"
    root.mkdir()
    (root / "src").mkdir()
    (root / "node_modules").mkdir()
    (root / ".git").mkdir()
    (root / ".venv").mkdir()

    ff = FileFilter(root)
    assert ff.should_ignore_dir("node_modules", "node_modules") is True
    assert ff.should_ignore_dir(".git", ".git") is True
    assert ff.should_ignore_dir(".venv", ".venv") is True
    assert ff.should_ignore_dir("src", "src") is False

    assert ff.should_ignore_file(root / ".env", ".env") is True
    assert ff.should_ignore_file(root / "id_rsa", "id_rsa") is True
    assert ff.should_ignore_file(root / "src" / "index.ts", "src/index.ts") is False


def test_language_detection(tmp_path):
    assert detect_file_language(tmp_path / "app.py") == "python"
    assert detect_file_language(tmp_path / "main.ts") == "typescript"
    assert detect_file_language(tmp_path / "comp.tsx") == "tsx"
    assert detect_file_language(tmp_path / "script.js") == "javascript"
    assert detect_file_language(tmp_path / "widget.dart") == "dart"
    assert detect_file_language(tmp_path / "config.json") == "json"
    assert detect_file_language(tmp_path / "unknown.xyz") == "unknown"

    assert is_supported_code_file(tmp_path / "app.py") is True
    assert is_supported_code_file(tmp_path / "main.ts") is True
    assert is_supported_code_file(tmp_path / "unknown.xyz") is False


def test_project_scanner(tmp_path):
    project_dir = tmp_path / "scan_repo"
    project_dir.mkdir()
    (project_dir / "src").mkdir()
    (project_dir / "node_modules").mkdir()
    (project_dir / "node_modules" / "pkg").mkdir()
    (project_dir / "node_modules" / "pkg" / "index.js").write_text("console.log('ignored');")

    (project_dir / "src" / "index.ts").write_text("console.log('hello');\n")
    (project_dir / "src" / "utils.py").write_text("def add(a, b):\n    return a + b\n")
    (project_dir / "package.json").write_text('{"name": "test-pkg"}')

    scanner = ProjectScanner(project_dir)
    files = list(scanner.scan())
    rel_paths = {f.relative_path for f in files}

    assert "src/index.ts" in rel_paths
    assert "src/utils.py" in rel_paths
    assert "package.json" in rel_paths
    assert not any("node_modules" in p for p in rel_paths)

    code_files = [f for f in files if f.is_code_file]
    assert len(code_files) == 2

