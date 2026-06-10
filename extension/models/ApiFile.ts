import vscode from 'vscode';
import {z} from 'zod';
import {FileUtil} from './FileUtil';
import {getLogger, getLwContent} from './Services';

const zApiSettings = z.object({
	url: z.string(),
	id: z.string(),
	pass: z.string(),
});

export type ApiSettings = z.infer<typeof zApiSettings>;

export class ApiFile
{
	public static fileName = 'api.json';

	public static async read(): Promise<ApiSettings | undefined>
	{
		const base = getLwContent().baseDir();
		if (!base) return undefined;

		return ApiFile.readAt(base);
	}

	public static async readAt(dirUri: vscode.Uri): Promise<ApiSettings | undefined>
	{
		const uri = FileUtil.join(dirUri, ApiFile.fileName);
		if (!await FileUtil.isFile(uri)) return undefined;

		try
		{
			const data = JSON.parse(await FileUtil.readFile(uri));

			return zApiSettings.parse(data);
		}
		catch (error)
		{
			getLogger().error('api.json パース失敗:', error);
			return undefined;
		}
	}
}
