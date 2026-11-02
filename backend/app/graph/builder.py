from typing import List, Dict, Any, Optional, Set
from app.schemas.graph import GraphDataResponse, GraphNode, GraphEdge, GraphNodeData
from app.graph.layouts import compute_grid_layout, compute_clustered_directory_layout


class GraphBuilder:
    def __init__(
        self,
        files: List[Dict[str, Any]],
        symbols: List[Dict[str, Any]],
        dependencies: List[Dict[str, Any]],
        cycle_file_ids: Optional[Set[str]] = None,
    ):
        self.files = files
        self.symbols = symbols
        self.dependencies = dependencies
        self.cycle_file_ids = cycle_file_ids or set()
        self.file_by_id = {f["id"]: f for f in files}

    def build_file_dependency_graph(
        self,
        language_filter: Optional[str] = None,
        directory_filter: Optional[str] = None,
        search_query: Optional[str] = None,
        max_nodes: int = 500,
    ) -> GraphDataResponse:
        """Builds file-level dependency graph."""
        nodes: List[Dict[str, Any]] = []
        edges: List[Dict[str, Any]] = []

        # Calculate in/out counts
        in_counts: Dict[str, int] = {f["id"]: 0 for f in self.files}
        out_counts: Dict[str, int] = {f["id"]: 0 for f in self.files}
        for dep in self.dependencies:
            src = dep.get("source_file_id")
            tgt = dep.get("target_file_id")
            if src in out_counts:
                out_counts[src] += 1
            if tgt in in_counts:
                in_counts[tgt] += 1

        # Filter files
        matched_files = []
        for f in self.files:
            if language_filter and f.get("language") != language_filter:
                continue
            if directory_filter and not f.get("relative_path", "").startswith(directory_filter):
                continue
            if search_query:
                q = search_query.lower()
                if q not in f.get("filename", "").lower() and q not in f.get("relative_path", "").lower():
                    continue
            matched_files.append(f)

        matched_files = matched_files[:max_nodes]
        matched_ids = {f["id"] for f in matched_files}

        for f in matched_files:
            f_id = f["id"]
            has_cycle = f_id in self.cycle_file_ids
            node_data = {
                "label": f.get("filename", ""),
                "entity_type": "file",
                "language": f.get("language", ""),
                "file_id": f_id,
                "relative_path": f.get("relative_path", ""),
                "incoming_count": in_counts.get(f_id, 0),
                "outgoing_count": out_counts.get(f_id, 0),
                "complexity": f.get("line_count", 0),
                "has_cycle": has_cycle,
                "is_external": False,
                "metrics": {
                    "lines": f.get("line_count", 0),
                    "size": f.get("file_size", 0),
                },
            }
            nodes.append({
                "id": f"file_{f_id}",
                "type": "custom",
                "data": node_data,
                "position": {"x": 0.0, "y": 0.0},
            })

        # Add edges between matched files
        edge_set = set()
        for dep in self.dependencies:
            src = dep.get("source_file_id")
            tgt = dep.get("target_file_id")
            if src in matched_ids and tgt in matched_ids and src != tgt:
                edge_key = (src, tgt)
                if edge_key not in edge_set:
                    edge_set.add(edge_key)
                    is_cycle_edge = src in self.cycle_file_ids and tgt in self.cycle_file_ids
                    edges.append({
                        "id": f"e_{src}_{tgt}",
                        "source": f"file_{src}",
                        "target": f"file_{tgt}",
                        "type": "smoothstep",
                        "animated": is_cycle_edge,
                        "label": dep.get("dependency_type", "IMPORTS"),
                        "data": {
                            "import_statement": dep.get("import_statement"),
                            "is_cycle": is_cycle_edge,
                            "line_number": dep.get("line_number"),
                        },
                    })

        compute_clustered_directory_layout(nodes)
        return GraphDataResponse(
            nodes=[GraphNode(**n) for n in nodes],
            edges=[GraphEdge(**e) for e in edges],
            stats={"total_nodes": len(nodes), "total_edges": len(edges)},
        )

    def build_module_architecture_graph(self) -> GraphDataResponse:
        """Aggregates file dependencies into top-level directory/module relationships."""
        modules: Dict[str, Dict[str, Any]] = {}
        for f in self.files:
            rel = f.get("relative_path", "")
            mod_name = rel.split("/")[0] if "/" in rel else "root"
            if mod_name not in modules:
                modules[mod_name] = {
                    "name": mod_name,
                    "file_count": 0,
                    "total_loc": 0,
                    "languages": set(),
                }
            modules[mod_name]["file_count"] += 1
            modules[mod_name]["total_loc"] += f.get("line_count", 0)
            if f.get("language"):
                modules[mod_name]["languages"].add(f.get("language"))

        # Aggregate edges between modules
        module_edges: Dict[tuple, int] = {}
        for dep in self.dependencies:
            src_f = self.file_by_id.get(dep.get("source_file_id"))
            tgt_f = self.file_by_id.get(dep.get("target_file_id"))
            if src_f and tgt_f:
                src_rel = src_f.get("relative_path", "")
                tgt_rel = tgt_f.get("relative_path", "")
                src_mod = src_rel.split("/")[0] if "/" in src_rel else "root"
                tgt_mod = tgt_rel.split("/")[0] if "/" in tgt_rel else "root"
                if src_mod != tgt_mod:
                    key = (src_mod, tgt_mod)
                    module_edges[key] = module_edges.get(key, 0) + 1

        nodes = []
        for mod_name, data in modules.items():
            nodes.append({
                "id": f"mod_{mod_name}",
                "type": "custom",
                "data": {
                    "label": mod_name,
                    "entity_type": "module",
                    "incoming_count": sum(c for (s, t), c in module_edges.items() if t == mod_name),
                    "outgoing_count": sum(c for (s, t), c in module_edges.items() if s == mod_name),
                    "metrics": {
                        "file_count": data["file_count"],
                        "total_loc": data["total_loc"],
                        "languages": list(data["languages"]),
                    },
                },
                "position": {"x": 0.0, "y": 0.0},
            })

        edges = []
        for (src_mod, tgt_mod), count in module_edges.items():
            edges.append({
                "id": f"e_{src_mod}_{tgt_mod}",
                "source": f"mod_{src_mod}",
                "target": f"mod_{tgt_mod}",
                "type": "smoothstep",
                "label": f"{count} imports",
                "data": {"count": count},
            })

        compute_grid_layout(nodes, cols=max(1, min(4, len(nodes))), spacing_x=340, spacing_y=200)
        return GraphDataResponse(
            nodes=[GraphNode(**n) for n in nodes],
            edges=[GraphEdge(**e) for e in edges],
            stats={"total_nodes": len(nodes), "total_edges": len(edges)},
        )

    def build_symbol_explorer_graph(self, max_symbols: int = 300) -> GraphDataResponse:
        """Visualizes classes, interfaces, components, methods, and functions."""
        filtered_symbols = [
            s for s in self.symbols
            if s.get("symbol_type") in ("class", "interface", "component", "function", "method", "enum")
        ][:max_symbols]

        sym_by_id = {s["id"]: s for s in filtered_symbols}
        nodes = []
        for s in filtered_symbols:
            f = self.file_by_id.get(s.get("file_id"), {})
            nodes.append({
                "id": f"sym_{s['id']}",
                "type": "custom",
                "data": {
                    "label": s.get("name", ""),
                    "entity_type": s.get("symbol_type", "function"),
                    "symbol_id": s["id"],
                    "file_id": s.get("file_id"),
                    "relative_path": f.get("relative_path", ""),
                    "language": s.get("language", ""),
                    "complexity": s.get("complexity", 1),
                    "metrics": {
                        "is_exported": s.get("is_exported", False),
                        "visibility": s.get("visibility", "public"),
                        "lines": f"{s.get('start_line')}-{s.get('end_line')}",
                    },
                },
                "position": {"x": 0.0, "y": 0.0},
            })

        edges = []
        for s in filtered_symbols:
            parent_id = s.get("parent_symbol_id")
            if parent_id and parent_id in sym_by_id:
                edges.append({
                    "id": f"e_contains_{parent_id}_{s['id']}",
                    "source": f"sym_{parent_id}",
                    "target": f"sym_{s['id']}",
                    "type": "smoothstep",
                    "label": "CONTAINS",
                })

        compute_grid_layout(nodes, cols=6, spacing_x=300, spacing_y=160)
        return GraphDataResponse(
            nodes=[GraphNode(**n) for n in nodes],
            edges=[GraphEdge(**e) for e in edges],
            stats={"total_nodes": len(nodes), "total_edges": len(edges)},
        )

    def build_external_dependencies_graph(self, max_pkgs: int = 50) -> GraphDataResponse:
        """Visualizes external dependencies and which internal files import them."""
        ext_deps: Dict[str, List[str]] = {}
        for dep in self.dependencies:
            pkg = dep.get("external_package")
            src_f_id = dep.get("source_file_id")
            if pkg and src_f_id:
                ext_deps.setdefault(pkg, []).append(src_f_id)

        # Sort packages by usage frequency
        sorted_pkgs = sorted(ext_deps.items(), key=lambda x: len(x[1]), reverse=True)[:max_pkgs]

        nodes = []
        edges = []
        internal_file_ids_included = set()

        for pkg, file_ids in sorted_pkgs:
            nodes.append({
                "id": f"pkg_{pkg}",
                "type": "custom",
                "data": {
                    "label": pkg,
                    "entity_type": "external_package",
                    "is_external": True,
                    "incoming_count": len(file_ids),
                    "metrics": {"imported_by_count": len(file_ids)},
                },
                "position": {"x": 0.0, "y": 0.0},
            })
            for fid in file_ids[:5]:  # limit sample connections per package
                internal_file_ids_included.add(fid)
                edges.append({
                    "id": f"e_{fid}_{pkg}",
                    "source": f"file_{fid}",
                    "target": f"pkg_{pkg}",
                    "type": "smoothstep",
                    "label": "IMPORTS",
                })

        for fid in internal_file_ids_included:
            f = self.file_by_id.get(fid)
            if f:
                nodes.append({
                    "id": f"file_{fid}",
                    "type": "custom",
                    "data": {
                        "label": f.get("filename", ""),
                        "entity_type": "file",
                        "relative_path": f.get("relative_path", ""),
                        "language": f.get("language", ""),
                    },
                    "position": {"x": 0.0, "y": 0.0},
                })

        compute_grid_layout(nodes, cols=5, spacing_x=320, spacing_y=160)
        return GraphDataResponse(
            nodes=[GraphNode(**n) for n in nodes],
            edges=[GraphEdge(**e) for e in edges],
            stats={"total_nodes": len(nodes), "total_edges": len(edges)},
        )

    # Alias for external dependencies graph
    build_dependency_graph = build_external_dependencies_graph

