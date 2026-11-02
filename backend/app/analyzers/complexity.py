from typing import List, Dict, Any
from app.schemas.analysis import ComplexityReportResponse, ComplexityItem


class ComplexityAnalyzer:
    def __init__(
        self,
        files: List[Dict[str, Any]],
        symbols_by_file: Dict[str, List[Dict[str, Any]]],
        dependencies: List[Dict[str, Any]],
    ):
        self.files = files
        self.symbols_by_file = symbols_by_file
        self.dependencies = dependencies

    def calculate_metrics(self) -> ComplexityReportResponse:
        # Calculate fan-in and fan-out per file_id
        fan_in_map: Dict[str, int] = {f["id"]: 0 for f in self.files}
        fan_out_map: Dict[str, int] = {f["id"]: 0 for f in self.files}

        for dep in self.dependencies:
            src_id = dep.get("source_file_id")
            tgt_id = dep.get("target_file_id")
            if src_id in fan_out_map:
                fan_out_map[src_id] += 1
            if tgt_id in fan_in_map:
                fan_in_map[tgt_id] += 1

        total_loc = 0
        total_complexity = 0
        total_functions_count = 0
        items: List[ComplexityItem] = []

        for f in self.files:
            f_id = f["id"]
            loc = f.get("line_count", 0)
            total_loc += loc

            file_symbols = self.symbols_by_file.get(f_id, [])
            functions = [s for s in file_symbols if s.get("symbol_type") in ("function", "method", "component")]
            classes = [s for s in file_symbols if s.get("symbol_type") == "class"]

            fn_count = len(functions)
            cls_count = len(classes)
            total_functions_count += fn_count

            # Cyclomatic complexity is sum of function complexities or 1 if empty
            cyclo = sum(s.get("complexity", 1) for s in functions) if functions else 1
            total_complexity += cyclo

            fan_in = fan_in_map.get(f_id, 0)
            fan_out = fan_out_map.get(f_id, 0)

            warnings: List[str] = []
            if loc > 500:
                warnings.append(f"Large source file ({loc} lines)")
            if cyclo > 20:
                warnings.append(f"High cumulative complexity ({cyclo})")
            if fan_out > 15:
                warnings.append(f"High coupling (imports {fan_out} files)")
            if fan_in > 20 and cyclo > 15:
                warnings.append(f"Potential core bottleneck (high fan-in and high complexity)")

            items.append(
                ComplexityItem(
                    file_id=f_id,
                    relative_path=f.get("relative_path", ""),
                    language=f.get("language", ""),
                    lines_of_code=loc,
                    function_count=fn_count,
                    class_count=cls_count,
                    cyclomatic_complexity=cyclo,
                    fan_in=fan_in,
                    fan_out=fan_out,
                    warnings=warnings,
                )
            )

        # Sort items by complexity descending
        items.sort(key=lambda x: x.cyclomatic_complexity, reverse=True)
        high_complexity = [i for i in items if i.cyclomatic_complexity >= 10 or len(i.warnings) > 0]
        avg_complexity = round(total_complexity / max(1, len(self.files)), 2)

        return ComplexityReportResponse(
            total_lines_of_code=total_loc,
            average_complexity=avg_complexity,
            high_complexity_files=high_complexity[:20],
            metrics_by_file=items,
        )

