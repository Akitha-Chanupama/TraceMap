# TraceMap Architecture Documentation

## 1. Modular Monolith Overview

TraceMap is architected as a modular local application with clean boundaries separating AST parsing, graph algorithms, and React Flow visualization:

```
Browser UI (React 18 + Vite + Tailwind CSS)
   │
   │  REST API (JSON over HTTP) & Real-time WebSockets
   ▼
FastAPI Application (127.0.0.1)
   ├── Core Services
   │   ├── Project Scanner: Recursive filesystem enumeration with gitignore & size guards
   │   ├── Language & Framework Detector: Config-based inference with evidence
   │   └── SHA-256 Hasher: Block-based incremental fingerprinting
   │
   ├── Multi-Language AST Parsers (Tree-sitter)
   │   ├── Python Parser: Classes, functions, methods, calls, complexity
   │   ├── JavaScript & JSX Parser: ESM, CJS require, arrow components, re-exports
   │   ├── TypeScript & TSX Parser: Interfaces, type aliases, enums, type imports
   │   └── Dart Parser: Classes, mixins, extensions, show/hide imports
   │
   ├── Analyzers
   │   ├── Reference Resolver: Path alias handling, index/barrel resolution, external classification
   │   ├── Circular Dependency Engine: Tarjan's SCC & NetworkX simple_cycles
   │   ├── Impact Analyzer: Reverse graph BFS blast radius traversal
   │   └── Complexity Calculator: Fan-in, Fan-out, LOC, cyclomatic indicators
   │
   ├── Graph Engine
   │   ├── Graph Builder: Nodes & edges construction across 5 graph modes
   │   └── Layout Engine: ELK.js hierarchical & radial distribution
   │
   └── Local Persistence
       └── SQLite Database (Foreign keys enabled, WAL mode)
```

## 2. Evidence-Based Principle

TraceMap adheres strictly to evidence-based analysis:
- No hardcoded demo graphs.
- Every node corresponds to a scanned source file or symbol with exact AST line and column ranges.
- Every edge represents an extracted import, export, or call expression with raw source statement verification.

## 3. Data Storage & Local Isolation

- All project indexes, symbols, and dependencies are stored in `tracemap.db` in the repository root.
- No network communication occurs outside `127.0.0.1`.
- Project deletion from TraceMap strictly removes database records and never deletes user code.
