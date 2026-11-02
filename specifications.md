# TRACEMAP
## Complete AI Coding Agent Development Specification

**Product:** TraceMap  
**Category:** Local Codebase Intelligence & Architecture Visualization  
**Development mode:** Complete application  
**Deployment:** Local machine only  
**Primary UI:** Premium dark developer interface  
**Cost:** $0 infrastructure and software budget  
**Primary objective:** Build a fully functional source-code analysis and architecture visualization platform.

---

# PART 1 — PRODUCT VISION

## 1.1 Mission

Build a local-first developer application that analyzes source-code repositories and generates interactive architecture visualizations.

TraceMap should help developers understand:

- How a project is structured.
- How files depend on one another.
- How modules communicate.
- How components connect.
- Which dependencies are unused or unresolved.
- Where circular dependencies exist.
- Which parts of a project may be affected by a code change.
- How the architecture evolves over time.

The application must analyze actual source code and generate evidence-based relationships.

Do not use static demo graphs, hardcoded project structures, mocked analysis results, or fake metrics.

## 1.2 Target users

- Software engineers.
- Full-stack developers.
- Frontend developers.
- Backend developers.
- Software architects.
- Developers working with unfamiliar repositories.
- Students studying software architecture.

## 1.3 Primary user journey

1. Open TraceMap.
2. Select a local project directory.
3. TraceMap scans and indexes the source code.
4. The application detects languages, frameworks and project structure.
5. The analysis engine extracts files, modules, symbols and dependencies.
6. The graph engine builds architecture relationships.
7. The user explores the architecture visually.
8. The user investigates circular dependencies and problematic modules.
9. The user explores impact analysis for selected files or symbols.
10. The user exports architecture diagrams and reports.

The application must remain useful without an internet connection.

---

# PART 2 — TECHNOLOGY STACK

Use the following stack unless a genuine compatibility issue requires a documented alternative.

## 2.1 Frontend

- React
- Vite
- TypeScript
- Tailwind CSS
- React Flow (@xyflow/react)
- Zustand for application state
- TanStack Query for server-state management
- Lucide React for icons
- Recharts for charts
- ELK.js for graph layout
- Monaco Editor for source-code inspection
- React Router where appropriate

Use strict TypeScript settings.

## 2.2 Backend

- Python 3.11+
- FastAPI
- Uvicorn
- Pydantic
- SQLAlchemy or SQLModel
- SQLite
- Alembic for database migrations
- Tree-sitter for source-code parsing
- Tree-sitter language grammars for supported languages
- NetworkX for graph algorithms
- Watchdog for filesystem monitoring
- pytest
- HTTPX

Use a compatible Tree-sitter grammar distribution and pin tested versions. Do not assume that all language grammars expose identical AST structures.

## 2.3 Supported languages

First-class support:

1. JavaScript
2. TypeScript
3. JSX
4. TSX
5. Python
6. Dart

Additional languages should be added through an extensible parser adapter architecture.

Future optional support:

- Java
- C#
- Go
- Rust
- PHP
- C++
- Vue single-file components

Do not claim support for a language until its parsing, symbol extraction, relationship extraction and tests are implemented.

## 2.4 Supporting technologies

- Git CLI for Git metadata and history.
- SQLite FTS5 for local search.
- Python pathlib for filesystem operations.
- Python hashlib for file fingerprints.
- NetworkX for graph algorithms.
- ELK.js for graph positioning.
- Playwright for frontend end-to-end tests.

Everything must be available through free tools and libraries.

No paid APIs, AI APIs, hosted databases, cloud storage or subscription services.

---

# PART 3 — APPLICATION ARCHITECTURE

Use a modular monolith architecture.

Do not introduce microservices, Kubernetes, Redis or cloud infrastructure.

## 3.1 High-level architecture

Browser UI
    |
    v
React Frontend
    |
    | HTTP REST API
    | WebSocket events
    v
FastAPI Backend
    |
    +---- Project Manager
    |
    +---- File Scanner
    |
    +---- Language Detector
    |
    +---- Parser Engine
    |
    +---- Symbol Extractor
    |
    +---- Dependency Resolver
    |
    +---- Graph Builder
    |
    +---- Architecture Analyzer
    |
    +---- Impact Analyzer
    |
    +---- SQLite Database
    |
    +---- Filesystem Watcher

## 3.2 Architectural principles

- Separate parsing from graph generation.
- Separate graph generation from visualization.
- Separate project scanning from source-code analysis.
- Make language-specific logic modular.
- Store reusable analysis results in SQLite.
- Avoid reprocessing unchanged files.
- Support incremental analysis.
- Ensure all operations are cancellable where practical.
- Make all graph relationships traceable to source-code evidence.

## 3.3 Analysis pipeline

Implement the following processing pipeline:

STEP 1: PROJECT DISCOVERY
- Resolve project root.
- Read project configuration files.
- Discover source directories.
- Identify supported source files.
- Identify ignored directories.

STEP 2: FILE SCANNING
- Enumerate files.
- Detect file types.
- Calculate file hashes.
- Extract file metadata.
- Skip irrelevant files.

