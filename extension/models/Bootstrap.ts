import vscode from 'vscode';
import {Api} from './Api';
import {FileUtil} from './FileUtil';
import {LwContent} from './LwContent';
import {ActiveConnection, ActiveConnectionV1, ActiveConnectionV2} from './ActiveConnection';
import {createActiveConnection, createVersionedServices} from './Services';
import {Version} from '../../common/types/Version';

export type InitializationResult =
	| { ok: true }
	| { ok: false, message: string };

type VersionResolution =
	| { ok: true, version: Version, lwDir: vscode.Uri }
	| { ok: false, message: string };

export async function initializeVersionedServices(): Promise<InitializationResult>
{
	const resolution = await resolveVersion();
	if (!resolution.ok) return resolution;

	createVersionedServices(resolution.version);

	const activeConnection = await buildActiveConnection(resolution.version, resolution.lwDir);
	createActiveConnection(activeConnection);

	return {ok: true};
}

async function resolveVersion(): Promise<VersionResolution>
{
	const lwDir = LwContent.dir();
	if (!lwDir)
	{
		return {
			ok: false,
			message: 'ワークスペースが開かれていないため、Palette CMS Content Sync は利用できません。',
		};
	}

	const hasV1 = Boolean(await Api.settingsAt(lwDir));
	const hasV2 = (await FileUtil.listDirectories(lwDir)).length > 0;

	if (hasV1 && hasV2)
	{
		return {
			ok: false,
			message: '.lwcontent 配下に api.json と接続先サブディレクトリが混在しています。どちらか一方に整理して VS Code を再読み込みしてください。',
		};
	}
	if (hasV1) return {ok: true, version: 1, lwDir};
	if (hasV2) return {ok: true, version: 2, lwDir};

	return {
		ok: false,
		message: '.lwcontent 配下に api.json または接続先サブディレクトリが必要です。配置してから VS Code を再読み込みしてください。',
	};
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
