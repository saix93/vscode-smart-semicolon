# C# Smart Semicolon

When you type `;` inside parentheses in C#, it moves to the end of the statement, like Rider does.

```csharp
Debug.Log(Foo(bar|))     // type ';'
Debug.Log(Foo(bar));|    // the semicolon and the cursor jump to the end

Foo(bar|) // comment     // type ';'
Foo(bar);| // comment    // trailing comments stay after it

Foo(|);                  // type ';'
Foo();|                  // no duplicate semicolon, the cursor just moves
```

A single <kbd>Ctrl</kbd>+<kbd>Z</kbd> undoes the semicolon.

## When the semicolon stays where it was typed

- Outside parentheses: `x = 1;`
- Inside a `for (...; ...; ...)` header.
- Inside strings and char literals (including verbatim and interpolated strings): `Log("a;b")`
- Inside comments.

## How it works

The extension watches edits in C# documents. When a single `;` is typed with one cursor, it scans the line up to the cursor, skipping strings and comments, to find unclosed `(`. If there is one, it removes the typed `;` and inserts it after the last code character of the line, before any trailing whitespace or comment.

## Requirements

None. The extension works on the text alone and does not need a language server.

## Related extensions

- [C# Auto Parens](https://github.com/saix93/vscode-auto-parentheses): adds `()` when accepting a method from the completion list.
- [C# Auto Suggest](https://github.com/saix93/vscode-auto-suggest): opens the completion list as soon as you start typing an identifier.

## Development

```sh
npm install
npm test          # compile, then run the unit and integration tests
npm run package   # build the .vsix
```

The integration tests download a separate copy of VS Code into `.vscode-test/` and run inside it.

Press <kbd>F5</kbd> in VS Code to launch an Extension Development Host.

## License

[MIT](LICENSE)
