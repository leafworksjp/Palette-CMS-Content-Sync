import vscode from 'vscode';
import {SyncWebView} from './SyncWebView';
import {Command} from '../../models/Command';
import {SyncSelection} from '../../../common/types/SyncPlan';
import {Success, Failure} from '../../../common/types/Result';
import {
	CompilationFailureArgs,
	GeneralFailureArgs,
	ValidationFailureArgs,
} from '../../../common/types/ApiResult';

type Selections = Record<string, SyncSelection>;

export class SyncViewController
{
	public readonly webview: SyncWebView;
	private readonly command: Command;

	constructor(context: vscode.ExtensionContext)
	{
		this.webview = new SyncWebView(context.extensionUri);
		this.command = new Command();
		this.webview.onExecute = this.executeSync.bind(this);

		context.subscriptions.push(
			vscode.window.registerWebviewViewProvider(this.webview.id, this.webview)
		);
	}

	public async sync()
	{
		const result = await this.command.syncInit();
		if (result.isFailure())
		{
			await this.showMessages(result);
			return;
		}
		this.webview.initialize(result.value);
	}

	private async executeSync(selections: Selections, subdir: string, url: string)
	{
		this.webview.setExecuting(true);
		const result = await this.command.syncExecute(selections, subdir, url);
		this.webview.setExecuting(false);

		await this.showMessages(result);

		if (result.isSuccess())
		{
			this.webview.clear();
		}
	}

	private async showMessages(
		result:
			| Success<string>
			| Failure<GeneralFailureArgs>
			| Failure<ValidationFailureArgs>
			| Failure<CompilationFailureArgs>
	)
	{
		if (result.isSuccess())
		{
			vscode.window.showInformationMessage(result.value);
		}
		else if (result.isFailure())
		{
			switch (result.error.type)
			{
				case 'ValidationErrorType':
					this.webview.postMessage('setErrors', result.error.messages);
					break;

				case 'CompilationErrorType':
					this.webview.postMessage('setErrors', ['コンパイルエラーが発生しました。']);
					break;

				default:
					vscode.window.showErrorMessage(result.error.message);
					break;
			}
		}
	}

	public dispose()
	{
	}
}
