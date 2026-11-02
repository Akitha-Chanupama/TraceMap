from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.analysis import (
    AnalysisSummaryResponse,
    CircularDependenciesResponse,
    ImpactAnalysisResponse,
    ComplexityReportResponse,
    UnresolvedDependencyItem,
    UnusedSymbolItem,
)
from app.services.analysis_service import AnalysisService

router = APIRouter(prefix="/projects/{project_id}/analysis", tags=["Analysis"])


@router.get("/summary", response_model=AnalysisSummaryResponse)
def get_summary(project_id: str, db: Session = Depends(get_db)):
    return AnalysisService.get_summary(db, project_id)


@router.get("/circular-dependencies", response_model=CircularDependenciesResponse)
def get_circular_dependencies(project_id: str, db: Session = Depends(get_db)):
    return AnalysisService.get_circular_dependencies(db, project_id)


@router.get("/unresolved-dependencies", response_model=List[UnresolvedDependencyItem])
def get_unresolved_dependencies(project_id: str, db: Session = Depends(get_db)):
    return AnalysisService.get_unresolved_dependencies(db, project_id)


@router.get("/complexity", response_model=ComplexityReportResponse)
def get_complexity(project_id: str, db: Session = Depends(get_db)):
    return AnalysisService.get_complexity_report(db, project_id)


@router.get("/unused-symbols", response_model=List[UnusedSymbolItem])
def get_unused_symbols(project_id: str, db: Session = Depends(get_db)):
    return AnalysisService.get_unused_symbols(db, project_id)


@router.get("/impact/{node_id}", response_model=ImpactAnalysisResponse)
def get_impact_analysis(project_id: str, node_id: str, db: Session = Depends(get_db)):
    # Support both file_id and file_<uuid> node_id prefixes
    clean_id = node_id.replace("file_", "")
    return AnalysisService.get_impact_analysis(db, project_id, clean_id)
