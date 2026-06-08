import vscode from 'vscode';
import {FileUtil} from './FileUtil';
import {DefinitionsFile} from '../models/DefinitionsFile';
import {Content, getColumns, clientOnlyFields} from '../../common/types/Content';
import {getLogger, getContentStrategy} from './Services';

export class ContentFile
{
	public static fileName = 'contents.json';

	public static async read(uri: vscode.Uri)
	{
		try
		{
			const data = JSON.parse(await FileUtil.readFile(uri));
			const content = getContentStrategy().parse(data);

			const definitions = await DefinitionsFile.read();
			const allowedFields = definitions ? getColumns(definitions, content) : undefined;

			if (allowedFields?.includes('search_query_where') && !content.search_query_where?.length)
			{
				content.search_query_where = [{col: '', operator: '=', val: ''}];
			}
			if (allowedFields?.includes('search_query_order') && !content.search_query_order?.length)
			{
				content.search_query_order = [{col: '', operator: 'ASC'}];
			}

			return content;
		}
		catch (error)
		{
			vscode.window.showErrorMessage(`${ContentFile.fileName}のフォーマットが不正な形式です。`);
			getLogger().error(error);

			return undefined;
		}
	}

	public static async write(uri: vscode.Uri, content: Content)
	{
		const definitions = await DefinitionsFile.read();
		if (!definitions || !content) return;

		const columns = getColumns(definitions, content);
		if (!columns) return;

		try
		{
			const contentObj = Object
			.fromEntries(Object.entries(content)
			.filter(([column]) => columns.includes(column) || clientOnlyFields.some(f => f === column)));

			const data = JSON.stringify(contentObj, undefined, 4);

			await FileUtil.writeFile(uri, data);
		}
		catch (error)
		{
			vscode.window.showErrorMessage(`${ContentFile.fileName}のフォーマットが不正な形式です。`);
		}
	}

	public static async create(newFileName: string)
	{
		const workspace = FileUtil.getWorkspace();

		if (!workspace || !newFileName) return;

		const dirPath = FileUtil.join(workspace, newFileName);

		FileUtil.createDirectory(dirPath);
		FileUtil.createDirectory(FileUtil.join(dirPath, 'src'));

		const content = getContentStrategy().create(newFileName);
		const data = JSON.stringify(content, undefined, 4);

		const contentFile = FileUtil.join(dirPath, ContentFile.fileName);

		await FileUtil.writeFile(contentFile, data);

		await FileUtil.openFileInEditor(contentFile);
	}

	public static async duplicate(sourceUri: vscode.Uri, newFileName: string)
	{
		const sourceDir = FileUtil.getDirectory(sourceUri);
		if (!await FileUtil.exists(sourceDir)) return;

		const targetDir = FileUtil.join(sourceDir, '..', newFileName);

		await FileUtil.copy(sourceDir, targetDir);

		const targetContentFile = FileUtil.join(targetDir, ContentFile.fileName);

		if (!await FileUtil.exists(targetContentFile)) return;

		const content = await ContentFile.read(targetContentFile);
		if (!content) return;

		const duplicated = getContentStrategy().duplicate(content, newFileName);
		await FileUtil.writeFile(targetContentFile, JSON.stringify(duplicated, undefined, 4));

		await FileUtil.openFileInEditor(targetContentFile);
	}

	public static async changeDirectoryName(uri: vscode.Uri, name: string)
	{
		const oldDir = FileUtil.getDirectory(uri);
		const newDir = FileUtil.join(FileUtil.getDirectory(oldDir), name);

		if (oldDir.fsPath === newDir.fsPath) return;

		await FileUtil.rename(oldDir, newDir);
	}

	/**
	 * 操作開始時に contents.json の URI を確定する。
	 * 確定後の URI は以降の非同期処理（read/write/CodeFile 操作等）で明示的に引き回す。
	 * これにより、通信中にユーザーがエディタを切り替えても別ファイルへ誤って書き込まないようにする。
	 *
	 * documentUri を省略した場合はアクティブエディタから取得する。
	 */
	public static async resolveActive(documentUri?: vscode.Uri): Promise<vscode.Uri | undefined>
	{
		const baseUri = documentUri ?? vscode.window.activeTextEditor?.document?.uri;
		if (!baseUri) return undefined;

		{
			const contentFilePath = FileUtil.join(FileUtil.getDirectory(baseUri), ContentFile.fileName);

			if (await FileUtil.isFile(contentFilePath))
			{
				return contentFilePath;
			}
		}
		{
			const contentFilePath = FileUtil.join(FileUtil.getDirectory(baseUri), '..', ContentFile.fileName);

			if (await FileUtil.isFile(contentFilePath))
			{
				return contentFilePath;
			}
		}

		return undefined;
	}

	public static createNewFileName = async (uri: vscode.Uri): Promise<string> =>
	{
		const content = await ContentFile.read(uri);
		if (!content) return '';

		const newPageId = await vscode.window.showInputBox({
			prompt: '新しいコンテンツIDを入力してください',
			value: content.page_id,
			validateInput: value =>
			{
				if (!value) return '入力してください';
				if (value === content.page_id) return '現在のIDと同じです';
				if (!/^[a-zA-Z0-9_-]+$/.test(value)) return '半角英数字、ハイフン、アンダースコアのみ使用できます';
				return null;
			}
		});

		return newPageId ?? '';
	};
}
