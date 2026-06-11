import vscode from 'vscode';
import {FileUtil} from './FileUtil';
import {Api} from './Api';
import {DefinitionsFile} from './DefinitionsFile';
import {ContentFile} from './ContentFile';
import {CodeFile} from './CodeFile';
import {JsonFile} from './JsonFile';
import {ActiveConnectionV2} from './ActiveConnection';
import {ContentStrategyV2, UploadPlan} from './ContentStrategy';
import {ApiResult} from '../../common/types/ApiResult';
import {Content} from '../../common/types/Content';
import {Code} from '../../common/types/Code';
import {Is} from '../../common/types/Is';
import {Locale} from '../locales/ja';
import {
	getActiveConnection,
	getContentStrategy,
	getHotReloadServer,
	getContentCache,
	getLogger,
	getUploadStatus,
} from './Services';

export class Command
{
	public async upload()
	{
		getUploadStatus().showUploading();

		const uri = await ContentFile.resolveActive();
		if (!uri)
		{
			getUploadStatus().showError();
			return ApiResult.generalFailure(Locale.pleaseOpenContent);
		}

		await CodeFile.clearCompileErrors(uri);

		const definitions = await DefinitionsFile.read();
		const content = await ContentFile.read(uri);

		if (!definitions || !content)
		{
			getUploadStatus().showError();
			return ApiResult.generalFailure(Locale.pleaseOpenContent);
		}

		const codeList = await CodeFile.read(uri);
		const strategy = getContentStrategy();
		const plan = strategy.uploadPlan(content);

		const dispatched = await this.dispatchUpload(plan, content, codeList);
		const uploadResult = dispatched.result;

		if (uploadResult.isFailure())
		{
			getUploadStatus().showError();
			return uploadResult;
		}

		getHotReloadServer().postMessage({type: 'reload', pageId: uploadResult.value.content.page_id});

		await ContentFile.write(uri, uploadResult.value.content);
		await CodeFile.create(uri, uploadResult.value.content);

		if (strategy instanceof ContentStrategyV2)
		{
			const ac = getActiveConnection();
			if (ac instanceof ActiveConnectionV2 && ac.subdir)
			{
				if (dispatched.replacedPageId) getContentCache().remove(ac.subdir, dispatched.replacedPageId);
				getContentCache().add(ac.subdir, uploadResult.value.content);
			}
		}

		const downloadResult = await Api.download(uploadResult.value.content);

		if (downloadResult.isFailure())
		{
			getUploadStatus().showError();
			return downloadResult;
		}

		await ContentFile.write(uri, downloadResult.value.content);
		await CodeFile.write(uri, downloadResult.value.content, downloadResult.value.codeList);

		if (content.use_template_engine)
		{
			const snippetsResult = await Api.getSnippets(uploadResult.value.content);
			if (snippetsResult.isFailure())
			{
				getUploadStatus().showError();
				return snippetsResult;
			}
			await JsonFile.write('snippets', snippetsResult.value, uri);
		}
		else
		{
			const variablesResult = await Api.getVariables(uploadResult.value.content);
			if (variablesResult.isFailure())
			{
				getUploadStatus().showError();
				return variablesResult;
			}
			await JsonFile.write('variables', variablesResult.value, uri);
		}

		getUploadStatus().showCompleted();
		return ApiResult.success(undefined);
	}

	private async dispatchUpload(plan: UploadPlan, content: Content, codeList: Code[])
	{
		switch (plan.kind)
		{
			case 'update':
				return {
					result: await Api.update(content, codeList),
					replacedPageId: undefined
				};
			case 'create':
				return {
					result: await Api.create(content, codeList),
					replacedPageId: undefined
				};
			case 'choose':
				return this.handleChoose(plan.candidates, content, codeList);
			default:
				return {
					result: ApiResult.generalFailure('接続先の list が取得できていません。再試行してください。'),
					replacedPageId: undefined,
				};
		}
	}

	private async handleChoose(candidates: Content[], content: Content, codeList: Code[])
	{
		type Choice =
			| {action: 'create', label: string}
			| {action: 'replace', label: string, targetPageId: string};

		const items: Choice[] = [
			{action: 'create', label: '新規作成'},
			...candidates.map(c => ({
				action: 'replace' as const,
				label: `置き換え: ${c.page_id}`,
				targetPageId: c.page_id,
			})),
		];

		const choice = await vscode.window.showQuickPick(items, {
			placeHolder: `対象: ${content.page_id}`,
		});

		if (!choice)
		{
			return {
				result: ApiResult.generalFailure('アップロードをキャンセルしました。'),
				replacedPageId: undefined,
			};
		}

		if (choice.action === 'create')
		{
			return {
				result: await Api.create(content, codeList),
				replacedPageId: undefined
			};
		}

		return {
			result: await Api.replace(content, codeList, choice.targetPageId),
			replacedPageId: choice.targetPageId,
		};
	}

