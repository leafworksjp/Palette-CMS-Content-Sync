import vscode from 'vscode';
import {SyncHtml} from './SyncHtml';

export class SyncWebView implements vscode.WebviewViewProvider
{
	public readonly id = 'paletteCmsContentSync.syncView';

	private webview?: vscode.Webview;

	constructor(
		private readonly extensionUri: vscode.Uri
	)
	{
	}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		token: vscode.CancellationToken
	)
	{
		this.webview = webviewView.webview;

		this.webview.options = {
			enableScripts: true,
			localResourceRoots: [this.extensionUri]
		};

		this.webview.onDidReceiveMessage(this.handleMessage.bind(this));

		this.webview.html = SyncHtml.get(this.webview, this.extensionUri);
	}

	private async handleMessage(message: unknown)
	{
	}
}
