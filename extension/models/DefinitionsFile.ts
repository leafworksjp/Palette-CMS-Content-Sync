import {FileUtil} from './FileUtil';
import {Definitions} from '../../common/types/Definitions';
import {getLogger, getDefinitionsStrategy, getLwContent} from './Services';

export class DefinitionsFile
{
	private static fileName = 'definitions.json';

	private static uri()
	{
		const base = getLwContent().baseDir();
		return base ? FileUtil.join(base, DefinitionsFile.fileName) : undefined;
	}

	public static async read()
	{
		const uri = DefinitionsFile.uri();
		if (!uri) return undefined;
		if (!await FileUtil.exists(uri)) return undefined;

		try
		{
			const data = JSON.parse(await FileUtil.readFile(uri));

			return getDefinitionsStrategy().parse(data);
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
