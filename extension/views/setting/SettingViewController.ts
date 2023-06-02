import vscode from 'vscode';
import {SettingWebView} from './SettingWebView';
import {SettingToolBar} from './SettingToolBar';
import {FileUtil} from '../../models/FileUtil';
import {ContentFile} from '../../models/ContentFile';
import {CodeFile} from '../../models/CodeFile';
import {Failure, Success} from '../../types/Result';
import {GeneralFailureArgs, ValidationFailureArgs} from '../../types/ApiResult';

export class SettingViewController
{
	public readonly webview: SettingWebView;
	public readonly toolBar: SettingToolBar;

	constructor(context: vscode.ExtensionContext)
	{
		this.webview = new SettingWebView(context.extensionUri);
		this.toolBar = new SettingToolBar();

		context.subscriptions.push(
			vscode.window.registerWebviewViewProvider(this.webview.id, this.webview)
		);
	}

	async upload()
	{
		const result = await this.toolBar.upload();
		await this.webview.refresh();

		this.showMessages(result);
	}

	async uploadAll()
	{
		const message = await vscode.window.showInformationMessage(
			'全てのコンテンツをアップロードします。よろしいですか？',
			{title: 'アップロード', isCloseAffordance: false},
			{title: 'キャンセル', isCloseAffordance: true}
		);

		if (!message || message.title !== 'アップロード') return;

		const result = await this.toolBar.uploadAll();
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

		const result = await this.toolBar.download();
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

		const result = await this.toolBar.delete();
		await this.webview.refresh();

		this.showMessages(result);
	}

	async downloadVariables()
	{
		const result = await this.toolBar.downloadVariables();

		this.showMessages(result);
	}

	async downloadDefinitions()
	{
		const result = await this.toolBar.downloadDefinitions();
		await this.webview.refresh();

		this.showMessages(result);
	}

	public async create()
	{
		await this.toolBar.create();
	}

	public async duplicate()
	{
		await this.toolBar.duplicate();
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

		await this.toolBar.changeExtensions(source, target).catch(e => vscode.window.showErrorMessage(e.message));
	}

	public async renameDirectory()
	{
		await this.toolBar.renameDirectory();
	}

	public onDidChangeActiveTextEditor()
	{
		this.webview.refresh();
	}

	public onDidSaveTextDocument(document: vscode.TextDocument)
	{
		if (FileUtil.getBase(document.uri) === ContentFile.fileName)
		{
			this.webview.refresh();
		}
	}

	private showMessages(result: Success<string>|Failure<GeneralFailureArgs>|Failure<ValidationFailureArgs>)
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

				default:
					vscode.window.showErrorMessage(result.error.message);
					break;
			}
		}
	}
}