STEP 3: SOURCE PARSING
- Select the appropriate language parser.
- Parse source into an AST.
- Record syntax errors.
- Extract imports and exports.
- Extract definitions.
- Extract references and supported call expressions.

STEP 4: SYMBOL INDEXING
- Register classes.
- Register functions.
- Register methods.
- Register variables where supported.
- Register interfaces and types.
- Record symbol locations.

STEP 5: DEPENDENCY RESOLUTION
- Resolve relative imports.
- Resolve local module imports.
- Resolve supported package imports.
- Process path aliases from project configuration.
- Mark unresolved dependencies.
- Distinguish external packages from local files.

STEP 6: GRAPH CONSTRUCTION
- Build file-level graph.
- Build module-level graph.
- Build symbol-level relationships where resolution is sufficiently reliable.
- Record relationship evidence and confidence.

STEP 7: ARCHITECTURE ANALYSIS
- Find circular dependencies.
- Calculate dependency counts.
- Identify highly connected modules.
- Identify isolated files.
- Calculate centrality metrics.
- Detect potential dead code.
- Calculate basic complexity indicators.

STEP 8: PERSISTENCE
- Save analysis results.
- Store graph metadata.
- Store project fingerprints.
- Record analysis timestamps.

STEP 9: VISUALIZATION
- Return graph data to frontend.
- Apply selected graph layout.
- Display interactive nodes and edges.
- Enable filtering and exploration.

---

# PART 4 — PROJECT STRUCTURE

Create the following repository structure.

```text
TraceMap/
│
├── README.md
├── LICENSE
├── .gitignore
├── .editorconfig
├── .env.example
│
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   │
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       │
│       ├── components/
│       │   ├── layout/
│       │   │   ├── AppLayout.tsx
│       │   │   ├── Sidebar.tsx
│       │   │   ├── Topbar.tsx
│       │   │   └── StatusBar.tsx
│       │   │
│       │   ├── dashboard/
│       │   │   ├── ProjectOverview.tsx
│       │   │   ├── MetricCard.tsx
│       │   │   ├── LanguageChart.tsx
│       │   │   └── RecentProjects.tsx
│       │   │
│       │   ├── explorer/
│       │   │   ├── ProjectExplorer.tsx
│       │   │   ├── FileTree.tsx
│       │   │   ├── FileNode.tsx
│       │   │   └── SearchPanel.tsx
│       │   │
│       │   ├── graph/
│       │   │   ├── ArchitectureGraph.tsx
│       │   │   ├── GraphControls.tsx
│       │   │   ├── GraphLegend.tsx
│       │   │   ├── GraphFilters.tsx
│       │   │   ├── CustomNodes/
│       │   │   └── CustomEdges/
│       │   │
│       │   ├── analysis/
│       │   │   ├── AnalysisProgress.tsx
│       │   │   ├── CircularDependencies.tsx
│       │   │   ├── ImpactAnalysis.tsx
│       │   │   ├── ComplexityReport.tsx
│       │   │   └── UnresolvedDependencies.tsx
│       │   │
│       │   ├── inspector/
│       │   │   ├── NodeInspector.tsx
│       │   │   ├── SymbolInspector.tsx
│       │   │   └── SourceViewer.tsx
│       │   │
│       │   └── common/
│       │       ├── Modal.tsx
│       │       ├── Tooltip.tsx
│       │       ├── EmptyState.tsx
│       │       ├── LoadingState.tsx
│       │       └── ErrorState.tsx
│       │
│       ├── pages/
│       │   ├── HomePage.tsx
│       │   ├── ProjectPage.tsx
│       │   ├── ArchitecturePage.tsx
│       │   ├── DependenciesPage.tsx
│       │   ├── AnalysisPage.tsx
│       │   └── SettingsPage.tsx
│       │
│       ├── services/
│       │   ├── api.ts
│       │   ├── projectApi.ts
│       │   ├── graphApi.ts
│       │   └── analysisApi.ts
│       │
│       ├── stores/
│       │   ├── projectStore.ts
│       │   ├── graphStore.ts
│       │   └── uiStore.ts
│       │
│       ├── hooks/
│       ├── types/
│       ├── utils/
│       └── styles/
│
├── backend/
│   ├── requirements.txt
│   ├── pyproject.toml
│   │
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   │
│   │   ├── api/
│   │   │   ├── health.py
│   │   │   ├── projects.py
│   │   │   ├── files.py
│   │   │   ├── graph.py
│   │   │   ├── analysis.py
│   │   │   ├── symbols.py
│   │   │   └── settings.py
│   │   │
│   │   ├── models/
│   │   │   ├── project.py
│   │   │   ├── source_file.py
│   │   │   ├── symbol.py
│   │   │   ├── dependency.py
│   │   │   └── analysis.py
│   │   │
│   │   ├── schemas/
│   │   ├── repositories/
│   │   │
│   │   ├── core/
│   │   │   ├── scanner.py
│   │   │   ├── language_detector.py
│   │   │   ├── file_filter.py
│   │   │   └── hashing.py
│   │   │
│   │   ├── parsers/
│   │   │   ├── base.py
│   │   │   ├── registry.py
│   │   │   ├── javascript.py
│   │   │   ├── typescript.py
│   │   │   ├── python.py
│   │   │   └── dart.py
│   │   │
│   │   ├── analyzers/
│   │   │   ├── symbol_extractor.py
│   │   │   ├── import_extractor.py
│   │   │   ├── export_extractor.py
│   │   │   ├── reference_resolver.py
│   │   │   ├── complexity.py
│   │   │   ├── circular_dependencies.py
│   │   │   └── impact_analysis.py
│   │   │
│   │   ├── graph/
│   │   │   ├── builder.py
│   │   │   ├── algorithms.py
│   │   │   ├── serializer.py
│   │   │   └── layouts.py
│   │   │
│   │   ├── services/
│   │   │   ├── project_service.py
│   │   │   ├── analysis_service.py
│   │   │   ├── graph_service.py
│   │   │   ├── file_service.py
│   │   │   ├── indexing_service.py
│   │   │   └── watcher_service.py
│   │   │
│   │   └── workers/
│   │       ├── analysis_worker.py
│   │       └── task_manager.py
│   │
│   └── tests/
│       ├── fixtures/
│       ├── test_scanner.py
│       ├── test_parsers.py
│       ├── test_resolver.py
│       ├── test_graph.py
│       ├── test_analysis.py
│       └── test_api.py
│
├── scripts/
│   ├── setup.ps1
│   ├── start.ps1
│   ├── stop.ps1
│   ├── setup.sh
│   └── start.sh
│
└── docs/
    ├── ARCHITECTURE.md
    ├── SUPPORTED_LANGUAGES.md
    ├── API.md
    ├── SECURITY.md
    └── DEVELOPMENT.md
```

