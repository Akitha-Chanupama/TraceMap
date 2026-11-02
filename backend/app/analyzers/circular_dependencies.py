import networkx as nx
from typing import List, Dict, Any, Set, Tuple
from app.schemas.analysis import CircularDependenciesResponse, CircularDependencyCycle, CycleParticipant


class CircularDependencyAnalyzer:
    def __init__(self, file_dependencies: List[Dict[str, Any]]):
        """
        file_dependencies: List of dicts with:
            source_file_id: str
            source_relative_path: str
            target_file_id: str
            target_relative_path: str
            import_statement: Optional[str]
            line_number: Optional[int]
        """
        self.dependencies = file_dependencies
        self.graph = nx.DiGraph()
        self._build_graph()

    def _build_graph(self):
        for dep in self.dependencies:
            src = dep.get("source_relative_path")
            tgt = dep.get("target_relative_path")
            if src and tgt and src != tgt:
                self.graph.add_edge(
                    src,
                    tgt,
                    source_file_id=dep.get("source_file_id"),
                    target_file_id=dep.get("target_file_id"),
                    import_statement=dep.get("import_statement"),
                    line_number=dep.get("line_number"),
                )

    def detect_cycles(self) -> CircularDependenciesResponse:
        """Finds all elementary cycles using NetworkX simple_cycles."""
        if self.graph.number_of_nodes() == 0:
            return CircularDependenciesResponse(total_cycles=0, cycles=[])

        try:
            raw_cycles = list(nx.simple_cycles(self.graph))
        except Exception:
            raw_cycles = []

        seen_canonical_cycles: Set[Tuple[str, ...]] = set()
        detected_cycles: List[CircularDependencyCycle] = []

        for cycle in raw_cycles:
            if len(cycle) < 2:
                continue

            # Canonical representation: find min element and rotate cycle to start with it
            min_idx = cycle.index(min(cycle))
            canonical = tuple(cycle[min_idx:] + cycle[:min_idx])
            if canonical in seen_canonical_cycles:
                continue
            seen_canonical_cycles.add(canonical)

            participants: List[CycleParticipant] = []
            cycle_len = len(cycle)
            paths: List[str] = []

            for i in range(cycle_len):
                src = cycle[i]
                nxt = cycle[(i + 1) % cycle_len]
                edge_data = self.graph.get_edge_data(src, nxt, default={})
                import_stmt = edge_data.get("import_statement", "")
                src_id = edge_data.get("source_file_id", "")

                participants.append(
                    CycleParticipant(
                        file_id=src_id,
                        relative_path=src,
                        imports_next=import_stmt,
                    )
                )
                paths.append(f"{src} ──► {nxt}")

            # Determine severity
            if cycle_len == 2:
                severity = "high"  # Direct tight mutual recursion
            elif cycle_len <= 4:
                severity = "medium"
            else:
                severity = "low"

            cycle_id = f"cycle_{len(detected_cycles) + 1}_{canonical[0]}"
            detected_cycles.append(
                CircularDependencyCycle(
                    cycle_id=cycle_id,
                    length=cycle_len,
                    severity=severity,
                    participants=participants,
                    paths=paths,
                )
            )

        # Sort cycles by severity and length
        severity_order = {"high": 0, "medium": 1, "low": 2}
        detected_cycles.sort(key=lambda c: (severity_order.get(c.severity, 3), c.length))

        return CircularDependenciesResponse(
            total_cycles=len(detected_cycles),
            cycles=detected_cycles,
        )
