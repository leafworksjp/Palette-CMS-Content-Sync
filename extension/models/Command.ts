import {FileUtil} from './FileUtil';
import {Api} from './Api';
import {DefinitionsFile} from './DefinitionsFile';
import {ContentFile} from './ContentFile';
import {CodeFile} from './CodeFile';
import {JsonFile} from './JsonFile';
import {ApiResult} from '../../common/types/ApiResult';
import {Locale} from '../locales/ja';
import {getHotReloadServer, getUploadStatus, getContentStrategy} from './Services';

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

		const uploadResult = await Api.upload(content, codeList);

		if (uploadResult.isSuccess())
		{
			getHotReloadServer().postMessage({type: 'reload', pageId: content.page_id});

			await ContentFile.write(uri, uploadResult.value.content);
			await CodeFile.create(uri, uploadResult.value.content);

			const downloadResult = await Api.download(uploadResult.value.content);

			if (downloadResult.isSuccess())
			{
				await ContentFile.write(uri, downloadResult.value.content);
				await CodeFile.write(uri, downloadResult.value.content, downloadResult.value.codeList);
			}
			else
			{
				getUploadStatus().showError();
				return downloadResult;
			}

			if (content.use_template_engine)
			{
				const snippetsResult = await Api.getSnippets(uploadResult.value.content);
				if (snippetsResult.isSuccess())
				{
					await JsonFile.write('snippets', snippetsResult.value, uri);

					getUploadStatus().showCompleted();
					return ApiResult.success(undefined);
				}
				else
				{
					getUploadStatus().showError();
					return snippetsResult;
				}
			}
			else
			{
				const variablesResult = await Api.getVariables(uploadResult.value.content);

				if (variablesResult.isSuccess())
				{
					await JsonFile.write('variables', variablesResult.value, uri);

					getUploadStatus().showCompleted();
					return ApiResult.success(undefined);
				}
				else
				{
					getUploadStatus().showError();
					return variablesResult;
				}
			}
		}
		else
		{
			getUploadStatus().showError();
			return uploadResult;
		}
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
		const uri = await ContentFile.resolveActive();
		if (!uri) return;

		const newFileName = await ContentFile.createNewFileName(uri);

		if (!newFileName) return;

		await ContentFile.create(newFileName);
	}

	public async duplicate()
	{
		const uri = await ContentFile.resolveActive();
		if (!uri) return;

		const newFileName = await ContentFile.createNewFileName(uri);

		if (!newFileName) return;

		await ContentFile.duplicate(uri, newFileName);
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

		if (!content || !getContentStrategy().isUploaded(content))
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

		if (!content || !getContentStrategy().isUploaded(content))
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

	public async changePageId(newPageId: string)
	{
		const uri = await ContentFile.resolveActive();
		if (!uri) return ApiResult.generalFailure(Locale.pleaseOpenContent);

		const contentStrategy = getContentStrategy();

		const content = await ContentFile.read(uri);

		if (!content) return ApiResult.generalFailure(Locale.pleaseOpenContent);

		if (!contentStrategy.isUploaded(content))
		{
			return ApiResult.generalFailure('コンテンツをアップロードしてください。');
		}

		if (contentStrategy.isPageIdServerIdentifier())
		{
			const result = await Api.changePageId(content, newPageId);
			if (!result.isSuccess()) return result;

			await ContentFile.write(uri, result.value.content);
		}
		else
		{
			await ContentFile.write(uri, {...content, page_id: newPageId});
		}

		await ContentFile.changeDirectoryName(uri, newPageId);
		return ApiResult.success('コンテンツIDを更新しました。');
	}
}
