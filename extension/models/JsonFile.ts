import vscode from 'vscode';
import {FileUtil} from './FileUtil';
import {ContentFile} from './ContentFile';

const fileNames = {
	variables: 'variables.json',
	snippets: 'snippets.json',
};

export class JsonFile
{
	public static async read(file: keyof typeof fileNames)
	{
		const fileName = fileNames[file];

		const contentDir = await ContentFile.getDirectoryPath();

		if (!contentDir) return undefined;

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

	public static async write(file: keyof typeof fileNames, variables: object)
	{
		const fileName = fileNames[file];

		const contentDir = await ContentFile.getDirectoryPath();

		if (!contentDir) return;

		const jsonFilePath = FileUtil.join(contentDir, fileName);

		await FileUtil.writeFile(jsonFilePath, JSON.stringify(variables, undefined, 4));
	}
}
