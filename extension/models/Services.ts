import {DiagnosticReporter} from './DiagnosticReporter';
import {Logger} from './Logger';
import {UploadStatus} from './UploadStatus';
import {WebSocketServer} from './WebSocketServer';

let hotReloadServer: WebSocketServer | undefined = undefined;
let logger: Logger| undefined = undefined;
let diagnosticReporter: DiagnosticReporter | undefined = undefined;
let uploadStatus: UploadStatus | undefined = undefined;

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

export const unregisterServices = (): void =>
{
	hotReloadServer = undefined;
	logger = undefined;
	diagnosticReporter = undefined;
	uploadStatus = undefined;
};
