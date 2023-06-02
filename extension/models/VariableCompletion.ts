import vscode from 'vscode';
import {VariablesFile} from '../models/VariablesFile';
import {Is} from '../types/Is';
import {FileUtil} from './FileUtil';

type Variable = {key: string, value: string, dirName: string};

export class VariableCompletion
{
	private provider?: vscode.Disposable;
	private variables?: Variable[];
	private documentSelector = [
		{scheme: 'file', language: 'html'},
		{scheme: 'file', language: 'css'},
		{scheme: 'file', language: 'javascript'},
		{scheme: 'file', language: 'json'},
		{scheme: 'file', language: 'xml'},
	];

	constructor(private context: vscode.ExtensionContext)
	{
		this.refresh();
	}

	public async refresh()
	{
		this.provider?.dispose();
		this.provider = undefined;

		const data = await this.loadVariablesFile();

		if (!data) return;

		this.variables = this.createVariables(data);

		if (!this.variables) return;

		const items = this.toCompletionItems(this.variables);

		this.provider = vscode.languages.registerCompletionItemProvider(
			this.documentSelector,
			{
				provideCompletionItems(document: vscode.TextDocument, position: vscode.Position)
				{
					const linePrefix = document.lineAt(position).text.substr(0, position.character);

					if (!linePrefix.endsWith('[')) return undefined;

					return items;
				}
			},
			'['
		);

		this.context.subscriptions.push(this.provider);
	}

	private async loadVariablesFile()
	{
		try
		{
			const fileUri = vscode.window.activeTextEditor?.document?.uri;
			if (!fileUri) return undefined;

			const fileName = FileUtil.getName(fileUri);

			const variablesFile = await VariablesFile.read();
			if (!variablesFile) return undefined;

			const data = variablesFile[fileName];
			if (!data || !Is.object(data)) return undefined;

			return data;
		}
		catch (_)
		{
			return undefined;
		}
	}

	private createVariables(values: object, dirName: string = ''): Variable[]
	{
		return Object
		.entries(values)
		.reduce<Variable[]>((variables, [key, value]) =>
		{
			if (Is.object(value))
			{
				return [...variables, ...this.createVariables(value, key)];
			}
			if (Is.string(value))
			{
				variables.push({key, value, dirName} as Variable);
			}
			return variables;
		}, []);
	}

	private toQuickPickItems(variables: Variable[])
	{
		return variables.map(variable =>
		{
			const descPrefix = variable.dirName ? `${variable.dirName} / ` : '';

			const label = variable.value;
			const description = `${descPrefix}${variable.key}`;

			return {label, description} as vscode.QuickPickItem;
		});
	}

	private toCompletionItems(variables: Variable[])
	{
		return variables.map(variable =>
		{
			const labelPrefix = variable.dirName ? `${variable.dirName} / ` : '';
			const docPrefix = variable.dirName ? `${variable.dirName}\n` : '';

			const label = `${labelPrefix}${variable.key}: ${variable.value}`;
			const documentation = `${docPrefix}${variable.key}\n${variable.value}`;
			const insertText = variable.value.replace(/^\[/, '').replace(/\]$/, '');

			const items = new vscode.CompletionItem(label, vscode.CompletionItemKind.Variable);
			items.documentation = documentation;
			items.insertText = insertText;

			return items;
		});
	}

	public async insertVariable()
	{
		if (!this.variables) return;

		const items = this.toQuickPickItems(this.variables);

		const item = await vscode.window.showQuickPick(items, {
			placeHolder: '変数を選択してください。',
			matchOnDescription: true,
		});
		if (!item) return;

		const editor = vscode.window.activeTextEditor;
		if (!editor) return;

		editor.edit(editBuilder => editBuilder.replace(editor.selection, item.label));
	}
}