The agent may add supporting modules, migrations and test files. Do not combine all analysis functionality into one large Python file.

---

# PART 5 — CORE FUNCTIONAL REQUIREMENTS

## 5.1 Project management

Users must be able to:

- Open a local project directory.
- View recently opened projects.
- Remove a project from TraceMap's history without deleting its files.
- Rename project display labels.
- Re-analyze a project.
- Refresh the project index.
- View project path.
- View last analysis timestamp.
- View supported language distribution.

Support Windows, Linux and macOS paths.

For Windows, handle drive letters, backslashes and spaces correctly.

Provide a native folder picker if practical. Also provide a manual path input.

Validate that the directory exists before analysis.

## 5.2 Intelligent project discovery

Automatically detect:

- package.json
- tsconfig.json
- jsconfig.json
- vite.config.*
- next.config.*
- angular.json
- pyproject.toml
- requirements.txt
- setup.py
- pubspec.yaml
- Cargo.toml
- go.mod
- pom.xml

Use these files to identify project type, dependencies, aliases and source directories.

Framework identification must be based on actual project evidence.

Display detected frameworks with confidence and supporting evidence where practical.

Do not assume a project uses a framework simply because its directory name resembles one.

## 5.3 File explorer

Build an interactive source-code file explorer.

Features:

- Hierarchical directory tree.
- File-type icons.
- Language badges.
- Search by filename.
- Filter by file type.
- Show file size.
- Show symbol count.
- Show dependency count.
- Highlight problematic files.
- Navigate from file tree to architecture graph.
- Open files in source viewer.

Ignore generated and dependency directories by default.

Default exclusions:

- node_modules
- .git
- .venv
- venv
- __pycache__
- dist
- build
- coverage
- .next
- .dart_tool
- .idea
- .vscode
- vendor
- target

Respect .gitignore rules where practical.

Allow users to configure exclusions.

## 5.4 Architecture visualization

This is the main feature of TraceMap.

Use React Flow to build an interactive graph.

Graph nodes must represent actual analyzed entities.

Supported node types:

- Project
- Directory
- File
- Module
- Class
- Function
- Interface
- Component
- External package

Supported relationship types:

- IMPORTS
- EXPORTS
- CONTAINS
- CALLS
- EXTENDS
- IMPLEMENTS
- REFERENCES

Only display relationship types that have actually been extracted and resolved.

### Graph modes

Implement these views:

1. Project Overview
   - High-level project modules.
   - Main directories.
   - Major dependencies.

2. File Dependency Graph
   - Source files.
   - Import relationships.
   - Circular dependencies.

3. Module Architecture
   - Logical modules.
   - Module-to-module dependencies.

4. Symbol Explorer
   - Classes.
   - Functions.
   - Interfaces.
   - Symbol relationships where resolution is reliable.

5. Dependency Graph
   - Internal dependencies.
   - External packages.
   - Dependency direction.

6. Impact Graph
   - Selected file or symbol.
   - Direct dependants.
   - Transitive dependants.
   - Dependency paths.

### Graph interactions

- Pan and zoom.
- Drag nodes.
- Select nodes.
- Multi-select nodes.
- Search graph nodes.
- Expand and collapse groups.
- Hide and show directories.
- Filter by relationship type.
- Filter by language.
- Highlight incoming dependencies.
- Highlight outgoing dependencies.
- Focus on selected node.
- Fit graph to screen.
- Reset graph layout.
- Navigate to source file.
- Display relationship details on edge selection.

### Graph layouts

Provide:

- Hierarchical top-to-bottom.
- Hierarchical left-to-right.
- Force-directed.
- Radial.
- Clustered by directory.

Use ELK.js or another appropriate free graph layout library.

