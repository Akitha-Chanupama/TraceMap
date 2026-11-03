import json
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple


LANGUAGE_EXTENSION_MAP: Dict[str, str] = {
    # JavaScript & TypeScript
    ".js": "javascript",
    ".mjs": "javascript",
    ".cjs": "javascript",
    ".jsx": "jsx",
    ".ts": "typescript",
    ".mts": "typescript",
    ".cts": "typescript",
    ".tsx": "tsx",

    # Python
    ".py": "python",
    ".pyw": "python",
    ".pyi": "python",

    # PHP
    ".php": "php",
    ".phtml": "php",
    ".php3": "php",
    ".php4": "php",
    ".php5": "php",
    ".phps": "php",
    ".inc": "php",

    # Dart & Flutter
    ".dart": "dart",

    # Java & Kotlin & Android
    ".java": "java",
    ".jsp": "java",
    ".kt": "kotlin",
    ".kts": "kotlin",
    ".gradle": "gradle",

    # Swift & Objective-C & iOS
    ".swift": "swift",
    ".m": "objective-c",
    ".mm": "objective-c",
    ".xcconfig": "xcconfig",
    ".plist": "plist",

    # C, C++, C#
    ".c": "c",
    ".h": "c",
    ".cpp": "cpp",
    ".cc": "cpp",
    ".cxx": "cpp",
    ".hpp": "cpp",
    ".hh": "cpp",
    ".hxx": "cpp",
    ".cs": "csharp",
    ".csx": "csharp",

    # Go, Rust, Ruby
    ".go": "go",
    ".rs": "rust",
    ".rb": "ruby",
    ".erb": "ruby",
    ".rake": "ruby",
    ".gemspec": "ruby",

    # Web & Styles
    ".html": "html",
    ".htm": "html",
    ".css": "css",
    ".scss": "scss",
    ".sass": "sass",
    ".less": "less",
    ".vue": "vue",
    ".svelte": "svelte",

    # Database
    ".sql": "sql",
    ".psql": "sql",

    # Shell & Scripts
    ".sh": "shell",
    ".bash": "shell",
    ".zsh": "shell",
    ".bat": "batch",
    ".cmd": "batch",
    ".ps1": "powershell",
    ".psm1": "powershell",

    # Config & Data Serialization
    ".json": "json",
    ".json5": "json",
    ".jsonc": "json",
    ".yaml": "yaml",
    ".yml": "yaml",
    ".toml": "toml",
    ".ini": "ini",
    ".cfg": "config",
    ".conf": "config",
    ".properties": "properties",
    ".xml": "xml",
    ".proto": "protobuf",
    ".graphql": "graphql",
    ".gql": "graphql",
    ".arb": "arb",

    # Documentation & Text
    ".md": "markdown",
    ".markdown": "markdown",
    ".rst": "restructuredtext",
    ".txt": "text",
    ".csv": "csv",
    ".tsv": "tsv",
    ".svg": "svg",
    ".cmake": "cmake",
}

SPECIAL_FILENAME_MAP: Dict[str, str] = {
    "dockerfile": "dockerfile",
    "makefile": "makefile",
    "cmakelists.txt": "cmake",
    "gemfile": "ruby",
    "rakefile": "ruby",
    "podfile": "ruby",
    "brewfile": "ruby",
    "jenkinsfile": "groovy",
    "procfile": "yaml",
    ".gitignore": "config",
    ".gitattributes": "config",
    ".editorconfig": "config",
    ".env": "config",
    ".env.example": "config",
}

SUPPORTED_CODE_LANGUAGES = {
    "javascript",
    "jsx",
    "typescript",
    "tsx",
    "python",
    "dart",
    "php",
    "java",
    "kotlin",
    "swift",
    "c",
    "cpp",
    "csharp",
    "go",
    "rust",
    "ruby",
}


def detect_file_language(file_path: Path) -> str:
    """Accurately detects source file language from extension or known filename."""
    file_name = file_path.name.lower()
    if file_name in SPECIAL_FILENAME_MAP:
        return SPECIAL_FILENAME_MAP[file_name]

    ext = file_path.suffix.lower()
    return LANGUAGE_EXTENSION_MAP.get(ext, "unknown")


def is_supported_code_file(file_path: Path) -> bool:
    lang = detect_file_language(file_path)
    return lang in SUPPORTED_CODE_LANGUAGES


