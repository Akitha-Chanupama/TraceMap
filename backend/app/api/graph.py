from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.source_file import SourceFile
from app.models.dependency import Dependency
from app.schemas.graph import GraphDataResponse
from app.services.graph_service import GraphService

router = APIRouter(prefix="/projects/{project_id}/graph", tags=["Graph"])


@router.get("", response_model=GraphDataResponse)
def get_graph(
    project_id: str,
    type: str = "file_dependency",
    language: Optional[str] = None,
    directory: Optional[str] = None,
    search: Optional[str] = None,
    max_nodes: int = 500,
    db: Session = Depends(get_db),
):
    return GraphService.get_graph(
        db,
        project_id,
        graph_type=type,
        language=language,
        directory=directory,
        search=search,
        max_nodes=max_nodes,
    )


@router.get("/nodes/{node_id}")
def get_node_details(project_id: str, node_id: str, db: Session = Depends(get_db)):
    # Node ID can be file_<uuid> or mod_<name> or sym_<uuid>
    if node_id.startswith("file_"):
        file_id = node_id.replace("file_", "")
        f = db.query(SourceFile).filter(SourceFile.project_id == project_id, SourceFile.id == file_id).first()
        if not f:
            raise HTTPException(status_code=404, detail="Node not found")
        incoming = db.query(Dependency).filter(Dependency.target_file_id == file_id).count()
        outgoing = db.query(Dependency).filter(Dependency.source_file_id == file_id).count()
        return {
            "id": node_id,
            "type": "file",
            "filename": f.filename,
            "relative_path": f.relative_path,
            "language": f.language,
            "line_count": f.line_count,
            "incoming_dependencies": incoming,
            "outgoing_dependencies": outgoing,
        }
    return {"id": node_id, "type": "generic"}


@router.get("/neighbors/{node_id}")
def get_node_neighbors(project_id: str, node_id: str, db: Session = Depends(get_db)):
    if node_id.startswith("file_"):
        file_id = node_id.replace("file_", "")
        incoming = (
            db.query(Dependency, SourceFile)
            .join(SourceFile, Dependency.source_file_id == SourceFile.id)
            .filter(Dependency.target_file_id == file_id)
            .all()
        )
        outgoing = (
            db.query(Dependency, SourceFile)
            .join(SourceFile, Dependency.target_file_id == SourceFile.id)
            .filter(Dependency.source_file_id == file_id)
            .all()
        )
        return {
            "incoming": [{"file": f.relative_path, "statement": d.import_statement} for d, f in incoming],
            "outgoing": [{"file": f.relative_path, "statement": d.import_statement} for d, f in outgoing],
        }
    return {"incoming": [], "outgoing": []}
