import vscode from 'vscode';
import {FileUtil} from './FileUtil';
import {DefinitionsFile} from '../models/DefinitionsFile';
import {Content, createContent, getColumns, zContent} from '../../common//types/Content';
import {getLogger} from './Services';

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

			const content = zContent.parse(data);

			if (!content.search_query_where?.length)
			{
				content.search_query_where = [{col: '', operator: '=', val: ''}];
			}
			if (!content.search_query_order?.length)
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
			.filter(([column]) => columns.includes(column)));

			const data = JSON.stringify(contentObj, undefined, 4);

			await FileUtil.writeFile(contentFile, data);
		}
		catch (error)
		{
			vscode.window.showErrorMessage(`${ContentFile.fileName}のフォーマットが不正な形式です。`);
		}
	}

	public static async create()
	{
		const workspace = FileUtil.getWorkspace();
		const newFileName = await FileUtil.getNewFileName();

		if (!workspace || !newFileName) return;

		const dirPath = FileUtil.join(workspace, newFileName);

		FileUtil.createDirectory(dirPath);
		FileUtil.createDirectory(FileUtil.join(dirPath, 'src'));

		const content = createContent();
		content.page_id = newFileName;
		content.category = '未設定';
		content.http_header_content_type = 'html';
		content.device_type = ['pc', 'smart'];
		content.search_row = 10;

		const data = JSON.stringify(content, undefined, 4);

		const contentFile = FileUtil.join(dirPath, ContentFile.fileName);

		await FileUtil.writeFile(contentFile, data);

		await FileUtil.openFileInEditor(contentFile);
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
}
