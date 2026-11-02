# TraceMap REST & WebSocket API Documentation

All REST endpoints are namespaced under `/api/v1` and accept/return JSON payloads.

---

## 1. Health
- `GET /api/v1/health`: Returns service status, database connectivity, and supported languages.

---

## 2. Projects
- `GET /api/v1/projects`: List recently opened projects.
- `POST /api/v1/projects/open`: Open and register a project directory.
  - Body: `{"root_path": "D:/projects/my-app", "name": "Optional Name"}`
- `POST /api/v1/projects/select-folder`: Opens native folder selection dialog (tkinter).
- `GET /api/v1/projects/{project_id}`: Get project details and configuration.
- `PATCH /api/v1/projects/{project_id}`: Update project display name.
- `DELETE /api/v1/projects/{project_id}`: Remove project from TraceMap history without deleting files.
- `POST /api/v1/projects/{project_id}/analyze`: Trigger background indexing.
- `POST /api/v1/projects/{project_id}/refresh`: Trigger full re-analysis.
- `GET /api/v1/projects/{project_id}/status`: Check analysis progress and status.

---

## 3. Files
- `GET /api/v1/projects/{project_id}/files`: List scanned files with pagination and search.
- `GET /api/v1/projects/{project_id}/files/tree`: Hierarchical directory tree structure.
- `GET /api/v1/projects/{project_id}/files/{file_id}`: Single file metadata.
- `GET /api/v1/projects/{project_id}/files/{file_id}/source`: Read file source code safely (enforces project boundary).

---

## 4. Architecture Graph
- `GET /api/v1/projects/{project_id}/graph`:
  - Query parameters:
    - `type`: `file_dependency` | `module_architecture` | `symbol_explorer` | `dependencies`
    - `language`: filter by language (e.g. `typescript`, `python`)
    - `directory`: filter by directory prefix
    - `search`: filter node labels
    - `max_nodes`: maximum nodes to return (default: 500)
- `GET /api/v1/projects/{project_id}/graph/nodes/{node_id}`: Get node metrics and data.
- `GET /api/v1/projects/{project_id}/graph/neighbors/{node_id}`: Get incoming and outgoing dependencies.

---

## 5. Analysis
- `GET /api/v1/projects/{project_id}/analysis/summary`: Overview statistics and language breakdown.
- `GET /api/v1/projects/{project_id}/analysis/circular-dependencies`: Detected cyclic loops and severity.
- `GET /api/v1/projects/{project_id}/analysis/impact/{node_id}`: Reverse dependency blast radius.
- `GET /api/v1/projects/{project_id}/analysis/complexity`: McCabe complexity, fan-in, fan-out.
- `GET /api/v1/projects/{project_id}/analysis/unresolved-dependencies`: Missing imports and path aliases.
- `GET /api/v1/projects/{project_id}/analysis/unused-symbols`: Cautious static unreferenced exports.

---

## 6. Global Search
- `GET /api/v1/projects/{project_id}/search?q={query}`: Unified search across files, symbols, and packages.

---

## 7. Real-time WebSocket
- `WS /api/v1/ws/projects/{project_id}`
  - Events broadcast:
    - `scanning_progress`: `{"phase": "scanning", "current": int, "total": int}`
    - `parsing_progress`: `{"phase": "parsing", "current": int, "total": int}`
    - `indexing_progress`: `{"phase": "indexing", "current": int, "total": int}`
    - `analysis_completed`: `{"phase": "completed", "current": 100, "total": 100}`
    - `file_changed`: `{"event_type": "modified", "relative_path": "src/App.tsx"}`
