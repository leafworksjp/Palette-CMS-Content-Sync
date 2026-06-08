import vscode from 'vscode';
import {Api} from './Api';
import {FileUtil} from './FileUtil';
import {LwContent} from './LwContent';
import {ActiveConnection, ActiveConnectionV1, ActiveConnectionV2} from './ActiveConnection';
import {createActiveConnection, createVersionedServices} from './Services';
import {Version} from '../../common/types/Version';
import {ApiResult} from '../../common/types/ApiResult';

export async function initializeVersionedServices()
{
	const resolution = await resolveVersion();
	if (resolution.isFailure()) return resolution;

	createVersionedServices(resolution.value.version);

	const activeConnection = await buildActiveConnection(resolution.value.version, resolution.value.lwDir);
	createActiveConnection(activeConnection);

	return ApiResult.success(undefined);
}

async function resolveVersion()
{
	const lwDir = LwContent.dir();
	if (!lwDir)
	{
		return ApiResult.generalFailure('ワークスペースが開かれていないため、Palette CMS Content Sync は利用できません。');
	}

	const hasV1 = Boolean(await Api.settingsAt(lwDir));
	const hasV2 = (await FileUtil.listDirectories(lwDir)).length > 0;

	if (hasV1 && hasV2)
	{
		return ApiResult.generalFailure('.lwcontent 配下に api.json と接続先サブディレクトリが混在しています。どちらか一方に整理して VS Code を再読み込みしてください。');
	}
	if (!hasV1 && !hasV2)
	{
		return ApiResult.generalFailure('.lwcontent 配下に api.json または接続先サブディレクトリが必要です。配置してから VS Code を再読み込みしてください。');
	}

	const version: Version = hasV1 ? 1 : 2;
	return ApiResult.success({version, lwDir});
}

async function buildActiveConnection(version: Version, lwDir: vscode.Uri): Promise<ActiveConnection>
{
	if (version === 1)
	{
		const url = (await Api.settingsAt(lwDir))?.url;
		return new ActiveConnectionV1(url);
	}
	return new ActiveConnectionV2();
}
