from pathlib import Path
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.project import Project
from app.core.language_detector import ProjectDetector
from app.schemas.project import ProjectCreate, ProjectUpdate


class ProjectService:
    @staticmethod
    def open_project(db: Session, project_in: ProjectCreate) -> Project:
        resolved_path = Path(project_in.root_path).resolve()
        if not resolved_path.exists() or not resolved_path.is_dir():
            raise HTTPException(status_code=400, detail=f"Directory does not exist: {project_in.root_path}")

        norm_path = str(resolved_path)

        # Check if project already registered
        existing = db.query(Project).filter(Project.root_path == norm_path).first()
        if existing:
            return existing

        detector = ProjectDetector(resolved_path)
        proj_type, frameworks, config_data = detector.detect_project_info()
        name = project_in.name or resolved_path.name or "Unnamed Project"

        project = Project(
            name=name,
            root_path=norm_path,
            project_type=proj_type,
            detected_languages=frameworks,
            configuration=config_data,
            analysis_status="idle",
        )
        db.add(project)
        db.commit()
        db.refresh(project)
        return project

    @staticmethod
    def get_projects(db: Session) -> List[Project]:
        return db.query(Project).order_by(Project.updated_at.desc()).all()

    @staticmethod
    def get_project(db: Session, project_id: str) -> Project:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        return project

    @staticmethod
    def update_project(db: Session, project_id: str, update_in: ProjectUpdate) -> Project:
        project = ProjectService.get_project(db, project_id)
        if update_in.name is not None:
            project.name = update_in.name
        db.commit()
        db.refresh(project)
        return project

    @staticmethod
    def delete_project(db: Session, project_id: str) -> bool:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        db.delete(project)
        db.commit()
        return True
