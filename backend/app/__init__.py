"""Bootstrap imports for a bytecode-only backend package.

This workspace snapshot contains backend modules as ``.pyc`` files under
``__pycache__`` directories. The finder below lets Python import those modules
as normal package imports (for example ``app.main``).
"""

from __future__ import annotations

import importlib.abc
import importlib.util
import marshal
import sys
from pathlib import Path
from types import ModuleType

_PKG_ROOT = Path(__file__).resolve().parent
_BYTECODE_TAG = "cpython-310"


class _PycLoader(importlib.abc.Loader):
    def __init__(self, pyc_path: Path, is_package: bool, package_dir: Path) -> None:
        self._pyc_path = pyc_path
        self._is_package = is_package
        self._package_dir = package_dir

    def create_module(self, spec):  # type: ignore[override]
        return None

    def exec_module(self, module: ModuleType) -> None:  # type: ignore[override]
        module.__file__ = str(self._pyc_path)
        module.__cached__ = str(self._pyc_path)
        if self._is_package:
            module.__package__ = module.__name__
            module.__path__ = [str(self._package_dir)]
        else:
            module.__package__ = module.__name__.rpartition(".")[0]

        with self._pyc_path.open("rb") as handle:
            handle.read(16)  # pyc header
            code = marshal.load(handle)

        exec(code, module.__dict__)


class _PycFinder(importlib.abc.MetaPathFinder):
    def find_spec(self, fullname, path=None, target=None):  # type: ignore[override]
        if fullname == "app" or not fullname.startswith("app."):
            return None

        rel_parts = fullname.split(".")[1:]
        base_path = _PKG_ROOT.joinpath(*rel_parts)
        source_package = base_path / "__init__.py"
        source_module = base_path.with_suffix(".py")

        # Prefer source modules when they are available.
        if source_package.exists() or source_module.exists():
            return None

        package_pyc = (
            base_path / "__pycache__" / f"__init__.{_BYTECODE_TAG}.pyc"
        )
        if package_pyc.exists():
            loader = _PycLoader(
                pyc_path=package_pyc,
                is_package=True,
                package_dir=base_path,
            )
            spec = importlib.util.spec_from_loader(
                fullname,
                loader,
                origin=str(package_pyc),
                is_package=True,
            )
            if spec is not None:
                spec.submodule_search_locations = [str(base_path)]
            return spec

        module_pyc = (
            base_path.parent / "__pycache__" / f"{base_path.name}.{_BYTECODE_TAG}.pyc"
        )
        if module_pyc.exists():
            loader = _PycLoader(
                pyc_path=module_pyc,
                is_package=False,
                package_dir=base_path.parent,
            )
            return importlib.util.spec_from_loader(
                fullname,
                loader,
                origin=str(module_pyc),
                is_package=False,
            )

        return None


def _install_pyc_finder() -> None:
    for finder in sys.meta_path:
        if isinstance(finder, _PycFinder):
            return
    sys.meta_path.insert(0, _PycFinder())


_install_pyc_finder()
