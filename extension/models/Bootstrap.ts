import vscode from 'vscode';
import {Api} from './Api';
import {ApiFile} from './ApiFile';
import {FileUtil} from './FileUtil';
import {LwContent} from './LwContent';
import {createVersionedServices, getActiveConnection, getContentCache, getLogger} from './Services';
import {Version} from '../../common/types/Version';
import {ApiResult} from '../../common/types/ApiResult';

export async function initializeVersionedServices()
{
	const resolution = await resolveVersion();
	if (resolution.isFailure()) return resolution;

	const v1Url = resolution.value.version === 1
		? (await ApiFile.readAt(resolution.value.lwDir))?.url
		: undefined;

	createVersionedServices(resolution.value.version, v1Url);

	if (resolution.value.version === 2)
	{
		const subdir = getActiveConnection().subdir;
		if (subdir) await fetchContentCache(subdir);
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

	const hasV1 = Boolean(await ApiFile.readAt(lwDir));
	const hasV2 = (await FileUtil.listDirectories(lwDir)).length > 0;

	if (hasV1 && hasV2)
	{
		return ApiResult.generalFailure('.lwcontent 配下の接続情報が不整合です。サーバーから再度ダウンロードしてください。');
	}
	if (!hasV1 && !hasV2)
	{
		return ApiResult.generalFailure('.lwcontent 配下に接続情報がありません。サーバーから再度ダウンロードしてください。');
	}

	const version: Version = hasV1 ? 1 : 2;
	return ApiResult.success({version, lwDir});
}

async function fetchContentCache(subdir: string): Promise<void>
{
	const result = await Api.list();
	if (result.isSuccess())
	{
		getContentCache().set(subdir, result.value);
		return;
	}

	//Logger は開発者向け詳細 (result.error 含む)、 showWarningMessage はユーザー向け案内で役割分担。
	getLogger().error('Initial list fetch failed:', result.error);
	getContentCache().clear(subdir);
	vscode.window.showWarningMessage(`接続先 (${subdir}) のコンテンツ一覧をサーバーから取得できませんでした。アップロード時の新規/更新判定など一部機能が無効化されます。`);
}
