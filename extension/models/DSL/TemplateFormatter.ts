import * as prettier from 'prettier';
import {TemplateLexer, TemplateToken} from './TemplateLexer';

type LineCol = {line: number; char: number};

class HTMLTemplateFormatter
{
	private input = '';
	private tokens: TemplateToken[] = [];
	private saved: string[] = [];
	private protected = '';
	private restored = '';
	private pos = 0;
	private id = 0;

	public async format(input: string): Promise<string>
	{
		this.input = input;

		this.tokens = new TemplateLexer().tokenize(this.input);
		//console.log('=== tokens ===\n', this.tokens);

		while (this.pos < this.tokens.length)
		{
			this.parseToken();
		}

		console.log('=== expressions ===\n', this.saved);

		console.log('=== protected ===\n', this.protected);

		this.restored = await this.applyHTMLFormatter(this.protected);

		console.log('=== formatted ===\n', this.restored);

		await this.restoreTokens();

		console.log('=== restored ===\n', this.restored);

		return this.restored;
	}

	private parseToken(): void
	{
		switch (this.tokens[this.pos].type)
		{
			case 'TEXT':
				this.parseTextToken();
				break;

			case 'OPEN_OUTPUT':
				this.parseOutputToken();
				break;

			case 'CODE':
				this.parseCodeToken();
				break;

			case 'SINGLE_INCLUDE':
				this.parseSingleLineIncludeToken();
				break;

			case 'SINGLE_EXPORT':
				this.parseSingleLineExportToken();
				break;

			case 'SINGLE_IMPORT':
				this.parseSingleLineImportToken();
				break;

			case 'SINGLE_CODE':
				this.parseSingleLineCodeToken();
				break;

			case 'INCLUDE':
				this.parseIncludeToken();
				break;

			case 'FOR':
				this.parseForToken();
				break;

			case 'IF':
				this.parseIfToken();
				break;

			case 'CHILDREN':
				this.parseChildrenToken();
				break;

			case 'SINGLE_COMMENT':
				this.parseCommentToken();
				break;

			default:
				this.pos++;
				break;
		}
	}

	private parseExpression(): undefined | number
	{
		const token = this.tokens[this.pos];

		if (token?.type === 'EXPRESSION')
		{
			const id = this.id;
			const expressionToken = token;
			const originalExpression = this.input.slice(expressionToken.pos, expressionToken.pos + expressionToken.length);
			this.saved.push(originalExpression);
			this.pos++;
			this.id++;

			return id;
		}
		else
		{
			return undefined;
		}
	}

	private parseTextToken(): void
	{
		const token = this.tokens[this.pos];

		this.protected += this.input.slice(token.pos, token.pos + token.length);
		this.pos++;
	}

	private parseOutputToken(): void
	{
		this.pos++;
		this.protected += '{{';

		const exprToken = this.tokens[this.pos];
		if (exprToken?.type === 'EXPRESSION')
		{
			const originalExpression = this.input.slice(exprToken.pos, exprToken.pos + exprToken.length);
			this.saved.push(originalExpression);
			this.protected += `__EXPR_${this.id}__`;
			this.id++;
			this.pos++;
		}

		if (this.tokens[this.pos]?.type === 'CLOSE_OUTPUT')
		{
			this.pos++;
			this.protected += '}}';
		}
	}

	private parseCodeToken(): void
	{
		this.pos++;
		this.protected += '<template-code>\n';

		if (this.tokens[this.pos]?.type === 'EXPRESSION')
		{
			this.protected += `<template-expr data-id="${this.parseExpression() ?? ''}" />\n`;
		}

		if (this.tokens[this.pos]?.type === 'ENDCODE')
		{
			this.pos++;
			this.protected += '</template-code>';
		}
	}

	private parseSingleLineIncludeToken(): void
	{
		this.pos++;
		this.protected += `<template-include data-id="${this.parseExpression() ?? ''}" />`;
	}

	private parseSingleLineExportToken(): void
	{
		this.pos++;
		this.protected += `<template-export data-id="${this.parseExpression() ?? ''}" />`;
	}

	private parseSingleLineImportToken(): void
	{
		this.pos++;
		this.protected += `<template-import data-id="${this.parseExpression() ?? ''}" />`;
	}

