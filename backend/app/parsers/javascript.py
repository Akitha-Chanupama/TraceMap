import re
import tree_sitter as ts
import tree_sitter_javascript as tsj
from typing import List, Dict, Any, Optional
from app.parsers.base import BaseParser, ParseResult, ParsedSymbol, ParsedImport, ParsedExport, ParsedCall


class JavaScriptParser(BaseParser):
    def __init__(self, language_inst=None):
        if language_inst is None:
            self.language = ts.Language(tsj.language())
        else:
            self.language = language_inst
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

        self._traverse_node(tree.root_node, code_bytes, result, current_scope=None, is_exported_context=False)
        return result

    def _traverse_node(
        self,
        node: ts.Node,
        source: bytes,
        result: ParseResult,
        current_scope: Optional[str] = None,
        is_exported_context: bool = False,
    ):
        node_type = node.type

        # 1. Imports
        if node_type == "import_statement":
            self._handle_import_statement(node, source, result)
            return

        # 2. Exports
        elif node_type == "export_statement":
            is_default = any(c.type == "default" for c in node.children)
            source_clause = node.child_by_field_name("source")
            reexport_source = self._clean_string(self._get_text(source_clause, source)) if source_clause else None

            # Re-exports: export { a, b } from './module';
            if reexport_source:
                for c in node.children:
                    if c.type == "export_clause":
                        for spec in c.children:
                            if spec.type == "export_specifier":
                                name_node = spec.child_by_field_name("name")
                                if name_node:
                                    s_name = self._get_text(name_node, source)
                                    result.exports.append(
                                        ParsedExport(
                                            symbol_name=s_name,
                                            is_default=is_default,
                                            is_reexport=True,
                                            reexport_source=reexport_source,
                                            line_number=node.start_point[0] + 1,
                                        )
                                    )
                # Also treat re-export as an import dependency
                result.imports.append(
                    ParsedImport(
                        source_module=reexport_source,
                        line_number=node.start_point[0] + 1,
                        raw_statement=self._get_text(node, source),
                    )
                )
                return

            # Traverse children under export statement with is_exported_context=True
            for child in node.children:
                if child.type not in ("export", "default", ";"):
                    self._traverse_node(
                        child,
                        source,
                        result,
                        current_scope=current_scope,
                        is_exported_context=True,
                    )
            return

        # 3. Class Declarations
        elif node_type == "class_declaration":
            class_name = self._get_node_name(node, source)
            if class_name:
                qualified = f"{current_scope}.{class_name}" if current_scope else class_name
                complexity = self._calculate_complexity(node)
                start_p = node.start_point
                end_p = node.end_point

                symbol = ParsedSymbol(
                    name=class_name,
                    qualified_name=qualified,
                    symbol_type="class",
                    start_line=start_p[0] + 1,
                    end_line=end_p[0] + 1,
                    start_column=start_p[1] + 1,
                    end_column=end_p[1] + 1,
                    is_exported=is_exported_context,
                    visibility="public",
                    complexity=complexity,
                    parent_name=current_scope,
                )
                result.symbols.append(symbol)
                if is_exported_context:
                    result.exports.append(
                        ParsedExport(
                            symbol_name=class_name,
                            is_default=False,
                            line_number=start_p[0] + 1,
                        )
                    )

                body = node.child_by_field_name("body")
                if body:
                    for child in body.children:
                        self._traverse_node(child, source, result, current_scope=qualified)
                return

        # 4. Function Declarations
        elif node_type in ("function_declaration", "generator_function_declaration"):
            func_name = self._get_node_name(node, source)
            if func_name:
                qualified = f"{current_scope}.{func_name}" if current_scope else func_name
                is_component = self._is_component_name(func_name)
                is_method = current_scope is not None
                sym_type = "component" if is_component else ("method" if is_method else "function")
                complexity = self._calculate_complexity(node)
                start_p = node.start_point
                end_p = node.end_point

                symbol = ParsedSymbol(
                    name=func_name,
                    qualified_name=qualified,
                    symbol_type=sym_type,
                    start_line=start_p[0] + 1,
                    end_line=end_p[0] + 1,
                    start_column=start_p[1] + 1,
                    end_column=end_p[1] + 1,
                    is_exported=is_exported_context,
                    visibility="public",
                    complexity=complexity,
                    parent_name=current_scope,
                )
                result.symbols.append(symbol)
                if is_exported_context:
                    result.exports.append(
                        ParsedExport(
                            symbol_name=func_name,
                            is_default=False,
                            line_number=start_p[0] + 1,
                        )
                    )

                body = node.child_by_field_name("body")
                if body:
                    for child in body.children:
                        self._traverse_node(child, source, result, current_scope=qualified)
                return

        # 5. Method definitions inside classes
        elif node_type == "method_definition":
            method_name = self._get_node_name(node, source)
            if method_name:
                qualified = f"{current_scope}.{method_name}" if current_scope else method_name
                complexity = self._calculate_complexity(node)
                start_p = node.start_point
                end_p = node.end_point

                symbol = ParsedSymbol(
                    name=method_name,
                    qualified_name=qualified,
                    symbol_type="method",
                    start_line=start_p[0] + 1,
                    end_line=end_p[0] + 1,
                    start_column=start_p[1] + 1,
                    end_column=end_p[1] + 1,
                    is_exported=False,
                    visibility="private" if method_name.startswith("#") or method_name.startswith("_") else "public",
                    complexity=complexity,
                    parent_name=current_scope,
                )
                result.symbols.append(symbol)

                body = node.child_by_field_name("body")
                if body:
                    for child in body.children:
                        self._traverse_node(child, source, result, current_scope=qualified)
                return

        # 6. Lexical / Variable Declarations (Arrow functions, Components, Constants, CommonJS require)
        elif node_type in ("lexical_declaration", "variable_declaration"):
            for child in node.children:
                if child.type == "variable_declarator":
                    name_node = child.child_by_field_name("name")
                    value_node = child.child_by_field_name("value")
                    if name_node and value_node:
                        var_name = self._get_text(name_node, source)
                        
                        # Check for CommonJS require: const x = require('./x')
                        if value_node.type == "call_expression":
                            fn_child = value_node.child_by_field_name("function")
                            if fn_child and self._get_text(fn_child, source) == "require":
                                args = value_node.child_by_field_name("arguments")
                                if args and args.named_children:
                                    req_path = self._clean_string(self._get_text(args.named_children[0], source))
                                    result.imports.append(
                                        ParsedImport(
                                            source_module=req_path,
                                            imported_symbols=[var_name],
                                            line_number=node.start_point[0] + 1,
                                            raw_statement=self._get_text(node, source),
                                        )
                                    )

                        # Check for Arrow function or function expression
                        if value_node.type in ("arrow_function", "function"):
                            is_component = self._is_component_name(var_name)
                            qualified = f"{current_scope}.{var_name}" if current_scope else var_name
                            complexity = self._calculate_complexity(value_node)
                            start_p = node.start_point
                            end_p = node.end_point

                            symbol = ParsedSymbol(
                                name=var_name,
                                qualified_name=qualified,
                                symbol_type="component" if is_component else "function",
                                start_line=start_p[0] + 1,
                                end_line=end_p[0] + 1,
                                start_column=start_p[1] + 1,
                                end_column=end_p[1] + 1,
                                is_exported=is_exported_context,
                                visibility="public",
                                complexity=complexity,
                                parent_name=current_scope,
                            )
                            result.symbols.append(symbol)
                            if is_exported_context:
                                result.exports.append(
                                    ParsedExport(
                                        symbol_name=var_name,
                                        is_default=False,
                                        line_number=start_p[0] + 1,
                                    )
                                )

                            body = value_node.child_by_field_name("body")
                            if body:
                                for b_child in body.children:
                                    self._traverse_node(b_child, source, result, current_scope=qualified)
                            continue

        # 7. Function Calls
        elif node_type == "call_expression":
            fn_node = node.child_by_field_name("function")
            if fn_node:
                callee = self._get_text(fn_node, source)
                # Ignore require here since handled above
                if callee != "require":
                    result.calls.append(
                        ParsedCall(
                            callee_name=callee,
                            caller_name=current_scope,
                            line_number=node.start_point[0] + 1,
                        )
                    )

        # Recurse for general children
        for child in node.children:
            self._traverse_node(
                child,
                source,
                result,
                current_scope=current_scope,
                is_exported_context=is_exported_context,
            )

    def _handle_import_statement(self, node: ts.Node, source: bytes, result: ParseResult):
        raw = self._get_text(node, source)
        line = node.start_point[0] + 1
        source_module = ""
        imported_names: List[str] = []
        alias_map: Dict[str, str] = {}
        is_type_only = False

        # Find 'from' or source child
        for child in node.children:
            if child.type == "string":
                source_module = self._clean_string(self._get_text(child, source))
            elif child.type == "import_clause":
                # Check for 'type' keyword e.g. import type { ... }
                clause_text = self._get_text(child, source)
                if clause_text.strip().startswith("type "):
                    is_type_only = True

                for sub in child.children:
                    if sub.type == "identifier":
                        # Default import: import React from 'react'
                        imported_names.append(self._get_text(sub, source))
                    elif sub.type == "named_imports":
                        for spec in sub.children:
                            if spec.type == "import_specifier":
                                name_node = spec.child_by_field_name("name")
                                alias_node = spec.child_by_field_name("alias")
                                if name_node:
                                    orig = self._get_text(name_node, source)
                                    alias = self._get_text(alias_node, source) if alias_node else orig
                                    imported_names.append(orig)
                                    if alias != orig:
                                        alias_map[orig] = alias
                    elif sub.type == "namespace_import":
                        # import * as Foo from './foo'
                        for star_child in sub.children:
                            if star_child.type == "identifier":
                                star_name = self._get_text(star_child, source)
                                imported_names.append("*")
                                alias_map["*"] = star_name

        if source_module:
            result.imports.append(
                ParsedImport(
                    source_module=source_module,
                    imported_symbols=imported_names,
                    alias_map=alias_map,
                    is_type_only=is_type_only,
                    line_number=line,
                    raw_statement=raw,
                )
            )

    def _clean_string(self, text: str) -> str:
        return text.strip("'\"`")

    def _get_node_name(self, node: ts.Node, source: bytes) -> Optional[str]:
        name_node = node.child_by_field_name("name")
        if name_node:
            return self._get_text(name_node, source)
        return None

    def _get_text(self, node: ts.Node, source: bytes) -> str:
        return source[node.start_byte:node.end_byte].decode("utf-8", errors="ignore")

    def _is_component_name(self, name: str) -> bool:
        """PascalCase identifiers typically represent React components in JSX/TSX."""
        return bool(re.match(r"^[A-Z][a-zA-Z0-9]+$", name))

    def _calculate_complexity(self, node: ts.Node) -> int:
        branch_types = {
            "if_statement",
            "for_statement",
            "for_in_statement",
            "while_statement",
            "do_statement",
            "catch_clause",
            "ternary_expression",
            "switch_case",
        }
        count = 1
        stack = [node]
        while stack:
            curr = stack.pop()
            if curr.type in branch_types:
                count += 1
            elif curr.type == "binary_expression":
                op = curr.child_by_field_name("operator")
                if op and op.type in ("&&", "||", "??"):
                    count += 1
            stack.extend(curr.children)
        return count

