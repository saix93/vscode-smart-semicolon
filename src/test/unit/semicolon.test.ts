import * as assert from 'node:assert/strict';
import { planSemicolon, scanLine } from '../../semicolon';

// Simulates typing ';' at '|' in `line` and returns the resulting line, with '|' at the cursor.
function type(line: string): string {
    const column = line.indexOf('|');
    const text = line.replace('|', '');
    const move = planSemicolon(text, column);
    if (!move) return text.slice(0, column) + ';|' + text.slice(column);
    if (move.alreadyTerminated) return text.slice(0, move.codeLength) + '|' + text.slice(move.codeLength);
    return text.slice(0, move.codeLength) + ';|' + text.slice(move.codeLength);
}

describe('planSemicolon', () => {
    it('moves the semicolon out of the parentheses', () => {
        assert.equal(type('Foo(bar|)'), 'Foo(bar);|');
        assert.equal(type('    Foo(Bar(1|))'), '    Foo(Bar(1));|');
        assert.equal(type('var x = Foo(|)'), 'var x = Foo();|');
        assert.equal(type('Foo(a|, b)'), 'Foo(a, b);|');
    });

    it('keeps trailing whitespace and comments after the semicolon', () => {
        assert.equal(type('Foo(bar|)   '), 'Foo(bar);|   ');
        assert.equal(type('Foo(bar|) // comment'), 'Foo(bar);| // comment');
        assert.equal(type('Foo(bar|) /* comment */'), 'Foo(bar);| /* comment */');
    });

    it('does not duplicate an existing semicolon', () => {
        assert.equal(type('Foo(|);'), 'Foo();|');
        assert.equal(type('Foo(bar|); // done'), 'Foo(bar);| // done');
    });

    it('leaves the semicolon where it was typed outside parentheses', () => {
        assert.equal(type('x = 1|'), 'x = 1;|');
        assert.equal(type('Foo()|'), 'Foo();|');
    });

    it('leaves the semicolon inside for loops', () => {
        assert.equal(type('for (int i = 0|'), 'for (int i = 0;|');
        assert.equal(type('for (int i = 0; i < n|)'), 'for (int i = 0; i < n;|)');
    });

    it('leaves the semicolon inside strings and comments', () => {
        assert.equal(type('Log("a(b|")'), 'Log("a(b;|")');
        assert.equal(type('Log(\'|\')'), 'Log(\';|\')');
        assert.equal(type('// Foo(|)'), '// Foo(;|)');
        assert.equal(type('Foo(/* a|*/)'), 'Foo(/* a;|*/)');
    });

    it('understands escaped and verbatim strings', () => {
        assert.equal(type('Log("\\")"|)'), 'Log("\\")");|');
        assert.equal(type('Log(@"C:\\"|)'), 'Log(@"C:\\");|');
        assert.equal(type('Log(@"say ""hi"")"|)'), 'Log(@"say ""hi"")");|');
        assert.equal(type('Log($@"{x})"|)'), 'Log($@"{x})");|');
    });

    it('ignores comment markers inside strings', () => {
        assert.equal(type('Open("http://a"|)'), 'Open("http://a");|');
    });
});

describe('scanLine', () => {
    it('returns the unclosed parentheses', () => {
        assert.deepEqual(scanLine('a(b(c)(', 7), [1, 6]);
    });

    it('returns null inside a string or comment', () => {
        assert.equal(scanLine('a("b', 4), null);
        assert.equal(scanLine('a // b', 6), null);
    });
});