Do not run expensive layouts on the main UI thread for large graphs. Use web workers where appropriate.

Provide graph filtering and progressive rendering for large projects.

## 5.5 Custom graph nodes

Design custom React Flow nodes.

Each node should display:

- Entity name.
- Entity type.
- Language icon.
- Incoming dependency count.
- Outgoing dependency count.
- Optional complexity indicator.
- Warning indicators where applicable.

Visual distinction should be achieved through subtle borders, icons and accents.

Do not overcrowd nodes with information.

Use a consistent visual legend.

## 5.6 Dependency analyzer

Extract local import relationships from source code.

Examples:

JavaScript:

import { UserService } from './services/userService';
import React from 'react';
const utils = require('./utils');

TypeScript:

import type { User } from '@/types/user';

Python:

from app.services.auth import AuthService;
import os;

Dart:

import 'package:flutter/material.dart';
import '../services/user_service.dart';

Support:

- Relative imports.
- Absolute imports.
- Package imports.
- Type-only imports.
- Re-exports.
- Dynamic imports where statically identifiable.
- Supported path aliases.
- Index/barrel files.
- Python relative imports.
- Dart package imports.

Distinguish:

- Internal dependency.
- External dependency.
- Unresolved dependency.
- Built-in/runtime dependency.

Do not classify every unresolved dependency as a missing package.

Store resolution status and resolution evidence.

## 5.7 Circular dependency detection

Detect dependency cycles using graph algorithms.

Examples:

A → B → C → A

Display:

- Cycle participants.
- Cycle length.
- Dependency path.
- Source import locations.
- Number of cycles.
- Severity based on structural characteristics.

Provide a dedicated circular dependency page.

Allow users to click a cycle and highlight it in the graph.

Avoid reporting duplicate cycles for the same underlying cycle.

For large graphs, use efficient strongly connected component algorithms.

## 5.8 Symbol extraction

Extract:

- Classes.
- Functions.
- Methods.
- Interfaces.
- Enums.
- Type aliases.
- Constructors.
- Supported variables.
- Components.

Store:

- Symbol name.
- Symbol type.
- File ID.
- Parent symbol.
- Start line.
- End line.
- Start column.
- End column.
- Export status.
- Visibility where supported.
- Language.

Use AST node locations.

Never invent line numbers.

## 5.9 Call relationship analysis

Where practical, identify function and method calls.

For the initial version:

- Extract call expressions.
- Resolve calls to locally defined symbols where statically identifiable.
- Record unresolved calls separately.
- Avoid guessing relationships based only on matching names.
- Display confidence or resolution status.

Dynamic dispatch, reflection, dependency injection, decorators and runtime-generated calls may not be fully resolvable.

Document these limitations.

## 5.10 Impact analysis

When a user selects a file or symbol, analyze what could be affected by modifying it.

Show:

- Direct dependants.
- Transitive dependants.
- Dependency depth.
- Number of potentially affected files.
- Dependency paths.
- Relevant import statements.

For an import edge A → B, B is a dependency of A. Therefore, changing B may affect A.

Use reverse dependency traversal for impact analysis.

Clearly distinguish potential impact from guaranteed runtime impact.

Provide:

- Direct impact.
- Extended impact.
- Full dependency chain.
- Visual impact graph.

## 5.11 Complexity and code quality analysis

Implement measurable, explainable metrics.

Initial metrics:

- File count.
- Lines of code.
- Comment lines where detectable.
- Blank lines.
- Number of classes.
- Number of functions.
- Number of imports.
- Cyclomatic complexity for supported syntax.
- Maximum function length.
- File size.
- Fan-in.
- Fan-out.

Provide potential warnings:

- Very large files.
- Very long functions.
- High dependency counts.
- Highly connected modules.
- Circular dependencies.
- Unresolved internal imports.

Do not invent a universal quality score.

If an aggregate score is introduced, expose its formula and component measurements.

## 5.12 Dead-code and unused symbol detection

Implement cautious static detection.

Identify:

- Files with no incoming local imports.
- Exported symbols with no statically detected references.
- Unreferenced local functions where supported.

Exclude likely entry points and externally exposed symbols.

Display findings as potential unused code, not definitive proof of dead code.

Never automatically delete source code.

## 5.13 Source code inspector

When users select a node, open a source inspector.

Use Monaco Editor in read-only mode initially.

Display:

- Syntax highlighting.
- Line numbers.
- Selected symbol range.
- Import statements.
- Export statements.
- Related dependencies.
- Clickable references.
- Navigation to dependent files.

Read source code from the selected project only.

Do not modify source files in the initial version.

## 5.14 Architecture export

Support:

- Export graph to SVG.
- Export graph to PNG.
- Export graph to JSON.
- Export dependency report to Markdown.
- Export architecture summary to HTML.
- Export analysis report to JSON.

Use graph data and actual analysis results.

Include project name, export timestamp, selected graph type and legend.

## 5.15 Incremental analysis

This is a major requirement.

TraceMap must avoid rescanning and reparsing every file unnecessarily.

Implement:

1. File hashing.
2. File modification detection.
3. Changed-file detection.
4. Deleted-file detection.
5. Incremental parsing.
6. Dependency invalidation.
7. Graph updates.
8. Persistent analysis cache.

