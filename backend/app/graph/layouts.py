import math
from typing import List, Dict, Any


def compute_grid_layout(nodes: List[Dict[str, Any]], cols: int = 5, spacing_x: int = 320, spacing_y: int = 160) -> List[Dict[str, Any]]:
    """Simple clean grid layout fallback for node positions."""
    for i, node in enumerate(nodes):
        row = i // cols
        col = i % cols
        node["position"] = {
            "x": float(col * spacing_x),
            "y": float(row * spacing_y),
        }
    return nodes


def compute_radial_layout(nodes: List[Dict[str, Any]], center_x: float = 600.0, center_y: float = 400.0, radius_step: float = 250.0) -> List[Dict[str, Any]]:
    """Distributes nodes in concentric circles."""
    if not nodes:
        return nodes

    nodes[0]["position"] = {"x": center_x, "y": center_y}
    remaining = nodes[1:]
    if not remaining:
        return nodes

    layer = 1
    idx = 0
    while idx < len(remaining):
        count_in_layer = min(len(remaining) - idx, layer * 8)
        radius = layer * radius_step
        for i in range(count_in_layer):
            angle = (2 * math.pi * i) / count_in_layer
            remaining[idx + i]["position"] = {
                "x": round(center_x + radius * math.cos(angle), 1),
                "y": round(center_y + radius * math.sin(angle), 1),
            }
        idx += count_in_layer
        layer += 1
    return nodes


def compute_clustered_directory_layout(nodes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Clusters nodes by directory folder."""
    clusters: Dict[str, List[Dict[str, Any]]] = {}
    for node in nodes:
        dir_name = node.get("data", {}).get("relative_path", "")
        if "/" in dir_name:
            folder = dir_name.rsplit("/", 1)[0]
        else:
            folder = "root"
        clusters.setdefault(folder, []).append(node)

    curr_x = 0.0
    for folder, cluster_nodes in clusters.items():
        compute_grid_layout(cluster_nodes, cols=max(1, min(4, len(cluster_nodes))), spacing_x=280, spacing_y=140)
        # Offset cluster
        for n in cluster_nodes:
            n["position"]["x"] += curr_x
        max_x = max((n["position"]["x"] for n in cluster_nodes), default=0.0)
        curr_x = max_x + 360.0
    return nodes
