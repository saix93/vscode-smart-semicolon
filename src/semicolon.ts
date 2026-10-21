// Pure logic of the extension, kept free of the `vscode` module so it can be unit tested.

/**
 * Scans the line up to `end`. Returns null if `end` is inside a string, char literal
 * or comment; otherwise the stack of positions of unclosed '('.
 */
export function scanLine(text: string, end: number): number[] | null {
    const openParens: number[] = [];
    let i = 0;
    while (i < end) {
        const c = text[i];
        if (c === '/' && text[i + 1] === '/') return null;
        if (c === '/' && text[i + 1] === '*') {
            const close = text.indexOf('*/', i + 2);
            if (close === -1 || close + 2 > end) return null;
            i = close + 2;
            continue;
        }
        if (c === '"' || c === '\'') {
            const verbatim = c === '"' && (text[i - 1] === '@' || (text[i - 1] === '$' && text[i - 2] === '@') || (text[i - 1] === '@' && text[i - 2] === '$'));
            let j = i + 1;
            while (j < text.length) {
                if (!verbatim && text[j] === '\\') { j += 2; continue; }
                if (text[j] === c) {
                    if (verbatim && text[j + 1] === '"') { j += 2; continue; }
                    break;
                }
                j++;
            }
            if (j >= end) return null;
            i = j + 1;
            continue;
        }
        if (c === '(') openParens.push(i);
        else if (c === ')') openParens.pop();
        i++;
    }
    return openParens;
}

// Length of the code part of the line, without trailing whitespace and comments after `from`.
function codeLength(text: string, from: number): number {
    let code = text;
    const lineComment = code.indexOf('//', from);
    if (lineComment !== -1 && scanLine(code, lineComment) !== null) code = code.slice(0, lineComment);
    code = code.trimEnd();

    while (code.endsWith('*/')) {
        const open = code.lastIndexOf('/*', code.length - 2);
        if (open < from || scanLine(code, open) === null) break;
        code = code.slice(0, open).trimEnd();
    }
    return code.length;
}

export interface SemicolonMove {
    /** Length of the code part of the line, where the ';' goes. */
    codeLength: number;
    /** True if the code already ends with ';', so the typed one is just dropped. */
    alreadyTerminated: boolean;
}

/**
 * Given the line without the typed ';' and the column where it was typed, returns where the
 * ';' should be moved, or undefined if it should stay where it was typed.
 */
export function planSemicolon(text: string, column: number): SemicolonMove | undefined {
    const openParens = scanLine(text, column);
    if (!openParens || openParens.length === 0) return undefined;

    // Inside for (...;...;...) the semicolon belongs where it was typed.
    if (/\bfor\s*$/.test(text.slice(0, openParens[0]))) return undefined;

    const length = codeLength(text, column);
    return { codeLength: length, alreadyTerminated: text.slice(0, length).endsWith(';') };
}
