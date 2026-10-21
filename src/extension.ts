import * as vscode from 'vscode';
import { planSemicolon } from './semicolon';

let applying = false;

// Moves a ';' typed inside parentheses to the end of the line.
async function onDidChangeTextDocument(e: vscode.TextDocumentChangeEvent): Promise<void> {
    if (applying || e.reason !== undefined) return;
    if (e.document.languageId !== 'csharp' || e.contentChanges.length !== 1) return;

    const change = e.contentChanges[0];
    if (change.text !== ';' || change.rangeLength !== 0) return;

    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document !== e.document || editor.selections.length !== 1) return;

    const pos = change.range.start;
    const current = e.document.lineAt(pos.line).text;
    const text = current.slice(0, pos.character) + current.slice(pos.character + 1);

    const move = planSemicolon(text, pos.character);
    if (!move) return;

    applying = true;
    try {
        await editor.edit(edit => {
            edit.delete(new vscode.Range(pos, pos.translate(0, 1)));
            if (!move.alreadyTerminated) edit.insert(new vscode.Position(pos.line, move.codeLength + 1), ';');
        }, { undoStopBefore: false, undoStopAfter: true });
    } finally {
        applying = false;
    }

    const cursor = new vscode.Position(pos.line, move.alreadyTerminated ? move.codeLength : move.codeLength + 1);
    editor.selection = new vscode.Selection(cursor, cursor);
}

export function activate(context: vscode.ExtensionContext): void {
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(onDidChangeTextDocument));
}

export function deactivate(): void {}
