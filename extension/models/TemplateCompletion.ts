import * as vscode from 'vscode';
import {CodeFile} from './CodeFile';
import {JsonFile} from './JsonFile';

type Snippet = {
	[key: string]: {
		code: string;
		filter: string;
		documentation: string;
	};
};

export class TemplateCompletion
{
	private providers: vscode.Disposable[] = [];
	private documentSelector = [
		{scheme: 'file', language: 'html'},
		{scheme: 'file', language: 'css'},
		{scheme: 'file', language: 'javascript'},
		{scheme: 'file', language: 'json'},
		{scheme: 'file', language: 'xml'},
	];

	constructor(private context: vscode.ExtensionContext)
	{
		this.refresh();
	}

	public dispose()
	{
		this.providers.forEach(provider => provider.dispose());
		this.providers = [];
	}

	public async refresh()
	{
		this.dispose();

		this.providers.push(
			vscode.languages.registerCompletionItemProvider(
				this.documentSelector,
				{
					provideCompletionItems: (document, position) =>
					{
						const line = document.lineAt(position).text.slice(0, position.character);
						const match = line.match(/@[\w]*$/);
						if (!match) return undefined;
						return this.getCompletionItems();
					}
				},
				'@'
			)
		);

		const data = await this.loadJsonFile();

		if (data)
		{
			const items = this.createCompletionItems(data);

			this.providers.push(
				vscode.languages.registerCompletionItemProvider(
					this.documentSelector,
					{
						provideCompletionItems: () => items
					}
				)
			);
		}

		this.context.subscriptions.push(...this.providers);
	}

	private async loadJsonFile()
	{
		try
		{
			const fileUri = vscode.window.activeTextEditor?.document?.uri;
			if (!fileUri) return undefined;

			const codeType = CodeFile.parseCodeType(fileUri);

			const json = await JsonFile.read('snippets');
			if (!json) return undefined;

			const data = json[codeType];
			if (!data) return undefined;

			return data;
		}
		catch (_)
		{
			return undefined;
		}
	}

	private createCompletionItems(data: Snippet): vscode.CompletionItem[]
	{
		const items: vscode.CompletionItem[] = [];

		for (const [key, value] of Object.entries(data))
		{
			const item = new vscode.CompletionItem(key, vscode.CompletionItemKind.Snippet);
			item.insertText = new vscode.SnippetString(value.code);
			item.filterText = value.filter;
			item.documentation = new vscode.MarkdownString(value.documentation);
			items.push(item);
		}

		return items;
	}

	private getCompletionItems(): vscode.CompletionItem[]
	{
		return [
			this.createForItem1(),
			this.createForItem2(),
			this.createForItem3(),
			this.createIfItem(),
			this.createIfElseIfItem(),
			this.createIfElseIfElseItem(),
			this.createCodeLineItem(),
			this.createCodeBlockItem(),
			this.createCommentItem(),
			this.createIncludeSimple(),
			this.createIncludeWithProps(),
			this.createIncludeWithQuery1(),
			this.createIncludeWithQuery2(),
			this.createIncludeWithQueryAndProps(),
			this.createIncludeWithChildren(),
			this.createIncludeWithChildrenAndProps(),
			this.createChildren(),
		];
	}

	private createForItem1(): vscode.CompletionItem
	{
		const item = new vscode.CompletionItem('for (item)', vscode.CompletionItemKind.Keyword);
		item.insertText = new vscode.SnippetString(
			'for ( let ${1:item} in ${2:collection} )\n\t${0}\n@endfor'
		);
		item.detail = '繰り返し構文（item）';
		item.documentation = new vscode.MarkdownString(
			'要素単位の繰り返し処理です。'
		);
		item.preselect = true;
		return item;
	}

	private createForItem2(): vscode.CompletionItem
	{
		const item = new vscode.CompletionItem('for (key, item)', vscode.CompletionItemKind.Keyword);
		item.insertText = new vscode.SnippetString(
			'for ( let (${1:key}, ${2:item}) in ${3:collection} )\n\t${0}\n@endfor'
		);
		item.detail = '繰り返し構文（key, item）';
		item.documentation = new vscode.MarkdownString(
			'キーと値の両方を使った繰り返し処理です。'
		);
		return item;
	}