	public async uploadAll()
	{
		getUploadStatus().showUploading();
		const workspace = FileUtil.getWorkspace();
		const definitions = await DefinitionsFile.read();

		if (!workspace || !definitions)
		{
			getUploadStatus().showError();
			return ApiResult.generalFailure(Locale.pleaseOpenContent);
		}

		const files = await FileUtil.listFiles(workspace);
		const uris = files.filter(file => FileUtil.getBase(file) === ContentFile.fileName);

		const errors = [];

		await Promise.all(uris.map(async uri =>
		{
			const content = await ContentFile.read(uri);

			if (!content)
			{
				errors.push(`${ContentFile.fileName}の読み込みに失敗しました。`);
				return;
			}

			const codeList = await CodeFile.read(uri);

			const uploadResult = await Api.upload(content, codeList);

			if (uploadResult.isFailure())
			{
				errors.push(uploadResult.error);
			}
		}));

		if (errors.length)
		{
			getUploadStatus().showError();
			return ApiResult.generalFailure('アップロードに失敗したファイルがあります。');
		}
		else
		{
			getUploadStatus().showCompleted();
			return ApiResult.success('全てのコンテンツをアップロードしました。');
		}
	}

	public async download()
	{
		const uri = await ContentFile.resolveActive();
		if (!uri) return ApiResult.generalFailure(Locale.pleaseOpenContent);

		const definitions = await DefinitionsFile.read();
		const content = await ContentFile.read(uri);

		if (!definitions || !content)
		{
			return ApiResult.generalFailure(Locale.pleaseOpenContent);
		}

		const downloadResult = await Api.download(content);

		if (downloadResult.isSuccess())
		{
			await ContentFile.write(uri, downloadResult.value.content);
			await CodeFile.write(uri, downloadResult.value.content, downloadResult.value.codeList);

			if (content.use_template_engine)
			{
				const snippetsResult = await Api.getSnippets(downloadResult.value.content);
				if (snippetsResult.isSuccess())
				{
					await JsonFile.write('snippets', snippetsResult.value, uri);

					return ApiResult.success('ダウンロード完了');
				}
				else
				{
					return snippetsResult;
				}
			}
			else
			{
				const variablesResult = await Api.getVariables(downloadResult.value.content);

				if (variablesResult.isSuccess())
				{
					await JsonFile.write('variables', variablesResult.value, uri);

					return ApiResult.success('ダウンロード完了');
				}
				else
				{
					return variablesResult;
				}
			}
		}
		else
		{
			return downloadResult;
		}
	}

	public async create()
	{
		const newPageId = await ContentFile.promptNewPageId();
		if (!newPageId) return;

		await ContentFile.create(newPageId);
	}

	public async duplicate()
	{
		const uri = await ContentFile.resolveActive();
		if (!uri) return;

		const newPageId = await ContentFile.promptDifferentPageId(uri);
		if (!newPageId) return;

		await ContentFile.duplicate(uri, newPageId);
	}

	public async delete()
	{
		const uri = await ContentFile.resolveActive();
		if (!uri) return ApiResult.generalFailure(Locale.pleaseOpenContent);

		const content = await ContentFile.read(uri);

		if (!content)
		{
			return ApiResult.generalFailure(Locale.pleaseOpenContent);
		}

		const result = await Api.delete(content);

		if (result.isSuccess())
		{
			const dirPath = FileUtil.getDirectory(uri);

			await FileUtil.deleteFile(dirPath, {recursive: true, useTrash: true});
			return ApiResult.success('削除完了');
		}
		else
		{
			return result;
		}
	}

	public async changeExtensions(source: string, target: string)
	{
		const uri = await ContentFile.resolveActive();
		if (!uri) return;

		await CodeFile.changeExtensions(uri, source, target);
	}