	private parseSingleLineCodeToken(): void
	{
		this.pos++;
		this.protected += `<template-code data-id="${this.parseExpression() ?? ''}" />`;
	}

	private parseChildrenToken(): void
	{
		this.pos++;
		this.protected += '<template-children />';
	}

	private parseIncludeToken(): void
	{
		this.pos++;
		this.protected += `<template-include data-id="${this.parseExpression() ?? ''}">`;

		while (this.pos < this.tokens.length)
		{
			if (this.tokens[this.pos] && this.tokens[this.pos].type === 'ENDINCLUDE')
			{
				this.pos++;
				this.protected += '</template-include>';
				break;
			}
			this.parseToken();
		}
	}

	private parseForToken(): void
	{
		this.pos++;
		this.protected += `<template-for data-id="${this.parseExpression() ?? ''}">`;

		while (this.pos < this.tokens.length)
		{
			if (this.tokens[this.pos] && this.tokens[this.pos].type === 'ENDFOR')
			{
				this.pos++;
				this.protected += '</template-for>';
				break;
			}
			this.parseToken();
		}
	}

	private parseIfToken(): void
	{
		this.pos++;
		this.protected += `<template-if data-id="${this.parseExpression() ?? ''}">`;

		while (this.pos < this.tokens.length)
		{
			const token = this.tokens[this.pos];

			if (token && token.type === 'ELSEIF')
			{
				this.pos++;
				this.protected += `<template-elseif data-id="${this.parseExpression() ?? ''}" />`;
				this.parseToken();
				continue;
			}
			if (token && token.type === 'ELSE')
			{
				this.pos++;
				this.protected += '<template-else />';
				this.parseToken();
				continue;
			}
			if (token && token.type === 'ENDIF')
			{
				this.pos++;
				this.protected += '</template-if>';
				break;
			}
			this.parseToken();
		}
	}

	private parseCommentToken(): void
	{
		this.pos++;

		if (this.tokens[this.pos] && this.tokens[this.pos].type === 'COMMENT')
		{
			const expressionToken = this.tokens[this.pos];
			const originalExpression = this.input.slice(expressionToken.pos, expressionToken.pos + expressionToken.length);

			this.saved.push(originalExpression);
			this.pos++;

			this.protected += `<template-comment data-id="${this.id}" />`;
			this.id++;
		}
		else
		{
			this.protected += '<template-comment data-id="" />';
		}
	}

	private async applyHTMLFormatter(input: string): Promise<string>
	{
		return await prettier.format(input, {
			parser: 'html',
			plugins: [require('prettier/parser-html')],
			printWidth: 100,
		});
	}

	private async applyJavaScriptFormatter(input: string): Promise<string>
	{
		return await prettier.format(input, {
			parser: 'babel',
			printWidth: 100,
			//semi: true,
			singleQuote: true,
			tabWidth: 2,
			useTabs: false,
		});
	}

	private async restoreTokens(): Promise<void>
	{
		this.restoreOutputToken();
		this.restoreSelfClosingIncludeToken();
		this.restoreSelfClosingExportToken();
		this.restoreSelfClosingImportToken();
		this.restoreSelfClosingCodeToken();
		this.restoreSelfClosingChildrenToken();
		this.restoreSelfClosingComment();
		this.restoreIncludeToken();
		this.restoreForToken();
		this.restoreIfToken();

		this.restoreCodeToken();
	}

	private restoreOutputToken(): void
	{
		this.restored = this.restored.replace(/__EXPR_(\d+)__/g, (_, id) =>
		{
			const original = this.saved[Number(id)];
			return original ?? '';
		});
	}

	private restoreCodeToken(): void
	{
		this.restored = this.restored.replace(
			/([ \t]*)<template-code\s*>/g,
			(_, indent) => indent + '@code'
		);
		this.restored = this.restored.replace(
			/<template-expr\s+data-id="(\d*)"\s*\/>/g,
			(_, id) =>
			{
				return (id ? (this.saved[Number(id)] ?? '').trim() : '');
			}
		);
		this.restored = this.restored.replace(
			/<\/template-code>/g,
			'@endcode'
		);
	}

