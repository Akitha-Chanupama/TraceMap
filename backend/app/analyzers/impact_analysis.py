from collections import deque
from typing import List, Dict, Any, Set
import networkx as nx
from app.schemas.analysis import ImpactAnalysisResponse, ImpactNode


class ImpactAnalyzer:
    def __init__(self, file_dependencies: List[Dict[str, Any]], files_lookup: Dict[str, Dict[str, Any]]):
        """
        file_dependencies: List of dicts with:
            source_file_id: str
            source_relative_path: str
            target_file_id: str
            target_relative_path: str
            import_statement: Optional[str]
        files_lookup: Dict mapping relative_path -> {id: str, relative_path: str, filename: str}
        """
        self.files_lookup = files_lookup
        # Standard graph: edge A -> B means A imports B (A depends on B)
        self.graph = nx.DiGraph()
        for dep in file_dependencies:
            src = dep.get("source_relative_path")
            tgt = dep.get("target_relative_path")
            if src and tgt:
                self.graph.add_edge(
                    src,
                    tgt,
                    import_statement=dep.get("import_statement"),
                    source_file_id=dep.get("source_file_id"),
                    target_file_id=dep.get("target_file_id"),
                )

    def analyze_impact(self, target_relative_path: str) -> ImpactAnalysisResponse:
        """
        Calculates blast radius of modifying target_relative_path.
        Uses reverse dependency traversal (who imports target_relative_path?).
        """
        root_info = self.files_lookup.get(target_relative_path, {})
        root_id = root_info.get("id", target_relative_path)
        root_label = root_info.get("filename", target_relative_path)

        if not self.graph.has_node(target_relative_path):
            return ImpactAnalysisResponse(
                root_node_id=root_id,
                root_label=root_label,
                root_relative_path=target_relative_path,
                direct_dependants=[],
                transitive_dependants=[],
                total_affected_files=0,
                max_depth=0,
                explanation=f"No internal files import '{target_relative_path}'. Modifying it has 0 known internal dependants.",
            )

        # Reverse graph: edge B -> A means A depends on B (modifying B impacts A)
        rev_graph = self.graph.reverse(copy=True)

        direct_dependants: List[ImpactNode] = []
        transitive_dependants: List[ImpactNode] = []
        visited: Set[str] = {target_relative_path}

        # BFS queue: (node, depth, via_import)
        queue = deque([(target_relative_path, 0, "")])
        max_depth = 0

        while queue:
            curr, depth, via_imp = queue.popleft()
            if depth > max_depth:
                max_depth = depth

            for neighbor in rev_graph.successors(curr):
                if neighbor not in visited:
                    visited.add(neighbor)
                    edge_data = rev_graph.get_edge_data(curr, neighbor, default={})
                    imp_stmt = edge_data.get("import_statement") or f"import from {curr}"
                    n_info = self.files_lookup.get(neighbor, {})
                    n_id = n_info.get("id", neighbor)

                    node_obj = ImpactNode(
                        file_id=n_id,
                        relative_path=neighbor,
                        depth=depth + 1,
                        via_import=imp_stmt,
                    )

                    if depth + 1 == 1:
                        direct_dependants.append(node_obj)
                    else:
                        transitive_dependants.append(node_obj)

                    queue.append((neighbor, depth + 1, imp_stmt))

        total_affected = len(direct_dependants) + len(transitive_dependants)
        explanation = (
            f"Modifying '{target_relative_path}' potentially affects {len(direct_dependants)} direct "
            f"and {len(transitive_dependants)} transitive dependants across {max_depth} levels of dependency depth."
        )

        return ImpactAnalysisResponse(
            root_node_id=root_id,
            root_label=root_label,
            root_relative_path=target_relative_path,
            direct_dependants=direct_dependants,
            transitive_dependants=transitive_dependants,
            total_affected_files=total_affected,
            max_depth=max_depth,
            explanation=explanation,
        )
