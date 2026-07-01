import vscode from 'vscode';
import {Version} from '../../common/types/Version';

type ConnectionValue = {
	url?: string;
	subdir?: string;
};

export abstract class ActiveConnection
{
	public static init(version: Version, v1Url?: string): ActiveConnection
	{
		return version === 1
			? new ActiveConnectionV1(v1Url)
			: new ActiveConnectionV2();
	}

	public abstract readonly version: Version;

	public abstract get current(): string | undefined;
	public abstract get subdir(): string | undefined;
}

export class ActiveConnectionV1 extends ActiveConnection
{
	public readonly version = 1 as const;

	public constructor(private readonly url: string | undefined)
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
	public readonly configSection = 'paletteCMSContentSync';
	public readonly configKey = 'connection';

	public readonly version = 2 as const;

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
		.getConfiguration(this.configSection)
		.update(this.configKey, value, vscode.ConfigurationTarget.Workspace);
	}

	private read(): ConnectionValue
	{
		const value = vscode.workspace
		.getConfiguration(this.configSection)
		.get<ConnectionValue>(this.configKey);

		return value ?? {};
	}
}
