import vscode from 'vscode';
import {ActiveConnection, ActiveConnectionV2} from './ActiveConnection';

export class ConnectionStatusBar
{
	private readonly item: vscode.StatusBarItem;
	private readonly configListener: vscode.Disposable | undefined;

	public constructor(private readonly activeConnection: ActiveConnection)
	{
		this.item = vscode.window.createStatusBarItem(
			vscode.StatusBarAlignment.Left,
			9999
		);
		this.item.command = 'paletteCmsContentSync.selectConnection';
		this.item.tooltip = '接続先をクリックして変更';
		this.item.show();
		this.refresh();

		if (!(activeConnection instanceof ActiveConnectionV2)) return;
		this.configListener = vscode.workspace.onDidChangeConfiguration(e =>
		{
			if (!e.affectsConfiguration(`${activeConnection.configSection}.${activeConnection.configKey}`)) return;
			this.refresh();
		});
	}

	public dispose(): void
	{
		this.configListener?.dispose();
		this.item.dispose();
	}

	private refresh(): void
	{
		const name = this.activeConnection.current;
		this.item.text = name ? `$(server) ${name}` : '$(server) 接続先未選択';
	}
}
