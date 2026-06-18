import vscode from 'vscode';
import {FileUtil} from './FileUtil';
import {Api} from './Api';
import {DefinitionsFile} from './DefinitionsFile';
import {ContentFile} from './ContentFile';
import {CodeFile} from './CodeFile';
import {JsonFile} from './JsonFile';
import {ActiveConnectionV2} from './ActiveConnection';
import {ContentStrategyV2, UploadPlan} from './ContentStrategy';
import {
	ApiResult,
	CompilationFailureArgs,
	GeneralFailureArgs,
	ValidationFailureArgs,
} from '../../common/types/ApiResult';
import {Content, ContentV2, UploadChoice} from '../../common/types/Content';
import {Code} from '../../common/types/Code';
import {
	SyncAction,
	SyncDiff,
	SyncSelection,
	buildActions,
	buildDefaultSelections,
	computeSyncDiff,
	orderActions,
} from '../../common/types/SyncPlan';
import {SyncActionRecord, SyncLog} from './SyncLog';
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
		if (!getActiveConnection().current) return ApiResult.generalFailure(Locale.pleaseSelectConnection);

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

		const ac = getActiveConnection();
		const subdir = ac instanceof ActiveConnectionV2 ? ac.subdir : undefined;

		const dispatched = await this.dispatchUpload(plan, content, codeList);
		const uploadResult = dispatched.result;

		if (uploadResult.isFailure())
		{
			getUploadStatus().showError();
			if (subdir)
			{
				const refreshResult = await this.refreshCache(subdir);
				if (refreshResult.isFailure())
				{
					vscode.window.showWarningMessage('サーバーへの接続に問題があります。接続を確認してください。');
				}
			}
			return uploadResult;
		}

		getHotReloadServer().postMessage({type: 'reload', pageId: uploadResult.value.content.page_id});

		await ContentFile.write(uri, uploadResult.value.content);
		await CodeFile.create(uri, uploadResult.value.content);

		await this.updateContentCache(uploadResult.value.content, subdir, dispatched.replacedPageId);

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

	private async refreshCache(subdir: string): Promise<Awaited<ReturnType<typeof Api.list>>>
	{
		const result = await Api.list();
		if (result.isSuccess()) getContentCache().set(subdir, result.value);
		else getContentCache().clear(subdir);
		return result;
	}

	private async updateContentCache(content: Content, subdir: string | undefined, replacedPageId?: string): Promise<void>
	{
		if (!subdir) return;

		const strategy = getContentStrategy();
		if (!(strategy instanceof ContentStrategyV2)) return;

		const v2Result = strategy.safeParse(content);
		if (!v2Result.success)
		{
			getLogger().error('updateContentCache: failed to parse uploaded content', v2Result.error);
			return;
		}

		if (replacedPageId)
		{
			getContentCache().remove(subdir, replacedPageId);
			await ContentFile.deleteContentDir(replacedPageId);
		}
		getContentCache().add(subdir, v2Result.data);
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
					result: ApiResult.generalFailure('接続先のコンテンツ一覧が取得できていません。再試行してください。'),
					replacedPageId: undefined,
				};
		}
	}

	private async handleChoose(candidates: ContentV2[], content: Content, codeList: Code[])
	{
		const items: UploadChoice[] = [
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
		if (!getActiveConnection().current) return ApiResult.generalFailure(Locale.pleaseSelectConnection);

		if (getContentStrategy() instanceof ContentStrategyV2)
		{
			return ApiResult.generalFailure('このコマンドは現在の接続先では使用できません。同期コマンドをご利用ください。');
		}

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

		const errors: (string | GeneralFailureArgs | ValidationFailureArgs | CompilationFailureArgs)[] = [];

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
				return;
			}

			await ContentFile.write(uri, uploadResult.value.content);
		}));

		if (errors.length)
		{
			getUploadStatus().showError();
			return ApiResult.generalFailure('アップロードに失敗したファイルがあります。');
		}

		getUploadStatus().showCompleted();
		return ApiResult.success('全てのコンテンツをアップロードしました。');
	}

	public async download()
	{
		if (!getActiveConnection().current) return ApiResult.generalFailure(Locale.pleaseSelectConnection);

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
		if (!getActiveConnection().current) throw new Error(Locale.pleaseSelectConnection);

		const newPageId = await ContentFile.promptNewPageId();
		if (!newPageId) return;

		await ContentFile.create(newPageId);
	}

	public async duplicate()
	{
		if (!getActiveConnection().current) throw new Error(Locale.pleaseSelectConnection);

		const uri = await ContentFile.resolveActive();
		if (!uri) throw new Error(Locale.pleaseOpenContent);

		const newPageId = await ContentFile.promptDifferentPageId(uri);
		if (!newPageId) return;

		await ContentFile.duplicate(uri, newPageId);
	}

	public async delete()
	{
		if (!getActiveConnection().current) return ApiResult.generalFailure(Locale.pleaseSelectConnection);

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
		if (!getActiveConnection().current) throw new Error(Locale.pleaseSelectConnection);

		const uri = await ContentFile.resolveActive();
		if (!uri) throw new Error(Locale.pleaseOpenContent);

		await CodeFile.changeExtensions(uri, source, target);
	}

	public async downloadSnippets()
	{
		if (!getActiveConnection().current) return ApiResult.generalFailure(Locale.pleaseSelectConnection);

		const uri = await ContentFile.resolveActive();
		if (!uri) return ApiResult.generalFailure(Locale.pleaseOpenContent);

		const content = await ContentFile.read(uri);
		if (!content) return ApiResult.generalFailure(Locale.pleaseOpenContent);

		const uploaded = getContentStrategy().isUploaded(content);
		if (Is.undefined(uploaded))
		{
			return ApiResult.generalFailure('接続先のコンテンツ一覧が取得できていません。再試行してください。');
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
		if (!getActiveConnection().current) return ApiResult.generalFailure(Locale.pleaseSelectConnection);

		const uri = await ContentFile.resolveActive();
		if (!uri) return ApiResult.generalFailure(Locale.pleaseOpenContent);

		const content = await ContentFile.read(uri);
		if (!content) return ApiResult.generalFailure(Locale.pleaseOpenContent);

		const uploaded = getContentStrategy().isUploaded(content);
		if (Is.undefined(uploaded))
		{
			return ApiResult.generalFailure('接続先のコンテンツ一覧が取得できていません。再試行してください。');
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
		if (!getActiveConnection().current) return ApiResult.generalFailure(Locale.pleaseSelectConnection);

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
		if (!getActiveConnection().current) throw new Error(Locale.pleaseSelectConnection);

		const uri = await ContentFile.resolveActive();
		if (!uri) throw new Error(Locale.pleaseOpenContent);

		const content = await ContentFile.read(uri);
		if (!content) throw new Error(Locale.pleaseOpenContent);

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
			return contentStrategy.validate(content, newDefinitions);
		}))).flat();

		if (validationErrors.length > 0)
		{
			const logger = getLogger();
			logger.error(`Connection switch blocked: ${validationErrors.length} validation errors against new definitions`);
			validationErrors.forEach(e =>
			{
				logger.error(`  [${e.page_id}] ${e.field} = ${JSON.stringify(e.value)} (${e.reason})`);
			});
			return ApiResult.generalFailure(
				`接続先を切り替えられません: 既存コンテンツに新しい定義と合わない箇所が ${validationErrors.length} 件あります。`
			);
		}

		const activeConnection = getActiveConnection();
		if (!(activeConnection instanceof ActiveConnectionV2))
		{
			return ApiResult.generalFailure('この接続先は切替に対応していません');
		}

		await activeConnection.set({url, subdir});

		const listResult = await this.refreshCache(subdir);
		if (listResult.isFailure())
		{
			getLogger().error('list fetch failed:', listResult.error);
			vscode.window.showWarningMessage(`接続先 (${subdir}) のコンテンツ一覧をサーバーから取得できませんでした。アップロード時の新規/更新判定など一部機能が無効化されます。`);
		}

		return ApiResult.success(`接続先を ${url} に切り替えました。`);
	}

	public async syncInit()
	{
		const strategy = getContentStrategy();
		if (!(strategy instanceof ContentStrategyV2))
		{
			return ApiResult.generalFailure('同期は現在の接続先では利用できません。');
		}

		const ac = getActiveConnection();
		if (!(ac instanceof ActiveConnectionV2) || !ac.subdir || !ac.current)
		{
			return ApiResult.generalFailure(Locale.pleaseSelectConnection);
		}

		const listResult = await this.refreshCache(ac.subdir);
		if (listResult.isFailure()) return listResult;

		const localResult = await this.loadLocalV2Contents(strategy);
		if (localResult.isFailure()) return localResult;

		const diffs: SyncDiff[] = computeSyncDiff(localResult.value, listResult.value);
		const selections: Record<string, SyncSelection> = buildDefaultSelections(diffs);

		return ApiResult.success({
			diffs,
			selections,
			subdir: ac.subdir,
			url: ac.current,
		});
	}

	private async loadLocalV2Contents(strategy: ContentStrategyV2)
	{
		const workspace = FileUtil.getWorkspace();
		if (!workspace) return ApiResult.generalFailure('ワークスペースが見つかりません');

		const all = await ContentFile.readAll(workspace);
		const v2Contents: ContentV2[] = all.flatMap(c =>
		{
			const v2Result = strategy.safeParse(c);
			if (!v2Result.success) return [];
			return [v2Result.data];
		});

		return ApiResult.success(v2Contents);
	}

	public async syncExecute(selections: Record<string, SyncSelection>, subdir: string, url: string)
	{
		const strategy = getContentStrategy();
		if (!(strategy instanceof ContentStrategyV2))
		{
			return ApiResult.generalFailure('同期は現在の接続先では利用できません。');
		}

		const list = getContentCache().get(subdir);
		if (!list) return ApiResult.generalFailure('接続先のコンテンツ一覧が取得できていません。再試行してください。');

		const localResult = await this.loadLocalV2Contents(strategy);
		if (localResult.isFailure()) return localResult;

		const diffs: SyncDiff[] = computeSyncDiff(localResult.value, list);
		const actions = buildActions(diffs, selections);
		const ordered = orderActions(actions);

		const results = await ordered.reduce<Promise<SyncActionRecord[]>>(
			async (accumulator, action) =>
			{
				const acc = await accumulator;
				const result = await this.executeOneSyncAction(action, subdir, strategy, list);
				return [...acc, result];
			},
			Promise.resolve([])
		);

		const logUri = await SyncLog.write(subdir, url, results);
		if (logUri) await vscode.window.showTextDocument(logUri);

		const successCount = results.filter(r => !r.error).length;
		const failureCount = results.filter(r => r.error).length;
		return ApiResult.success(`同期完了: 成功 ${successCount} 件、失敗 ${failureCount} 件`);
	}

	private formatError(error: GeneralFailureArgs | ValidationFailureArgs | CompilationFailureArgs): string
	{
		switch (error.type)
		{
			case 'ValidationErrorType':
				return error.messages.join('\n');

			case 'CompilationErrorType':
				return 'コンパイルエラー';

			default:
				return error.message;
		}
	}

	private async executeOneSyncAction(action: SyncAction, subdir: string, strategy: ContentStrategyV2, list: ContentV2[]): Promise<SyncActionRecord>
	{
		if (action.kind === 'update' || action.kind === 'create')
		{
			const uri = ContentFile.contentFileUri(action.local.page_id);
			if (!uri) return {action, error: 'ローカルのコンテンツファイルパスが取得できませんでした'};

			const codeList = await CodeFile.read(uri);
			const result = action.kind === 'update'
				? await Api.update(action.local, codeList)
				: await Api.create(action.local, codeList);

			if (result.isFailure()) return {action, error: this.formatError(result.error)};

			const v2Result = strategy.safeParse(result.value.content);
			if (v2Result.success) getContentCache().add(subdir, v2Result.data);
			return {action};
		}

		if (action.kind === 'replace')
		{
			const uri = ContentFile.contentFileUri(action.local.page_id);
			if (!uri) return {action, error: 'ローカルのコンテンツファイルパスが取得できませんでした'};

			const codeList = await CodeFile.read(uri);
			const result = await Api.replace(action.local, codeList, action.targetPageId);

			if (result.isFailure()) return {action, error: this.formatError(result.error)};

			getContentCache().remove(subdir, action.targetPageId);
			const v2Result = strategy.safeParse(result.value.content);
			if (v2Result.success) getContentCache().add(subdir, v2Result.data);
			await ContentFile.deleteContentDir(action.targetPageId);
			return {action};
		}

		if (action.kind === 'delete')
		{
			const target = list.find(c => c.page_id === action.pageId);
			if (!target) return {action, error: '削除対象のコンテンツがサーバー側に見つかりません'};

			const result = await Api.delete(target);
			if (result.isFailure()) return {action, error: this.formatError(result.error)};

			getContentCache().remove(subdir, action.pageId);
			return {action};
		}

		if (action.kind === 'downloadLocal')
		{
			const result = await Api.download(action.server);
			if (result.isFailure()) return {action, error: this.formatError(result.error)};

			const v2Result = strategy.safeParse(result.value.content);
			if (!v2Result.success) return {action, error: 'サーバー応答が不正な形式です'};

			const uri = ContentFile.contentFileUri(v2Result.data.page_id);
			if (!uri) return {action, error: 'ローカルのコンテンツファイルパスが取得できませんでした'};

			await ContentFile.write(uri, v2Result.data);
			await CodeFile.create(uri, v2Result.data);
			await CodeFile.write(uri, v2Result.data, result.value.codeList);
			return {action};
		}

		return {action, error: 'unknown action'};
	}
}
