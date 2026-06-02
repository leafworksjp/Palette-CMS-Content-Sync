import vscode from 'vscode';
import {FileUtil} from './FileUtil';
import {getConnection} from './Services';
import {Version} from '../../common/types/Version';

export interface LwContentStrategy
{
	base(dir: vscode.Uri): vscode.Uri | undefined;
}

export class LwContentStrategyV1 implements LwContentStrategy
{
	public base(dir: vscode.Uri): vscode.Uri
	{
		return dir;
	}
}

export class LwContentStrategyV2 implements LwContentStrategy
{
	public base(dir: vscode.Uri): vscode.Uri | undefined
	{
		const subdir = getConnection().subdir;
		if (!subdir) return undefined;

		return FileUtil.join(dir, subdir);
	}
}

export class LwContent
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

	public static init(version: Version)
	{
		return version === 1
			? new LwContent(new LwContentStrategyV1())
			: new LwContent(new LwContentStrategyV2());
	}

	constructor(private readonly strategy: LwContentStrategy) {}

	public base(): vscode.Uri | undefined
	{
		const lwDir = LwContent.dir();
		if (!lwDir) return undefined;

		return this.strategy.base(lwDir);
	}
}