	private restoreSelfClosingIncludeToken(): void
	{
		this.restored = this.restored.replace(
			/([ \t]*)<template-include\s+data-id="(\d*)"\s*\/>/g,
			(_, indent, id) => indent + '@include:' + (id ? (this.saved[Number(id)] ?? '') : '')
		);
	}

	private restoreSelfClosingExportToken(): void
	{
		this.restored = this.restored.replace(
			/([ \t]*)<template-export\s+data-id="(\d*)"\s*\/>/g,
			(_, indent, id) => indent + '@export:' + (id ? (this.saved[Number(id)] ?? '') : '')
		);
	}

	private restoreSelfClosingImportToken(): void
	{
		this.restored = this.restored.replace(
			/([ \t]*)<template-import\s+data-id="(\d*)"\s*\/>/g,
			(_, indent, id) => indent + '@import:' + (id ? (this.saved[Number(id)] ?? '') : '')
		);
	}

	private restoreSelfClosingCodeToken(): void
	{
		this.restored = this.restored.replace(
			/([ \t]*)<template-code\s+data-id="(\d*)"\s*\/>/g,
			(_, indent, id) => indent + '@code:' + (id ? (this.saved[Number(id)] ?? '') : '')
		);
	}

	private restoreSelfClosingChildrenToken(): void
	{
		this.restored = this.restored.replace(
			/<template-children\s*\/>/g,
			'@children'
		);
	}

	private restoreSelfClosingComment(): void
	{
		this.restored = this.restored.replace(
			/([ \t]*)<template-comment\s+data-id="(\d*)"\s*\/>/g,
			(_, indent, id) => indent + '@#' + (id ? (this.saved[Number(id)] ?? '') : '')
		);
	}

	private restoreIncludeToken(): void
	{
		this.restored = this.restored.replace(
			/([ \t]*)<template-include\s+data-id="(\d*)"\s*>/g,
			(_, indent, id) => indent + '@include ' + (id ? (this.saved[Number(id)] ?? '') : '')
		);
		this.restored = this.restored.replace(
			/<\/template-include>/g,
			'@endinclude'
		);
	}

	private restoreForToken(): void
	{
		this.restored = this.restored.replace(
			/([ \t]*)<template-for\s+data-id="(\d*)"\s*>/g,
			(_, indent, id) => indent + '@for ' + (id ? (this.saved[Number(id)] ?? '') : '')
		);
		this.restored = this.restored.replace(
			/<\/template-for>/g,
			'@endfor'
		);
	}

	private restoreIfToken(): void
	{
		this.restored = this.restored.replace(
			/([ \t]*)<template-if\s+data-id="(\d*)"\s*>/g,
			(_, indent, id) => indent + '@if ' + (id ? (this.saved[Number(id)] ?? '') : '')
		);
		this.restored = this.restored.replace(
			/([ \t]*)<template-elseif\s+data-id="(\d*)"\s*\/>/g,
			(_, indent, id) => indent.replace(/^ {2}/, '') + '@elseif ' + (id ? (this.saved[Number(id)] ?? '') : '')
		);
		this.restored = this.restored.replace(
			/([ \t]*)<template-else\s*\/>/g,
			(_, indent) => indent.replace(/^ {2}/, '') + '@else'
		);
		this.restored = this.restored.replace(
			/<\/template-if>/g,
			'@endif'
		);
	}

	private async replaceAsync(str: string, regex: RegExp, asyncFn: (...args: any[]) => Promise<string>): Promise<string>
	{
		const matches = [...str.matchAll(regex)];
		const replacements = await Promise.all(
			matches.map(match => asyncFn(...match))
		);

		let result = '';
		let lastIndex = 0;

		matches.forEach((match, i) =>
		{
			if (match.index === undefined) return;

			result += str.slice(lastIndex, match.index);
			result += replacements[i];
			lastIndex = match.index + match[0].length;
		});

		result += str.slice(lastIndex);
		return result;
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

export class TemplateFormatter
{
	private formatter: HTMLTemplateFormatter | undefined;

	constructor(language: string)
	{
		switch (language)
		{
			case 'html':
				this.formatter = new HTMLTemplateFormatter();
				break;

			default:
				break;
		}
	}

	async format(input: string): Promise<string>
	{
		return this.formatter ? this.formatter.format(input) : input;
	}
}
