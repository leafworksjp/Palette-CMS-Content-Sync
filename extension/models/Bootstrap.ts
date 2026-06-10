import {Api} from './Api';
import {FileUtil} from './FileUtil';
import {LwContent} from './LwContent';
import {createVersionedServices, getActiveConnection, getListCache, getLogger} from './Services';
import {Version} from '../../common/types/Version';
import {ApiResult} from '../../common/types/ApiResult';

export async function initializeVersionedServices()
{
	const resolution = await resolveVersion();
	if (resolution.isFailure()) return resolution;

	const v1Url = resolution.value.version === 1
		? (await Api.settingsAt(resolution.value.lwDir))?.url
		: undefined;

	createVersionedServices(resolution.value.version, v1Url);

	if (resolution.value.version === 2)
	{
		const subdir = getActiveConnection().subdir;
		if (subdir) await fetchListCache(subdir);
	}

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

async function fetchListCache(subdir: string): Promise<void>
{
	const result = await Api.list();
	if (result.isSuccess())
	{
		getListCache().set(subdir, result.value);
	}
	else
	{
		getLogger().error('初期 list 取得失敗:', result.error);
	}
}