Use Watchdog for filesystem monitoring.

Debounce rapid file events.

When one file changes:

- Reparse that file.
- Recalculate its symbols and dependencies.
- Update affected graph relationships.
- Recalculate relevant graph metrics.
- Update the interface.

Use full re-analysis when project configuration changes or incremental state becomes unreliable.

Provide manual full refresh.

---

# PART 6 — DATA MODELS

Use SQLite as the initial database.

All project-specific data must be stored locally.

## 6.1 Project

Fields:

- id: UUID
- name
- root_path
- project_type
- detected_languages: JSON
- configuration: JSON
- created_at
- updated_at
- last_analyzed_at
- analysis_status

## 6.2 SourceFile

Fields:

- id
- project_id
- relative_path
- absolute_path
- filename
- extension
- language
- file_size
- content_hash
- line_count
- parse_status
- parse_error
- last_modified
- last_analyzed_at

Unique constraint: project_id + relative_path.

## 6.3 Symbol

Fields:

- id
- project_id
- file_id
- parent_symbol_id
- name
- qualified_name
- symbol_type
- language
- start_line
- end_line
- start_column
- end_column
- is_exported
- visibility
- complexity
- metadata: JSON

## 6.4 Dependency

Fields:

- id
- project_id
- source_file_id
- target_file_id: nullable
- external_package
- source_symbol_id: nullable
- target_symbol_id: nullable
- dependency_type
- import_statement
- line_number
- resolution_status
- confidence
- metadata: JSON

## 6.5 AnalysisRun

Fields:

- id
- project_id
- status
- started_at
- completed_at
- total_files
- processed_files
- failed_files
- skipped_files
- analysis_duration_ms
- summary: JSON
- error_message

## 6.6 GraphSnapshot

Fields:

- id
- project_id
- analysis_run_id
- graph_type
- graph_data: JSON
- created_at

Graph snapshots may be compressed or normalized if storage becomes a concern.

## 6.7 Settings

Store:

- Default graph layout.
- Default graph mode.
- Ignored directories.
- Maximum graph nodes.
- Theme preference.
- Source viewer settings.
- Analysis preferences.

Use database migrations from the beginning.

---

# PART 7 — API DESIGN

Use REST endpoints under:

`/api/v1`

Use Pydantic request and response schemas.

## 7.1 Health

GET /api/v1/health

Returns:

- Application status.
- Backend version.
- Database status.
- Supported language parsers.
- Watcher status.

Do not reveal sensitive filesystem information.

## 7.2 Project management

GET /api/v1/projects

Returns recently opened projects.

POST /api/v1/projects/open

Request:

{
  "root_path": "D:/projects/example"
}

Validates and registers a local project.

POST /api/v1/projects/select-folder

Opens a native folder selection dialog where supported.

GET /api/v1/projects/{project_id}

Returns project details and analysis status.

DELETE /api/v1/projects/{project_id}

Removes the project from TraceMap's database without deleting original source files.

POST /api/v1/projects/{project_id}/analyze

Starts a new analysis run.

POST /api/v1/projects/{project_id}/refresh

Triggers full re-analysis.

GET /api/v1/projects/{project_id}/status

Returns analysis status and progress.

## 7.3 File APIs

GET /api/v1/projects/{project_id}/files

Query parameters:

- search
- language
- directory
- page
- page_size

GET /api/v1/projects/{project_id}/files/tree

Returns the directory hierarchy.

GET /api/v1/projects/{project_id}/files/{file_id}

Returns metadata.

GET /api/v1/projects/{project_id}/files/{file_id}/source

Returns source content after validating that the path remains inside the project root.

## 7.4 Graph APIs

GET /api/v1/projects/{project_id}/graph

Parameters:

- type
- layout
- language
- directory
- relationship_type
- depth
- search

Returns graph nodes and edges.

GET /api/v1/projects/{project_id}/graph/nodes/{node_id}

Returns selected node details.

GET /api/v1/projects/{project_id}/graph/neighbors/{node_id}

Returns incoming and outgoing relationships.

GET /api/v1/projects/{project_id}/graph/export

Supports JSON and supported diagram formats.

## 7.5 Analysis APIs

GET /api/v1/projects/{project_id}/analysis/summary

GET /api/v1/projects/{project_id}/analysis/circular-dependencies

GET /api/v1/projects/{project_id}/analysis/unresolved-dependencies

GET /api/v1/projects/{project_id}/analysis/complexity

GET /api/v1/projects/{project_id}/analysis/unused-symbols

GET /api/v1/projects/{project_id}/analysis/impact/{node_id}

GET /api/v1/projects/{project_id}/analysis/metrics

## 7.6 Search APIs

GET /api/v1/projects/{project_id}/search

Support:

- File search.
- Symbol search.
- Module search.
- Dependency search.

Use SQLite FTS5 where appropriate.

## 7.7 WebSocket

`/api/v1/ws/projects/{project_id}`

Send real-time events:

- analysis_started
- scanning_progress
- parsing_progress
- indexing_progress
- graph_building
- analysis_completed
- analysis_failed
- file_changed
- incremental_analysis_started
- incremental_analysis_completed

