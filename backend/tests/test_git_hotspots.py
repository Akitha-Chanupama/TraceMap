import os
import subprocess
import pytest
from pathlib import Path
from app.analyzers.git_hotspots import GitHotspotAnalyzer


def test_non_git_directory(tmp_path):
    analyzer = GitHotspotAnalyzer(tmp_path)
    res = analyzer.analyze()
    assert res["is_git_repo"] is False
    assert len(res["hotspots"]) == 0
    assert "not a Git repository" in res["message"]


def test_git_hotspot_analysis(tmp_path):
    repo_dir = tmp_path / "git_test_repo"
    repo_dir.mkdir()

    # Initialize a dummy git repo
    subprocess.run(["git", "init"], cwd=str(repo_dir), check=True, capture_output=True)
    subprocess.run(["git", "config", "user.name", "Tester"], cwd=str(repo_dir), check=True, capture_output=True)
    subprocess.run(["git", "config", "user.email", "tester@example.com"], cwd=str(repo_dir), check=True, capture_output=True)

    # Commit 1
    file_hot = repo_dir / "hot_module.ts"
    file_cold = repo_dir / "stable_module.ts"
    file_hot.write_text("console.log('v1');\n" * 20)
    file_cold.write_text("export const STABLE = 100;\n")

    subprocess.run(["git", "add", "."], cwd=str(repo_dir), check=True, capture_output=True)
    subprocess.run(["git", "commit", "-m", "init commit"], cwd=str(repo_dir), check=True, capture_output=True)

    # Commit 2 - only touch hot_module
    file_hot.write_text("console.log('v2');\n" * 30)
    subprocess.run(["git", "commit", "-am", "update hot module"], cwd=str(repo_dir), check=True, capture_output=True)

    # Commit 3 - touch hot_module again
    file_hot.write_text("console.log('v3');\n" * 50)
    subprocess.run(["git", "commit", "-am", "refactor hot module"], cwd=str(repo_dir), check=True, capture_output=True)

    files_map = {
        "hot_module.ts": {"id": "1", "line_count": 120},
        "stable_module.ts": {"id": "2", "line_count": 10},
    }

    analyzer = GitHotspotAnalyzer(repo_dir, files_map=files_map)
    assert analyzer.is_git_repository() is True

    res = analyzer.analyze()
    assert res["is_git_repo"] is True
    assert res["total_commits_analyzed"] == 3

    hotspots = {h["relative_path"]: h for h in res["hotspots"]}
    assert "hot_module.ts" in hotspots
    assert "stable_module.ts" in hotspots

    hot_stat = hotspots["hot_module.ts"]
    cold_stat = hotspots["stable_module.ts"]

    assert hot_stat["commit_count"] == 3
    assert cold_stat["commit_count"] == 1
    assert hot_stat["churn_score"] > cold_stat["churn_score"]
    assert hot_stat["author_count"] == 1
    assert hot_stat["hotspot_level"] in ("high", "critical")
