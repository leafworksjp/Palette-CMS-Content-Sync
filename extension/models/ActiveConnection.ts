import vscode from 'vscode';

type ConnectionValue = {
	url?: string;
	subdir?: string;
};

export class ActiveConnection
{
	public static readonly configSection = 'paletteCMSContentSync';
	public static readonly configKey = 'connection';

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
		.getConfiguration(ActiveConnection.configSection)
		.update(ActiveConnection.configKey, value, vscode.ConfigurationTarget.Workspace);
	}

	private read(): ConnectionValue
	{
		const value = vscode.workspace
		.getConfiguration(ActiveConnection.configSection)
		.get<ConnectionValue>(ActiveConnection.configKey);

		return value ?? {};
	}
}
