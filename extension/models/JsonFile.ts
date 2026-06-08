import vscode from 'vscode';
import {FileUtil} from './FileUtil';

const fileNames = {
	variables: 'variables.json',
	snippets: 'snippets.json',
};

export class JsonFile
{
	public static async read(file: keyof typeof fileNames, uri: vscode.Uri)
	{
		const fileName = fileNames[file];

		const contentDir = FileUtil.getDirectory(uri);

		const variableUri = FileUtil.join(contentDir, fileName);

		if (!await FileUtil.exists(variableUri)) return undefined;

		try
		{
			return JSON.parse(await FileUtil.readFile(variableUri));
		}
		catch (error)
		{
			vscode.window.showErrorMessage(`${fileName}のフォーマットが不正な形式です。`);

			return undefined;
		}
	}

	public static async write(file: keyof typeof fileNames, variables: object, uri: vscode.Uri)
	{
		const fileName = fileNames[file];

		const contentDir = FileUtil.getDirectory(uri);

		const jsonFilePath = FileUtil.join(contentDir, fileName);

		await FileUtil.writeFile(jsonFilePath, JSON.stringify(variables, undefined, 4));
	}
}
