from pathlib import Path
from app.analyzers.reference_resolver import ReferenceResolver


def test_reference_resolver():
    project_files = [
        "src/main.ts",
        "src/components/Header.tsx",
        "src/components/Button.tsx",
        "src/services/api.ts",
        "src/utils/index.ts",
        "backend/app/main.py",
        "backend/app/config.py",
    ]

    tsconfig_paths = {
        "@/*": ["src/*"]
    }

    resolver = ReferenceResolver(
        Path("D:/dummy_proj"),
        project_files,
        tsconfig_paths=tsconfig_paths,
        tsconfig_base_url=".",
    )

    # 1. Relative import resolution with extension omission
    status, target, pkg, conf = resolver.resolve_dependency("src/main.ts", "./components/Header", "typescript")
    assert status == "resolved_internal"
    assert target == "src/components/Header.tsx"

    # 2. Barrel index resolution
    status, target, pkg, conf = resolver.resolve_dependency("src/main.ts", "./utils", "typescript")
    assert status == "resolved_internal"
    assert target == "src/utils/index.ts"

    # 3. Path alias resolution
    status, target, pkg, conf = resolver.resolve_dependency("src/components/Header.tsx", "@/services/api", "typescript")
    assert status == "resolved_internal"
    assert target == "src/services/api.ts"

    # 4. External npm package
    status, target, pkg, conf = resolver.resolve_dependency("src/main.ts", "react", "typescript")
    assert status == "resolved_external"
    assert pkg == "react"

    # 5. Builtin module
    status, target, pkg, conf = resolver.resolve_dependency("backend/app/main.py", "os", "python")
    assert status == "builtin"
    assert pkg == "os"

