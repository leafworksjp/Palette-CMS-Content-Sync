import vscode from 'vscode';
import {FileUtil} from './FileUtil';
import {getActiveConnection} from './Services';
import {Version} from '../../common/types/Version';

export abstract class LwContent
{
	public static readonly directoryName = '.lwcontent';

	public static dir(): vscode.Uri | undefined
	{
		const workspace = FileUtil.getWorkspace();
		if (!workspace) return undefined;

		return FileUtil.join(workspace, LwContent.directoryName);
	}

	public static async exists(): Promise<boolean>
	{
		const lwDir = LwContent.dir();
		if (!lwDir) return false;

		return await FileUtil.isDirectory(lwDir);
	}

	public static init(version: Version): LwContent
	{
		return version === 1
			? new LwContentV1()
			: new LwContentV2();
	}

	abstract readonly version: Version;

	public abstract baseDir(): vscode.Uri | undefined;
}

export class LwContentV1 extends LwContent
{
	readonly version = 1 as const;

	public baseDir(): vscode.Uri | undefined
	{
		return LwContent.dir();
	}
}

export class LwContentV2 extends LwContent
{
	readonly version = 2 as const;

	public baseDir(): vscode.Uri | undefined
	{
		const lwDir = LwContent.dir();
		if (!lwDir) return undefined;

		const subdir = getActiveConnection().subdir;
		if (!subdir) return undefined;

		return FileUtil.join(lwDir, subdir);
	}
}
