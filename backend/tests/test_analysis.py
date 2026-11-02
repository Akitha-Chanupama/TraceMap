from app.analyzers.circular_dependencies import CircularDependencyAnalyzer
from app.analyzers.impact_analysis import ImpactAnalyzer


def test_circular_dependency_detection():
    # Mutual recursion A -> B -> A and multi-step cycle C -> D -> E -> C
    dependencies = [
        {"source_file_id": "1", "source_relative_path": "a.ts", "target_file_id": "2", "target_relative_path": "b.ts", "import_statement": "import b"},
        {"source_file_id": "2", "source_relative_path": "b.ts", "target_file_id": "1", "target_relative_path": "a.ts", "import_statement": "import a"},
        {"source_file_id": "3", "source_relative_path": "c.ts", "target_file_id": "4", "target_relative_path": "d.ts", "import_statement": "import d"},
        {"source_file_id": "4", "source_relative_path": "d.ts", "target_file_id": "5", "target_relative_path": "e.ts", "import_statement": "import e"},
        {"source_file_id": "5", "source_relative_path": "e.ts", "target_file_id": "3", "target_relative_path": "c.ts", "import_statement": "import c"},
        {"source_file_id": "6", "source_relative_path": "f.ts", "target_file_id": "1", "target_relative_path": "a.ts", "import_statement": "import a"},
    ]

    analyzer = CircularDependencyAnalyzer(dependencies)
    result = analyzer.detect_cycles()

    assert result.total_cycles == 2
    lengths = {c.length for c in result.cycles}
    assert 2 in lengths  # a <-> b
    assert 3 in lengths  # c -> d -> e -> c


def test_impact_analysis():
    # Dependency graph:
    # app.ts imports user.ts
    # profile.tsx imports user.ts
    # user.ts imports auth.ts
    # Changing auth.ts should impact user.ts (depth 1), and app.ts & profile.tsx (depth 2)
    dependencies = [
        {"source_file_id": "1", "source_relative_path": "app.ts", "target_file_id": "2", "target_relative_path": "user.ts"},
        {"source_file_id": "3", "source_relative_path": "profile.tsx", "target_file_id": "2", "target_relative_path": "user.ts"},
        {"source_file_id": "2", "source_relative_path": "user.ts", "target_file_id": "4", "target_relative_path": "auth.ts"},
    ]
    files_lookup = {
        "auth.ts": {"id": "4", "filename": "auth.ts", "relative_path": "auth.ts"},
        "user.ts": {"id": "2", "filename": "user.ts", "relative_path": "user.ts"},
        "app.ts": {"id": "1", "filename": "app.ts", "relative_path": "app.ts"},
        "profile.tsx": {"id": "3", "filename": "profile.tsx", "relative_path": "profile.tsx"},
    }

    analyzer = ImpactAnalyzer(dependencies, files_lookup)
    impact = analyzer.analyze_impact("auth.ts")

    assert impact.total_affected_files == 3
    assert len(impact.direct_dependants) == 1
    assert impact.direct_dependants[0].relative_path == "user.ts"
    assert len(impact.transitive_dependants) == 2
    transitive_paths = {t.relative_path for t in impact.transitive_dependants}
    assert "app.ts" in transitive_paths
    assert "profile.tsx" in transitive_paths
    assert impact.max_depth == 2

