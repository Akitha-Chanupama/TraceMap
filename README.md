# TraceMap

Local-first codebase intelligence and interactive architecture visualization platform.

TraceMap analyzes real source-code repositories on your local machine and generates evidence-based architecture visualizations. It runs 100% locally with zero cloud dependencies, zero external AI calls, and zero subscription costs.

---

## Key Features

- **AST-Based Source Code Parsing**: Analyzes JavaScript, TypeScript, JSX, TSX, Python, and Dart using Tree-sitter.
- **Evidence-Based Relationships**: Accurately extracts imports, exports, classes, functions, calls, and type definitions directly from concrete syntax trees.
- **Interactive Architecture Graph**: React Flow-powered canvas with automatic hierarchical (ELK.js) and force-directed layouts.
- **Circular Dependency Detection**: Identifies cycle participants, cycle length, and code paths using Tarjan's strongly connected components algorithm.
- **Impact Analysis**: Reverse dependency graph traversal to visualize the blast radius of modifying any file or symbol.
- **Incremental Indexing**: SHA-256 content hashing and filesystem watching (`watchdog`) ensures only modified files are reparsed.
- **Monaco Code Inspector**: Inspect source files with syntax highlighting and jump to dependency locations.
- **Privacy & Security**: Binds to `127.0.0.1` only, enforces path traversal protection, never modifies or executes user source code.

---

## Local Storage and Data Privacy

TraceMap is strictly local-first:
- All index data, parsed symbols, and dependency relationships are stored in a local SQLite database (`tracemap.db`).
- No source code, metadata, or telemetry is ever transmitted outside your machine.
- Removing a project from TraceMap only removes its index from TraceMap's database—your actual source code files are never altered or deleted.

---

## Architecture Overview

```
Browser UI (React + Vite + Tailwind + React Flow + Monaco)
       │ HTTP REST & WebSockets
       ▼
FastAPI Backend (Python 3.11+)
       ├── Scanner & Language Detector
       ├── Tree-sitter AST Parsers (JS/TS/Python/Dart)
       ├── Dependency Resolver & Symbol Indexer
       ├── NetworkX Graph Algorithms (Cycles, Impact, Centrality)
       ├── Watchdog Filesystem Observer
       └── SQLite Database (SQLAlchemy / Alembic)
```

---

## Quick Start (Windows)

### Prerequisites
- Python 3.11+
- Node.js LTS (v18+) and npm
- Git

### 1. Automated Setup & Launch
Run the PowerShell setup script from the repository root:
```powershell
.\scripts\setup.ps1
.\scripts\start.ps1
```

### 2. Manual Startup
**Backend:**
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Frontend:**
```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser. API documentation is available at `http://127.0.0.1:8000/docs`.
