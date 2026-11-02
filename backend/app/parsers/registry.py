from typing import Dict, Optional
from app.parsers.base import BaseParser
from app.parsers.python import PythonParser
from app.parsers.javascript import JavaScriptParser
from app.parsers.typescript import TypeScriptParser
from app.parsers.dart import DartParser


class ParserRegistry:
    _parsers: Dict[str, BaseParser] = {}

    @classmethod
    def get_parser_for_language(cls, language: str) -> Optional[BaseParser]:
        lang = language.lower()
        if lang not in cls._parsers:
            if lang == "python":
                cls._parsers[lang] = PythonParser()
            elif lang in ("javascript", "jsx"):
                cls._parsers[lang] = JavaScriptParser()
            elif lang == "typescript":
                cls._parsers[lang] = TypeScriptParser(is_tsx=False)
            elif lang == "tsx":
                cls._parsers[lang] = TypeScriptParser(is_tsx=True)
            elif lang == "dart":
                cls._parsers[lang] = DartParser()
            else:
                return None
        return cls._parsers.get(lang)

    @classmethod
    def get_supported_languages(cls) -> list[str]:
        return ["javascript", "jsx", "typescript", "tsx", "python", "dart"]
