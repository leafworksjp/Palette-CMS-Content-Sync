import vscode from 'vscode';
import {SyncWebView} from './SyncWebView';
import {SyncSelection} from '../../../common/types/SyncPlan';

type Selections = Record<string, SyncSelection>;

export class SyncViewController
{
	public readonly webview: SyncWebView;

	constructor(context: vscode.ExtensionContext)
	{
		this.webview = new SyncWebView(context.extensionUri);
		this.webview.onExecute = this.executeSync.bind(this);

		context.subscriptions.push(
			vscode.window.registerWebviewViewProvider(this.webview.id, this.webview)
		);
	}

	public async sync()
	{
	}

	private async executeSync(selections: Selections)
	{
	}

	public dispose()
	{
	}
}
