import vscode from 'vscode';
import {FileUtil} from './FileUtil';
import {ContentFile} from './ContentFile';

export class VariablesFile
{
	public static fileName = 'variables.json';

	public static async read()
	{
		const contentDir = await ContentFile.getDirectoryPath();

		if (!contentDir) return undefined;

		const variableUri = FileUtil.join(contentDir, VariablesFile.fileName);

		if (!await FileUtil.exists(variableUri)) return undefined;

		try
		{
			return JSON.parse(await FileUtil.readFile(variableUri));
		}
		catch (error)
		{
			vscode.window.showErrorMessage(`${VariablesFile.fileName}のフォーマットが不正な形式です。`);

			return undefined;
		}
	}

	public static async write(variables: object)
	{
		const contentDir = await ContentFile.getDirectoryPath();

		if (!contentDir) return;

		const variablesFilePath = FileUtil.join(contentDir, VariablesFile.fileName);

		await FileUtil.writeFile(variablesFilePath, JSON.stringify(variables, undefined, 4));
	}
}
