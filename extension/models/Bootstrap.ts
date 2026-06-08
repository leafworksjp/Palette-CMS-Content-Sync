import {Api} from './Api';
import {FileUtil} from './FileUtil';
import {LwContent} from './LwContent';
import {ActiveConnection} from './ActiveConnection';
import {Version} from '../../common/types/Version';

export async function resolveVersion(): Promise<Version | undefined>
{
	const lwDir = LwContent.dir();
	if (!lwDir) return undefined;

	const hasV1 = Boolean(await Api.settingsAt(lwDir));
	const hasV2 = (await FileUtil.listDirectories(lwDir)).length > 0;

	if (hasV1 && hasV2) return undefined;
	if (hasV1) return 1;
	if (hasV2) return 2;

	return undefined;
}

export async function defaultConnectionForV1(): Promise<string|undefined>
{
	const lwDir = LwContent.dir();
	if (!lwDir) return undefined;

	return (await Api.settingsAt(lwDir))?.url;
}

export async function initializeConnection(activeConnection: ActiveConnection): Promise<void>
{
	if (activeConnection.current) return;

	const url = await defaultConnectionForV1();
	if (!url) return;

	await activeConnection.set({url});
}
