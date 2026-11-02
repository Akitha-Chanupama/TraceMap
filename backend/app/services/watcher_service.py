import time
import threading
from pathlib import Path
from typing import Dict, Optional, Callable
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler, FileSystemEvent

from app.core.file_filter import FileFilter
from app.core.language_detector import is_supported_code_file


class ProjectFileEventHandler(FileSystemEventHandler):
    def __init__(
        self,
        project_root: Path,
        on_change_callback: Callable[[str, str], None],
        debounce_seconds: float = 1.0,
    ):
        super().__init__()
        self.project_root = project_root.resolve()
        self.on_change = on_change_callback
        self.debounce_seconds = debounce_seconds
        self.file_filter = FileFilter(self.project_root)
        self.last_events: Dict[str, float] = {}
        self.lock = threading.Lock()

    def _should_process(self, path_str: str) -> bool:
        p = Path(path_str)
        try:
            rel = p.relative_to(self.project_root).as_posix()
        except ValueError:
            return False

        if p.is_dir():
            return not self.file_filter.should_ignore_dir(p.name, rel)
        else:
            return not self.file_filter.should_ignore_file(p, rel) and is_supported_code_file(p)

    def _handle_event(self, event: FileSystemEvent, event_type: str):
        if event.is_directory:
            return

        src_path = event.src_path
        if not self._should_process(src_path):
            return

        now = time.time()
        with self.lock:
            last_time = self.last_events.get(src_path, 0.0)
            if now - last_time < self.debounce_seconds:
                return
            self.last_events[src_path] = now

        try:
            rel_path = Path(src_path).relative_to(self.project_root).as_posix()
            self.on_change(event_type, rel_path)
        except Exception:
            pass

    def on_created(self, event: FileSystemEvent):
        self._handle_event(event, "created")

    def on_modified(self, event: FileSystemEvent):
        self._handle_event(event, "modified")

    def on_deleted(self, event: FileSystemEvent):
        self._handle_event(event, "deleted")


class WatcherManager:
    _observers: Dict[str, Observer] = {}

    @classmethod
    def start_watching(
        cls,
        project_id: str,
        project_root: Path,
        on_change_callback: Callable[[str, str], None],
    ):
        cls.stop_watching(project_id)
        handler = ProjectFileEventHandler(project_root, on_change_callback)
        observer = Observer()
        observer.schedule(handler, str(project_root), recursive=True)
        observer.daemon = True
        observer.start()
        cls._observers[project_id] = observer

    @classmethod
    def stop_watching(cls, project_id: str):
        if project_id in cls._observers:
            observer = cls._observers.pop(project_id)
            try:
                observer.stop()
                observer.join(timeout=2.0)
            except Exception:
                pass

    @classmethod
    def is_watching(cls, project_id: str) -> bool:
        return project_id in cls._observers