Each event must have a documented payload.

Provide polling as a fallback.

---

# PART 8 — FRONTEND UI/UX

## 8.1 Design direction

Create a premium dark developer application.

The interface should feel like a polished desktop engineering tool, not a generic admin dashboard.

Design references:

- Linear
- GitHub Desktop
- VS Code
- Modern observability platforms
- Professional code intelligence tools

Do not copy their branding or exact layouts.

### Visual theme

Suggested palette:

- Main background: #0B0D12
- Secondary background: #11151D
- Sidebar: #0E1219
- Panel background: #151B25
- Elevated surface: #1A2230
- Border: #283244
- Primary text: #E8EDF5
- Secondary text: #929EB0
- Accent blue: #4C8DFF
- Accent cyan: #36C5E8
- Accent purple: #9A78FF
- Success: #35C98A
- Warning: #F1B85B
- Error: #EF6464

Use accent colors sparingly.

Use a consistent spacing scale, typography system, radius system and component states.

Avoid excessive gradients, glowing borders, oversized cards and decorative animations.

## 8.2 Main application layout

Sidebar:

- Overview
- Architecture
- File Explorer
- Dependencies
- Circular Dependencies
- Impact Analysis
- Code Quality
- Search

Bottom sidebar:

- Current project
- Settings
- Application status

Topbar:

- Project selector
- Breadcrumbs
- Global search
- Analyze/Refresh action
- Notification/status indicator

Main workspace:

- Page-specific content.
- Consistent toolbar.
- Contextual inspector.
- Loading and error states.

## 8.3 Overview page

Display:

- Project name.
- Project root.
- Project type.
- Detected languages.
- Total source files.
- Total lines of code.
- Total symbols.
- Total internal dependencies.
- External packages.
- Circular dependency count.
- Unresolved import count.
- Last analyzed timestamp.

Charts:

- Language distribution.
- Files by directory.
- Dependency distribution.
- Complexity distribution.

Sections:

- Project structure preview.
- Most connected files.
- Largest source files.
- Recent analysis results.
- Architecture warnings.

All displayed values must come from the backend.

## 8.4 Architecture page

This is the flagship screen.

Layout:

- Main graph canvas.
- Left graph navigation/filter panel.
- Right contextual inspector.
- Top graph toolbar.

Graph toolbar:

- Graph mode selector.
- Layout selector.
- Search nodes.
- Filter relationships.
- Filter languages.
- Zoom controls.
- Fit view.
- Export.

The inspector should update when a graph node is selected.

Show actual relationship counts and evidence.

## 8.5 File Explorer page

Three-column layout where appropriate:

- Directory tree.
- File list or search results.
- Source code inspector.

Allow users to select files and navigate to their graph representation.

## 8.6 Dependencies page

Show:

- Internal modules.
- External packages.
- Unresolved imports.
- Dependency counts.
- Dependency direction.
- Dependency graph.

Include filters and sorting.

## 8.7 Circular Dependencies page

Display:

- Total detected cycles.
- Cycle length.
- Files involved.
- Source locations.
- Interactive cycle visualization.
- Navigate to source.
- Highlight cycle in architecture graph.

## 8.8 Impact Analysis page

Allow a user to select a file or symbol.

Display:

- Direct dependants.
- Transitive dependants.
- Dependency depth.
- Affected module count.
- Visual dependency paths.

Include a clear explanation that static impact analysis indicates potential impact, not guaranteed runtime effects.

## 8.9 Code Quality page

Display:

- File complexity.
- Function length.
- File size.
- Fan-in/fan-out.
- Potentially unused symbols.
- Unresolved dependencies.
- Circular dependency warnings.

Allow filtering and sorting.

## 8.10 Search

Global search should support:

- Filenames.
- Directory names.
- Symbols.
- Classes.
- Functions.
- Modules.

Clicking a result should navigate to the appropriate inspector or graph node.

## 8.11 Settings

Allow configuration of:

- Ignored directories.
- Maximum file size for parsing.
- Supported language options.
- Graph defaults.
- Automatic file watching.
- Analysis behavior.
- Application appearance.

Settings must persist locally.

---

# PART 9 — PERFORMANCE REQUIREMENTS

TraceMap must remain usable on medium-sized projects.

Initial engineering targets, to be measured on a documented development machine:

- 1,000 source files: practical initial analysis.
- 5,000 source files: usable with incremental indexing and graph filtering.
- 10,000 source files: best-effort support with graph pagination or subgraph rendering.

Do not promise specific scan times without benchmarking.

Performance rules:

- Ignore dependency and generated directories by default.
- Avoid loading full source content for every file into memory.
- Hash files incrementally.
- Reuse unchanged parse results.
- Batch database writes.
- Use background tasks for analysis.
- Use WebSockets for progress updates.
- Paginate file and symbol searches.
- Limit graph payloads.
- Support subgraph expansion.
- Avoid recomputing all graph layouts on every interaction.
- Cache frequently used graph queries.
- Cancel obsolete analysis tasks safely.

Add benchmark fixtures for larger repositories.

---

# PART 10 — SECURITY AND LOCAL PRIVACY

TraceMap must be designed as a local application.

## 10.1 Network security

