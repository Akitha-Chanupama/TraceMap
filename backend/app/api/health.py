from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.parsers.registry import ParserRegistry

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("")
def get_health(db: Session = Depends(get_db)):
    db_ok = True
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_ok = False

    return {
        "status": "healthy" if db_ok else "degraded",
        "backend_version": "0.1.0",
        "database": "connected" if db_ok else "disconnected",
        "supported_languages": ParserRegistry.get_supported_languages(),
    }
