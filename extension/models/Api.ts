import {z} from 'zod';
import fetch, {Response, BodyInit, FetchError} from 'node-fetch';
import {ApiFile} from './ApiFile';
import {ApiResult} from '../../common/types/ApiResult';
import {Is} from '../../common/types/Is';
import {zCompileErrors} from '../../common/types/CompileErrors';
import {getLogger, getContentStrategy, getDefinitionsStrategy} from './Services';
import {Content} from '../../common/types/Content';
import {ContentStrategyV2} from './ContentStrategy';
import {Code} from '../../common/types/Code';

const isJsonResponse = (response: Response) =>
{
	const contentType = response.headers.get('content-type');

	if (!contentType) return false;

	return (contentType.indexOf('application/json') !== -1);
};

export class Api
{
	public static async upload(content: Content, codeList: Code[])
	{
		const contentStrategy = getContentStrategy();
		const endpoint = contentStrategy.uploadEndpoint(content);
		const method = contentStrategy.uploadMethod(content);
		const body = JSON.stringify({
			contents: contentStrategy.parse(content),
			contents_html: codeList
		});

		const result = await Api.fetch(endpoint, method, body);

		if (result.isSuccess())
		{
			if (Is.undefined(result.value.contents))
			{
				const zCompileErrorsResult = zCompileErrors.safeParse(result.value);
				if (zCompileErrorsResult.success)
				{
					return ApiResult.compilationFailure(zCompileErrorsResult.data);
				}
				else
				{
					getLogger().error(`API invalid response [${content.page_id}]:`, zCompileErrorsResult.error);
					return ApiResult.generalFailure('APIのレスポンスが不正な形式です。');
				}
			}
			else
			{
				const zResult = contentStrategy.safeParse(result.value.contents);
				if (zResult.success)
				{
					return ApiResult.success({content: zResult.data});
				}
				else
				{
					getLogger().error(`API invalid response [${content.page_id}]:`, zResult.error);
					return ApiResult.generalFailure('APIのレスポンスが不正な形式です。');
				}
			}
		}
		else
		{
			return result;
		}
	}

	public static async download(content: Content)
	{
		const contentStrategy = getContentStrategy();
		const result = await Api.fetch(`info?${contentStrategy.serverIdParam(content)}`, 'GET');

		if (result.isSuccess())
		{
			const zResult = contentStrategy.safeParse(result.value.contents);
			if (zResult.success)
			{
				return ApiResult.success({
					content: zResult.data,
					codeList: result.value.contents_html as Code[]
				});
			}
			else
			{
				getLogger().error(`API invalid response [${content.page_id}]:`, result.value);
				return ApiResult.generalFailure('APIのレスポンスが不正な形式です。');
			}
		}
		else
		{
			return result;
		}
	}

	public static async delete(content: Content)
	{
		const result = await Api.fetch(`delete?${getContentStrategy().serverIdParam(content)}`, 'DELETE');

		if (result.isSuccess())
		{
			return ApiResult.success({});
		}
		else
		{
			return result;
		}
	}

	public static async getVariables(content: Content)
	{
		const result = await Api.fetch(`variables?${getContentStrategy().serverIdParam(content)}`, 'GET');

		if (result.isSuccess())
		{
			if (result.value.Variables)
			{
				return ApiResult.success(result.value.Variables);
			}
			else
			{
				getLogger().error(`API invalid response [${content.page_id}]:`, result.value);
				return ApiResult.generalFailure('APIのレスポンスが不正な形式です。');
			}
		}
		else
		{
			return result;
		}
	}

	public static async getSnippets(content: Content)
	{
		const result = await Api.fetch(`snippets?${getContentStrategy().serverIdParam(content)}`, 'GET');

		if (result.isSuccess())
		{
			if (result.value.Snippets)
			{
				return ApiResult.success(result.value.Snippets);
			}
			else
			{
				getLogger().error(`API invalid response [${content.page_id}]:`, result.value);
				return ApiResult.generalFailure('APIのレスポンスが不正な形式です。');
			}
		}
		else
		{
			return result;
		}
	}