- Bind backend to 127.0.0.1 by default.
- Never bind to 0.0.0.0 unless explicitly configured.
- Restrict CORS to the configured frontend origin.
- Validate request origins.
- Use a local session token or equivalent protection for state-changing API operations.
- Validate WebSocket connections.
- Do not expose the backend to external networks.

## 10.2 Filesystem security

- Resolve and canonicalize project paths.
- Ensure file access stays inside the registered project root.
- Prevent path traversal.
- Handle symbolic links carefully.
- Do not follow symlinks outside the project root by default.
- Never modify project source files.
- Never delete user project files.
- Never execute analyzed source code.
- Avoid reading secrets and environment files by default.
- Exclude .env, credentials, keys and certificates from indexing.
- Provide configurable exclusion rules.

## 10.3 Source-code safety

Treat source code as untrusted input.

- Parse code without executing it.
- Limit maximum source file size.
- Handle malformed source files.
- Catch parser failures per file.
- Limit memory consumption.
- Prevent one malformed file from stopping an entire scan.
- Avoid shell execution using user-controlled paths.

## 10.4 Privacy

- No telemetry.
- No analytics.
- No cloud synchronization.
- No AI APIs.
- No source-code uploads.
- No external dependency on hosted services for normal operation.

The README must clearly explain how project data and indexes are stored locally.

---

# PART 11 — TESTING STRATEGY

Testing is mandatory.

## 11.1 Unit tests

Test:

- Language detection.
- File filtering.
- File hashing.
- AST parsing.
- Symbol extraction.
- Import extraction.
- Export extraction.
- Relative path resolution.
- Alias resolution.
- Dependency classification.
- Graph construction.
- Circular dependency detection.
- Impact analysis.
- Complexity metrics.

## 11.2 Integration tests

Create small sample projects for:

- React.
- TypeScript.
- Python/FastAPI.
- Flutter/Dart.
- Mixed-language monorepos.

Verify that the actual source code produces expected nodes and edges.

Include:

- Relative imports.
- Absolute imports.
- Re-exports.
- Barrel files.
- Type-only imports.
- Circular dependencies.
- Unresolved imports.
- Dynamic imports.
- Nested directories.
- Syntax errors.
- Ignored directories.
- Duplicate filenames in different directories.

## 11.3 API tests

Test every endpoint.

Include:

- Invalid project paths.
- Nonexistent directories.
- Invalid project IDs.
- Unauthorized requests.
- Source path traversal attempts.
- Missing files.
- Analysis cancellation.
- Failed parser operations.
- Concurrent requests.
- Expired or deleted project references.

## 11.4 Frontend tests

Use Vitest and React Testing Library.

Test:

- Project opening.
- Analysis progress.
- Graph rendering.
- Node selection.
- Filters.
- Search.
- Inspector.
- Navigation.
- Error states.
- Empty states.

Use Playwright for end-to-end tests.

## 11.5 Acceptance testing

The agent must create a sample repository with known relationships.

Example:

src/
  main.ts
  services/
    user.ts
    auth.ts
  components/
    profile.tsx
  utils/
    formatter.ts

Create deliberate dependencies and at least one circular dependency.

The test suite must verify that TraceMap correctly identifies the expected files, symbols, edges and cycles.

Do not validate only whether an API returns HTTP 200. Validate the actual semantic output.

---

# PART 12 — INSTALLATION AND STARTUP

The primary development environment is Windows with PowerShell.

Provide Windows-first scripts and Unix alternatives.

## 12.1 Prerequisites

Install:

- Python 3.11 or newer compatible version.
- Node.js LTS.
- npm.
- Git.

Verify:

```powershell
python --version
node --version
npm --version
git --version
```

## 12.2 Backend setup

From the project root:

```powershell
cd backend

python -m venv .venv

.\.venv\Scripts\Activate.ps1

python -m pip install --upgrade pip

pip install -r requirements.txt
```

If PowerShell blocks activation, provide a process-scoped alternative or use the environment's Python executable directly.

## 12.3 Frontend setup

Open a separate terminal:

```powershell
cd frontend

npm install
```

## 12.4 Start the backend

```powershell
cd backend

.\.venv\Scripts\Activate.ps1

python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend:

http://127.0.0.1:8000

API documentation:

http://127.0.0.1:8000/docs

## 12.5 Start the frontend

In another terminal:

```powershell
cd frontend

