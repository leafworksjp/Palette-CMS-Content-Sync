import {DiagnosticReporter} from './DiagnosticReporter';
import {Connection} from './Connection';
import {LwContent} from './LwContent';
import {Logger} from './Logger';
import {UploadStatus} from './UploadStatus';
import {WebSocketServer} from './WebSocketServer';
import {Version} from '../../common/types/Version';
import {ContentContext} from '../../common/types/Content';
import {DefinitionsContext} from '../../common/types/Definitions';

let hotReloadServer: WebSocketServer | undefined = undefined;
let logger: Logger| undefined = undefined;
let diagnosticReporter: DiagnosticReporter | undefined = undefined;
let uploadStatus: UploadStatus | undefined = undefined;
let connection: Connection | undefined = undefined;
let lwContent: LwContent | undefined = undefined;
let contentContext: ContentContext | undefined = undefined;
let definitionsContext: DefinitionsContext | undefined = undefined;
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

export const createVersion = (version: Version): Version =>
{
	if (currentVersion)
	{
		throw new Error('Version is already registered.');
	}
	currentVersion = version;

	return currentVersion;
};

export const getVersion = (): Version =>
{
	if (!currentVersion)
	{
		throw new Error('Version is not registered.');
	}
	return currentVersion;
};

export const createContentContext = (version: Version): ContentContext =>
{
	if (contentContext)
	{
		throw new Error('ContentContext is already registered.');
	}

	contentContext = ContentContext.init(version);

	return contentContext;
};

export const getContentContext = (): ContentContext =>
{
	if (!contentContext)
	{
		throw new Error('ContentContext is not registered.');
	}
	return contentContext;
};

export const createDefinitionsContext = (version: Version): DefinitionsContext =>
{
	if (definitionsContext)
	{
		throw new Error('DefinitionsContext is already registered.');
	}

	definitionsContext = DefinitionsContext.init(version);

	return definitionsContext;
};

export const getDefinitionsContext = (): DefinitionsContext =>
{
	if (!definitionsContext)
	{
		throw new Error('DefinitionsContext is not registered.');
	}
	return definitionsContext;
};

export const createConnection = (): Connection =>
{
	if (connection)
	{
		throw new Error('Connection is already registered.');
	}
	connection = new Connection();

	return connection;
};

export const getConnection = (): Connection =>
{
	if (!connection)
	{
		throw new Error('Connection is not registered.');
	}
	return connection;
};

export const createLwContent = (version: Version): LwContent =>
{
	if (lwContent)
	{
		throw new Error('LwContent is already registered.');
	}
	lwContent = LwContent.init(version);

	return lwContent;
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
	connection = undefined;
	lwContent = undefined;
	contentContext = undefined;
	definitionsContext = undefined;
	currentVersion = undefined;
};
