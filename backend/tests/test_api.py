import pytest
from app.database import SessionLocal, init_db
from app.api.health import get_health
from app.api.projects import list_projects, open_project, get_project, delete_project
from app.api.files import list_files, get_file_tree, get_file_source
from app.api.graph import get_graph
from app.api.analysis import get_summary, get_circular_dependencies, get_complexity, get_impact_analysis, get_git_hotspots
from app.schemas.project import ProjectCreate
from fastapi import BackgroundTasks


@pytest.fixture(scope="module")
def db_session():
    init_db()
    session = SessionLocal()
    yield session
    session.close()


def test_health_api(db_session):
    res = get_health(db_session)
    assert res["status"] in ("healthy", "degraded")
    assert "supported_languages" in res
    assert "javascript" in res["supported_languages"]
    assert "python" in res["supported_languages"]
    assert "dart" in res["supported_languages"]


def test_project_and_analysis_apis(db_session, tmp_path):
    # Create sample codebase on disk
    src_dir = tmp_path / "sample_app" / "src"
    src_dir.mkdir(parents=True)
    
    file_a = src_dir / "index.ts"
    file_b = src_dir / "service.ts"
    file_a.write_text("import { getData } from './service';\nexport function main() { return getData(); }")
    file_b.write_text("export function getData() { return 42; }")

    # 1. Open and register project
    bg_tasks = BackgroundTasks()
    proj = open_project(
        ProjectCreate(root_path=str(tmp_path / "sample_app"), name="Direct Test Project"),
        background_tasks=bg_tasks,
        db=db_session,
    )
    assert proj.id is not None
    assert proj.name == "Direct Test Project"

    # 2. List projects
    projects = list_projects(db_session)
    assert any(p.id == proj.id for p in projects)

    # 3. Synchronously run indexing for this test project
    from app.services.indexing_service import IndexingService
    indexer = IndexingService(db_session, proj)
    run = indexer.run_full_indexing()
    assert run.status == "completed"
    assert run.processed_files == 2

    # 4. Files API & Tree
    files = list_files(proj.id, db=db_session)
    assert len(files) == 2
    tree = get_file_tree(proj.id, db=db_session)
    assert tree.name == "Direct Test Project"

    # 5. Graph API
    graph_res = get_graph(proj.id, type="file_dependency", db=db_session)
    assert len(graph_res.nodes) == 2
    assert len(graph_res.edges) == 1

    # 6. Analysis APIs
    summary = get_summary(proj.id, db=db_session)
    assert summary.total_files == 2
    assert summary.total_dependencies == 1

    cycles = get_circular_dependencies(proj.id, db=db_session)
    assert cycles.total_cycles == 0

    complexity = get_complexity(proj.id, db=db_session)
    assert complexity.total_lines_of_code > 0

    # 7. File Source API
    file_a_obj = next(f for f in files if f.filename == "index.ts")
    source_res = get_file_source(proj.id, file_a_obj.id, db=db_session)
    assert "import { getData }" in source_res.content

    # 8. Impact Analysis API
    file_b_obj = next(f for f in files if f.filename == "service.ts")
    impact_res = get_impact_analysis(proj.id, file_b_obj.id, db=db_session)
    assert impact_res.total_affected_files == 1
    assert impact_res.direct_dependants[0].relative_path == "src/index.ts"

    # 9. Git Hotspots API
    hotspots_res = get_git_hotspots(proj.id, db=db_session)
    assert isinstance(hotspots_res.is_git_repo, bool)

    # 10. Delete Project
    del_res = delete_project(proj.id, db=db_session)
    assert del_res["message"] == "Project removed from history"