npm run dev
```

Frontend:

http://localhost:5173

## 12.6 One-command startup

Implement:

```powershell
.\scripts\start.ps1
```

The script should:

1. Check prerequisites.
2. Verify dependencies are installed.
3. Start the backend.
4. Start the frontend.
5. Open the application in the default browser when appropriate.
6. Track child processes.
7. Stop them safely when the user closes the application or runs the stop script.

Do not start duplicate backend instances.

Provide a matching setup script.

Document troubleshooting for Windows ports, Python environments and npm dependencies.

---

# PART 13 — DEVELOPMENT PLAN

Although the target is a complete application, implementation should be executed through controlled milestones.

## Milestone 1: Foundation

- Repository setup.
- Frontend scaffolding.
- Backend scaffolding.
- Database and migrations.
- Health endpoint.
- Application layout.
- Project registration.
- Native folder selection or manual path entry.

Deliverable: TraceMap opens local project directories.

## Milestone 2: Source-code analysis

- File scanner.
- Language detector.
- Tree-sitter integration.
- JavaScript and TypeScript parser.
- Python parser.
- Dart parser.
- Symbol extraction.
- Import and export extraction.

Deliverable: Actual source-code analysis.

## Milestone 3: Dependency engine

- Local import resolution.
- External package detection.
- Alias handling.
- Dependency persistence.
- Unresolved imports.
- Dependency graph construction.

Deliverable: Accurate file-level dependency graph.

## Milestone 4: Architecture visualization

- React Flow integration.
- Custom nodes and edges.
- Graph layout engine.
- Interactive navigation.
- Node inspector.
- Graph filters.
- Graph search.

Deliverable: Fully interactive architecture explorer.

## Milestone 5: Advanced analysis

- Circular dependency detection.
- Impact analysis.
- Complexity analysis.
- Fan-in/fan-out.
- Potential dead-code detection.
- Architecture warnings.

Deliverable: Architecture intelligence platform.

## Milestone 6: Developer experience

- Source code viewer.
- File explorer.
- Export functionality.
- Search.
- Project dashboard.
- Reports.
- Recent projects.

Deliverable: Complete developer-facing application.

## Milestone 7: Incremental indexing

- File hashing.
- Change detection.
- Filesystem watcher.
- Incremental parsing.
- Graph cache updates.
- Analysis cancellation.

Deliverable: Efficient ongoing project monitoring.

## Milestone 8: Quality and final verification

- Full automated testing.
- Performance testing.
- Security testing.
- Error handling.
- Documentation.
- Windows setup scripts.
- Production-quality UI refinement.

Deliverable: Complete portfolio-quality TraceMap release.

Do not skip milestones or replace incomplete functionality with mock implementations.

---

# PART 14 — DEFINITION OF DONE

The application is considered complete only when all the following conditions are satisfied.

## Project management

- [ ] Users can open local repositories.
- [ ] Project information is persisted.
- [ ] Recent projects work.
- [ ] Multiple projects are supported.
- [ ] Project removal does not delete source files.

## Source analysis

- [ ] JavaScript parsing works.
- [ ] TypeScript parsing works.
- [ ] JSX/TSX parsing works.
- [ ] Python parsing works.
- [ ] Dart parsing works.
- [ ] Symbols are extracted with correct source locations.
- [ ] Imports and exports are extracted.
- [ ] Supported local dependencies are resolved.

## Graph

- [ ] File dependency graph is generated from real source.
- [ ] Module graph works.
- [ ] Symbol explorer works for supported relationships.
- [ ] Graph interactions work.
- [ ] Graph layouts work.
- [ ] Search and filtering work.
- [ ] Node inspector works.
- [ ] Graph export works.

## Analysis

- [ ] Circular dependencies are identified.
- [ ] Unresolved dependencies are reported.
- [ ] Impact analysis works.
- [ ] Complexity metrics are calculated.
- [ ] Potentially unused symbols are reported cautiously.

## Performance

- [ ] Unchanged files are cached.
- [ ] Incremental analysis works.
- [ ] Large graph filtering works.
- [ ] Analysis progress is real.
- [ ] Analysis failures do not crash the entire application.

## Security

- [ ] Backend is localhost-only by default.
- [ ] Project path validation works.
- [ ] Path traversal is prevented.
- [ ] Source files are never modified.
- [ ] Sensitive files are excluded by default.
- [ ] No project code is executed.

## Delivery

- [ ] Frontend starts successfully.
- [ ] Backend starts successfully.
- [ ] Database migrations work.
- [ ] Automated tests have been executed.
- [ ] README is complete.
- [ ] Windows setup scripts work.
- [ ] No paid services are required.

Any incomplete requirement must be reported honestly.

---

# PART 15 — FINAL INSTRUCTIONS TO THE AI CODING AGENT

You are responsible for implementing TraceMap as a complete working software product.

Do not stop after generating an architecture diagram, writing a development plan or building a frontend prototype.

First inspect the existing workspace and development environment.

Then:

1. Create the complete repository structure.
2. Establish the frontend and backend.
3. Implement database models and migrations.
4. Implement the source-code parsing system.
5. Implement the dependency resolution engine.
6. Implement graph construction and analysis.
7. Build the interactive frontend.
8. Connect all frontend features to real APIs.
9. Implement incremental analysis.
10. Implement security protections.
11. Write and execute automated tests.
12. Fix implementation failures.
13. Verify functionality against real local repositories.
14. Complete documentation and setup scripts.

Maintain a development checklist in `docs/DEVELOPMENT.md`.

Keep the application runnable throughout development.

Use real test fixtures, not invented analysis responses.

When a feature cannot be fully implemented due to static-analysis limitations, clearly document the limitation and show the actual evidence and confidence level.

The final delivery must include:

- Full source code.
- Working local application.
- Database migrations.
- Tests.
- Documentation.
- Windows setup scripts.
- Verified feature list.
- Known limitations.
- Exact startup instructions.

**Final quality target:** TraceMap should look and behave like a professional developer product that could be demonstrated in a technical interview or included in a serious software engineering portfolio.