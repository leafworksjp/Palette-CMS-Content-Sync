import vscode from 'vscode';
import {SyncHtml} from './SyncHtml';
import {SyncDiff, SyncSelection, zSyncSelection} from '../../../common/types/SyncPlan';

type Selections = Record<string, SyncSelection>;

export class SyncWebView implements vscode.WebviewViewProvider
{
	public readonly id = 'paletteCmsContentSync.syncView';

	public onExecute?: (selections: Selections) => Promise<void>;

	private webview?: vscode.Webview;

	private diffs: SyncDiff[] | undefined;
	private selections: Selections = {};
	private executing: boolean = false;
	private subdir: string = '';
	private url: string = '';

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

	public initialize(args: {diffs: SyncDiff[], selections: Selections, subdir: string, url: string}): void
	{
		this.diffs = args.diffs;
		this.selections = args.selections;
		this.subdir = args.subdir;
		this.url = args.url;
		this.executing = false;
		this.refresh();
	}

	public setExecuting(value: boolean): void
	{
		this.executing = value;
		this.refresh();
	}

	private refresh(): void
	{
		this.webview?.postMessage({
			command: 'refresh',
			diffs: this.diffs,
			selections: this.selections,
			subdir: this.subdir,
			url: this.url,
			executing: this.executing,
		});
	}

	private async handleMessage(message: any)
	{
		if (!this.webview) return;

		switch (message.command)
		{
			case 'onLoad':
				this.refresh();
				break;
			case 'updateSelection':
				{
					const pageId = String(message.pageId);
					const selectionResult = zSyncSelection.safeParse(message.selection);
					if (!selectionResult.success) break;

					this.selections = {...this.selections, [pageId]: selectionResult.data};
					this.refresh();
				}
				break;
			case 'execute':
				await this.onExecute?.(this.selections);
				break;
			default:
				break;
		}
	}
}
