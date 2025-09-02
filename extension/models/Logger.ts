import * as vscode from 'vscode';

export class Logger
{
	private channel: vscode.OutputChannel;

	public constructor()
	{
		this.channel = vscode.window.createOutputChannel('Palette CMS Content Sync');
	}

	public dispose()
	{
		this.channel.dispose();
	}

	public log(...args: unknown[])
	{
		this.channel.appendLine(args.map(arg => this.stringify(arg)).join(' '));
	}

	public error(...args: unknown[])
	{
		this.channel.appendLine('[Error]');
		for (const arg of args)
		{
			this.channel.appendLine(this.stringify(arg));
		}
	}

	public show()
	{
		this.channel.show();
	}

	private stringify(arg: unknown): string
	{
		if (arg instanceof Error)
		{
			return `${arg.message}\n${arg.stack ?? ''}`;
		}
		else if (typeof arg === 'object')
		{
			try
			{
				return JSON.stringify(arg, null, 2);
			}
			catch
			{
				return String(arg);
			}
		}
		else
		{
			return String(arg);
		}
	}
}
