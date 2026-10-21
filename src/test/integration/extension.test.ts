import * as assert from 'node:assert/strict';
import * as vscode from 'vscode';
import { closeAllEditors, delay, openCSharp, textWithCursor, waitFor } from './helpers';

// Types ';' at the '|' marker of `content` and returns the text once the extension is done.
async function typeSemicolon(content: string, language?: string): Promise<string> {
    const editor = await openCSharp(content, language);
    await vscode.commands.executeCommand('type', { text: ';' });
    // The extension reacts to the change asynchronously.
    await delay(300);
    return textWithCursor(editor);
}

suite('Smart Semicolon', () => {
    suiteSetup(async () => {
        await vscode.extensions.getExtension('saix93.csharp-smart-semicolon')!.activate();
    });

    teardown(closeAllEditors);

    test('moves the semicolon to the end of the line', async () => {
        assert.equal(await typeSemicolon('Debug.Log(Foo(bar|))'), 'Debug.Log(Foo(bar));|');
    });

    test('keeps trailing comments after the semicolon', async () => {
        assert.equal(await typeSemicolon('Foo(bar|) // comment'), 'Foo(bar);| // comment');
    });

    test('does not duplicate an existing semicolon', async () => {
        assert.equal(await typeSemicolon('Foo(|);'), 'Foo();|');
    });

    test('works on indented lines of a multi-line document', async () => {
        assert.equal(await typeSemicolon('void A()\n{\n    Foo(|)\n}'), 'void A()\n{\n    Foo();|\n}');
    });

    test('leaves the semicolon inside for loops', async () => {
        assert.equal(await typeSemicolon('for (int i = 0|)'), 'for (int i = 0;|)');
    });

    test('leaves the semicolon inside strings', async () => {
        assert.equal(await typeSemicolon('Log("a(b|")'), 'Log("a(b;|")');
    });

    test('ignores other languages', async () => {
        assert.equal(await typeSemicolon('Foo(bar|)', 'javascript'), 'Foo(bar;|)');
    });

    test('a single undo removes the moved semicolon', async () => {
        const editor = await openCSharp('Foo(bar|)');
        await vscode.commands.executeCommand('type', { text: ';' });
        await waitFor(() => editor.document.getText() === 'Foo(bar);');
        await vscode.commands.executeCommand('undo');
        await waitFor(() => editor.document.getText() !== 'Foo(bar);');
        assert.equal(editor.document.getText(), 'Foo(bar)');
    });
});
