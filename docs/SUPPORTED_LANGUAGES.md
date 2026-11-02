# Supported Languages & Grammar Specifications

TraceMap provides first-class, verified support for the following languages via concrete Tree-sitter AST parsers:

| Language | Extensions | Supported AST Constructs | Tree-sitter Grammar |
| :--- | :--- | :--- | :--- |
| **JavaScript** | `.js`, `.mjs`, `.cjs` | ESM imports/exports, CommonJS `require`, function declarations, arrow functions, classes, methods, calls, McCabe complexity | `tree-sitter-javascript` |
| **JSX** | `.jsx` | React functional components (PascalCase), JSX expressions, hooks, props | `tree-sitter-javascript` |
| **TypeScript** | `.ts`, `.mts`, `.cts` | Interfaces, type aliases, enums, type-only imports, namespaces | `tree-sitter-typescript` |
| **TSX** | `.tsx` | TypeScript React components, typed props, interfaces | `tree-sitter-typescript (tsx)` |
| **Python** | `.py` | Classes, functions, async functions, methods, `from . import`, `import as`, `__all__`, cyclomatic complexity | `tree-sitter-python` |
| **Dart** | `.dart` | Classes, mixins, extensions, enums, `package:` imports, relative imports, `show`/`hide` combinators | `tree-sitter-dart` |

---

## Extensible Parser Adapter Architecture

All language parsers implement the abstract `BaseParser` interface defined in `app.parsers.base`:

```python
class BaseParser(ABC):
    @abstractmethod
    def parse(self, code_bytes: bytes, file_path: str = "") -> ParseResult:
        pass
```

Future languages (such as Go, Rust, C#, Java, and C++) can be added by registering a new parser class with `ParserRegistry.get_parser_for_language(...)`.

