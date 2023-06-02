
import vscode from 'vscode';
import {SettingViewController} from './views/setting/SettingViewController';
import {VariableCompletion} from './models/VariableCompletion';
import {Preview} from './models/Preview';

export function activate(context: vscode.ExtensionContext)
{
	registerSettingView(context);
	registerVariableCompletionProvider(context);
	registerPreview(context);
}

function registerSettingView(context: vscode.ExtensionContext)
{
	const viewController = new SettingViewController(context);

	const commands = [
		vscode.commands.registerCommand('paletteCmsContentSync.uploadContent', async _ =>
		{
			await viewController.upload();
		}),
		vscode.commands.registerCommand('paletteCmsContentSync.uploadAllContents', async _ =>
		{
			await viewController.uploadAll();
		}),
		vscode.commands.registerCommand('paletteCmsContentSync.downlaodContent', async _ =>
		{
			await viewController.download();
		}),
		vscode.commands.registerCommand('paletteCmsContentSync.createContent', async _ =>
		{
			await viewController.create();
		}),
		vscode.commands.registerCommand('paletteCmsContentSync.duplicateContent', async _ =>
		{
			await viewController.duplicate();
		}),
		vscode.commands.registerCommand('paletteCmsContentSync.deleteContent', async _ =>
		{
			await viewController.delete();
		}),
		vscode.commands.registerCommand('paletteCmsContentSync.changeLanguage', async _ =>
		{
			await viewController.changeLanguage();
		}),
		vscode.commands.registerCommand('paletteCmsContentSync.downloadVariables', async _ =>
		{
			await viewController.downloadVariables();
		}),
		vscode.commands.registerCommand('paletteCmsContentSync.downloadDefinitions', async _ =>
		{
			await viewController.downloadDefinitions();
		}),
		vscode.commands.registerCommand('paletteCmsContentSync.renameDirectory', async _ =>
		{
			await viewController.renameDirectory();
		}),
	];

	let lastDocument: vscode.Uri|undefined = undefined;

	const events = [
		vscode.window.onDidChangeActiveTextEditor(event =>
		{
			if (!event?.document.uri) return;

			if (lastDocument !== event.document.uri)
			{
				viewController.onDidChangeActiveTextEditor();
			}
			lastDocument = event.document.uri;
		}),
		vscode.workspace.onDidSaveTextDocument(document =>
		{
			viewController.onDidSaveTextDocument(document);
		}),
	];

	context.subscriptions.push(...commands, ...events);
}

function registerVariableCompletionProvider(context: vscode.ExtensionContext)
{
	const completion = new VariableCompletion(context);

	const commands = [
		vscode.commands.registerCommand('paletteCmsContentSync.insertVariable', _ =>
		{
			completion.insertVariable();
		}),
	];

	let lastDocument: vscode.Uri|undefined = undefined;

	const events = [
		vscode.window.onDidChangeActiveTextEditor(event =>
		{
			if (!event?.document.uri) return;

			if (lastDocument !== event.document.uri)
			{
				completion.refresh();
			}
			lastDocument = event.document.uri;
		}),
	];

	context.subscriptions.push(...commands, ...events);
}

function registerPreview(context: vscode.ExtensionContext)
{
	const preview = new Preview(context.extensionUri);

	const commands = [
		vscode.commands.registerCommand('paletteCmsContentSync.previewContent', async _ =>
		{
			await preview.open().catch(e => vscode.window.showErrorMessage(e.message));
		}),

	];

	let lastDocument: vscode.Uri|undefined = undefined;

	const events = [
		vscode.window.onDidChangeActiveTextEditor(async event =>
		{
			if (!event?.document.uri) return;

			if (lastDocument !== event.document.uri)
			{
				await preview.update();
			}
			lastDocument = event.document.uri;
		}),
		vscode.workspace.onDidSaveTextDocument(async _ =>
		{
			await preview.update();
		}),
	];

	context.subscriptions.push(...commands, ...events);
}

export function deactivate() {}
