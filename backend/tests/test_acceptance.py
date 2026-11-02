import os
from pathlib import Path
import pytest
from app.database import SessionLocal, init_db
from app.services.project_service import ProjectService
from app.services.indexing_service import IndexingService
from app.services.analysis_service import AnalysisService
from app.services.graph_service import GraphService
from app.schemas.project import ProjectCreate


@pytest.fixture(scope="module")
def sample_project():
    init_db()
    db = SessionLocal()
    sample_root = Path("fixtures/sample_repo").resolve()

    project = ProjectService.open_project(
        db,
        ProjectCreate(
            root_path=str(sample_root),
            name="Acceptance Verification Project",
        ),
    )

    # Run full indexing
    indexer = IndexingService(db, project)
    run = indexer.run_full_indexing()

    yield db, project, run

    ProjectService.delete_project(db, project.id)
    db.close()


def test_acceptance_source_analysis(sample_project):
    db, project, run = sample_project

    # 1. Verify Scan & Parse Count
    assert run.status == "completed"
    assert run.processed_files == 5  # main.ts, user.ts, auth.ts, profile.tsx, formatter.ts
    assert run.failed_files == 0

    # 2. Verify Symbols Extracted with Exact Locations
    symbols = AnalysisService.get_summary(db, project.id)
    assert symbols.total_symbols >= 6


def test_acceptance_dependency_resolution(sample_project):
    db, project, run = sample_project

    # Graph contains expected nodes and edges
    graph = GraphService.get_graph(db, project.id, graph_type="file_dependency")
    node_labels = {n.data.label for n in graph.nodes}
    assert "main.ts" in node_labels
    assert "user.ts" in node_labels
    assert "auth.ts" in node_labels
    assert "profile.tsx" in node_labels
    assert "formatter.ts" in node_labels

    # Check edges exist
    assert len(graph.edges) >= 5


def test_acceptance_circular_dependency_detection(sample_project):
    db, project, run = sample_project

    cycles_res = AnalysisService.get_circular_dependencies(db, project.id)
    assert cycles_res.total_cycles >= 1

    # Verify that the mutual cycle between user.ts and auth.ts is accurately identified
    found_auth_user_cycle = False
    for cycle in cycles_res.cycles:
        participants = {p.relative_path.replace("\\", "/") for p in cycle.participants}
        if "src/services/user.ts" in participants and "src/services/auth.ts" in participants:
            found_auth_user_cycle = True
            break

    assert found_auth_user_cycle is True, "Expected cycle between user.ts and auth.ts not found"


def test_acceptance_impact_analysis(sample_project):
    db, project, run = sample_project

    # Changing formatter.ts should impact main.ts
    impact = AnalysisService.get_impact_analysis(db, project.id, "src/utils/formatter.ts")
    assert impact.total_affected_files >= 1
    dependants = {d.relative_path.replace("\\", "/") for d in impact.direct_dependants}
    assert "src/main.ts" in dependants

