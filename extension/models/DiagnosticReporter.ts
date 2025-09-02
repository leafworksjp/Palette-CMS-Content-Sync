import * as vscode from 'vscode';
import {getLogger} from './Services';

export class DiagnosticReporter
{
	private collection: vscode.DiagnosticCollection;

	public constructor()
	{
		this.collection = vscode.languages.createDiagnosticCollection('Palette CMS Content Sync');
	}

	public report(uri: vscode.Uri, diagnostics: vscode.Diagnostic[])
	{
		this.collection.set(uri, diagnostics);
	}

	public clear(uri?: vscode.Uri)
	{
		if (uri)
		{
			this.collection.delete(uri);
		}
		else
		{
			this.collection.clear();
		}
	}

	public dispose()
	{
		this.collection?.dispose();
	}

	public async reportError(uri: vscode.Uri, message: string, lineIndex: number): Promise<void>
	{
		try
		{
			const document = await vscode.workspace.openTextDocument(uri);
			if (lineIndex >= document.lineCount) return;

			const line = document.lineAt(lineIndex);
			const diagnostic = new vscode.Diagnostic(
				line.range,
				message,
				vscode.DiagnosticSeverity.Error
			);

			this.report(uri, [diagnostic]);
		}
		catch (error)
		{
			getLogger().error(`[DiagnosticReporter] Failed to load document for URI: ${uri.fsPath}`, error);
		}
	}
}
