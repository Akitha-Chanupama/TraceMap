from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.symbol import Symbol
from app.schemas.symbol import SymbolResponse

router = APIRouter(prefix="/projects/{project_id}/symbols", tags=["Symbols"])


@router.get("", response_model=List[SymbolResponse])
def list_symbols(
    project_id: str,
    file_id: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    query = db.query(Symbol).filter(Symbol.project_id == project_id)
    if file_id:
        query = query.filter(Symbol.file_id == file_id)
    if type:
        query = query.filter(Symbol.symbol_type == type)
    if search:
        query = query.filter(Symbol.name.ilike(f"%{search}%") | Symbol.qualified_name.ilike(f"%{search}%"))
    return query.limit(limit).all()
