import vscode from 'vscode';
import {SettingWebView} from './SettingWebView';
import {Command} from '../../models/Command';
import {Api} from '../../models/Api';
import {FileUtil} from '../../models/FileUtil';
import {LwContent} from '../../models/LwContent';
import {ContentFile} from '../../models/ContentFile';
import {CodeFile} from '../../models/CodeFile';
import {getContentStrategy} from '../../models/Services';
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
			vscode.window.registerWebviewViewProvider(this.webview.id, this.webview),
			vscode.workspace.onDidChangeConfiguration(e =>
			{
				if (e.affectsConfiguration('paletteCMSContentSync.connection'))
				{
					this.webview.refresh();
				}
			})
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
			await this.showMessages(result);
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

		await this.showMessages(result);
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

		await this.showMessages(result);
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

		await this.showMessages(result);
	}

	async downloadSnippets()
	{
		const result = await this.command.downloadSnippets();

		await this.showMessages(result);
	}

	async downloadVariables()
	{
		const result = await this.command.downloadVariables();

		await this.showMessages(result);
	}

	async downloadDefinitions()
	{
		const result = await this.command.downloadDefinitions();
		await this.webview.refresh();

		await this.showMessages(result);
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

	public async changePageId()
	{
		const uri = await ContentFile.resolveActive();
		if (!uri) return;

		const newPageId = await ContentFile.promptDifferentPageId(uri);
		if (!newPageId) return;

		const result = await this.command.changePageId(newPageId);

		await this.webview.refresh();

		await this.showMessages(result);

		if (result.isSuccess() && !getContentStrategy().isPageIdServerIdentifier())
		{
			const uploadNow = {title: 'はい(他の変更も送信されます)', isCloseAffordance: false};
			const later = {title: '後で手動でアップロード', isCloseAffordance: true};

			const answer = await vscode.window.showInformationMessage(
				'サーバに反映するため、今すぐコンテンツをアップロードしますか？',
				uploadNow,
				later
			);

			if (answer?.title === uploadNow.title)
			{
				await this.upload();
			}
		}
	}

	public async selectConnection()
	{
		const lwDirUri = LwContent.dir();
		if (!lwDirUri) return;

		const connectionDirs = await FileUtil.listDirectories(lwDirUri);

		if (!connectionDirs.length)
		{
			vscode.window.showWarningMessage(`${LwContent.directoryName}/ 配下に接続先ディレクトリが見つかりません`);
			return;
		}

		const candidates = await Promise.all(connectionDirs.map(async dirUri =>
		{
			const subdir = FileUtil.getBase(dirUri);
			const url = (await Api.settingsAt(dirUri))?.url;

			return url ? {label: url, description: subdir, url, subdir} : undefined;
		}));

		const items = candidates.filter((item): item is NonNullable<typeof item> => item !== undefined);

		if (!items.length)
		{
			vscode.window.showWarningMessage('有効な接続先が見つかりません');
			return;
		}

		const selected = await vscode.window.showQuickPick(items, {
			placeHolder: '接続先を選択してください',
		});

		if (!selected) return;

		const result = await this.command.applyConnection(lwDirUri, selected.url, selected.subdir);
		await this.webview.refresh();
		await this.showMessages(result);
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
			const uri = await ContentFile.resolveActive(document.uri);
			const content = uri ? await ContentFile.read(uri) : undefined;
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
					{
						this.webview.postMessage('setErrors', ['コンパイルエラーが発生しました。']);
						const uri = await ContentFile.resolveActive();
						if (uri)
						{
							await CodeFile.appendCompileErrors(uri, result.error.errors);
						}
					}
					break;

				default:
					vscode.window.showErrorMessage(result.error.message);
					break;
			}
		}
	}
}
