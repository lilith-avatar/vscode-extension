import * as vscode from 'vscode';

export function getActiveLuaDocument(): vscode.TextDocument|null {
    const activeTextEditor = vscode.window.activeTextEditor;
    if (activeTextEditor === undefined || activeTextEditor.document === undefined){
        return null;
    }
    if (activeTextEditor.document.languageId != "lua"){
        return null;
    }
    return activeTextEditor.document;
}

export function getCursorPosition(): vscode.Position{
    const activeTextEditor = vscode.window.activeTextEditor;
    return activeTextEditor.selection.active;
}
