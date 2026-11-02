import re
import tree_sitter as ts
import tree_sitter_dart as tsd
from typing import List, Dict, Any, Optional
from app.parsers.base import BaseParser, ParseResult, ParsedSymbol, ParsedImport, ParsedExport, ParsedCall


class DartParser(BaseParser):
    def __init__(self):
        self.language = ts.Language(tsd.language())
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

        # 1. Imports and Exports
        if node_type == "import_or_export":
            raw = self._get_text(node, source)
            line = node.start_point[0] + 1
            is_export = raw.strip().startswith("export")
            
            # Find uri string
            uri = ""
            imported_names: List[str] = []
            for child in node.children:
                uri_node = self._find_first_descendant_of_type(child, ["configurable_uri", "uri", "string_literal"])
                if uri_node:
                    uri = self._clean_string(self._get_text(uri_node, source))

                # Check show / hide combinators
                comb = self._find_first_descendant_of_type(child, ["combinator"])
                if comb:
                    comb_text = self._get_text(comb, source)
                    if comb_text.startswith("show"):
                        # e.g. show Foo, Bar
                        names = [n.strip() for n in comb_text.replace("show", "").split(",") if n.strip()]
                        imported_names.extend(names)

            if uri:
                if is_export:
                    result.exports.append(
                        ParsedExport(
                            symbol_name=uri,
                            is_default=False,
                            is_reexport=True,
                            reexport_source=uri,
                            line_number=line,
                        )
                    )
                # Register dependency
                result.imports.append(
                    ParsedImport(
                        source_module=uri,
                        imported_symbols=imported_names,
                        line_number=line,
                        raw_statement=raw,
                    )
                )
            return

        # 2. Classes, Mixins, Extensions, Enums
        elif node_type in ("class_definition", "mixin_declaration", "extension_declaration", "enum_declaration"):
            name = ""
            for child in node.children:
                if child.type == "identifier":
                    name = self._get_text(child, source)
                    break
            
            if name:
                qualified = f"{current_scope}.{name}" if current_scope else name
                sym_type = "class"
                if "enum" in node_type:
                    sym_type = "enum"
                elif "mixin" in node_type:
                    sym_type = "interface"

                complexity = self._calculate_complexity(node)
                start_p = node.start_point
                end_p = node.end_point

                result.symbols.append(
                    ParsedSymbol(
                        name=name,
                        qualified_name=qualified,
                        symbol_type=sym_type,
                        start_line=start_p[0] + 1,
                        end_line=end_p[0] + 1,
                        start_column=start_p[1] + 1,
                        end_column=end_p[1] + 1,
                        is_exported=not name.startswith("_"),
                        visibility="private" if name.startswith("_") else "public",
                        complexity=complexity,
                        parent_name=current_scope,
                    )
                )

                if not current_scope and not name.startswith("_"):
                    result.exports.append(
                        ParsedExport(
                            symbol_name=name,
                            is_default=False,
                            line_number=start_p[0] + 1,
                        )
                    )

                # Process methods inside class_body
                body = self._find_first_descendant_of_type(node, ["class_body", "declaration_body"])
                if body:
                    for child in body.children:
                        self._traverse_node(child, source, result, current_scope=qualified)
                return

        # 3. Method and Function signatures
        elif node_type in ("method_signature", "function_signature"):
            name = ""
            for child in node.children:
                if child.type == "identifier":
                    name = self._get_text(child, source)
                    break

            if name:
                qualified = f"{current_scope}.{name}" if current_scope else name
                is_method = current_scope is not None
                complexity = self._calculate_complexity(node)
                start_p = node.start_point
                end_p = node.end_point

                result.symbols.append(
                    ParsedSymbol(
                        name=name,
                        qualified_name=qualified,
                        symbol_type="method" if is_method else "function",
                        start_line=start_p[0] + 1,
                        end_line=end_p[0] + 1,
                        start_column=start_p[1] + 1,
                        end_column=end_p[1] + 1,
                        is_exported=not name.startswith("_") and not is_method,
                        visibility="private" if name.startswith("_") else "public",
                        complexity=complexity,
                        parent_name=current_scope,
                    )
                )

                if not is_method and not name.startswith("_"):
                    result.exports.append(
                        ParsedExport(
                            symbol_name=name,
                            is_default=False,
                            line_number=start_p[0] + 1,
                        )
                    )
            return

        # 4. Method Calls
        elif node_type in ("method_invocation", "function_expression_invocation"):
            for child in node.children:
                if child.type == "identifier":
                    callee = self._get_text(child, source)
                    result.calls.append(
                        ParsedCall(
                            callee_name=callee,
                            caller_name=current_scope,
                            line_number=node.start_point[0] + 1,
                        )
                    )
                    break

        for child in node.children:
            self._traverse_node(child, source, result, current_scope=current_scope)

    def _find_first_descendant_of_type(self, node: ts.Node, types: List[str]) -> Optional[ts.Node]:
        if node.type in types:
            return node
        for child in node.children:
            res = self._find_first_descendant_of_type(child, types)
            if res:
                return res
        return None

    def _clean_string(self, text: str) -> str:
        return text.strip("'\"`")

    def _get_text(self, node: ts.Node, source: bytes) -> str:
        return source[node.start_byte:node.end_byte].decode("utf-8", errors="ignore")

    def _calculate_complexity(self, node: ts.Node) -> int:
        branch_types = {
            "if_statement",
            "for_statement",
            "while_statement",
            "do_statement",
            "catch_clause",
            "conditional_expression",
            "switch_statement",
        }
        count = 1
        stack = [node]
        while stack:
            curr = stack.pop()
            if curr.type in branch_types:
                count += 1
            stack.extend(curr.children)
        return count

