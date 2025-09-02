import * as vscode from 'vscode';
import {ExpressionLexer} from './DSL/ExpressionLexer';
import {tokenToIndex} from './DSL/SemanticTokenType';
import {TemplateLexer} from './DSL/TemplateLexer';

const legend = new vscode.SemanticTokensLegend(
	[
		'keyword',
		'string',
		'number',
		'operator',
		'variable',
		'constant',
		'function',
		'property',
		'type',
		'comment',
		'namespace',
		'tag',
		'attribute',
	],
	[]
);

class PaletteSemanticTokenProvider implements vscode.DocumentSemanticTokensProvider
{
	async provideDocumentSemanticTokens(
		document: vscode.TextDocument
	): Promise<vscode.SemanticTokens>
	{
		const tokensBuilder = new vscode.SemanticTokensBuilder(legend);
		const text = document.getText();
		const templateTokens = new TemplateLexer().tokenize(text);

		for (const t of templateTokens)
		{
			const {line, char, length, type} = t;
			if (type === 'EXPRESSION')
			{
				const startOffset = document.offsetAt(new vscode.Position(line, char));
				const exprText = text.substring(startOffset, startOffset + length);

				const exprTokens = ExpressionLexer.tokenize(exprText, line, char);
				for (const et of exprTokens)
				{
					const idx = tokenToIndex(et.type);
					if (idx !== undefined)
					{
						tokensBuilder.push(et.line, et.char, et.length, idx);
					}
				}
			}
			else
			{
				const idx = tokenToIndex(type);
				if (idx !== undefined)
				{
					tokensBuilder.push(line, char, length, idx);
				}
			}
		}

		return tokensBuilder.build();
	}
}

export class PaletteSyntaxHighlighting
{
	private provider?: vscode.Disposable;

	constructor(private context: vscode.ExtensionContext)
	{
		const semanticTokenProvider = new PaletteSemanticTokenProvider();

		this.provider = vscode.languages.registerDocumentSemanticTokensProvider(
			{language: 'html'},
			semanticTokenProvider,
			legend
		);
	}

	public dispose()
	{
		this.provider?.dispose();
	}
}
