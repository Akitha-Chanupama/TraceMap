import pytest
from app.graph.builder import GraphBuilder
from app.graph.layouts import compute_grid_layout, compute_clustered_directory_layout


def test_graph_builder_file_dependency():
    files = [
        {"id": "1", "filename": "index.ts", "relative_path": "src/index.ts", "language": "typescript", "line_count": 50, "file_size": 1000},
        {"id": "2", "filename": "auth.ts", "relative_path": "src/auth.ts", "language": "typescript", "line_count": 80, "file_size": 1600},
        {"id": "3", "filename": "user.ts", "relative_path": "src/user.ts", "language": "typescript", "line_count": 60, "file_size": 1200},
    ]
    symbols = []
    dependencies = [
        {"source_file_id": "1", "target_file_id": "2", "dependency_type": "IMPORTS"},
        {"source_file_id": "2", "target_file_id": "3", "dependency_type": "IMPORTS"},
        {"source_file_id": "3", "target_file_id": "2", "dependency_type": "IMPORTS"}, # cycle
    ]

    builder = GraphBuilder(files, symbols, dependencies, cycle_file_ids={"2", "3"})
    graph = builder.build_file_dependency_graph()

    assert len(graph.nodes) == 3
    assert len(graph.edges) == 3

    # Check that cycle edge is animated and colored
    cycle_edge = next(e for e in graph.edges if e.source == "file_2" and e.target == "file_3")
    assert cycle_edge.animated is True

    # Filter by search
    searched = builder.build_file_dependency_graph(search_query="auth")
    assert len(searched.nodes) == 1
    assert searched.nodes[0].data.label == "auth.ts"


def test_graph_builder_module_architecture():
    files = [
        {"id": "1", "filename": "user.ts", "relative_path": "services/user.ts", "language": "typescript"},
        {"id": "2", "filename": "profile.tsx", "relative_path": "components/profile.tsx", "language": "tsx"},
    ]
    symbols = []
    dependencies = [
        {"source_file_id": "2", "target_file_id": "1", "dependency_type": "IMPORTS"},
    ]

    builder = GraphBuilder(files, symbols, dependencies)
    graph = builder.build_module_architecture_graph()

    labels = {n.data.label for n in graph.nodes}
    assert "components" in labels
    assert "services" in labels
    assert len(graph.edges) == 1


def test_graph_builder_symbol_explorer():
    files = [
        {"id": "1", "filename": "index.ts", "relative_path": "src/index.ts", "language": "typescript"},
    ]
    symbols = [
        {"id": "s1", "name": "UserService", "symbol_type": "class", "file_id": "1", "start_line": 1, "end_line": 20, "is_exported": True},
        {"id": "s2", "name": "getUser", "symbol_type": "method", "file_id": "1", "start_line": 5, "end_line": 10, "is_exported": False},
    ]
    dependencies = []

    builder = GraphBuilder(files, symbols, dependencies)
    graph = builder.build_symbol_explorer_graph()

    assert len(graph.nodes) == 2
    sym_labels = {n.data.label for n in graph.nodes}
    assert "UserService" in sym_labels
    assert "getUser" in sym_labels


def test_graph_builder_external_dependencies():
    files = [
        {"id": "1", "filename": "index.ts", "relative_path": "src/index.ts", "language": "typescript"},
    ]
    symbols = []
    dependencies = [
        {"source_file_id": "1", "target_file_id": None, "external_package": "react", "dependency_type": "IMPORTS"},
        {"source_file_id": "1", "target_file_id": None, "external_package": "lodash", "dependency_type": "IMPORTS"},
    ]

    builder = GraphBuilder(files, symbols, dependencies)
    graph = builder.build_dependency_graph()

    labels = {n.data.label for n in graph.nodes}
    assert "index.ts" in labels
    assert "react" in labels
    assert "lodash" in labels
    assert len(graph.edges) == 2


def test_graph_layouts():
    nodes = [
        {"id": "1", "position": {"x": 0, "y": 0}, "data": {"relative_path": "src/components/button.tsx"}},
        {"id": "2", "position": {"x": 0, "y": 0}, "data": {"relative_path": "src/components/modal.tsx"}},
        {"id": "3", "position": {"x": 0, "y": 0}, "data": {"relative_path": "src/services/api.ts"}},
    ]

    grid_nodes = compute_grid_layout(nodes)
    assert len(grid_nodes) == 3
    # Check that positions are offset
    assert grid_nodes[1]["position"]["x"] > 0 or grid_nodes[1]["position"]["y"] > 0

    clustered = compute_clustered_directory_layout(nodes)
    assert len(clustered) == 3
