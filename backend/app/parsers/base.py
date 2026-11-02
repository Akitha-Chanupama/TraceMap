from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field


@dataclass
class ParsedSymbol:
    name: str
    qualified_name: str
    symbol_type: str  # class, function, method, interface, enum, type_alias, variable, component
    start_line: int
    end_line: int
    start_column: int
    end_column: int
    is_exported: bool = False
    visibility: str = "public"
    complexity: int = 1
    parent_name: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ParsedImport:
    source_module: str  # The specifier being imported, e.g. './utils', 'react', 'app.services'
    imported_symbols: List[str] = field(default_factory=list)  # Specific imported symbols, e.g. ['useState']
    alias_map: Dict[str, str] = field(default_factory=dict)  # Symbol -> Local Alias
    is_type_only: bool = False
    line_number: int = 1
    raw_statement: str = ""


@dataclass
class ParsedExport:
    symbol_name: str
    is_default: bool = False
    is_reexport: bool = False
    reexport_source: Optional[str] = None  # If re-exporting from another module
    line_number: int = 1


@dataclass
class ParsedCall:
    callee_name: str
    caller_name: Optional[str] = None
    line_number: int = 1


@dataclass
class ParseResult:
    symbols: List[ParsedSymbol] = field(default_factory=list)
    imports: List[ParsedImport] = field(default_factory=list)
    exports: List[ParsedExport] = field(default_factory=list)
    calls: List[ParsedCall] = field(default_factory=list)
    syntax_errors: List[str] = field(default_factory=list)


class BaseParser(ABC):
    @abstractmethod
    def parse(self, code_bytes: bytes, file_path: str = "") -> ParseResult:
        """Parses source code bytes into AST and extracts semantic entities."""
        pass

