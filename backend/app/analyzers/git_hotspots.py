import math
import subprocess
from pathlib import Path
from typing import Dict, Any, List, Optional
from collections import defaultdict


class GitHotspotAnalyzer:
    def __init__(self, project_root: str | Path, files_map: Optional[Dict[str, Dict[str, Any]]] = None):
        """
        :param project_root: Path to project root directory
        :param files_map: Map of relative_path -> file metadata (e.g. line_count, file_id)
        """
        self.project_root = Path(project_root).resolve()
        self.files_map = files_map or {}

    def is_git_repository(self) -> bool:
        """Checks if project root is inside an active Git repository."""
        git_dir = self.project_root / ".git"
        if git_dir.exists():
            return True
        try:
            res = subprocess.run(
                ["git", "rev-parse", "--is-inside-work-tree"],
                cwd=str(self.project_root),
                capture_output=True,
                text=True,
                timeout=5,
            )
            return res.returncode == 0 and res.stdout.strip() == "true"
        except Exception:
            return False

    def analyze(self, max_commits: int = 500) -> Dict[str, Any]:
        """
        Extracts commit logs, computes per-file churn, author diversity,
        and identifies high-risk architecture hotspots.
        """
        if not self.is_git_repository():
            return {
                "is_git_repo": False,
                "total_commits_analyzed": 0,
                "hotspots": [],
                "top_authors": [],
                "message": "Project is not a Git repository. Git churn analysis requires a Git history.",
            }

        # Safe Git log command with numstat
        cmd = [
            "git",
            "log",
            f"-n{max_commits}",
            "--format=__TM_COMMIT__%h|%an|%ad|%s",
            "--numstat",
            "--date=short",
        ]

        try:
            res = subprocess.run(
                cmd,
                cwd=str(self.project_root),
                capture_output=True,
                text=True,
                timeout=30,
            )
            if res.returncode != 0:
                return {
                    "is_git_repo": True,
                    "total_commits_analyzed": 0,
                    "hotspots": [],
                    "top_authors": [],
                    "message": f"Git log execution failed: {res.stderr.strip()}",
                }
            log_output = res.stdout
        except Exception as e:
            return {
                "is_git_repo": True,
                "total_commits_analyzed": 0,
                "hotspots": [],
                "top_authors": [],
                "message": f"Could not read Git logs: {str(e)}",
            }

        file_stats: Dict[str, Dict[str, Any]] = defaultdict(lambda: {
            "commits": set(),
            "authors": set(),
            "lines_added": 0,
            "lines_deleted": 0,
            "last_date": None,
        })
        author_commit_counts: Dict[str, int] = defaultdict(int)
        total_commits = 0

        current_author = "Unknown"
        current_date = None

        for line in log_output.splitlines():
            line = line.strip()
            if not line:
                continue

            if line.startswith("__TM_COMMIT__"):
                total_commits += 1
                parts = line.replace("__TM_COMMIT__", "").split("|")
                current_hash = parts[0] if len(parts) > 0 else ""
                current_author = parts[1] if len(parts) > 1 else "Unknown"
                current_date = parts[2] if len(parts) > 2 else None
                author_commit_counts[current_author] += 1
                continue

            # Parse numstat line: added \t deleted \t path
            parts = line.split("\t")
            if len(parts) == 3:
                added_str, deleted_str, raw_path = parts
                norm_path = raw_path.replace("\\", "/").strip()
                
                # Handle renamed files e.g. "old => new"
                if " => " in norm_path:
                    norm_path = norm_path.split(" => ")[-1].replace("}", "").strip()

                try:
                    added = int(added_str) if added_str != "-" else 0
                    deleted = int(deleted_str) if deleted_str != "-" else 0
                except ValueError:
                    added, deleted = 0, 0

                stats = file_stats[norm_path]
                stats["commits"].add(total_commits)
                stats["authors"].add(current_author)
                stats["lines_added"] += added
                stats["lines_deleted"] += deleted
                if not stats["last_date"]:
                    stats["last_date"] = current_date

        # Compute hotspot items
        hotspots: List[Dict[str, Any]] = []

        # If files_map was provided, ensure all known code files are included in assessment
        all_paths = set(file_stats.keys()).union(self.files_map.keys())

        # Find max commit count for relative scaling
        max_file_commits = max((len(s["commits"]) for s in file_stats.values()), default=1)

        for rel_path in all_paths:
            stats = file_stats.get(rel_path, {
                "commits": set(),
                "authors": set(),
                "lines_added": 0,
                "lines_deleted": 0,
                "last_date": None,
            })
            f_meta = self.files_map.get(rel_path, {})
            file_id = f_meta.get("id")
            line_count = f_meta.get("line_count", 0)

            c_count = len(stats["commits"])
            a_count = len(stats["authors"])
            l_added = stats["lines_added"]
            l_deleted = stats["lines_deleted"]
            total_churn_lines = l_added + l_deleted

            # Calculate Churn Score (0.0 to 100.0)
            if max_file_commits > 0:
                commit_factor = (c_count / max_file_commits) * 65.0
                line_factor = min(35.0, math.log1p(total_churn_lines) * 4.5)
                churn_score = round(min(100.0, commit_factor + line_factor), 1)
            else:
                churn_score = 0.0

            # Determine Hotspot Risk Level
            if churn_score >= 60 and line_count >= 100:
                level = "critical"
                risk_summary = f"Critical Hotspot: Changed in {c_count} commits by {a_count} authors with {line_count} LOC."
            elif churn_score >= 45 or (churn_score >= 30 and line_count >= 80):
                level = "high"
                risk_summary = f"High Churn: Frequent modifications ({c_count} commits) and high complexity ({line_count} LOC)."
            elif churn_score >= 20:
                level = "medium"
                risk_summary = f"Moderate Activity: {c_count} commits across {a_count} author(s)."
            else:
                level = "low"
                risk_summary = f"Stable: Infrequently modified ({c_count} commit(s))."

            hotspots.append({
                "file_id": file_id,
                "relative_path": rel_path,
                "commit_count": c_count,
                "lines_added": l_added,
                "lines_deleted": l_deleted,
                "author_count": a_count,
                "last_modified_date": stats["last_date"],
                "churn_score": churn_score,
                "complexity_lines": line_count,
                "hotspot_level": level,
                "risk_summary": risk_summary,
            })

        # Sort hotspots descending by churn_score then complexity_lines
        hotspots.sort(key=lambda x: (x["churn_score"], x["complexity_lines"]), reverse=True)

        top_authors = [
            {"author": auth, "commits": count}
            for auth, count in sorted(author_commit_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        ]

        return {
            "is_git_repo": True,
            "total_commits_analyzed": total_commits,
            "hotspots": hotspots,
            "top_authors": top_authors,
            "message": None,
        }
