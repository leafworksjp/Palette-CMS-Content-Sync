
import vscode from 'vscode';
import {SettingViewController} from './views/setting/SettingViewController';
import {VariableCompletion} from './models/VariableCompletion';
import {TemplateCompletion} from './models/TemplateCompletion';
import {
	createHotReloadServer,
	createLogger,
	createDiagnosticReporter,
	createUploadStatus,
	createConnection,
	createLwContent,
	createVersion,
	createContentStrategy,
	createDefinitionsStrategy,
	unregisterServices,
} from './models/Services';
import {resolveVersion, initializeConnection} from './models/Bootstrap';
import {PaletteSyntaxHighlighting} from './models/PaletteSyntaxHighlighting';
import * as path from 'path';
import * as fs from 'fs';
import {HTMLFormatter} from './models/HTMLFormatter';

const onDidChangeActiveTextEditorHandlers: ((editor: vscode.TextEditor) => void)[] = [];
const onDidSaveTextDocumentHandlers:((document: vscode.TextDocument) => void)[] = [];
let paletteSyntaxHighlighting: PaletteSyntaxHighlighting | undefined = undefined;
let settingsViewController: SettingViewController | undefined = undefined;
let variableCompletion: VariableCompletion | undefined = undefined;
let templateCompletion: TemplateCompletion | undefined = undefined;
let htmlFormatter: HTMLFormatter | undefined = undefined;

export async function activate(context: vscode.ExtensionContext)
{
	registerServices(context);
	setLanguageConfiguration(context);
	registerSyntaxHighlighting(context);
	registerHTMLFormatter(context);

	const isReady = await detectVersion(context);
	if (!isReady) return;

	registerSettingsViewController(context);
	registerVariableCompletionProvider(context);
	registerTemplateCompletionProvider(context);
	bindEvents(context);
}

export function deactivate()
{
	unregisterServices();
	onDidChangeActiveTextEditorHandlers.splice(0);
	onDidSaveTextDocumentHandlers.splice(0);
	paletteSyntaxHighlighting = undefined;
	settingsViewController = undefined;
	variableCompletion = undefined;
	templateCompletion = undefined;
	htmlFormatter = undefined;
}

function registerServices(context: vscode.ExtensionContext)
{
	context.subscriptions.push(
		createLogger(),
		createHotReloadServer(),
		createDiagnosticReporter(),
		createUploadStatus()
	);
}

async function detectVersion(context: vscode.ExtensionContext): Promise<boolean>
{
	const version = await resolveVersion();
	if (!version) return false;

	createVersion(version);
	createContentStrategy(version);
	createDefinitionsStrategy(version);
	createLwContent(version);

	const connection = createConnection();
	context.subscriptions.push(connection);

	await initializeConnection(connection);

	return true;
}

function setLanguageConfiguration(context: vscode.ExtensionContext)
{
	const configPath = path.join(context.extensionPath, 'language-configuration.json');
	const configContent = fs.readFileSync(configPath, 'utf8');
	const config = JSON.parse(configContent);
	vscode.languages.setLanguageConfiguration('html', config);
}

function registerSyntaxHighlighting(context: vscode.ExtensionContext)
{
	paletteSyntaxHighlighting = new PaletteSyntaxHighlighting(context);
	context.subscriptions.push(paletteSyntaxHighlighting);
}

function registerHTMLFormatter(context: vscode.ExtensionContext)
{
	htmlFormatter = new HTMLFormatter();
	context.subscriptions.push(htmlFormatter);
}

function registerSettingsViewController(context: vscode.ExtensionContext)
{
	settingsViewController = new SettingViewController(context);
	onDidChangeActiveTextEditorHandlers.push(textEditor => settingsViewController?.onDidChangeActiveTextEditor());
	onDidSaveTextDocumentHandlers.push(document => settingsViewController?.onDidSaveTextDocument(document));
	context.subscriptions.push(settingsViewController);

	registerCommand(context, 'paletteCmsContentSync.uploadContent', () => settingsViewController?.upload());
	registerCommand(context, 'paletteCmsContentSync.uploadAllContents', () => settingsViewController?.uploadAll());
	registerCommand(context, 'paletteCmsContentSync.downloadContent', () => settingsViewController?.download());
	registerCommand(context, 'paletteCmsContentSync.createContent', () => settingsViewController?.create());
	registerCommand(context, 'paletteCmsContentSync.duplicateContent', () => settingsViewController?.duplicate());
	registerCommand(context, 'paletteCmsContentSync.deleteContent', () => settingsViewController?.delete());
	registerCommand(context, 'paletteCmsContentSync.changeLanguage', () => settingsViewController?.changeLanguage());
	registerCommand(context, 'paletteCmsContentSync.downloadSnippets', () => settingsViewController?.downloadSnippets());
	registerCommand(context, 'paletteCmsContentSync.downloadVariables', () => settingsViewController?.downloadVariables());
	registerCommand(context, 'paletteCmsContentSync.downloadDefinitions', () => settingsViewController?.downloadDefinitions());
	registerCommand(context, 'paletteCmsContentSync.renameDirectory', () => settingsViewController?.renameDirectory());
	registerCommand(context, 'paletteCmsContentSync.selectConnection', () => settingsViewController?.selectConnection());
	registerCommand(context, 'paletteCmsContentSync.changePageId', () => settingsViewController?.changePageId());
}

function registerVariableCompletionProvider(context: vscode.ExtensionContext)
{
	variableCompletion = new VariableCompletion(context);
	onDidChangeActiveTextEditorHandlers.push(textEditor => variableCompletion?.refresh());
	context.subscriptions.push(variableCompletion);

	registerCommand(context, 'paletteCmsContentSync.insertVariable', () => variableCompletion?.insertVariable());
}

function registerTemplateCompletionProvider(context: vscode.ExtensionContext)
{
	templateCompletion = new TemplateCompletion(context);
	onDidChangeActiveTextEditorHandlers.push(textEditor => templateCompletion?.refresh());
	context.subscriptions.push(templateCompletion);
}

function bindEvents(context: vscode.ExtensionContext)
{
	let lastDocument: vscode.Uri|undefined = undefined;

	const onDidChangeActiveTextEditor = vscode.window.onDidChangeActiveTextEditor(textEditor =>
	{
		if (!textEditor?.document.uri) return;

		if (lastDocument !== textEditor.document.uri)
		{
			onDidChangeActiveTextEditorHandlers.forEach(callback => callback(textEditor));
		}
		lastDocument = textEditor.document.uri;
	});

	const	onDidSaveTextDocument =	vscode.workspace.onDidSaveTextDocument(document =>
	{
		onDidSaveTextDocumentHandlers.forEach(callback => callback(document));
	});

	context.subscriptions.push(
		onDidChangeActiveTextEditor,
		onDidSaveTextDocument
	);
}

function registerCommand(
	context: vscode.ExtensionContext,
	command: string,
	callback: () => void
)
{
	context.subscriptions.push(
		vscode.commands.registerCommand(command, callback)
	);
}
