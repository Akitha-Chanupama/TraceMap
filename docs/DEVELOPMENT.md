# TraceMap Development Checklist

## Milestone 1: Foundation
- [x] Repository initialization (`.gitignore`, `.editorconfig`, `.env.example`, `LICENSE`, `README.md`)
- [x] Backend scaffolding (FastAPI, SQLite, models, database, health endpoint)
- [x] Frontend scaffolding (Vite, React, TypeScript, Tailwind CSS, layout shell)
- [x] Project registration API & UI (open local directory, validate path, register project)

## Milestone 2: Source-Code Analysis
- [x] File scanner & language detector (JS/TS/TSX/JSX, Python, Dart, config files)
- [x] SHA-256 file hashing & exclusion rules
- [x] Tree-sitter parser infrastructure & grammar bindings
- [x] AST parsing & symbol extraction (classes, functions, methods, interfaces, types)
- [x] Import and export extraction

## Milestone 3: Dependency Engine
- [x] Relative & absolute import resolution
- [x] Path alias handling (`tsconfig.json`, `package.json`)
- [x] Internal vs external vs unresolved classification
- [x] Graph builder (file-level and module-level dependencies)
- [x] Persistence of dependencies and symbols in SQLite

## Milestone 4: Architecture Visualization
- [x] React Flow canvas with custom dark-themed nodes & edges
- [x] ELK.js layout integration (hierarchical TB/LR, force-directed, radial, clustered)
- [x] 5 Graph Modes (File Dependency, Module Architecture, Symbol Explorer, Dependencies, Impact)
- [x] Graph navigation, filtering, search, and selection controls
- [x] Contextual node/edge inspector

## Milestone 5: Advanced Analysis
- [x] Circular dependency detection (NetworkX SCC / simple cycles)
- [x] Impact analysis (reverse dependency traversal)
- [x] Complexity metrics (LOC, fan-in, fan-out, cyclomatic indicators)
- [x] Potentially unused symbol & dead code detection heuristics

## Milestone 6: Developer Experience
- [x] Read-only Monaco source code viewer with symbol jump-to-definition
- [x] Hierarchical file explorer tree
- [x] Global search (files, symbols, modules)
- [x] Architecture export (SVG, PNG, JSON, Markdown report)
- [x] Dashboard & recent projects management

## Milestone 7: Incremental Indexing
- [x] Watchdog filesystem watcher service
- [x] Incremental change detection (created, modified, deleted)
- [x] Selective reparsing & affected graph invalidation
- [x] WebSocket real-time progress & status event streaming

## Milestone 8: Quality & Delivery
- [x] Unit & integration tests for parsers, resolvers, graph algorithms, APIs, and UI stores (21/21 backend pytest tests, 8/8 frontend vitest tests passing)
- [x] Test fixtures with realistic code repositories (including deliberate circular dependencies in `fixtures/sample_repo`)
- [x] Windows PowerShell scripts (`setup.ps1`, `start.ps1`, `stop.ps1`) & Unix shell scripts
- [x] Complete documentation (`ARCHITECTURE.md`, `SUPPORTED_LANGUAGES.md`, `API.md`, `SECURITY.md`, `README.md`)
