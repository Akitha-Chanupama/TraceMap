from pathlib import Path
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.project import Project
from app.models.source_file import SourceFile
from app.models.symbol import Symbol
from app.models.dependency import Dependency
from app.schemas.file import FileResponse, FileTreeNode, SourceCodeResponse


class FileService:
    @staticmethod
    def get_files(
        db: Session,
        project_id: str,
        search: Optional[str] = None,
        language: Optional[str] = None,
        directory: Optional[str] = None,
        page: int = 1,
        page_size: int = 100,
    ) -> List[FileResponse]:
        query = db.query(SourceFile).filter(SourceFile.project_id == project_id)

        if search:
            query = query.filter(SourceFile.filename.ilike(f"%{search}%") | SourceFile.relative_path.ilike(f"%{search}%"))
        if language:
            query = query.filter(SourceFile.language == language)
        if directory:
            query = query.filter(SourceFile.relative_path.startswith(directory))

        offset = (page - 1) * page_size
        files = query.order_by(SourceFile.relative_path.asc()).offset(offset).limit(page_size).all()

        results = []
        for f in files:
            sym_count = db.query(Symbol).filter(Symbol.file_id == f.id).count()
            dep_count = db.query(Dependency).filter(Dependency.source_file_id == f.id).count()
            f_resp = FileResponse.model_validate(f)
            f_resp.symbols_count = sym_count
            f_resp.dependencies_count = dep_count
            results.append(f_resp)
        return results

    @staticmethod
    def get_file_tree(db: Session, project_id: str) -> FileTreeNode:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        files = db.query(SourceFile).filter(SourceFile.project_id == project_id).order_by(SourceFile.relative_path.asc()).all()

        root = FileTreeNode(
            id="root",
            name=project.name,
            path="",
            type="directory",
            children=[],
        )

        nodes_by_path: Dict[str, FileTreeNode] = {"": root}

        for f in files:
            parts = f.relative_path.split("/")
            curr_path = ""
            parent = root

            for idx, part in enumerate(parts):
                curr_path = f"{curr_path}/{part}" if curr_path else part
                is_file = idx == len(parts) - 1

                if curr_path not in nodes_by_path:
                    node = FileTreeNode(
                        id=f.id if is_file else f"dir_{curr_path}",
                        name=part,
                        path=curr_path,
                        type="file" if is_file else "directory",
                        extension=f.extension if is_file else None,
                        language=f.language if is_file else None,
                        size=f.file_size if is_file else None,
                        file_id=f.id if is_file else None,
                        children=[] if not is_file else None,
                    )
                    nodes_by_path[curr_path] = node
                    if parent.children is not None:
                        parent.children.append(node)

                parent = nodes_by_path[curr_path]

        return root

    @staticmethod
    def get_file_source(db: Session, project_id: str, file_id: str) -> SourceCodeResponse:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        source_file = db.query(SourceFile).filter(
            SourceFile.project_id == project_id,
            SourceFile.id == file_id,
        ).first()

        if not source_file:
            raise HTTPException(status_code=404, detail="File not found")

        # Security check: Ensure file path strictly resides inside project root
        proj_root = Path(project.root_path).resolve()
        file_path = Path(source_file.absolute_path).resolve()
        try:
            file_path.relative_to(proj_root)
        except ValueError:
            raise HTTPException(status_code=403, detail="Access denied: file resides outside project root")

        if not file_path.exists() or not file_path.is_file():
            raise HTTPException(status_code=404, detail="File content not found on filesystem")

        try:
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                content = f.read()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to read file: {e}")

        # Fetch symbols and imports for metadata
        symbols = db.query(Symbol).filter(Symbol.file_id == file_id).all()
        deps = db.query(Dependency).filter(Dependency.source_file_id == file_id).all()

        sym_list = [
            {
                "id": s.id,
                "name": s.name,
                "type": s.symbol_type,
                "start_line": s.start_line,
                "end_line": s.end_line,
                "complexity": s.complexity,
            }
            for s in symbols
        ]

        import_list = [
            {
                "id": d.id,
                "statement": d.import_statement,
                "line": d.line_number,
                "status": d.resolution_status,
                "external_package": d.external_package,
            }
            for d in deps
        ]

        return SourceCodeResponse(
            file_id=source_file.id,
            filename=source_file.filename,
            relative_path=source_file.relative_path,
            language=source_file.language,
            content=content,
            line_count=source_file.line_count,
            symbols=sym_list,
            imports=import_list,
            exports=[],
        )