class ProjectDetector:
    def __init__(self, root_path: Path):
        self.root = root_path.resolve()

    def detect_project_info(self) -> Tuple[str, Dict[str, Any], Dict[str, Any]]:
        """
        Analyzes configuration and source files in project root.
        Returns: (project_type, detected_frameworks_with_evidence, project_config)
        """
        frameworks: Dict[str, Any] = {}
        config_data: Dict[str, Any] = {}
        project_types: List[str] = []

        # 1. Check Node/JavaScript/TypeScript ecosystem
        pkg_json = self.root / "package.json"
        if pkg_json.exists():
            project_types.append("Node.js")
            try:
                with open(pkg_json, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    deps = {**data.get("dependencies", {}), **data.get("devDependencies", {})}
                    config_data["package_json"] = {
                        "name": data.get("name"),
                        "version": data.get("version"),
                        "dependencies": list(deps.keys()),
                    }

                    if "react" in deps:
                        frameworks["React"] = {"evidence": "package.json dependency 'react'", "confidence": 1.0}
                    if "next" in deps:
                        frameworks["Next.js"] = {"evidence": "package.json dependency 'next'", "confidence": 1.0}
                    if "vue" in deps:
                        frameworks["Vue"] = {"evidence": "package.json dependency 'vue'", "confidence": 1.0}
                    if "express" in deps:
                        frameworks["Express"] = {"evidence": "package.json dependency 'express'", "confidence": 1.0}
                    if "fastify" in deps:
                        frameworks["Fastify"] = {"evidence": "package.json dependency 'fastify'", "confidence": 1.0}
                    if "tailwindcss" in deps:
                        frameworks["TailwindCSS"] = {"evidence": "package.json dependency 'tailwindcss'", "confidence": 1.0}
                    if "vite" in deps:
                        frameworks["Vite"] = {"evidence": "package.json dependency 'vite'", "confidence": 1.0}
            except Exception:
                pass

        # Check tsconfig.json for TypeScript path aliases
        tsconfig = self.root / "tsconfig.json"
        if tsconfig.exists():
            project_types.append("TypeScript")
            try:
                with open(tsconfig, "r", encoding="utf-8") as f:
                    ts_content = f.read()
                    clean_lines = [l for l in ts_content.splitlines() if not l.strip().startswith("//")]
                    ts_data = json.loads("\n".join(clean_lines))
                    compiler_opts = ts_data.get("compilerOptions", {})
                    base_url = compiler_opts.get("baseUrl", ".")
                    paths = compiler_opts.get("paths", {})
                    config_data["tsconfig"] = {
                        "baseUrl": base_url,
                        "paths": paths,
                    }
            except Exception:
                pass

        # 2. Check Dart/Flutter ecosystem
        pubspec = self.root / "pubspec.yaml"
        if pubspec.exists() or (self.root / "mobile_app" / "pubspec.yaml").exists():
            project_types.append("Dart")
            target_pubspec = pubspec if pubspec.exists() else (self.root / "mobile_app" / "pubspec.yaml")
            try:
                with open(target_pubspec, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                    if "flutter:" in content or "sdk: flutter" in content:
                        frameworks["Flutter"] = {"evidence": "pubspec.yaml flutter sdk dependency", "confidence": 1.0}
            except Exception:
                pass

        # 3. Check PHP ecosystem
        composer_json = self.root / "composer.json"
        has_php = (
            composer_json.exists()
            or any(self.root.glob("*.php"))
            or (self.root / "artisan").exists()
            or any(self.root.glob("app/**/*.php"))
        )
        if has_php:
            project_types.append("PHP")
            if (self.root / "artisan").exists():
                frameworks["Laravel"] = {"evidence": "artisan CLI found", "confidence": 1.0}
            if composer_json.exists():
                try:
                    with open(composer_json, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        reqs = {**data.get("require", {}), **data.get("require-dev", {})}
                        if "laravel/framework" in reqs:
                            frameworks["Laravel"] = {"evidence": "composer.json require laravel/framework", "confidence": 1.0}
                        if "symfony/framework-bundle" in reqs:
                            frameworks["Symfony"] = {"evidence": "composer.json require symfony/framework-bundle", "confidence": 1.0}
                        if "codeigniter4/framework" in reqs:
                            frameworks["CodeIgniter"] = {"evidence": "CodeIgniter framework found", "confidence": 1.0}
                except Exception:
                    pass

        # 4. Check Python ecosystem
        req_txt = self.root / "requirements.txt"
        pyproject = self.root / "pyproject.toml"
        setup_py = self.root / "setup.py"
        has_python = (
            req_txt.exists()
            or pyproject.exists()
            or setup_py.exists()
            or (any(self.root.glob("*.py")) and "PHP" not in project_types)
        )
        if has_python:
            project_types.append("Python")
            if req_txt.exists():
                try:
                    with open(req_txt, "r", encoding="utf-8", errors="ignore") as f:
                        lines = [l.lower() for l in f.readlines()]
                        if any("fastapi" in l for l in lines):
                            frameworks["FastAPI"] = {"evidence": "requirements.txt 'fastapi'", "confidence": 1.0}
                        if any("django" in l for l in lines):
                            frameworks["Django"] = {"evidence": "requirements.txt 'django'", "confidence": 1.0}
                        if any("flask" in l for l in lines):
                            frameworks["Flask"] = {"evidence": "requirements.txt 'flask'", "confidence": 1.0}
                except Exception:
                    pass

        final_project_type = " / ".join(dict.fromkeys(project_types)) if project_types else "Polyglot"
        return final_project_type, frameworks, config_data
