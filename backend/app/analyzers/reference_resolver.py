import os
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple

PYTHON_BUILTINS = {
    "sys", "os", "pathlib", "json", "re", "math", "time", "datetime",
    "typing", "collections", "abc", "uuid", "hashlib", "random", "io",
    "inspect", "copy", "functools", "itertools", "contextlib", "dataclasses",
    "enum", "logging", "sqlite3", "unittest", "http", "urllib", "socket",
    "threading", "asyncio", "multiprocessing", "subprocess", "tempfile",
    "shutil", "glob", "fnmatch", "pickle", "traceback", "warnings", "base64",
}

NODE_BUILTINS = {
    "fs", "fs/promises", "path", "http", "https", "url", "querystring",
    "crypto", "events", "stream", "util", "os", "child_process", "buffer",
    "assert", "cluster", "dgram", "dns", "net", "readline", "repl",
    "tls", "tty", "v8", "vm", "zlib", "perf_hooks", "worker_threads",
}

JS_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]


class ReferenceResolver:
    def __init__(
        self,
        project_root: Path,
        all_relative_files: List[str],
        tsconfig_paths: Optional[Dict[str, List[str]]] = None,
        tsconfig_base_url: str = ".",
    ):
        self.project_root = project_root.resolve()
        # Set of normalized relative posix paths: e.g. "src/components/Button.tsx"
        self.files_set: Set[str] = {Path(f).as_posix() for f in all_relative_files}
        # Map lowercase to actual case for case-insensitive filesystem tolerance
        self.lower_to_actual: Dict[str, str] = {p.lower(): p for p in self.files_set}
        self.tsconfig_paths = tsconfig_paths or {}
        self.tsconfig_base_url = tsconfig_base_url

    def resolve_dependency(
        self,
        source_relative_path: str,
        import_specifier: str,
        language: str,
    ) -> Tuple[str, Optional[str], Optional[str], float]:
        """
        Resolves an import specifier from a source file.
        Returns:
            (resolution_status, target_relative_path, external_package_name, confidence)
            resolution_status: 'resolved_internal' | 'resolved_external' | 'builtin' | 'unresolved'
        """
        spec = import_specifier.strip().strip("'\"`")
        if not spec:
            return "unresolved", None, None, 0.0

        lang = language.lower()

        # 1. Built-in module checks
        if lang == "python":
            root_mod = spec.split(".")[0]
            if root_mod in PYTHON_BUILTINS:
                return "builtin", None, root_mod, 1.0
        elif lang in ("javascript", "jsx", "typescript", "tsx"):
            clean_node_mod = spec.removeprefix("node:")
            if clean_node_mod in NODE_BUILTINS:
                return "builtin", None, clean_node_mod, 1.0

        # 2. Relative Imports
        if spec.startswith("."):
            target = self._resolve_relative_path(source_relative_path, spec, lang)
            if target:
                return "resolved_internal", target, None, 1.0
            return "unresolved", None, None, 0.3

        # 3. Path Aliases (e.g. tsconfig '@/*')
        if self.tsconfig_paths:
            aliased_target = self._resolve_alias(spec, lang)
            if aliased_target:
                return "resolved_internal", aliased_target, None, 1.0

        # 4. Dart package / file imports
        if lang == "dart":
            if spec.startswith("package:"):
                # e.g. package:flutter/material.dart or package:my_app/screens/home.dart
                pkg_parts = spec.replace("package:", "").split("/", 1)
                pkg_name = pkg_parts[0]
                if len(pkg_parts) > 1:
                    subpath = f"lib/{pkg_parts[1]}"
                    if subpath in self.files_set:
                        return "resolved_internal", subpath, None, 1.0
                return "resolved_external", None, pkg_name, 0.9

        # 5. Python module / package resolution (e.g. 'app.services.auth')
        if lang == "python":
            py_target = self._resolve_python_module(spec)
            if py_target:
                return "resolved_internal", py_target, None, 1.0
            # Likely an installed pip package
            root_pkg = spec.split(".")[0]
            return "resolved_external", None, root_pkg, 0.8

        # 6. JavaScript / TypeScript external package check (e.g. 'react', '@tanstack/react-query')
        if not spec.startswith(".") and not spec.startswith("/"):
            # Check if it could match a local source dir directly
            direct_local = self._check_candidate(spec, lang)
            if direct_local:
                return "resolved_internal", direct_local, None, 0.9

            # Treat as external npm package
            # If scoped package: '@scope/pkg/sub' -> '@scope/pkg'
            parts = spec.split("/")
            if spec.startswith("@") and len(parts) >= 2:
                pkg_name = f"{parts[0]}/{parts[1]}"
            else:
                pkg_name = parts[0]
            return "resolved_external", None, pkg_name, 0.95

        return "unresolved", None, None, 0.0

    def _resolve_relative_path(self, source_path: str, spec: str, lang: str) -> Optional[str]:
        source_dir = Path(source_path).parent
        combined = (source_dir / spec).as_posix()
        norm_path = Path(os.path.normpath(combined)).as_posix()
        # Clean relative leading './'
        if norm_path.startswith("./"):
            norm_path = norm_path[2:]

        return self._check_candidate(norm_path, lang)

    def _resolve_alias(self, spec: str, lang: str) -> Optional[str]:
        for alias_key, target_patterns in self.tsconfig_paths.items():
            key_clean = alias_key.rstrip("*")
            if spec.startswith(key_clean):
                suffix = spec[len(key_clean):]
                for pattern in target_patterns:
                    candidate_pat = pattern.rstrip("*")
                    base = Path(self.tsconfig_base_url) / candidate_pat
                    resolved_cand = (base / suffix).as_posix()
                    found = self._check_candidate(resolved_cand, lang)
                    if found:
                        return found
        return None

    def _resolve_python_module(self, dotted_spec: str) -> Optional[str]:
        as_path = dotted_spec.replace(".", "/")
        cand = self._check_candidate(as_path, "python")
        if cand:
            return cand
        return None

    def _check_candidate(self, cand_path: str, lang: str) -> Optional[str]:
        cand_clean = cand_path.rstrip("/")
        lower_clean = cand_clean.lower()

        # 1. Exact match with extension
        if cand_clean in self.files_set:
            return cand_clean
        if lower_clean in self.lower_to_actual:
            return self.lower_to_actual[lower_clean]

        # 2. Check candidate + extensions
        if lang in ("javascript", "jsx", "typescript", "tsx"):
            for ext in JS_EXTENSIONS:
                trial = f"{cand_clean}{ext}"
                if trial in self.files_set:
                    return trial
                if trial.lower() in self.lower_to_actual:
                    return self.lower_to_actual[trial.lower()]
            # Check barrel / index file: cand_clean/index.ts, etc.
            for ext in JS_EXTENSIONS:
                trial = f"{cand_clean}/index{ext}"
                if trial in self.files_set:
                    return trial
                if trial.lower() in self.lower_to_actual:
                    return self.lower_to_actual[trial.lower()]

        elif lang == "python":
            trial = f"{cand_clean}.py"
            if trial in self.files_set:
                return trial
            if trial.lower() in self.lower_to_actual:
                return self.lower_to_actual[trial.lower()]
            # Package __init__.py
            trial_init = f"{cand_clean}/__init__.py"
            if trial_init in self.files_set:
                return trial_init
            if trial_init.lower() in self.lower_to_actual:
                return self.lower_to_actual[trial_init.lower()]

        elif lang == "dart":
            trial = f"{cand_clean}.dart"
            if trial in self.files_set:
                return trial
            if trial.lower() in self.lower_to_actual:
                return self.lower_to_actual[trial.lower()]

        return None
