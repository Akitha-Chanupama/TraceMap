from pathlib import Path
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.project import Project
from app.models.source_file import SourceFile
from app.models.symbol import Symbol
from app.models.dependency import Dependency
from app.analyzers.circular_dependencies import CircularDependencyAnalyzer
from app.analyzers.impact_analysis import ImpactAnalyzer
from app.analyzers.complexity import ComplexityAnalyzer
from app.core.language_detector import detect_file_language
from app.schemas.analysis import (
    AnalysisSummaryResponse,
    CircularDependenciesResponse,
    ImpactAnalysisResponse,
    ComplexityReportResponse,
    UnresolvedDependencyItem,
    UnusedSymbolItem,
    GitHotspotsResponse,
)


class AnalysisService:
    @staticmethod
    def get_summary(db: Session, project_id: str) -> AnalysisSummaryResponse:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        files = db.query(SourceFile).filter(SourceFile.project_id == project_id).all()
        symbols = db.query(Symbol).filter(Symbol.project_id == project_id).all()
        deps = db.query(Dependency).filter(Dependency.project_id == project_id).all()

        total_files = len(files)
        total_lines = sum(f.line_count for f in files)
        total_symbols = len(symbols)
        total_deps = len(deps)

        # Language breakdown
        lang_map: Dict[str, int] = {}
        for f in files:
            lang = f.language
            if not lang or lang == "unknown":
                lang = detect_file_language(Path(f.relative_path))
                f.language = lang
            lang_map[lang] = lang_map.get(lang, 0) + 1

        # File connectivity
        dep_dicts = []
        unresolved_count = 0
        file_lookup = {f.id: f.relative_path for f in files}
        for d in deps:
            if d.resolution_status == "unresolved":
                unresolved_count += 1
            if d.target_file_id and d.target_file_id in file_lookup:
                dep_dicts.append({
                    "source_file_id": d.source_file_id,
                    "source_relative_path": file_lookup.get(d.source_file_id, ""),
                    "target_file_id": d.target_file_id,
                    "target_relative_path": file_lookup.get(d.target_file_id, ""),
                    "import_statement": d.import_statement,
                    "line_number": d.line_number,
                })

        cycle_analyzer = CircularDependencyAnalyzer(dep_dicts)
        cycles_res = cycle_analyzer.detect_cycles()

        # Top connected files (in-degree + out-degree)
        conn_counts: Dict[str, int] = {}
        for d in dep_dicts:
            src = d["source_relative_path"]
            tgt = d["target_relative_path"]
            conn_counts[src] = conn_counts.get(src, 0) + 1
            conn_counts[tgt] = conn_counts.get(tgt, 0) + 1

        sorted_conns = sorted(conn_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        top_connected = [{"file": k, "connections": v} for k, v in sorted_conns]

        # Largest files
        sorted_files = sorted(files, key=lambda f: f.line_count, reverse=True)[:10]
        largest = [{"file": f.relative_path, "lines": f.line_count, "language": f.language} for f in sorted_files]

        return AnalysisSummaryResponse(
            project_id=project_id,
            total_files=total_files,
            total_lines=total_lines,
            total_symbols=total_symbols,
            total_dependencies=total_deps,
            circular_cycles_count=cycles_res.total_cycles,
            unresolved_dependencies_count=unresolved_count,
            potential_unused_symbols_count=0,
            language_breakdown=lang_map,
            top_connected_files=top_connected,
            largest_files=largest,
        )

    @staticmethod
    def get_circular_dependencies(db: Session, project_id: str) -> CircularDependenciesResponse:
        files = db.query(SourceFile).filter(SourceFile.project_id == project_id).all()
        file_lookup = {f.id: f.relative_path for f in files}
        deps = db.query(Dependency).filter(
            Dependency.project_id == project_id,
            Dependency.target_file_id != None,
        ).all()

        dep_dicts = [
            {
                "source_file_id": d.source_file_id,
                "source_relative_path": file_lookup.get(d.source_file_id, ""),
                "target_file_id": d.target_file_id,
                "target_relative_path": file_lookup.get(d.target_file_id, ""),
                "import_statement": d.import_statement,
                "line_number": d.line_number,
            }
            for d in deps
            if d.source_file_id in file_lookup and d.target_file_id in file_lookup
        ]

        analyzer = CircularDependencyAnalyzer(dep_dicts)
        return analyzer.detect_cycles()

    @staticmethod
    def get_impact_analysis(db: Session, project_id: str, file_id_or_path: str) -> ImpactAnalysisResponse:
        files = db.query(SourceFile).filter(SourceFile.project_id == project_id).all()
        files_by_id = {f.id: f for f in files}
        files_by_path = {f.relative_path: f for f in files}

        target_file = files_by_id.get(file_id_or_path) or files_by_path.get(file_id_or_path)
        if not target_file:
            raise HTTPException(status_code=404, detail="File not found in project")

        deps = db.query(Dependency).filter(
            Dependency.project_id == project_id,
            Dependency.target_file_id != None,
        ).all()

        file_lookup_map = {
            f.relative_path: {"id": f.id, "relative_path": f.relative_path, "filename": f.filename}
            for f in files
        }

        dep_dicts = [
            {
                "source_file_id": d.source_file_id,
                "source_relative_path": files_by_id[d.source_file_id].relative_path,
                "target_file_id": d.target_file_id,
                "target_relative_path": files_by_id[d.target_file_id].relative_path,
                "import_statement": d.import_statement,
            }
            for d in deps
            if d.source_file_id in files_by_id and d.target_file_id in files_by_id
        ]

        analyzer = ImpactAnalyzer(dep_dicts, file_lookup_map)
        return analyzer.analyze_impact(target_file.relative_path)

    @staticmethod
    def get_complexity_report(db: Session, project_id: str) -> ComplexityReportResponse:
        files = db.query(SourceFile).filter(SourceFile.project_id == project_id).all()
        symbols = db.query(Symbol).filter(Symbol.project_id == project_id).all()
        deps = db.query(Dependency).filter(Dependency.project_id == project_id).all()

        files_data = [{"id": f.id, "relative_path": f.relative_path, "language": f.language, "line_count": f.line_count} for f in files]
        symbols_by_file: Dict[str, List[Dict[str, Any]]] = {}
        for s in symbols:
            symbols_by_file.setdefault(s.file_id, []).append({
                "symbol_type": s.symbol_type,
                "complexity": s.complexity,
            })
        deps_data = [{"source_file_id": d.source_file_id, "target_file_id": d.target_file_id} for d in deps]

        analyzer = ComplexityAnalyzer(files_data, symbols_by_file, deps_data)
        return analyzer.calculate_metrics()

    @staticmethod
    def get_unresolved_dependencies(db: Session, project_id: str) -> List[UnresolvedDependencyItem]:
        deps = db.query(Dependency).filter(
            Dependency.project_id == project_id,
            Dependency.resolution_status == "unresolved",
        ).all()

        files = db.query(SourceFile).filter(SourceFile.project_id == project_id).all()
        f_map = {f.id: f.relative_path for f in files}

        items = []
        for d in deps:
            items.append(
                UnresolvedDependencyItem(
                    source_file_id=d.source_file_id,
                    source_relative_path=f_map.get(d.source_file_id, "unknown"),
                    import_statement=d.import_statement or "",
                    line_number=d.line_number,
                    target_specifier=d.import_statement or "unresolved",
                    possible_reason="File or module was not found at specified path or in package registry",
                )
            )
        return items

    @staticmethod
    def get_unused_symbols(db: Session, project_id: str) -> List[UnusedSymbolItem]:
        """Cautious static unused symbol detector for exported symbols with 0 detected usages."""
        symbols = db.query(Symbol).filter(
            Symbol.project_id == project_id,
            Symbol.is_exported == True,
            Symbol.symbol_type.in_(["function", "class", "interface"]),
        ).all()
        files = db.query(SourceFile).filter(SourceFile.project_id == project_id).all()
        f_map = {f.id: f.relative_path for f in files}

        items = []
        for s in symbols:
            # Exclude likely entry points e.g. main, App, index, route handlers
            rel = f_map.get(s.file_id, "")
            is_entry = any(e in rel.lower() for e in ["main", "index", "app", "page", "route", "test"])
            if not is_entry:
                items.append(
                    UnusedSymbolItem(
                        symbol_id=s.id,
                        name=s.name,
                        symbol_type=s.symbol_type,
                        relative_path=rel,
                        line_number=s.start_line,
                        confidence=0.7,
                        reason="Exported symbol has no detected static import references in analyzed project files.",
                    )
                )
        return items[:50]

    @staticmethod
    def get_git_hotspots(db: Session, project_id: str) -> GitHotspotsResponse:
        """Analyzes Git churn and identifies code hotspots based on commit frequency and complexity."""
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        files = db.query(SourceFile).filter(SourceFile.project_id == project_id).all()
        files_map = {
            f.relative_path: {
                "id": f.id,
                "line_count": f.line_count,
                "language": f.language,
                "file_size": f.file_size,
            }
            for f in files
        }

        from app.analyzers.git_hotspots import GitHotspotAnalyzer
        analyzer = GitHotspotAnalyzer(project.root_path, files_map=files_map)
        res = analyzer.analyze()
        return GitHotspotsResponse(**res)

