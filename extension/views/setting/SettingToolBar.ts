import {FileUtil} from '../../models/FileUtil';
import {Api} from '../../models/Api';
import {DefinitionsFile} from '../../models/DefinitionsFile';
import {ContentFile} from '../../models/ContentFile';
import {CodeFile} from '../../models/CodeFile';
import {VariablesFile} from '../../models/VariablesFile';
import {ApiResult} from '../../types/ApiResult';
import {Locale} from '../../locales/ja';

export class SettingToolBar
{
	public async upload()
	{
		const definitions = await DefinitionsFile.read();
		const content = await ContentFile.read();

		if (!definitions || !content)
		{
			return ApiResult.generalFailure(Locale.pleaseOpenContent);
		}

		const codeList = await CodeFile.read();

		const uploadResult = await Api.upload(content, codeList);

		if (uploadResult.isSuccess())
		{
			await ContentFile.write(uploadResult.value.content);
			await CodeFile.create(uploadResult.value.content);

			const downloadResult = await Api.download(uploadResult.value.content);

			if (downloadResult.isSuccess())
			{
				await ContentFile.write(downloadResult.value.content);
				await CodeFile.write(downloadResult.value.content, downloadResult.value.codeList);
			}
			else
			{
				return downloadResult;
			}

			const variablesResult = await Api.getVariables(uploadResult.value.content);

			if (variablesResult.isSuccess())
			{
				await VariablesFile.write(variablesResult.value);

				return ApiResult.success('アップロード完了');
			}
			else
			{
				return variablesResult;
			}
		}
		else
		{
			return uploadResult;
		}
	}

	public async uploadAll()
	{
		const workspace = FileUtil.getWorkspace();
		const definitions = await DefinitionsFile.read();

		if (!workspace || !definitions)
		{
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
			return ApiResult.generalFailure('アップロードに失敗したファイルがあります。');
		}
		else
		{
			return ApiResult.success('アップロード完了');
		}
	}

	public async download()
	{
		const definitions = await DefinitionsFile.read();
		const content = await ContentFile.read();

		if (!definitions || !content)
		{
			return ApiResult.generalFailure(Locale.pleaseOpenContent);
		}

		const downloadResult = await Api.download(content);

		if (downloadResult.isSuccess())
		{
			await ContentFile.write(downloadResult.value.content);
			await CodeFile.write(downloadResult.value.content, downloadResult.value.codeList);

			const variablesResult = await Api.getVariables(downloadResult.value.content);

			if (variablesResult.isSuccess())
			{
				await VariablesFile.write(variablesResult.value);

				return ApiResult.success('ダウンロード完了');
			}
			else
			{
				return variablesResult;
			}
		}
		else
		{
			return downloadResult;
		}
	}

	public async create()
	{
		await ContentFile.create();
	}

	public async duplicate()
	{
		const sourceDir = await ContentFile.getDirectoryPath();
		const newFileName = await FileUtil.getNewFileName();

		if (!sourceDir || !await FileUtil.exists(sourceDir) || !newFileName) return;

		const targetDir = FileUtil.join(sourceDir, '..', newFileName);

		await FileUtil.copy(sourceDir, targetDir);

		const targetContentFile = FileUtil.join(targetDir, ContentFile.fileName);

		if (!await FileUtil.exists(targetContentFile)) return;

		const content = JSON.parse(await FileUtil.readFile(targetContentFile));

		content.id = '';
		content.page_id = newFileName;
		content.state = 0;

		await FileUtil.writeFile(targetContentFile, JSON.stringify(content, undefined, 4));

		await FileUtil.openFileInEditor(targetContentFile);
	}

	public async delete()
	{
		const content = await ContentFile.read();

		if (!content)
		{
			return ApiResult.generalFailure(Locale.pleaseOpenContent);
		}

		const result = await Api.delete(content);

		if (result.isSuccess())
		{
			const dirPath = await ContentFile.getDirectoryPath();

			if (dirPath)
			{
				await FileUtil.deleteFile(dirPath, {recursive: true, useTrash: true});
				return ApiResult.success('削除完了');
			}
			else
			{
				return ApiResult.generalFailure('コンテンツのフォルダが見つかりません。');
			}
		}
		else
		{
			return result;
		}
	}

	public async changeExtensions(source: string, target: string)
	{
		await CodeFile.changeExtensions(source, target);
	}

	public async downloadVariables()
	{
		const content = await ContentFile.read();

		if (!content || !content.id)
		{
			return ApiResult.generalFailure('コンテンツをアップロードしてください。');
		}

		const result = await Api.getVariables(content);

		if (result.isSuccess())
		{
			await VariablesFile.write(result.value);

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
		const content = await ContentFile.read();

		if (!content) return;

		await ContentFile.changeDirectoryName(content.page_id);
	}
}