	private createForItem3(): vscode.CompletionItem
	{
		const item = new vscode.CompletionItem('for (range)', vscode.CompletionItemKind.Keyword);
		item.insertText = new vscode.SnippetString(
			'for ( let ${1:i} in ${2:0..10} )\n\t${0}\n@endfor'
		);
		item.detail = '繰り返し構文（範囲）';
		item.documentation = new vscode.MarkdownString(
			'数値の範囲を使った繰り返し処理です。'
		);
		return item;
	}

	private createIfItem(): vscode.CompletionItem
	{
		const item = new vscode.CompletionItem('if', vscode.CompletionItemKind.Keyword);
		item.insertText = new vscode.SnippetString(
			'if ( ${1:condition} )\n\t${0}\n@endif'
		);
		item.detail = '条件分岐構文';
		item.documentation = new vscode.MarkdownString(
			'`@if` を使った条件分岐です。'
		);
		item.preselect = true;
		return item;
	}

	private createIfElseIfItem(): vscode.CompletionItem
	{
		const item = new vscode.CompletionItem('if / elseif', vscode.CompletionItemKind.Keyword);
		item.insertText = new vscode.SnippetString(
			'if ( ${1:condition1} )\n\t${2}\n@elseif ( ${3:condition2} )\n\t${0}\n@endif'
		);
		item.detail = '複数条件分岐';
		item.documentation = new vscode.MarkdownString(
			'`@if` と `@elseif` を組み合わせた複数の条件分岐です。'
		);
		return item;
	}

	private createIfElseIfElseItem(): vscode.CompletionItem
	{
		const item = new vscode.CompletionItem('if / elseif / else', vscode.CompletionItemKind.Keyword);
		item.insertText = new vscode.SnippetString(
			'if ( ${1:condition1} )\n\t${2}\n@elseif ( ${3:condition2} )\n\t${4}\n@else\n\t${0}\n@endif'
		);
		item.detail = '複数条件＋else';
		item.documentation = new vscode.MarkdownString(
			'`@if`、`@elseif`、`@else` を組み合わせた複数の条件分岐です。'
		);
		return item;
	}

	private createCodeLineItem(): vscode.CompletionItem
	{
		const item = new vscode.CompletionItem('code:', vscode.CompletionItemKind.Snippet);
		item.insertText = new vscode.SnippetString(
			'code: ${1:let x = 1};'
		);
		item.detail = '単一行コードブロック';
		item.documentation = new vscode.MarkdownString(
			'一行のコードブロックです。'
		);
		return item;
	}

	private createCodeBlockItem(): vscode.CompletionItem
	{
		const item = new vscode.CompletionItem('code (block)', vscode.CompletionItemKind.Snippet);
		item.insertText = new vscode.SnippetString(
			'code\n\t${0}\n@endcode'
		);
		item.detail = '複数行コードブロック';
		item.documentation = new vscode.MarkdownString(
			'複数行のコードブロックです。'
		);
		item.preselect = true;
		return item;
	}

	private createIncludeSimple(): vscode.CompletionItem
	{
		const item = new vscode.CompletionItem('include', vscode.CompletionItemKind.Function);
		item.insertText = new vscode.SnippetString(
			'include: \'${1:template}\';'
		);
		item.detail = 'インクルード（テンプレートの埋め込み）';
		item.documentation = new vscode.MarkdownString(
			'別のテンプレートを埋め込みます。'
		);
		item.preselect = true;
		return item;
	}

	private createIncludeWithProps(): vscode.CompletionItem
	{
		const item = new vscode.CompletionItem('include (pass props)', vscode.CompletionItemKind.Function);
		item.insertText = new vscode.SnippetString(
			'include: \'${1:template}\' with {\n\tprops: {\n\t\t${2:key}: ${3:value},\n\t},\n};'
		);
		item.detail = '引数を渡してインクルード';
		item.documentation = new vscode.MarkdownString(
			'引数を指定して別のテンプレートを埋め込みます。'
		);
		return item;
	}

