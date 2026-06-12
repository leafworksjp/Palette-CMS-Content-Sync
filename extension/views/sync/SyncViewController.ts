import vscode from 'vscode';
import {SyncWebView} from './SyncWebView';

export class SyncViewController
{
	public readonly webview: SyncWebView;

	constructor(context: vscode.ExtensionContext)
	{
		this.webview = new SyncWebView(context.extensionUri);

		context.subscriptions.push(
			vscode.window.registerWebviewViewProvider(this.webview.id, this.webview)
		);
	}

	public dispose()
	{
	}
}
