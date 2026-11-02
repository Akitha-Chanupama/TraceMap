from typing import Dict, Any, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.source_file import SourceFile
from app.models.symbol import Symbol
from app.models.dependency import Dependency

router = APIRouter(prefix="/projects/{project_id}/search", tags=["Search"])


@router.get("")
def global_search(project_id: str, q: str = Query(..., min_length=1), db: Session = Depends(get_db)):
    term = f"%{q.strip()}%"

    files = (
        db.query(SourceFile)
        .filter(SourceFile.project_id == project_id)
        .filter(SourceFile.filename.ilike(term) | SourceFile.relative_path.ilike(term))
        .limit(20)
        .all()
    )

    symbols = (
        db.query(Symbol)
        .filter(Symbol.project_id == project_id)
        .filter(Symbol.name.ilike(term) | Symbol.qualified_name.ilike(term))
        .limit(30)
        .all()
    )

    packages = (
        db.query(Dependency.external_package)
        .filter(Dependency.project_id == project_id, Dependency.external_package != None)
        .filter(Dependency.external_package.ilike(term))
        .distinct()
        .limit(10)
        .all()
    )

    return {
        "files": [
            {
                "id": f.id,
                "name": f.filename,
                "path": f.relative_path,
                "language": f.language,
                "type": "file",
            }
            for f in files
        ],
        "symbols": [
            {
                "id": s.id,
                "name": s.name,
                "qualified_name": s.qualified_name,
                "type": s.symbol_type,
                "file_id": s.file_id,
                "line": s.start_line,
            }
            for s in symbols
        ],
        "packages": [p[0] for p in packages],
    }