	private createIncludeWithQuery1(): vscode.CompletionItem
	{
		const item = new vscode.CompletionItem('include (inherit query)', vscode.CompletionItemKind.Function);
		item.insertText = new vscode.SnippetString(
			'include: \'${1:template}\' with {query};'
		);
		item.detail = '検索条件を引き継いでインクルード';
		item.documentation = new vscode.MarkdownString(
			'現在の検索条件を引き継いで、別のテンプレートを埋め込みます。'
		);
		return item;
	}

	private createIncludeWithQuery2(): vscode.CompletionItem
	{
		const item = new vscode.CompletionItem('include (pass query)', vscode.CompletionItemKind.Function);
		item.insertText = new vscode.SnippetString(
			'include: \'${1:template}\' with {\n\tquery: {\n\t\t${2:key}: ${3:value},\n\t},\n};'
		);
		item.detail = '検索条件を渡してインクルード';
		item.documentation = new vscode.MarkdownString(
			'検索条件を指定して、別のテンプレートを埋め込みます。'
		);
		return item;
	}

	private createIncludeWithQueryAndProps(): vscode.CompletionItem
	{
		const item = new vscode.CompletionItem('include (inherit query and pass props)', vscode.CompletionItemKind.Function);
		item.insertText = new vscode.SnippetString(
			'include: \'${1:template}\' with {\n\tquery,\n\tprops: {\n\t\t${2:key}: ${3:value},\n\t},\n};'
		);
		item.detail = '検索条件と引数を渡してインクルード';
		item.documentation = new vscode.MarkdownString(
			'検索条件と引数を指定して、別のテンプレートを埋め込みます。'
		);
		return item;
	}

	private createIncludeWithChildren(): vscode.CompletionItem
	{
		const item = new vscode.CompletionItem('include with children', vscode.CompletionItemKind.Function);
		item.insertText = new vscode.SnippetString(
			'include (\'${1:template}\')\n\t${0}\n@endinclude'
		);
		item.detail = 'インクルード（子要素あり）';
		item.documentation = new vscode.MarkdownString(
			'別のテンプレートを埋め込みます。@include と @endinclude で囲まれた部分は、子要素として扱われます。'
		);
		item.preselect = true;
		return item;
	}

	private createIncludeWithChildrenAndProps(): vscode.CompletionItem
	{
		const item = new vscode.CompletionItem('include with children (pass props)', vscode.CompletionItemKind.Function);
		item.insertText = new vscode.SnippetString(
			'include (\'${1:template}\', {props: {${2:key}: \'${3:value}\'}})\n\t${0}\n@endinclude'
		);
		item.detail = '引数を渡してインクルード（子要素あり）';
		item.documentation = new vscode.MarkdownString(
			'引数を指定して別のテンプレートを埋め込みます。@include と @endinclude で囲まれた部分は、子要素として扱われます。'
		);
		item.preselect = true;
		return item;
	}

	private createChildren(): vscode.CompletionItem
	{
		const item = new vscode.CompletionItem('children', vscode.CompletionItemKind.Function);
		item.insertText = new vscode.SnippetString(
			'children'
		);
		item.detail = '子要素';
		item.documentation = new vscode.MarkdownString(
			'インクルード元のテンプレートから渡された子要素を描画します。'
		);
		item.preselect = true;
		return item;
	}

	private createCommentItem(): vscode.CompletionItem
	{
		const item = new vscode.CompletionItem('# comment', vscode.CompletionItemKind.Text);
		item.insertText = new vscode.SnippetString(
			'# ${0:comment}'
		);
		item.detail = 'コメント行';
		item.documentation = new vscode.MarkdownString(
			'コメントを記述します。出力からは削除されます。'
		);
		item.sortText = 'x comment';
		return item;
	}
}
