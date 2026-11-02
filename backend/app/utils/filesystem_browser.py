import os
import string
import platform
from pathlib import Path
from typing import List, Dict, Any, Optional


def get_available_drives() -> List[str]:
    """Returns available drive letters on Windows."""
    drives = []
    if platform.system() == "Windows":
        for letter in string.ascii_uppercase:
            drive_path = f"{letter}:\\"
            if os.path.exists(drive_path):
                drives.append(drive_path)
    else:
        drives.append("/")
    return drives


def get_quick_locations() -> List[Dict[str, str]]:
    """Returns convenient developer shortcuts."""
    locations = []
    
    # Current repository
    cwd = Path.cwd().resolve()
    locations.append({"name": f"Current Workspace ({cwd.name})", "path": str(cwd)})
    
    # Sample repo fixture if present
    sample = cwd / "fixtures" / "sample_repo"
    if sample.exists():
        locations.append({"name": "Sample Repo Fixture (Acceptance)", "path": str(sample.resolve())})
    
    # User home
    try:
        home = Path.home().resolve()
        locations.append({"name": "Home Directory (~)", "path": str(home)})
        
        # Desktop / Projects if exist
        desktop = home / "Desktop"
        if desktop.exists():
            locations.append({"name": "Desktop", "path": str(desktop)})
            
        projects = home / "projects"
        if projects.exists():
            locations.append({"name": "Projects", "path": str(projects)})
    except Exception:
        pass

    return locations


def browse_directory(target_path: Optional[str] = None) -> Dict[str, Any]:
    """Lists subdirectories for in-app directory browsing."""
    drives = get_available_drives()
    quick_locations = get_quick_locations()

    if not target_path or not target_path.strip():
        # Default to current working directory or first drive
        target_path = str(Path.cwd().resolve())

    path_obj = Path(target_path).resolve()
    if not path_obj.exists() or not path_obj.is_dir():
        # Fallback to parent or root
        path_obj = Path.cwd().resolve()

    parent_path = str(path_obj.parent) if path_obj.parent != path_obj else None

    subdirs: List[Dict[str, str]] = []
    try:
        with os.scandir(path_obj) as entries:
            for entry in entries:
                try:
                    if entry.is_dir(follow_symlinks=False):
                        # Filter out system and deep hidden folders
                        if entry.name.startswith(("$", "System Volume Information", "Recovery")):
                            continue
                        subdirs.append({
                            "name": entry.name,
                            "path": str(Path(entry.path).resolve()),
                        })
                except (PermissionError, OSError):
                    continue
    except (PermissionError, OSError):
        pass

    # Sort subdirectories alphabetically (case-insensitive)
    subdirs.sort(key=lambda x: x["name"].lower())

    return {
        "current_path": str(path_obj),
        "parent_path": parent_path,
        "directories": subdirs[:150],  # Limit to 150 items for speed
        "drives": drives,
        "quick_locations": quick_locations,
    }

