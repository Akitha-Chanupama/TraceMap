from typing import Optional, Set
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.source_file import SourceFile
from app.models.symbol import Symbol
from app.models.dependency import Dependency
from app.graph.builder import GraphBuilder
from app.analyzers.circular_dependencies import CircularDependencyAnalyzer
from app.schemas.graph import GraphDataResponse


class GraphService:
    @staticmethod
    def get_graph(
        db: Session,
        project_id: str,
        graph_type: str = "file_dependency",
        language: Optional[str] = None,
        directory: Optional[str] = None,
        search: Optional[str] = None,
        max_nodes: int = 500,
    ) -> GraphDataResponse:
        files = db.query(SourceFile).filter(SourceFile.project_id == project_id).all()
        if not files:
            return GraphDataResponse(nodes=[], edges=[], stats={"total_nodes": 0, "total_edges": 0})

        symbols = db.query(Symbol).filter(Symbol.project_id == project_id).all()
        deps = db.query(Dependency).filter(Dependency.project_id == project_id).all()

        files_data = [
            {
                "id": f.id,
                "filename": f.filename,
                "relative_path": f.relative_path,
                "language": f.language,
                "line_count": f.line_count,
                "file_size": f.file_size,
            }
            for f in files
        ]

        symbols_data = [
            {
                "id": s.id,
                "file_id": s.file_id,
                "parent_symbol_id": s.parent_symbol_id,
                "name": s.name,
                "symbol_type": s.symbol_type,
                "language": s.language,
                "complexity": s.complexity,
                "start_line": s.start_line,
                "end_line": s.end_line,
                "is_exported": s.is_exported,
                "visibility": s.visibility,
            }
            for s in symbols
        ]

        deps_data = [
            {
                "source_file_id": d.source_file_id,
                "target_file_id": d.target_file_id,
                "external_package": d.external_package,
                "dependency_type": d.dependency_type,
                "import_statement": d.import_statement,
                "line_number": d.line_number,
                "resolution_status": d.resolution_status,
            }
            for d in deps
        ]

        # Calculate cycles to mark cycle nodes
        file_lookup = {f.id: f.relative_path for f in files}
        dep_dicts_for_cycle = [
            {
                "source_file_id": d.source_file_id,
                "source_relative_path": file_lookup.get(d.source_file_id, ""),
                "target_file_id": d.target_file_id,
                "target_relative_path": file_lookup.get(d.target_file_id, ""),
                "import_statement": d.import_statement,
                "line_number": d.line_number,
            }
            for d in deps
            if d.target_file_id and d.source_file_id in file_lookup and d.target_file_id in file_lookup
        ]
        cycle_analyzer = CircularDependencyAnalyzer(dep_dicts_for_cycle)
        cycle_res = cycle_analyzer.detect_cycles()
        cycle_file_ids: Set[str] = set()
        for c in cycle_res.cycles:
            for p in c.participants:
                if p.file_id:
                    cycle_file_ids.add(p.file_id)

        builder = GraphBuilder(files_data, symbols_data, deps_data, cycle_file_ids=cycle_file_ids)

        if graph_type == "module_architecture":
            return builder.build_module_architecture_graph()
        elif graph_type == "symbol_explorer":
            return builder.build_symbol_explorer_graph(max_symbols=max_nodes)
        elif graph_type == "dependencies" or graph_type == "external_dependencies":
            return builder.build_external_dependencies_graph(max_pkgs=max_nodes)
        else:
            # Default: file_dependency or project_overview
            return builder.build_file_dependency_graph(
                language_filter=language,
                directory_filter=directory,
                search_query=search,
                max_nodes=max_nodes,
            )

