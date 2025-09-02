import * as vscode from 'vscode';
import {TemplateFormatter} from './DSL/TemplateFormatter';

export class HTMLFormattingProvider implements vscode.DocumentFormattingEditProvider
{
	async provideDocumentFormattingEdits(
		document: vscode.TextDocument
	): Promise<vscode.TextEdit[]>
	{
		const text = document.getText();
		const formatted = await new TemplateFormatter('html').format(text);

		const fullRange = new vscode.Range(
			document.positionAt(0),
			document.positionAt(text.length)
		);

		return [vscode.TextEdit.replace(fullRange, formatted)];
	}
}

export class HTMLFormatter
{
	private provider: vscode.Disposable | undefined;
	private documentSelector = [
		{scheme: 'file', language: 'html'},
	];

	public constructor()
	{
		this.provider = vscode.languages.registerDocumentFormattingEditProvider(
			this.documentSelector,
			new HTMLFormattingProvider()
		);
	}

	public dispose()
	{
		this.provider?.dispose();
		this.provider = undefined;
	}
}
