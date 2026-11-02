import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List, Optional, Callable
from sqlalchemy.orm import Session

from app.models.project import Project
from app.models.source_file import SourceFile
from app.models.symbol import Symbol
from app.models.dependency import Dependency
from app.models.analysis import AnalysisRun
from app.core.scanner import ProjectScanner, ScannedFileInfo
from app.parsers.registry import ParserRegistry
from app.analyzers.reference_resolver import ReferenceResolver
from app.analyzers.circular_dependencies import CircularDependencyAnalyzer


class IndexingService:
    def __init__(self, db: Session, project: Project, progress_callback: Optional[Callable[[str, int, int], None]] = None):
        self.db = db
        self.project = project
        self.progress_callback = progress_callback or (lambda phase, current, total: None)
        self.project_root = Path(project.root_path).resolve()

    def run_full_indexing(self) -> AnalysisRun:
        start_time = time.time()
        self.project.analysis_status = "scanning"
        self.db.commit()

        run = AnalysisRun(
            project_id=self.project.id,
            status="running",
            started_at=datetime.now(timezone.utc),
        )
        self.db.add(run)
        self.db.commit()
        self.db.refresh(run)

        try:
            # Step 1: Scan all files
            self.progress_callback("scanning", 0, 100)
            scanner = ProjectScanner(self.project_root)
            scanned_files: List[ScannedFileInfo] = list(scanner.scan())
            total_scanned = len(scanned_files)
            run.total_files = total_scanned
            self.db.commit()

            # Existing files map (rel_path -> SourceFile)
            existing_files = {
                f.relative_path: f
                for f in self.db.query(SourceFile).filter(SourceFile.project_id == self.project.id).all()
            }

            # Map to keep track of current files in project
            current_files_dict: Dict[str, SourceFile] = {}
            files_to_parse: List[SourceFile] = []

            # Sync scanned files to DB
            for scanned in scanned_files:
                existing = existing_files.get(scanned.relative_path)
                if existing:
                    # Check if modified
                    if existing.content_hash != scanned.content_hash:
                        existing.content_hash = scanned.content_hash
                        existing.file_size = scanned.file_size
                        existing.line_count = scanned.line_count
                        existing.last_modified = scanned.last_modified
                        existing.parse_status = "pending"
                        if scanned.is_code_file:
                            files_to_parse.append(existing)
                    elif existing.parse_status == "success":
                        # Unchanged and already parsed
                        pass
                    else:
                        if scanned.is_code_file:
                            files_to_parse.append(existing)
                    current_files_dict[scanned.relative_path] = existing
                else:
                    new_file = SourceFile(
                        project_id=self.project.id,
                        relative_path=scanned.relative_path,
                        absolute_path=scanned.absolute_path,
                        filename=scanned.filename,
                        extension=scanned.extension,
                        language=scanned.language,
                        file_size=scanned.file_size,
                        content_hash=scanned.content_hash,
                        line_count=scanned.line_count,
                        parse_status="pending",
                        last_modified=scanned.last_modified,
                    )
                    self.db.add(new_file)
                    self.db.flush()
                    if scanned.is_code_file:
                        files_to_parse.append(new_file)
                    current_files_dict[scanned.relative_path] = new_file

            # Clean up deleted files from DB
            scanned_rel_set = {s.relative_path for s in scanned_files}
            for rel_path, old_file in existing_files.items():
                if rel_path not in scanned_rel_set:
                    self.db.delete(old_file)

            self.db.commit()

            # Step 2: Parse source code files
            self.project.analysis_status = "parsing"
            self.db.commit()

            parsed_count = 0
            failed_count = 0
            all_parsed_imports: List[Dict[str, Any]] = []

            # Prepare tsconfig paths if present
            tsconfig_cfg = self.project.configuration.get("tsconfig", {}) if self.project.configuration else {}
            tsconfig_paths = tsconfig_cfg.get("paths", {})
            tsconfig_base_url = tsconfig_cfg.get("baseUrl", ".")

            total_to_parse = len(files_to_parse)
            for idx, source_file in enumerate(files_to_parse):
                self.progress_callback("parsing", idx + 1, max(1, total_to_parse))
                parser = ParserRegistry.get_parser_for_language(source_file.language)
                if not parser:
                    source_file.parse_status = "skipped"
                    continue

                abs_p = Path(source_file.absolute_path)
                try:
                    with open(abs_p, "rb") as f:
                        code_bytes = f.read()

                    # Clear existing symbols and dependencies for this file
                    self.db.query(Symbol).filter(Symbol.file_id == source_file.id).delete()
                    self.db.query(Dependency).filter(Dependency.source_file_id == source_file.id).delete()

                    parse_res = parser.parse(code_bytes, file_path=source_file.relative_path)

                    # Insert symbols
                    symbol_obj_map: Dict[str, str] = {}
                    for sym in parse_res.symbols:
                        parent_id = symbol_obj_map.get(sym.parent_name) if sym.parent_name else None
                        sym_model = Symbol(
                            project_id=self.project.id,
                            file_id=source_file.id,
                            parent_symbol_id=parent_id,
                            name=sym.name,
                            qualified_name=sym.qualified_name,
                            symbol_type=sym.symbol_type,
                            language=source_file.language,
                            start_line=sym.start_line,
                            end_line=sym.end_line,
                            start_column=sym.start_column,
                            end_column=sym.end_column,
                            is_exported=sym.is_exported,
                            visibility=sym.visibility,
                            complexity=sym.complexity,
                            metadata_json=sym.metadata,
                        )
                        self.db.add(sym_model)
                        self.db.flush()
                        symbol_obj_map[sym.qualified_name] = sym_model.id

                    # Record raw imports to resolve
                    for imp in parse_res.imports:
                        all_parsed_imports.append({
                            "source_file": source_file,
                            "parsed_import": imp,
                        })

                    source_file.parse_status = "success"
                    source_file.parse_error = None
                    source_file.last_analyzed_at = datetime.now(timezone.utc)
                    parsed_count += 1
                except Exception as e:
                    source_file.parse_status = "error"
                    source_file.parse_error = str(e)[:2000]
                    failed_count += 1

            self.db.commit()

            # Step 3: Resolve Dependencies
            self.project.analysis_status = "resolving"
            self.db.commit()

            all_rel_paths = list(current_files_dict.keys())
            resolver = ReferenceResolver(
                self.project_root,
                all_rel_paths,
                tsconfig_paths=tsconfig_paths,
                tsconfig_base_url=tsconfig_base_url,
            )

            total_imports = len(all_parsed_imports)
            resolved_deps: List[Dict[str, Any]] = []

            for idx, item in enumerate(all_parsed_imports):
                self.progress_callback("indexing", idx + 1, max(1, total_imports))
                src_file: SourceFile = item["source_file"]
                p_imp = item["parsed_import"]

                status, target_path, ext_pkg, conf = resolver.resolve_dependency(
                    src_file.relative_path,
                    p_imp.source_module,
                    src_file.language,
                )

                target_file_id = None
                if target_path and target_path in current_files_dict:
                    target_file_id = current_files_dict[target_path].id

                dep_model = Dependency(
                    project_id=self.project.id,
                    source_file_id=src_file.id,
                    target_file_id=target_file_id,
                    external_package=ext_pkg,
                    dependency_type="IMPORTS",
                    import_statement=p_imp.raw_statement or f"import '{p_imp.source_module}'",
                    line_number=p_imp.line_number,
                    resolution_status=status,
                    confidence=conf,
                )
                self.db.add(dep_model)

                if target_path and target_file_id:
                    resolved_deps.append({
                        "source_file_id": src_file.id,
                        "source_relative_path": src_file.relative_path,
                        "target_file_id": target_file_id,
                        "target_relative_path": target_path,
                        "import_statement": p_imp.raw_statement,
                        "line_number": p_imp.line_number,
                    })

            self.db.commit()

            # Step 4: Circular Dependency Detection
            cycle_analyzer = CircularDependencyAnalyzer(resolved_deps)
            cycle_res = cycle_analyzer.detect_cycles()

            # Step 5: Finalize Project Summary & Run
            duration_ms = int((time.time() - start_time) * 1000)
            run.status = "completed"
            run.completed_at = datetime.now(timezone.utc)
            run.processed_files = parsed_count
            run.failed_files = failed_count
            run.skipped_files = total_scanned - (parsed_count + failed_count)
            run.analysis_duration_ms = duration_ms
            run.summary = {
                "total_files": total_scanned,
                "parsed_files": parsed_count,
                "failed_files": failed_count,
                "circular_cycles": cycle_res.total_cycles,
                "duration_ms": duration_ms,
            }

            self.project.last_analyzed_at = datetime.now(timezone.utc)
            self.project.analysis_status = "completed"
            self.db.commit()
            self.progress_callback("completed", 100, 100)
            return run

        except Exception as e:
            self.db.rollback()
            run.status = "failed"
            run.error_message = str(e)[:2000]
            run.completed_at = datetime.now(timezone.utc)
            self.project.analysis_status = "failed"
            self.db.commit()
            raise

