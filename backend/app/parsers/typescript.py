import tree_sitter as ts
import tree_sitter_typescript as tst
from typing import Optional
from app.parsers.javascript import JavaScriptParser
from app.parsers.base import ParseResult, ParsedSymbol, ParsedExport


class TypeScriptParser(JavaScriptParser):
    def __init__(self, is_tsx: bool = False):
        if is_tsx:
            lang = ts.Language(tst.language_tsx())
        else:
            lang = ts.Language(tst.language_typescript())
        super().__init__(language_inst=lang)

    def _traverse_node(
        self,
        node: ts.Node,
        source: bytes,
        result: ParseResult,
        current_scope: Optional[str] = None,
        is_exported_context: bool = False,
    ):
        node_type = node.type

        # 1. Interfaces
        if node_type == "interface_declaration":
            name = self._get_node_name(node, source)
            if name:
                qualified = f"{current_scope}.{name}" if current_scope else name
                start_p = node.start_point
                end_p = node.end_point

                result.symbols.append(
                    ParsedSymbol(
                        name=name,
                        qualified_name=qualified,
                        symbol_type="interface",
                        start_line=start_p[0] + 1,
                        end_line=end_p[0] + 1,
                        start_column=start_p[1] + 1,
                        end_column=end_p[1] + 1,
                        is_exported=is_exported_context,
                        visibility="public",
                        complexity=1,
                        parent_name=current_scope,
                    )
                )
                if is_exported_context:
                    result.exports.append(
                        ParsedExport(
                            symbol_name=name,
                            is_default=False,
                            line_number=start_p[0] + 1,
                        )
                    )
            return

        # 2. Type Aliases
        elif node_type == "type_alias_declaration":
            name = self._get_node_name(node, source)
            if name:
                qualified = f"{current_scope}.{name}" if current_scope else name
                start_p = node.start_point
                end_p = node.end_point

                result.symbols.append(
                    ParsedSymbol(
                        name=name,
                        qualified_name=qualified,
                        symbol_type="type_alias",
                        start_line=start_p[0] + 1,
                        end_line=end_p[0] + 1,
                        start_column=start_p[1] + 1,
                        end_column=end_p[1] + 1,
                        is_exported=is_exported_context,
                        visibility="public",
                        complexity=1,
                        parent_name=current_scope,
                    )
                )
                if is_exported_context:
                    result.exports.append(
                        ParsedExport(
                            symbol_name=name,
                            is_default=False,
                            line_number=start_p[0] + 1,
                        )
                    )
            return

        # 3. Enums
        elif node_type == "enum_declaration":
            name = self._get_node_name(node, source)
            if name:
                qualified = f"{current_scope}.{name}" if current_scope else name
                start_p = node.start_point
                end_p = node.end_point

                result.symbols.append(
                    ParsedSymbol(
                        name=name,
                        qualified_name=qualified,
                        symbol_type="enum",
                        start_line=start_p[0] + 1,
                        end_line=end_p[0] + 1,
                        start_column=start_p[1] + 1,
                        end_column=end_p[1] + 1,
                        is_exported=is_exported_context,
                        visibility="public",
                        complexity=1,
                        parent_name=current_scope,
                    )
                )
                if is_exported_context:
                    result.exports.append(
                        ParsedExport(
                            symbol_name=name,
                            is_default=False,
                            line_number=start_p[0] + 1,
                        )
                    )
            return

        # Fallback to JavaScript handler for common constructs
        super()._traverse_node(
            node,
            source,
            result,
            current_scope=current_scope,
            is_exported_context=is_exported_context,
        )
