import type {ExpressionTokenType} from './SemanticTokenType';

export type ExpressionToken = {
  type: ExpressionTokenType;
  line: number;
  char: number;
  length: number;
};

export class ExpressionLexer
{
	private static keywords = new Set([
		'let',
		'mut',
		'do',
		'if',
		'elseif',
		'else',
		'for',
		'in',
		'with',
		'from',
		'as',
	]);
	private static literals = new Set([
		'true',
		'false',
		'null',
	]);
	private static operators = [
		'?->',
		'===',
		'!==',
		'...',
		'??',
		'?.',
		'?:',
		'|>',
		'==',
		'!=',
		'<=',
		'>=',
		'&&',
		'||',
		'++',
		'--',
		'..',
		'->',
		'=>',
		'>',
		'<',
		'+',
		'-',
		'*',
		'/',
		'%',
		'=',
		'!',
		'.',
		'?',
		':',
		'|',
		'&',
		'^',
		'~',
	];

	public static tokenize(
		expr: string,
		line: number,
		char: number
	): ExpressionToken[]
	{
		const tokens: ExpressionToken[] = [];
		let pos = 0;

		while (pos < expr.length)
		{
			const ch = expr[pos];

			if (ch === '\n')
			{
				line++;
				char = 0;
				pos++;
				continue;
			}

			if (/\s/.test(ch))
			{
				pos++;
				char++;
				continue;
			}

			if (expr.startsWith('//', pos))
			{
				const commentStart = pos;
				const endIdx = expr.indexOf('\n', pos + 2);
				const commentEnd = endIdx >= 0 ? endIdx : expr.length;
				const commentText = expr.slice(commentStart, commentEnd);
				tokens.push({
					type: 'COMMENT',
					line,
					char,
					length: commentText.length,
				});
				char += commentText.length;
				pos = commentEnd;
				continue;
			}

			if (expr.startsWith('/*', pos))
			{
				const commentStart = pos;
				const endIdx = expr.indexOf('*/', pos + 2);
				const commentEnd = endIdx >= 0 ? endIdx + 2 : expr.length;
				const commentText = expr.slice(commentStart, commentEnd);
				const parts = commentText.split('\n');
				parts.forEach((part, idx) =>
				{
					if (idx > 0)
					{
						line++;
						char = 0;
					}

					tokens.push({
						type: 'COMMENT',
						line,
						char,
						length: part.length,
					});
					char += part.length;
				});
				pos = commentEnd;
				continue;
			}

			if (ch === '"' || ch === "'")
			{
				const quote = ch;
				let i = pos + 1;
				while (i < expr.length)
				{
					if (expr[i] === '\\')
					{
						i += 2;
						continue;
					}
					if (expr[i] === quote)
					{
						i++;
						break;
					}
					i++;
				}
				const length = i - pos;
				tokens.push({type: 'STRING', line, char, length});
				char += length;
				pos = i;
				continue;
			}

			if (/\d/.test(ch))
			{
				let i = pos;
				while (i < expr.length && /[0-9]/.test(expr[i])) i++;
				if (expr[i] === '.' && /[0-9]/.test(expr[i + 1] ?? ''))
				{
					i++;
					while (i < expr.length && /[0-9]/.test(expr[i])) i++;
				}
				const length = i - pos;
				tokens.push({type: 'NUMBER', line, char, length});
				char += length;
				pos = i;
				continue;
			}

			if (/[a-zA-Z_]/.test(ch))
			{
				let i = pos;
				while (i < expr.length && /[\w]/.test(expr[i])) i++;
				const value = expr.slice(pos, i);
				const tokenType = this.literals.has(value) ? 'LITERAL' : this.keywords.has(value) ? 'KEYWORD' : 'IDENT';
				const length = i - pos;
				tokens.push({type: tokenType, line, char, length});
				char += length;
				pos = i;
				continue;
			}

			let matched = false;
			for (const op of this.operators)
			{
				if (expr.startsWith(op, pos))
				{
					tokens.push({type: 'OPERATOR', line, char, length: op.length});
					char += op.length;
					pos += op.length;
					matched = true;
					break;
				}
			}
			if (matched) continue;

			char++;
			pos++;
		}

		return tokens;
	}
}
