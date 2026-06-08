import vscode from 'vscode';
import {FileUtil} from '../../models/FileUtil';
import {SettingHtml} from './SettingHtml';
import {Content, updateDefaultValues} from '../../../common/types/Content';
import {DefinitionsFile} from '../../models/DefinitionsFile';
import {ContentFormatter} from '../../models/ContentFormatter';
import {ContentFile} from '../../models/ContentFile';
import {getConnection, getContentStrategy, getVersion} from '../../models/Services';

export class SettingWebView implements vscode.WebviewViewProvider
{
	public readonly id = 'paletteCmsContentSync.settingView';

	private webview?: vscode.Webview;
	private content?: Content;

	constructor(
		private readonly extensionUri: vscode.Uri
	)
	{
	}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		token: vscode.CancellationToken
	)
	{
		this.webview = webviewView.webview;

		this.webview.options = {
			enableScripts: true,
			localResourceRoots: [this.extensionUri]
		};

		this.webview.onDidReceiveMessage(this.handleMessage.bind(this));

		this.webview.html = SettingHtml.get(this.webview, this.extensionUri);

		this.refresh();
	}

	private async handleMessage(message: any)
	{
		if (!this.webview || !this.content) return;

		switch (message.command)
		{
			case 'onLoad':
				await this.refresh();
				break;

			case 'updateValue':
				await this.updateValue(message.key, message.value);
				break;

			case 'addSearchQuery':
				{
					const uri = await ContentFile.resolveActive();
					if (!uri) break;

					this.content = ContentFormatter.for(this.content).addSearchQuery(message.index).content;

					await ContentFile.write(uri, this.content);

					this.webview.postMessage({
						command: 'setSearchQueries',
						value: this.content.search_query_where,
					});
				}
				break;

			case 'deleteSearchQuery':
				{
					const uri = await ContentFile.resolveActive();
					if (!uri) break;

					this.content = ContentFormatter.for(this.content).deleteSearchQuery(message.index).content;

					await ContentFile.write(uri, this.content);

					this.webview.postMessage({
						command: 'setSearchQueries',
						value: this.content.search_query_where,
					});
				}
				break;

			case 'addOrderQuery':
				{
					const uri = await ContentFile.resolveActive();
					if (!uri) break;

					this.content = ContentFormatter.for(this.content).addOrderQuery(message.index).content;

					await ContentFile.write(uri, this.content);

					this.webview.postMessage({
						command: 'setOrderQueries',
						value: this.content.search_query_order,
					});
				}
				break;

			case 'deleteOrderQuery':
				{
					const uri = await ContentFile.resolveActive();
					if (!uri) break;

					this.content = ContentFormatter.for(this.content).deleteOrderQuery(message.index).content;

					await ContentFile.write(uri, this.content);

					this.webview.postMessage({
						command: 'setOrderQueries',
						value: this.content.search_query_order,
					});
				}
				break;

			default:
				break;
		}
	}

	private async updateValue(key: Exclude<keyof Content, 'is_unsynced'>, value: any)
	{
		if (!this.webview || !this.content) return;

		const documentUri = vscode.window.activeTextEditor?.document?.uri;
		const uri = await ContentFile.resolveActive(documentUri);
		if (!uri) return;

		this.content = ContentFormatter.for(this.content).formatValue(key, value).content;

		await ContentFile.write(uri, this.content);
		switch (key)
		{
			case 'contents_type':
			case 'sheet_id':
				{
					const version = getVersion();
					if (!version) break;

					const definitions = await DefinitionsFile.read();
					if (!definitions) break;

					const url = getConnection().current;
					if (!url) break;

					this.content = updateDefaultValues(definitions, this.content);

					const fileName = documentUri ? FileUtil.getName(documentUri) : '';

					const contentStrategy = getContentStrategy();

					this.webview.postMessage({
						command: 'refresh',
						value: {
							definitions,
							content: this.content,
							fileName,
							version,
							url,
							isReadOnly: contentStrategy.isUploaded(this.content),
							supportsSheetRefValue: contentStrategy.supportsSheetRefValue(),
						}
					});
				}
				break;

			case 'name':
				this.webview.postMessage({
					command: 'setName',
					value: this.content.name,
				});
				break;

			case 'page_id':
				this.webview.postMessage({
					command: 'setPageId',
					value: this.content.page_id,
				});
				break;

			case 'permission':
				this.webview.postMessage({
					command: 'setPermission',
					value: this.content.permission,
				});
				break;

			case 'role_key':
				this.webview.postMessage({
					command: 'setRoleKey',
					value: this.content.role_key,
				});
				break;

			case 'search_query_order_state':
				this.webview.postMessage({
					command: 'setSearchQueryOrderState',
					value: this.content.search_query_order_state,
				});
				break;

			default:
				break;
		}
	}

	public postMessage(command: string, value: any)
	{
		this.webview?.postMessage({command, value});
	}

	public async refresh()
	{
		const version = getVersion();
		if (!version) return;

		const definitions = await DefinitionsFile.read();
		if (!this.webview || !definitions) return;

		const url = getConnection().current;
		if (!url) return;

		const documentUri = vscode.window.activeTextEditor?.document?.uri;
		const uri = await ContentFile.resolveActive(documentUri);
		this.content = uri ? await ContentFile.read(uri) : undefined;

		const fileName = documentUri ? FileUtil.getName(documentUri) : '';

		const contentStrategy = getContentStrategy();

		this.webview.postMessage({
			command: 'refresh',
			value: {
				definitions,
				content: this.content,
				fileName,
				version,
				url,
				isReadOnly: this.content ? contentStrategy.isUploaded(this.content) : false,
				supportsSheetRefValue: contentStrategy.supportsSheetRefValue(),
			}
		});

		this.webview.postMessage({
			command: 'setErrors',
			value: [],
		});
	}
}
