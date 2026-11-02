import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    DEBUG: bool = False
    DATABASE_URL: str = "sqlite:///./tracemap.db"
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]
    
    # File Scanner Defaults
    MAX_FILE_SIZE_BYTES: int = 2 * 1024 * 1024  # 2MB
    DEFAULT_IGNORED_DIRS: List[str] = [
        "node_modules",
        ".git",
        ".venv",
        "venv",
        "__pycache__",
        "dist",
        "build",
        "coverage",
        ".next",
        ".nuxt",
        ".dart_tool",
        ".idea",
        ".vscode",
        "vendor",
        "target",
        ".pytest_cache",
        "out",
    ]
    
    DEFAULT_IGNORED_EXTENSIONS: List[str] = [
        ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp",
        ".pdf", ".zip", ".tar", ".gz", ".7z", ".exe", ".dll", ".so", ".dylib",
        ".woff", ".woff2", ".ttf", ".eot",
        ".mp3", ".mp4", ".wav", ".avi",
        ".pyc", ".pyo", ".pyd",
        ".db", ".sqlite", ".sqlite3",
        ".env", ".env.local", ".env.production",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()

