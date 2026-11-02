from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.source_file import SourceFile
from app.schemas.file import FileResponse, FileTreeNode, SourceCodeResponse
from app.services.file_service import FileService

router = APIRouter(prefix="/projects/{project_id}/files", tags=["Files"])


@router.get("", response_model=List[FileResponse])
def list_files(
    project_id: str,
    search: Optional[str] = None,
    language: Optional[str] = None,
    directory: Optional[str] = None,
    page: int = 1,
    page_size: int = 100,
    db: Session = Depends(get_db),
):
    return FileService.get_files(
        db,
        project_id,
        search=search,
        language=language,
        directory=directory,
        page=page,
        page_size=page_size,
    )


@router.get("/tree", response_model=FileTreeNode)
def get_file_tree(project_id: str, db: Session = Depends(get_db)):
    return FileService.get_file_tree(db, project_id)


@router.get("/{file_id}", response_model=FileResponse)
def get_file(project_id: str, file_id: str, db: Session = Depends(get_db)):
    file_obj = db.query(SourceFile).filter(
        SourceFile.project_id == project_id,
        SourceFile.id == file_id,
    ).first()
    if not file_obj:
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse.model_validate(file_obj)


@router.get("/{file_id}/source", response_model=SourceCodeResponse)
def get_file_source(project_id: str, file_id: str, db: Session = Depends(get_db)):
    return FileService.get_file_source(db, project_id, file_id)
