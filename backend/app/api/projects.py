import os
import asyncio
from pathlib import Path
from typing import List
from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db, SessionLocal
from app.models.project import Project
from app.models.analysis import AnalysisRun
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse
from app.services.project_service import ProjectService
from app.services.indexing_service import IndexingService
from app.services.watcher_service import WatcherManager
from app.api.websocket_manager import ws_manager

router = APIRouter(prefix="/projects", tags=["Projects"])


def _run_indexing_in_background(project_id: str):
    db = SessionLocal()
    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return

        def progress_cb(phase: str, current: int, total: int):
            try:
                loop = asyncio.get_running_loop()
                asyncio.run_coroutine_threadsafe(
                    ws_manager.broadcast_event(
                        project_id,
                        f"{phase}_progress" if phase in ("scanning", "parsing", "indexing") else f"analysis_{phase}",
                        {"phase": phase, "current": current, "total": total},
                    ),
                    loop,
                )
            except RuntimeError:
                pass

        indexer = IndexingService(db, project, progress_callback=progress_cb)
        indexer.run_full_indexing()

        def on_file_change(evt_type: str, rel_path: str):
            try:
                loop = asyncio.get_running_loop()
                asyncio.run_coroutine_threadsafe(
                    ws_manager.broadcast_event(
                        project_id,
                        "file_changed",
                        {"event_type": evt_type, "relative_path": rel_path},
                    ),
                    loop,
                )
            except RuntimeError:
                pass

        # Start filesystem watcher if not running automated test suite
        if not os.environ.get("TRACEMAP_TESTING"):
            WatcherManager.start_watching(
                project.id,
                Path(project.root_path),
                on_change_callback=on_file_change,
            )

    finally:
        db.close()


@router.get("", response_model=List[ProjectResponse])
def list_projects(db: Session = Depends(get_db)):
    return ProjectService.get_projects(db)


@router.post("/open", response_model=ProjectResponse)
def open_project(project_in: ProjectCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    project = ProjectService.open_project(db, project_in)
    # Automatically schedule initial analysis
    background_tasks.add_task(_run_indexing_in_background, project.id)
    return project


@router.post("/select-folder")
def select_folder_dialog():
    """Opens native Windows folder selection dialog using tkinter where available."""
    try:
        import tkinter as tk
        from tkinter import filedialog
        root = tk.Tk()
        root.withdraw()
        root.attributes("-topmost", True)
        selected_path = filedialog.askdirectory(title="Select Project Directory for TraceMap")
        root.destroy()
        if selected_path:
            return {"selected_path": str(Path(selected_path).resolve())}
        return {"selected_path": None}
    except Exception as e:
        return {"selected_path": None, "error": str(e)}


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: str, db: Session = Depends(get_db)):
    return ProjectService.get_project(db, project_id)


@router.patch("/{project_id}", response_model=ProjectResponse)
def update_project(project_id: str, update_in: ProjectUpdate, db: Session = Depends(get_db)):
    return ProjectService.update_project(db, project_id, update_in)


@router.delete("/{project_id}")
def delete_project(project_id: str, db: Session = Depends(get_db)):
    WatcherManager.stop_watching(project_id)
    ProjectService.delete_project(db, project_id)
    return {"message": "Project removed from history"}


@router.post("/{project_id}/analyze")
def trigger_analysis(project_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    project = ProjectService.get_project(db, project_id)
    background_tasks.add_task(_run_indexing_in_background, project.id)
    return {"message": "Analysis started", "status": "running"}


@router.post("/{project_id}/refresh")
def trigger_refresh(project_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    project = ProjectService.get_project(db, project_id)
    background_tasks.add_task(_run_indexing_in_background, project.id)
    return {"message": "Re-analysis triggered", "status": "running"}


@router.get("/{project_id}/status")
def get_analysis_status(project_id: str, db: Session = Depends(get_db)):
    project = ProjectService.get_project(db, project_id)
    latest_run = (
        db.query(AnalysisRun)
        .filter(AnalysisRun.project_id == project_id)
        .order_by(AnalysisRun.started_at.desc())
        .first()
    )
    return {
        "project_id": project.id,
        "status": project.analysis_status,
        "last_analyzed_at": project.last_analyzed_at,
        "latest_run": {
            "id": latest_run.id if latest_run else None,
            "status": latest_run.status if latest_run else None,
            "total_files": latest_run.total_files if latest_run else 0,
            "processed_files": latest_run.processed_files if latest_run else 0,
            "duration_ms": latest_run.analysis_duration_ms if latest_run else None,
            "summary": latest_run.summary if latest_run else None,
        } if latest_run else None,
    }
