import type {TemplateTokenType} from './SemanticTokenType';

export type TemplateToken = {
  type: TemplateTokenType;
  pos: number;
  line: number;
  char: number;
  length: number;
};

type LineCol = {line: number; char: number};

export class TemplateLexer
{
	private input = '';
	private pos = 0;
	private length = 0;

	public tokenize(input: string): TemplateToken[]
	{
		this.input = input;
		this.pos = 0;
		this.length = input.length;

		const tokens: TemplateToken[] = [];

		while (this.pos < this.length)
		{
			if (this.input.startsWith('@#', this.pos))
			{
				const start = this.pos;
				const lc = this.getLineCol(start);
				tokens.push({type: 'SINGLE_COMMENT', pos: this.pos, line: lc.line, char: lc.char, length: 2});
				this.pos += 2;
				const endIdx = this.input.indexOf('\n', this.pos);
				const commentEnd = endIdx === -1 ? this.length : endIdx;
				const len = commentEnd - this.pos;
				if (len > 0)
				{
					const lc2 = this.getLineCol(this.pos);
					tokens.push({type: 'COMMENT', pos: this.pos, line: lc2.line, char: lc2.char, length: len});
				}
				this.pos = commentEnd;
				continue;
			}

			const singleDirectives = [
				{key: '@include:', type: 'SINGLE_INCLUDE', kwLen: 9},
				{key: '@import:', type: 'SINGLE_IMPORT', kwLen: 8},
				{key: '@export:', type: 'SINGLE_EXPORT', kwLen: 8},
			] as const;
			let matchedSingleDirective = false;
			for (const directive of singleDirectives)
			{
				if (this.input.startsWith(directive.key, this.pos))
				{
					const start = this.pos;
					const lc = this.getLineCol(start);
					tokens.push({type: directive.type, pos: this.pos, line: lc.line, char: lc.char, length: directive.kwLen});
					this.pos += directive.kwLen;
					const semiIdx = this.input.indexOf(';', this.pos);
					const exprEnd = semiIdx === -1 ? this.length : (semiIdx + 1);
					const exprLen = exprEnd - this.pos;
					if (exprLen > 0)
					{
						const lc2 = this.getLineCol(this.pos);
						tokens.push({type: 'EXPRESSION', pos: this.pos, line: lc2.line, char: lc2.char, length: exprLen});
						this.pos += exprLen;
					}
					matchedSingleDirective = true;
					break;
				}
			}
			if (matchedSingleDirective) continue;

			if (this.input.startsWith('@code:', this.pos))
			{
				const start = this.pos;
				const lc = this.getLineCol(start);
				tokens.push({type: 'SINGLE_CODE', pos: this.pos, line: lc.line, char: lc.char, length: 6});
				this.pos += 6;
				const semiIdx = this.input.indexOf(';', this.pos);
				const exprEnd = semiIdx === -1 ? this.length : (semiIdx + 1);
				const exprLen = exprEnd - this.pos;
				if (exprLen > 0)
				{
					const lc2 = this.getLineCol(this.pos);
					tokens.push({type: 'EXPRESSION', pos: this.pos, line: lc2.line, char: lc2.char, length: exprLen});
					this.pos += exprLen;
				}
				continue;
			}

			if (this.input.startsWith('@code', this.pos))
			{
				const start = this.pos;
				const lc = this.getLineCol(start);
				tokens.push({type: 'CODE', pos: this.pos, line: lc.line, char: lc.char, length: 5});
				this.pos += 5;
				const endKeyword = '@endcode';
				const endIdx = this.input.indexOf(endKeyword, this.pos);
				const exprEnd = endIdx === -1 ? this.length : endIdx;
				const exprLen = exprEnd - this.pos;
				if (exprLen > 0)
				{
					const lc2 = this.getLineCol(this.pos);
					tokens.push({type: 'EXPRESSION', pos: this.pos, line: lc2.line, char: lc2.char, length: exprLen});
					this.pos += exprLen;
				}
				if (endIdx !== -1)
				{
					const lc3 = this.getLineCol(endIdx);
					tokens.push({type: 'ENDCODE', pos: endIdx, line: lc3.line, char: lc3.char, length: endKeyword.length});
					this.pos += endKeyword.length;
					continue;
				}
			}

			const directives = [
				{key: '@include', type: 'INCLUDE', kwLen: 8},
				{key: '@elseif', type: 'ELSEIF', kwLen: 7},
				{key: '@if', type: 'IF', kwLen: 3},
				{key: '@for', type: 'FOR', kwLen: 4},
			] as const;
			let matched = false;
			for (const directive of directives)
			{
				if (this.input.startsWith(directive.key, this.pos))
				{
					const start = this.pos;
					const lc = this.getLineCol(start);
					tokens.push({type: directive.type, pos: this.pos, line: lc.line, char: lc.char, length: directive.kwLen});
					this.pos += directive.kwLen;
					while (this.pos < this.length && /\s/.test(this.input[this.pos])) this.pos++;
					if (this.input[this.pos] === '(')
					{
						const exprStart = this.pos;
						const {line, char, length} = this.readBalanced('(', ')');

						tokens.push({type: 'EXPRESSION', pos: exprStart, line, char, length});
					}

					matched = true;
					break;
				}
			}
			if (matched) continue;

			if (this.input.startsWith('@else', this.pos))
			{
				const start = this.pos;
				const lc = this.getLineCol(start);
				tokens.push({type: 'ELSE', pos: this.pos, line: lc.line, char: lc.char, length: 5});
				this.pos += 5;
				continue;
			}

			if (this.input.startsWith('@endinclude', this.pos))
			{
				const kw = '@endinclude';
				const start = this.pos;
				const lc = this.getLineCol(start);
				tokens.push({type: 'ENDINCLUDE', pos: this.pos, line: lc.line, char: lc.char, length: kw.length});
				this.pos += kw.length;
				continue;
			}

			if (this.input.startsWith('@children', this.pos))
			{
				const kw = '@children';
				const start = this.pos;
				const lc = this.getLineCol(start);
				tokens.push({type: 'CHILDREN', pos: this.pos, line: lc.line, char: lc.char, length: kw.length});
				this.pos += kw.length;
				continue;
			}

			if (this.input.startsWith('@endif', this.pos))
			{
				const kw = '@endif';
				const start = this.pos;
				const lc = this.getLineCol(start);
				tokens.push({type: 'ENDIF', pos: this.pos, line: lc.line, char: lc.char, length: kw.length});
				this.pos += kw.length;
				continue;
			}

			if (this.input.startsWith('@endfor', this.pos))
			{
				const kw = '@endfor';
				const start = this.pos;
				const lc = this.getLineCol(start);
				tokens.push({type: 'ENDFOR', pos: this.pos, line: lc.line, char: lc.char, length: kw.length});
				this.pos += kw.length;
				continue;
			}

			if (this.input.startsWith('{{', this.pos))
			{
				const start = this.pos;
				const lc = this.getLineCol(start);
				tokens.push({type: 'OPEN_OUTPUT', pos: this.pos, line: lc.line, char: lc.char, length: 2});
				this.pos += 2;
				const closeIdx = this.input.indexOf('}}', this.pos);
				const exprEnd = closeIdx === -1 ? this.length : closeIdx;
				const len = exprEnd - this.pos;
				if (len > 0)
				{
					const lc2 = this.getLineCol(this.pos);
					tokens.push({type: 'EXPRESSION', pos: this.pos, line: lc2.line, char: lc2.char, length: len});
				}
				if (closeIdx !== -1)
				{
					const lc3 = this.getLineCol(closeIdx);
					tokens.push({type: 'CLOSE_OUTPUT', pos: this.pos + len, line: lc3.line, char: lc3.char, length: 2});
					this.pos = closeIdx + 2;
				}
				continue;
			}

			const start = this.pos;
			const lc = this.getLineCol(start);

			this.readUntil([
				//'\n',
				'@#',
				'@include:',
				'@import:',
				'@export:',
				'@include',
				'@children',
				'@code:',
				'@code',
				'@elseif',
				'@else',
				'@if',
				'@for',
				'@endif',
				'@endfor',
				'@endinclude',
				'{{',
			]);

			const len = this.pos - start;
			if (len > 0)
			{
				tokens.push({type: 'TEXT', pos: start, line: lc.line, char: lc.char, length: len});
			}
		}

		return tokens;
	}

