import {DiagnosticReporter} from './DiagnosticReporter';
import {ActiveConnection} from './ActiveConnection';
import {LwContent} from './LwContent';
import {Logger} from './Logger';
import {UploadStatus} from './UploadStatus';
import {WebSocketServer} from './WebSocketServer';
import {Version} from '../../common/types/Version';
import {ContentStrategy} from '../../common/types/Content';
import {DefinitionsStrategy} from '../../common/types/Definitions';

let hotReloadServer: WebSocketServer | undefined = undefined;
let logger: Logger| undefined = undefined;
let diagnosticReporter: DiagnosticReporter | undefined = undefined;
let uploadStatus: UploadStatus | undefined = undefined;
let activeConnection: ActiveConnection | undefined = undefined;
let lwContent: LwContent | undefined = undefined;
let contentStrategy: ContentStrategy | undefined = undefined;
let definitionsStrategy: DefinitionsStrategy | undefined = undefined;
let currentVersion: Version | undefined = undefined;

export const createHotReloadServer = (): WebSocketServer =>
{
	if (hotReloadServer)
	{
		throw new Error('HotReloadServer is already registered.');
	}
	hotReloadServer = new WebSocketServer(8127);

	return hotReloadServer;
};

export const getHotReloadServer = (): WebSocketServer =>
{
	if (!hotReloadServer)
	{
		throw new Error('HotReloadServer is not registered.');
	}
	return hotReloadServer;
};

export const createLogger = (): Logger =>
{
	if (logger)
	{
		throw new Error('Logger is already registered.');
	}
	logger = new Logger();

	return logger;
};

export const getLogger = (): Logger =>
{
	if (!logger)
	{
		throw new Error('Logger is not registered.');
	}
	return logger;
};

export const createDiagnosticReporter = (): DiagnosticReporter =>
{
	if (diagnosticReporter)
	{
		throw new Error('DiagnosticReporter is already registered.');
	}
	diagnosticReporter = new DiagnosticReporter();

	return diagnosticReporter;
};

export const getDiagnosticReporter = (): DiagnosticReporter =>
{
	if (!diagnosticReporter)
	{
		throw new Error('DiagnosticReporter is not registered.');
	}
	return diagnosticReporter;
};

export const createUploadStatus = (): UploadStatus =>
{
	if (uploadStatus)
	{
		throw new Error('UploadStatus is already registered.');
	}
	uploadStatus = new UploadStatus();

	return uploadStatus;
};

export const getUploadStatus = (): UploadStatus =>
{
	if (!uploadStatus)
	{
		throw new Error('UploadStatus is not registered.');
	}
	return uploadStatus;
};

export const createVersionedServices = (version: Version): void =>
{
	if (currentVersion)
	{
		throw new Error('Versioned services are already registered.');
	}
	currentVersion = version;
	contentStrategy = ContentStrategy.init(version);
	definitionsStrategy = DefinitionsStrategy.init(version);
	lwContent = LwContent.init(version);
};

export const getVersion = (): Version =>
{
	if (!currentVersion)
	{
		throw new Error('Version is not registered.');
	}
	return currentVersion;
};

export const getContentStrategy = (): ContentStrategy =>
{
	if (!contentStrategy)
	{
		throw new Error('ContentStrategy is not registered.');
	}
	return contentStrategy;
};

export const getDefinitionsStrategy = (): DefinitionsStrategy =>
{
	if (!definitionsStrategy)
	{
		throw new Error('DefinitionsStrategy is not registered.');
	}
	return definitionsStrategy;
};

export const createActiveConnection = (instance: ActiveConnection): ActiveConnection =>
{
	if (activeConnection)
	{
		throw new Error('ActiveConnection is already registered.');
	}
	activeConnection = instance;

	return activeConnection;
};

export const getActiveConnection = (): ActiveConnection =>
{
	if (!activeConnection)
	{
		throw new Error('ActiveConnection is not registered.');
	}
	return activeConnection;
};

export const getLwContent = (): LwContent =>
{
	if (!lwContent)
	{
		throw new Error('LwContent is not registered.');
	}
	return lwContent;
};

export const unregisterServices = (): void =>
{
	hotReloadServer = undefined;
	logger = undefined;
	diagnosticReporter = undefined;
	uploadStatus = undefined;
	activeConnection = undefined;
	lwContent = undefined;
	contentStrategy = undefined;
	definitionsStrategy = undefined;
	currentVersion = undefined;
};
