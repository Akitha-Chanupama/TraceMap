from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.api import health, projects, files, graph, analysis, symbols, search, settings as settings_api
from app.api.websocket_manager import ws_manager


# Initialize SQLite database and tables on startup
init_db()

app = FastAPI(
    title="TraceMap API",
    description="Local Codebase Intelligence & Architecture Visualization Platform",
    version="0.1.0",
)

# CORS Configuration strictly for local developer frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register REST Routers
api_v1_prefix = "/api/v1"
app.include_router(health.router, prefix=api_v1_prefix)
app.include_router(projects.router, prefix=api_v1_prefix)
app.include_router(files.router, prefix=api_v1_prefix)
app.include_router(graph.router, prefix=api_v1_prefix)
app.include_router(analysis.router, prefix=api_v1_prefix)
app.include_router(symbols.router, prefix=api_v1_prefix)
app.include_router(search.router, prefix=api_v1_prefix)
app.include_router(settings_api.router, prefix=api_v1_prefix)


# Real-time WebSocket Endpoint
@app.websocket("/api/v1/ws/projects/{project_id}")
async def websocket_project_endpoint(websocket: WebSocket, project_id: str):
    await ws_manager.connect(project_id, websocket)
    try:
        while True:
            # Keep connection alive; client can send ping or commands
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(project_id, websocket)
    except Exception:
        ws_manager.disconnect(project_id, websocket)


@app.get("/")
def root():
    return {
        "name": "TraceMap API",
        "status": "online",
        "documentation": "/docs",
    }
