import {FileUtil} from './FileUtil';
import {Definitions, zDefinitions} from '../../common/types/Definitions';
import {getLogger} from './Services';

export class DefinitionsFile
{
	private static fileName = 'definitions.json';

	private static uri()
	{
		const workspaceUri = FileUtil.getWorkspace();
		if (!workspaceUri) return undefined;

		return FileUtil.join(workspaceUri, FileUtil.LW_DIRECTORY_NAME, DefinitionsFile.fileName);
	}

	public static async read()
	{
		const uri = DefinitionsFile.uri();
		if (!uri) return undefined;
		if (!await FileUtil.exists(uri)) return undefined;

		try
		{
			const data = JSON.parse(await FileUtil.readFile(uri));

			return zDefinitions.parse(data);
		}
		catch (error)
		{
			console.error(error);
			getLogger().error(error);
			return undefined;
		}
	}

	public static async write(definitions: Definitions)
	{
		const uri = DefinitionsFile.uri();
		if (!uri) return;

		await FileUtil.writeFile(uri, JSON.stringify(definitions, undefined, 4));
	}
}
