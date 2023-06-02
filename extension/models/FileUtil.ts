import vscode from 'vscode';
import path from 'path';

export class FileUtil
{
	public static LW_DIRECTORY_NAME = '.lwcontent';

	public static getWorkspace = () => vscode.workspace.workspaceFolders?.[0].uri;

	public static exists = async (uri: vscode.Uri) =>
	{
		try
		{
			await vscode.workspace.fs.stat(uri);
			return true;
		}
		catch (_)
		{
			return false;
		}
	};

	public static isFile = async (uri: vscode.Uri) =>
	{
		try
		{
			const stat = await vscode.workspace.fs.stat(uri);

			return (stat.type === vscode.FileType.File);
		}
		catch (_)
		{
			return false;
		}
	};

	public static isDirectory = async (uri: vscode.Uri) =>
	{
		try
		{
			const stat = await vscode.workspace.fs.stat(uri);

			return (stat.type === vscode.FileType.Directory);
		}
		catch (_)
		{
			return false;
		}
	};

	public static isLwContent = async () =>
	{
		const ws = FileUtil.getWorkspace();

		if (!ws) return false;

		const dirPath = FileUtil.join(ws, FileUtil.LW_DIRECTORY_NAME);

		return (await FileUtil.exists(dirPath) && await FileUtil.isDirectory(dirPath));
	};

	public static getDirectory = (uri: vscode.Uri) => FileUtil.join(uri, '..');

	public static getBase = (uri: vscode.Uri) => path.parse(uri.fsPath).base;

	public static getName = (uri: vscode.Uri) => path.parse(uri.fsPath).name;

	public static getExt = (uri: vscode.Uri) => path.parse(uri.fsPath).ext;

	public static join = (base: vscode.Uri, ...pathSegments: string[]) => vscode.Uri.joinPath(base, ...pathSegments);

	public static readFile = async (uri: vscode.Uri) =>
	{
		const decoder = new TextDecoder();
		return decoder.decode(await vscode.workspace.fs.readFile(uri));
	};

	public static writeFile = async (uri: vscode.Uri, text: string) =>
	{
		const encoder = new TextEncoder();
		await vscode.workspace.fs.writeFile(uri, encoder.encode(text));
	};

	public static openFileInEditor = async (uri: vscode.Uri) =>
	{
		const document = await vscode.workspace.openTextDocument(uri);

		await vscode.window.showTextDocument(document);
	};

	public static createDirectory = (uri: vscode.Uri) =>
	{
		vscode.workspace.fs.createDirectory(uri);
	};

	public static reaname = async (sorce: vscode.Uri, target: vscode.Uri) =>
	{
		await vscode.workspace.fs.rename(sorce, target);
	};

	public static copy = async (sorce: vscode.Uri, target: vscode.Uri) =>
	{
		await vscode.workspace.fs.copy(sorce, target);
	};

	public static deleteFile = async (uri: vscode.Uri, options?: { recursive?: boolean; useTrash?: boolean }) =>
	{
		await vscode.workspace.fs.delete(uri, options);
	};

	public static listFiles = async (uri: vscode.Uri): Promise<vscode.Uri[]> =>
	{
		const files = await vscode.workspace.fs.readDirectory(uri);

		const result = await Promise.all(
			files.map(async ([fileName, fileType]) =>
			{
				if (fileType === vscode.FileType.File)
				{
					return [FileUtil.join(uri, fileName)];
				}
				else
				{
					return await FileUtil.listFiles(FileUtil.join(uri, fileName));
				}
			})
		);

		return result.flat();
	};

	public static findFiles = async (globPattern: string) => await vscode.workspace.findFiles(globPattern);

	public static getNewFileName = async () =>
	{
		const dir = FileUtil.getWorkspace();

		if (!dir) return undefined;

		const files = await vscode.workspace.fs.readDirectory(dir);

		if (!files.length) return 'new-content-0';

		const names = files
		.filter(([_, fileType]) => fileType === vscode.FileType.Directory)
		.map(([file, _]) => file)
		.filter(name => /^new-content-[0-9]+$/.test(name));

		if (!names.length) return 'new-content-0';

		const lastIndex = names
		.map(name => name.replace('new-content-', ''))
		.map(name => parseInt(name, 10))
		.sort((a, b) => a - b)
		.slice(-1)
		.at(0)
		?? 0;

		return `new-content-${lastIndex + 1}`;
	};
}