	public async downloadSnippets()
	{
		const uri = await ContentFile.resolveActive();
		if (!uri) return ApiResult.generalFailure(Locale.pleaseOpenContent);

		const content = await ContentFile.read(uri);
		if (!content) return ApiResult.generalFailure(Locale.pleaseOpenContent);

		const uploaded = getContentStrategy().isUploaded(content);
		if (Is.undefined(uploaded))
		{
			return ApiResult.generalFailure('接続先の list が取得できていません。再試行してください。');
		}
		if (!uploaded)
		{
			return ApiResult.generalFailure('コンテンツをアップロードしてください。');
		}

		const result = await Api.getSnippets(content);

		if (result.isSuccess())
		{
			await JsonFile.write('snippets', result.value, uri);

			return ApiResult.success('ダウンロード完了');
		}
		else
		{
			return result;
		}
	}

	public async downloadVariables()
	{
		const uri = await ContentFile.resolveActive();
		if (!uri) return ApiResult.generalFailure(Locale.pleaseOpenContent);

		const content = await ContentFile.read(uri);
		if (!content) return ApiResult.generalFailure(Locale.pleaseOpenContent);

		const uploaded = getContentStrategy().isUploaded(content);
		if (Is.undefined(uploaded))
		{
			return ApiResult.generalFailure('接続先の list が取得できていません。再試行してください。');
		}
		if (!uploaded)
		{
			return ApiResult.generalFailure('コンテンツをアップロードしてください。');
		}

		const result = await Api.getVariables(content);

		if (result.isSuccess())
		{
			await JsonFile.write('variables', result.value, uri);

			return ApiResult.success('ダウンロード完了');
		}
		else
		{
			return result;
		}
	}

	public async downloadDefinitions()
	{
		const result = await Api.getDefinitions();

		if (result.isSuccess())
		{
			await DefinitionsFile.write(result.value);

			return ApiResult.success('ダウンロード完了');
		}
		else
		{
			return result;
		}
	}

	public async renameDirectory()
	{
		const uri = await ContentFile.resolveActive();
		if (!uri) return;

		const content = await ContentFile.read(uri);

		if (!content) return;

		await ContentFile.changeDirectoryName(uri, content.page_id);
	}

	public async applyConnection(lwDirUri: vscode.Uri, url: string, subdir: string)
	{
		const workspace = FileUtil.getWorkspace();
		if (!workspace) return ApiResult.generalFailure('ワークスペースが見つかりません');

		const targetDefinitionsUri = FileUtil.join(lwDirUri, subdir, 'definitions.json');
		if (!await FileUtil.isFile(targetDefinitionsUri))
		{
			return ApiResult.generalFailure('切替先の definitions.json が見つかりません');
		}

		const newDefinitions = await DefinitionsFile.readAt(targetDefinitionsUri);
		if (!newDefinitions)
		{
			return ApiResult.generalFailure('切替先の definitions.json が不正な形式です');
		}

		const contentFiles = await vscode.workspace.findFiles(
			new vscode.RelativePattern(workspace, '**/contents.json'),
			new vscode.RelativePattern(workspace, '**/node_modules/**')
		);
		const contentStrategy = getContentStrategy();

		const validationErrors = (await Promise.all(contentFiles.map(async uri =>
		{
			const content = await ContentFile.read(uri);
			if (!content) return [];
			const errors = contentStrategy.validate(content, newDefinitions);
			return errors.map(e => ({...e, contentPath: uri.fsPath}));
		}))).flat();

		if (validationErrors.length > 0)
		{
			const logger = getLogger();
			logger.error(`接続先切替不可: ${validationErrors.length} 件のコンテンツ定義不整合`);
			validationErrors.forEach(e =>
			{
				logger.error(`  ${e.contentPath}: ${e.field} = ${JSON.stringify(e.value)} (${e.reason})`);
			});
			return ApiResult.generalFailure(
				`接続先を切り替えられません: ${validationErrors.length} 件のコンテンツ定義不整合があります（詳細はログを確認してください）`
			);
		}

		const activeConnection = getActiveConnection();
		if (!(activeConnection instanceof ActiveConnectionV2))
		{
			return ApiResult.generalFailure('V2 接続先のみ切替可能です');
		}

		await activeConnection.set({url, subdir});

		const listResult = await Api.list();
		if (listResult.isSuccess())
		{
			getContentCache().set(subdir, listResult.value);
		}
		else
		{
			getLogger().error('list 取得失敗:', listResult.error);
			getContentCache().clear(subdir);
			vscode.window.showWarningMessage(`接続先 (${subdir}) の list 取得に失敗しました。アップロード判定など一部機能が無効化されます。`);
		}

		return ApiResult.success(`接続先を ${url} に切り替えました。`);
	}
}
