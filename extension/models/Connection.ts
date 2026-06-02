import vscode from 'vscode';

type ConnectionValue = {
	url?: string;
	subdir?: string;
};

export class Connection implements vscode.Disposable
{
	private static readonly configSection = 'paletteCMSContentSync';
	private static readonly configKey = 'connection';

	private readonly item: vscode.StatusBarItem;
	private readonly configListener: vscode.Disposable;

	public constructor()
	{
		this.item = vscode.window.createStatusBarItem(
			vscode.StatusBarAlignment.Left,
			9999
		);
		this.item.command = 'paletteCmsContentSync.selectConnection';
		this.item.tooltip = '接続先をクリックして変更';
		this.item.show();

		this.configListener = vscode.workspace.onDidChangeConfiguration(e =>
		{
			if (e.affectsConfiguration(`${Connection.configSection}.${Connection.configKey}`))
			{
				this.refreshDisplay();
			}
		});

		this.refreshDisplay();
	}

	public get current(): string | undefined
	{
		return this.read().url || undefined;
	}

	public get subdir(): string | undefined
	{
		return this.read().subdir || undefined;
	}

	public async set(value: ConnectionValue): Promise<void>
	{
		await vscode.workspace
		.getConfiguration(Connection.configSection)
		.update(Connection.configKey, value, vscode.ConfigurationTarget.Workspace);
	}

	private read(): ConnectionValue
	{
		const value = vscode.workspace
		.getConfiguration(Connection.configSection)
		.get<ConnectionValue>(Connection.configKey);

		return value ?? {};
	}

	private refreshDisplay(): void
	{
		const name = this.current;
		this.item.text = name ? `$(server) ${name}` : '$(server) 接続先未選択';
	}

	public dispose()
	{
		this.configListener.dispose();
		this.item.dispose();
	}
}