	private readUntil(tokens: string[])
	{
		while (this.pos < this.length && !tokens.some(token => this.input.startsWith(token, this.pos)))
		{
			this.pos++;
		}
	}

	private readBalanced(start: string, end: string)
	{
		const exprStart = this.pos;
		let exprPos = this.pos;
		let depth = 1;
		let inString = false;
		let escape = false;
		let quotation = '';
		exprPos++;
		while (exprPos < this.length && depth > 0)
		{
			const char = this.input[exprPos];

			if (inString)
			{
				if (escape)
				{
					escape = false;
				}
				else if (char === '\\')
				{
					escape = true;
				}
				else if (char === quotation)
				{
					inString = false;
				}
			}
			else
			if (char === '"' || char === "'")
			{
				inString = true;
				quotation = char;
			}
			else if (char === start)
			{
				depth++;
			}
			else if (char === end)
			{
				depth--;
			}

			exprPos++;
		}
		const len = exprPos - exprStart;
		const lc2 = this.getLineCol(exprStart);
		this.pos = exprPos;

		return {line: lc2.line, char: lc2.char, length: len};
	}

	private getLineCol(pos: number): LineCol
	{
		const before = this.input.slice(0, pos);
		const lines = before.split('\n');
		const line = lines.length - 1;
		const char = lines[lines.length - 1].length;
		return {line, char};
	}
}