	public static async getDefinitions()
	{
		const result = await Api.fetch('definitions', 'GET');

		if (result.isSuccess())
		{
			const zResult = getDefinitionsStrategy().safeParse(result.value.definitions);
			if (zResult.success)
			{
				return ApiResult.success(zResult.data);
			}
			else
			{
				getLogger().error('API invalid response:', zResult.error);

				return ApiResult.generalFailure('APIのレスポンスが不正な形式です。');
			}
		}
		else
		{
			return result;
		}
	}

	public static async create(content: Content, codeList: Code[])
	{
		return Api.sendContent('create', 'POST', content, codeList);
	}

	public static async update(content: Content, codeList: Code[])
	{
		return Api.sendContent('update', 'PUT', content, codeList);
	}

	public static async replace(content: Content, codeList: Code[], targetPageId: string)
	{
		const endpoint = `replace?target_page_id=${encodeURIComponent(targetPageId)}`;
		return Api.sendContent(endpoint, 'PUT', content, codeList);
	}

	private static async sendContent(
		endpoint: string,
		method: 'POST' | 'PUT',
		content: Content,
		codeList: Code[]
	)
	{
		const contentStrategy = getContentStrategy();
		const body = JSON.stringify({
			contents: contentStrategy.parse(content),
			contents_html: codeList,
		});

		const result = await Api.fetch(endpoint, method, body);
		if (result.isFailure()) return result;

		if (Is.undefined(result.value.contents))
		{
			const zCompileErrorsResult = zCompileErrors.safeParse(result.value);
			if (zCompileErrorsResult.success)
			{
				return ApiResult.compilationFailure(zCompileErrorsResult.data);
			}
			getLogger().error(`API invalid response [${content.page_id}]:`, zCompileErrorsResult.error);
			return ApiResult.generalFailure('APIのレスポンスが不正な形式です。');
		}

		const zResult = contentStrategy.safeParse(result.value.contents);
		if (!zResult.success)
		{
			getLogger().error(`API invalid response [${content.page_id}]:`, zResult.error);
			return ApiResult.generalFailure('APIのレスポンスが不正な形式です。');
		}
		return ApiResult.success({content: zResult.data});
	}

	public static async list()
	{
		const strategy = getContentStrategy();
		if (!(strategy instanceof ContentStrategyV2))
		{
			return ApiResult.generalFailure('この機能は現在の接続先では利用できません。');
		}

		const result = await Api.fetch('list', 'GET');
		if (result.isFailure()) return result;

		const zResult = strategy.safeParseList(result.value.contents);
		if (!zResult.success)
		{
			getLogger().error('API invalid response:', zResult.error);
			return ApiResult.generalFailure('APIのレスポンスが不正な形式です。');
		}

		return ApiResult.success(zResult.data);
	}

	private static async fetch(endpoint: string, method: string, body: BodyInit | undefined = undefined)
	{
		const settings = await ApiFile.read();

		if (!settings)
		{
			const message = `${ApiFile.fileName}を読み込めません。環境設定を確認してください。`;
			getLogger().error('settings error:', message);
			return ApiResult.generalFailure(message);
		}

		const url = `${settings.url}api/v1/m/contents/${endpoint}`;
		const headers = {
			'X-Auth-Token': `${settings.id}:${settings.pass}`,
			'Content-Type': 'application/json'
		};

		try
		{
			const response = await fetch(url, {
				method,
				headers,
				body,
			});

			const text = await response.text();

			if (!isJsonResponse(response))
			{
				getLogger().error('Non-JSON response:', text);
				return ApiResult.generalFailure(text);
			}

			let data: any = undefined;

			try
			{
				data = JSON.parse(text);
			}
			catch (jsonError)
			{
				getLogger().error('JSON parse error:', jsonError);
				getLogger().error('Response body:', text);
				return ApiResult.generalFailure('APIのレスポンスが不正なJSON形式です。');
			}

			if (data.error)
			{
				const message = data.error.message;

				if (Is.array<string>(message))
				{
					return ApiResult.validationFailure(message);
				}
				if (Is.string(message))
				{
					return ApiResult.generalFailure(message);
				}

				getLogger().error('API error response:', data);
				return ApiResult.generalFailure('APIのレスポンスが不正な形式です。');
			}
			else
			{
				return ApiResult.success(data);
			}
		}
		catch (error)
		{
			getLogger().error('Fetch exception:', error);
			return ApiResult.generalFailure((error as FetchError).message);
		}
	}
}
