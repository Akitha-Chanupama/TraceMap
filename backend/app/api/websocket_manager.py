import asyncio
import json
from typing import Dict, List
from fastapi import WebSocket


class WebSocketManager:
    def __init__(self):
        # Map project_id -> list of active WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, project_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.setdefault(project_id, []).append(websocket)

    def disconnect(self, project_id: str, websocket: WebSocket):
        if project_id in self.active_connections:
            if websocket in self.active_connections[project_id]:
                self.active_connections[project_id].remove(websocket)
            if not self.active_connections[project_id]:
                del self.active_connections[project_id]

    async def broadcast_event(self, project_id: str, event_type: str, payload: dict):
        if project_id in self.active_connections:
            message = json.dumps({"event": event_type, "data": payload})
            disconnected = []
            for connection in self.active_connections[project_id]:
                try:
                    await connection.send_text(message)
                except Exception:
                    disconnected.append(connection)
            for d in disconnected:
                self.disconnect(project_id, d)


ws_manager = WebSocketManager()
