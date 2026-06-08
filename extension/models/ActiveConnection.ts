import vscode from 'vscode';
import {Version} from '../../common/types/Version';

type ConnectionValue = {
	url?: string;
	subdir?: string;
};

export abstract class ActiveConnection
{
	abstract readonly version: Version;

	public abstract get current(): string | undefined;
	public abstract get subdir(): string | undefined;
}

export class ActiveConnectionV1 extends ActiveConnection
{
	readonly version = 1 as const;

	constructor(private readonly url: string | undefined)
	{
		super();
	}

	public get current(): string | undefined
	{
		return this.url;
	}

	public get subdir(): undefined
	{
		return undefined;
	}
}

export class ActiveConnectionV2 extends ActiveConnection
{
	public static readonly configSection = 'paletteCMSContentSync';
	public static readonly configKey = 'connection';

	readonly version = 2 as const;

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
		.getConfiguration(ActiveConnectionV2.configSection)
		.update(ActiveConnectionV2.configKey, value, vscode.ConfigurationTarget.Workspace);
	}

	private read(): ConnectionValue
	{
		const value = vscode.workspace
		.getConfiguration(ActiveConnectionV2.configSection)
		.get<ConnectionValue>(ActiveConnectionV2.configKey);

		return value ?? {};
	}
}
