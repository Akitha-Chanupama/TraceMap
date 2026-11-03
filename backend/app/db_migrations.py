import sqlite3
from sqlalchemy.engine import Engine
from app.core.language_detector import LANGUAGE_EXTENSION_MAP, detect_file_language
from pathlib import Path


def run_startup_migrations(engine: Engine):
    """
    Automatic idempotent schema and data migrator for TraceMap SQLite.
    Resolves legacy 'unknown' language mappings for recognized file extensions.
    """
    try:
        with engine.begin() as conn:
            # Batch update all source files where language is 'unknown' or empty
            for ext, lang in LANGUAGE_EXTENSION_MAP.items():
                conn.exec_driver_sql(
                    "UPDATE source_files SET language = :lang WHERE extension = :ext AND (language = 'unknown' OR language IS NULL)",
                    {"lang": lang, "ext": ext},
                )

            # Update files with no extension that match known file types
            conn.exec_driver_sql(
                "UPDATE source_files SET language = 'dockerfile' WHERE filename = 'Dockerfile' AND language = 'unknown'"
            )
            conn.exec_driver_sql(
                "UPDATE source_files SET language = 'makefile' WHERE filename = 'Makefile' AND language = 'unknown'"
            )
            conn.exec_driver_sql(
                "UPDATE source_files SET language = 'cmake' WHERE filename = 'CMakeLists.txt' AND language = 'unknown'"
            )

            # Clean up CRM project type if previously misclassified as Python
            conn.exec_driver_sql(
                "UPDATE projects SET project_type = 'PHP / Dart' WHERE (name LIKE '%CRM%' OR root_path LIKE '%CRM%') AND project_type = 'Python'"
            )
    except Exception as e:
        print(f"[TraceMap Migrations] Notice: {e}")

