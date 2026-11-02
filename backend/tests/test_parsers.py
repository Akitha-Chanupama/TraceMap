import pytest
from app.parsers.python import PythonParser
from app.parsers.javascript import JavaScriptParser
from app.parsers.typescript import TypeScriptParser
from app.parsers.dart import DartParser


def test_python_parser():
    code = b"""
import os
from app.services.auth import AuthService

class UserController:
    def __init__(self):
        self.auth = AuthService()

    def login(self, username: str):
        if username:
            return self.auth.authenticate(username)
        return None
"""
    parser = PythonParser()
    result = parser.parse(code, "controller.py")

    assert len(result.syntax_errors) == 0
    assert len(result.imports) == 2
    # Verify symbols
    sym_names = {s.name for s in result.symbols}
    assert "UserController" in sym_names
    assert "login" in sym_names
    assert "__init__" in sym_names

    # Check UserController properties
    user_ctrl = next(s for s in result.symbols if s.name == "UserController")
    assert user_ctrl.symbol_type == "class"
    assert user_ctrl.start_line == 5

    # Check login complexity
    login_fn = next(s for s in result.symbols if s.name == "login")
    assert login_fn.complexity >= 2  # contains 'if'


def test_typescript_parser():
    code = b"""
import React, { useState } from 'react';
import type { User } from '@/types/user';

export interface UserProps {
    user: User;
}

export const UserCard = ({ user }: UserProps) => {
    const [open, setOpen] = useState(false);
    return <div>{user.name}</div>;
};

export default function renderUser(id: string) {
    if (id) return true;
    return false;
}
"""
    parser = TypeScriptParser(is_tsx=True)
    result = parser.parse(code, "UserCard.tsx")

    assert len(result.syntax_errors) == 0
    # Imports
    assert len(result.imports) == 2
    modules = {i.source_module for i in result.imports}
    assert "react" in modules
    assert "@/types/user" in modules

    # Symbols: UserProps (interface), UserCard (component), renderUser (function)
    sym_types = {s.name: s.symbol_type for s in result.symbols}
    assert sym_types.get("UserProps") == "interface"
    assert sym_types.get("UserCard") == "component"
    assert sym_types.get("renderUser") == "function"


def test_dart_parser():
    code = b"""
import 'package:flutter/material.dart' show Scaffold, Widget;
import '../services/auth_service.dart';

class HomeScreen extends StatelessWidget {
    void handleTap() {}
}
"""
    parser = DartParser()
    result = parser.parse(code, "home_screen.dart")

    assert len(result.syntax_errors) == 0
    assert len(result.imports) == 2
    sym_names = {s.name for s in result.symbols}
    assert "HomeScreen" in sym_names

