import os
import sys
import platform
import subprocess
from typing import Optional


def open_folder_dialog() -> Optional[str]:
    """
    Opens native OS folder selection dialog in a dedicated process to avoid
    thread-affinity issues with GUI frameworks in web servers.
    Forces the dialog to appear in front of the browser window.
    """
    system = platform.system()

    # 1. On Windows, try PowerShell FolderBrowserDialog with TopMost parent
    if system == "Windows":
        ps_script = (
            "Add-Type -AssemblyName System.Windows.Forms; "
            "$topForm = New-Object System.Windows.Forms.Form; "
            "$topForm.TopMost = $true; "
            "$f = New-Object System.Windows.Forms.FolderBrowserDialog; "
            "$f.Description = 'Select Project Directory for TraceMap'; "
            "$f.ShowNewFolderButton = $true; "
            "if ($f.ShowDialog($topForm) -eq [System.Windows.Forms.DialogResult]::OK) { "
            "  Write-Output $f.SelectedPath "
            "} "
            "$topForm.Dispose();"
        )
        try:
            res = subprocess.run(
                ["powershell", "-NoProfile", "-STA", "-Command", ps_script],
                capture_output=True,
                text=True,
                timeout=180,
            )
            out = res.stdout.strip()
            if out and os.path.isdir(out):
                return out
        except Exception:
            pass

    # 2. Standalone Tkinter subprocess (cross-platform fallback with topmost)
    tk_script = (
        "import sys\n"
        "try:\n"
        "    import tkinter as tk\n"
        "    from tkinter import filedialog\n"
        "    root = tk.Tk()\n"
        "    root.withdraw()\n"
        "    root.attributes('-topmost', True)\n"
        "    root.focus_force()\n"
        "    path = filedialog.askdirectory(title='Select Project Directory for TraceMap')\n"
        "    if path:\n"
        "        print(path)\n"
        "    root.destroy()\n"
        "except Exception as e:\n"
        "    sys.stderr.write(str(e))\n"
    )

    try:
        res = subprocess.run(
            [sys.executable, "-c", tk_script],
            capture_output=True,
            text=True,
            timeout=180,
        )
        out = res.stdout.strip()
        if out and os.path.isdir(out):
            return out
    except Exception:
        pass

    return None
