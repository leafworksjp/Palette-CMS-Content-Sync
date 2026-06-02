import vscode from 'vscode';
import {FileUtil} from './FileUtil';
import {DefinitionsFile} from '../models/DefinitionsFile';
import {Content, getColumns, clientOnlyFields} from '../../common/types/Content';
import {getLogger, getContentContext} from './Services';

export class ContentFile
{
	public static fileName = 'contents.json';

	public static async read(uri: vscode.Uri|undefined = undefined)
	{
		const contentFile = uri ?? await ContentFile.getFilePath();

		if (!contentFile) return undefined;

		try
		{
			const data = JSON.parse(await FileUtil.readFile(contentFile));
			const content = getContentContext().parse(data);

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

	public static async write(content: Content)
	{
		const definitions = await DefinitionsFile.read();
		const contentFile = await ContentFile.getFilePath();
		if (!contentFile || !definitions || !content) return;

		const columns = getColumns(definitions, content);
		if (!columns) return;

		try
		{
			const contentObj = Object
			.fromEntries(Object.entries(content)
			.filter(([column]) => columns.includes(column) || clientOnlyFields.some(f => f === column)));

			const data = JSON.stringify(contentObj, undefined, 4);

			await FileUtil.writeFile(contentFile, data);
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

		const content = getContentContext().createContent(newFileName);
		const data = JSON.stringify(content, undefined, 4);

		const contentFile = FileUtil.join(dirPath, ContentFile.fileName);

		await FileUtil.writeFile(contentFile, data);

		await FileUtil.openFileInEditor(contentFile);
	}

	public static async duplicate(newFileName: string)
	{
		const sourceDir = await ContentFile.getDirectoryPath();
		if (!sourceDir || !await FileUtil.exists(sourceDir)) return;

		const targetDir = FileUtil.join(sourceDir, '..', newFileName);

		await FileUtil.copy(sourceDir, targetDir);

		const targetContentFile = FileUtil.join(targetDir, ContentFile.fileName);

		if (!await FileUtil.exists(targetContentFile)) return;

		const content = await ContentFile.read(targetContentFile);
		if (!content) return;

		const duplicated = getContentContext().duplicateContent(content, newFileName);
		await FileUtil.writeFile(targetContentFile, JSON.stringify(duplicated, undefined, 4));

		await FileUtil.openFileInEditor(targetContentFile);
	}

	public static async changeDirectoryName(name: string)
	{
		const oldDir = await ContentFile.getDirectoryPath();

		if (!oldDir) return;

		const newDir = FileUtil.join(FileUtil.getDirectory(oldDir), name);

		if (oldDir.fsPath === newDir.fsPath) return;

		await FileUtil.rename(oldDir, newDir);
	}

	public static async getFilePath(uri: vscode.Uri|undefined = undefined)
	{
		const documentUri = uri ?? vscode.window.activeTextEditor?.document?.uri;

		if (!documentUri) return undefined;

		{
			const contentFilePath = FileUtil.join(FileUtil.getDirectory(documentUri), ContentFile.fileName);

			if (await FileUtil.isFile(contentFilePath))
			{
				return contentFilePath;
			}
		}
		{
			const contentFilePath = FileUtil.join(FileUtil.getDirectory(documentUri), '..', ContentFile.fileName);

			if (await FileUtil.isFile(contentFilePath))
			{
				return contentFilePath;
			}
		}

		return undefined;
	}

	public static async getDirectoryPath(uri: vscode.Uri|undefined = undefined)
	{
		const contentFilePath = await ContentFile.getFilePath(uri);

		if (!contentFilePath) return undefined;

		return FileUtil.getDirectory(contentFilePath);
	}

	public static createNewFileName = async (): Promise<string> =>
	{
		const content = await ContentFile.read();
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
