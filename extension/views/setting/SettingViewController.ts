import vscode from 'vscode';
import {SettingWebView} from './SettingWebView';
import {Command} from '../../models/Command';
import {FileUtil} from '../../models/FileUtil';
import {ContentFile} from '../../models/ContentFile';
import {CodeFile} from '../../models/CodeFile';
import {Failure, Success} from '../../../common/types/Result';
import {
	CompilationFailureArgs,
	GeneralFailureArgs,
	ValidationFailureArgs,
} from '../../../common/types/ApiResult';

export class SettingViewController
{
	public readonly webview: SettingWebView;
	public readonly command: Command;

	constructor(context: vscode.ExtensionContext)
	{
		this.webview = new SettingWebView(context.extensionUri);
		this.command = new Command();

		context.subscriptions.push(
			vscode.window.registerWebviewViewProvider(this.webview.id, this.webview)
		);
	}

	public dispose()
	{
	}

	async upload()
	{
		const result = await this.command.upload();
		await this.webview.refresh();

		if (result.isFailure())
		{
			this.showMessages(result);
		}
	}

	async uploadAll()
	{
		const message = await vscode.window.showInformationMessage(
			'全てのコンテンツをアップロードします。よろしいですか？',
			{title: 'アップロード', isCloseAffordance: false},
			{title: 'キャンセル', isCloseAffordance: true}
		);

		if (!message || message.title !== 'アップロード') return;

		const result = await this.command.uploadAll();
		await this.webview.refresh();

		this.showMessages(result);
	}

	async download()
	{
		const message = await vscode.window.showInformationMessage(
			'未アップロードの変更は失われます。よろしいですか？',
			{title: 'ダウンロード', isCloseAffordance: false},
			{title: 'キャンセル', isCloseAffordance: true}
		);

		if (!message || message.title !== 'ダウンロード') return;

		const result = await this.command.download();
		await this.webview.refresh();

		this.showMessages(result);
	}

	async delete()
	{
		const message = await vscode.window.showInformationMessage(
			'サーバーのコンテンツも削除されます。よろしいですか？',
			{title: '削除', isCloseAffordance: false},
			{title: 'キャンセル', isCloseAffordance: true}
		);

		if (!message || message.title !== '削除') return;

		const result = await this.command.delete();
		await this.webview.refresh();

		this.showMessages(result);
	}

	async downloadSnippets()
	{
		const result = await this.command.downloadSnippets();

		this.showMessages(result);
	}

	async downloadVariables()
	{
		const result = await this.command.downloadVariables();

		this.showMessages(result);
	}

	async downloadDefinitions()
	{
		const result = await this.command.downloadDefinitions();
		await this.webview.refresh();

		this.showMessages(result);
	}

	public async create()
	{
		await this.command.create();
	}

	public async duplicate()
	{
		await this.command.duplicate();
	}

	public async changeLanguage()
	{
		const extensions = [...CodeFile.extensions.keys()];

		const source = await vscode.window.showQuickPick(extensions, {
			placeHolder: '変換元の言語を選択してください。',
		});

		if (!source) return;

		const target = await vscode.window.showQuickPick(extensions.filter(ext => ext !== source), {
			placeHolder: '変換先の言語を選択してください。',
		});

		if (!target) return;

		await this.command.changeExtensions(source, target).catch(e => vscode.window.showErrorMessage(e.message));
	}

	public async renameDirectory()
	{
		await this.command.renameDirectory();
	}

	public onDidChangeActiveTextEditor()
	{
		this.webview.refresh();
	}

	public async onDidSaveTextDocument(document: vscode.TextDocument)
	{
		const config = vscode.workspace.getConfiguration('paletteCMSContentSync');
		const uploadOnSave = config.get<boolean>('uploadOnSave', false);

		if (uploadOnSave)
		{
			const content = await ContentFile.read();
			if (content)
			{
				await this.upload();
			}
		}

		if (FileUtil.getBase(document.uri) === ContentFile.fileName)
		{
			await this.webview.refresh();
		}
	}

	private showMessages(
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
					CodeFile.appendCompileErrors(result.error.errors);
					break;

				default:
					vscode.window.showErrorMessage(result.error.message);
					break;
			}
		}
	}
}
