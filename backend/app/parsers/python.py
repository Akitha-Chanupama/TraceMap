import tree_sitter as ts
import tree_sitter_python as tsp
from typing import List, Dict, Any, Optional
from app.parsers.base import BaseParser, ParseResult, ParsedSymbol, ParsedImport, ParsedExport, ParsedCall


class PythonParser(BaseParser):
    def __init__(self):
        self.language = ts.Language(tsp.language())
        self.parser = ts.Parser(self.language)

    def parse(self, code_bytes: bytes, file_path: str = "") -> ParseResult:
        result = ParseResult()
        try:
            tree = self.parser.parse(code_bytes)
        except Exception as e:
            result.syntax_errors.append(str(e))
            return result

        if tree.root_node.has_error:
            result.syntax_errors.append("AST contains syntax errors")

        self._traverse_node(tree.root_node, code_bytes, result, current_scope=None)
        return result

    def _traverse_node(
        self,
        node: ts.Node,
        source: bytes,
        result: ParseResult,
        current_scope: Optional[str] = None,
    ):
        node_type = node.type

        # 1. Imports
        if node_type == "import_statement":
            self._handle_import_statement(node, source, result)
        elif node_type == "import_from_statement":
            self._handle_import_from_statement(node, source, result)

        # 2. Classes
        elif node_type == "class_definition":
            class_name = self._get_node_name(node, source)
            if class_name:
                qualified = f"{current_scope}.{class_name}" if current_scope else class_name
                complexity = self._calculate_complexity(node)
                start_point = node.start_point
                end_point = node.end_point
                
                symbol = ParsedSymbol(
                    name=class_name,
                    qualified_name=qualified,
                    symbol_type="class",
                    start_line=start_point[0] + 1,
                    end_line=end_point[0] + 1,
                    start_column=start_point[1] + 1,
                    end_column=end_point[1] + 1,
                    is_exported=not class_name.startswith("_"),
                    visibility="private" if class_name.startswith("_") else "public",
                    complexity=complexity,
                    parent_name=current_scope,
                )
                result.symbols.append(symbol)
                
                # Default export status for top-level non-private classes
                if not current_scope and not class_name.startswith("_"):
                    result.exports.append(
                        ParsedExport(
                            symbol_name=class_name,
                            is_default=False,
                            line_number=start_point[0] + 1,
                        )
                    )

                # Traverse children inside class body
                body = node.child_by_field_name("body")
                if body:
                    for child in body.children:
                        self._traverse_node(child, source, result, current_scope=qualified)
                return

        # 3. Functions / Methods
        elif node_type in ("function_definition", "async_function_definition"):
            func_name = self._get_node_name(node, source)
            if func_name:
                qualified = f"{current_scope}.{func_name}" if current_scope else func_name
                is_method = current_scope is not None
                complexity = self._calculate_complexity(node)
                start_point = node.start_point
                end_point = node.end_point

                symbol = ParsedSymbol(
                    name=func_name,
                    qualified_name=qualified,
                    symbol_type="method" if is_method else "function",
                    start_line=start_point[0] + 1,
                    end_line=end_point[0] + 1,
                    start_column=start_point[1] + 1,
                    end_column=end_point[1] + 1,
                    is_exported=not func_name.startswith("_") and not is_method,
                    visibility="private" if func_name.startswith("_") else "public",
                    complexity=complexity,
                    parent_name=current_scope,
                )
                result.symbols.append(symbol)

                if not current_scope and not func_name.startswith("_"):
                    result.exports.append(
                        ParsedExport(
                            symbol_name=func_name,
                            is_default=False,
                            line_number=start_point[0] + 1,
                        )
                    )

                # Traverse inside function body to find calls
                body = node.child_by_field_name("body")
                if body:
                    for child in body.children:
                        self._traverse_node(child, source, result, current_scope=qualified)
                return

        # 4. Calls
        elif node_type == "call":
            func_node = node.child_by_field_name("function")
            if func_node:
                callee_name = self._get_text(func_node, source)
                result.calls.append(
                    ParsedCall(
                        callee_name=callee_name,
                        caller_name=current_scope,
                        line_number=node.start_point[0] + 1,
                    )
                )

        # Recurse for general nodes
        for child in node.children:
            self._traverse_node(child, source, result, current_scope=current_scope)

    def _handle_import_statement(self, node: ts.Node, source: bytes, result: ParseResult):
        raw = self._get_text(node, source)
        line = node.start_point[0] + 1
        for child in node.children:
            if child.type == "dotted_name":
                mod_name = self._get_text(child, source)
                result.imports.append(
                    ParsedImport(
                        source_module=mod_name,
                        imported_symbols=[mod_name],
                        line_number=line,
                        raw_statement=raw,
                    )
                )
            elif child.type == "aliased_import":
                name_node = child.child_by_field_name("name")
                alias_node = child.child_by_field_name("alias")
                if name_node:
                    mod_name = self._get_text(name_node, source)
                    alias = self._get_text(alias_node, source) if alias_node else mod_name
                    result.imports.append(
                        ParsedImport(
                            source_module=mod_name,
                            imported_symbols=[mod_name],
                            alias_map={mod_name: alias},
                            line_number=line,
                            raw_statement=raw,
                        )
                    )

    def _handle_import_from_statement(self, node: ts.Node, source: bytes, result: ParseResult):
        raw = self._get_text(node, source)
        line = node.start_point[0] + 1
        module_name = ""
        imported_names: List[str] = []
        alias_map: Dict[str, str] = {}

        module_node = node.child_by_field_name("module_name")
        if module_node:
            module_name = self._get_text(module_node, source)
        else:
            # Check for relative_import child
            for c in node.children:
                if c.type in ("relative_import", "dotted_name"):
                    module_name = self._get_text(c, source)
                    break

        for c in node.children:
            if c.type == "dotted_name" and c != module_node:
                name = self._get_text(c, source)
                imported_names.append(name)
            elif c.type == "aliased_import":
                name_node = c.child_by_field_name("name")
                alias_node = c.child_by_field_name("alias")
                if name_node:
                    n = self._get_text(name_node, source)
                    a = self._get_text(alias_node, source) if alias_node else n
                    imported_names.append(n)
                    alias_map[n] = a

        if module_name:
            result.imports.append(
                ParsedImport(
                    source_module=module_name,
                    imported_symbols=imported_names,
                    alias_map=alias_map,
                    line_number=line,
                    raw_statement=raw,
                )
            )

    def _get_node_name(self, node: ts.Node, source: bytes) -> Optional[str]:
        name_node = node.child_by_field_name("name")
        if name_node:
            return self._get_text(name_node, source)
        return None

    def _get_text(self, node: ts.Node, source: bytes) -> str:
        return source[node.start_byte:node.end_byte].decode("utf-8", errors="ignore")

    def _calculate_complexity(self, node: ts.Node) -> int:
        """Calculates McCabe cyclomatic complexity: 1 + number of branching decision points."""
        branch_types = {
            "if_statement",
            "elif_clause",
            "for_statement",
            "while_statement",
            "except_clause",
            "conditional_expression",
            "boolean_operator",
            "match_statement",
            "case_clause",
        }
        count = 1
        stack = [node]
        while stack:
            curr = stack.pop()
            if curr.type in branch_types:
                count += 1
            stack.extend(curr.children)
        return count

