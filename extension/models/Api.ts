import {z} from 'zod';
import fetch, {Response, BodyInit, FetchError} from 'node-fetch';
import {FileUtil} from './FileUtil';
import {ApiResult} from '../types/ApiResult';
import {Content, zContent} from '../types/Content';
import {Code} from '../types/Code';
import {zDefinitions} from '../types/Definitions';
import {Is} from '../types/Is';

const zApiSettings = z.object({
	url: z.string(),
	id: z.string(),
	pass: z.string(),
});

export type ApiSettings = z.infer<typeof zApiSettings>;

const isJsonResponse = (response: Response) =>
{
	const contentType = response.headers.get('content-type');

	if (!contentType) return false;

	return (contentType.indexOf('application/json') !== -1);
};

export class Api
{
	private static fileName = 'api.json';

	public static async upload(content: Content, codeList: Code[])
	{
		const endpoint = `${content.id ? 'update' : 'create'}`;
		const method = content.id ? 'PUT' : 'POST';
		const body = JSON.stringify({
			contents: content,
			contents_html: codeList
		});

		const result = await Api.fetch(endpoint, method, body);

		if (result.isSuccess())
		{
			const zResult = zContent.safeParse(result.value.contents);
			if (zResult.success)
			{
				return ApiResult.success({
					content: zResult.data,
				});
			}
			else
			{
				return ApiResult.generalFailure('APIのレスポンスが不正な形式です。');
			}
		}
		else
		{
			return result;
		}
	}

	public static async download(content: Content)
	{
		const result = await Api.fetch(`info?id=${content.id}`, 'GET');

		if (result.isSuccess())
		{
			const zResult = zContent.safeParse(result.value.contents);
			if (zResult.success)
			{
				return ApiResult.success({
					content: zResult.data,
					codeList: result.value.contents_html as Code[]
				});
			}
			else
			{
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
		const result = await Api.fetch(`delete?id=${content.id}`, 'DELETE');

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
		const result = await Api.fetch(`variables?id=${content.id}`, 'GET');

		if (result.isSuccess())
		{
			if (result.value.Variables)
			{
				return ApiResult.success(result.value.Variables);
			}
			else
			{
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
			const zResult = zDefinitions.safeParse(result.value.definitions);
			if (zResult.success)
			{
				return ApiResult.success(zResult.data);
			}
			else
			{
				console.error(zResult.error);
				return ApiResult.generalFailure('APIのレスポンスが不正な形式です。');
			}
		}
		else
		{
			return result;
		}
	}

	public static async settings()
	{
		const workspaceUri = FileUtil.getWorkspace();

		if (!workspaceUri) return undefined;

		const uri = FileUtil.join(workspaceUri, FileUtil.LW_DIRECTORY_NAME, Api.fileName);

		try
		{
			const data = JSON.parse(await FileUtil.readFile(uri));

			const settings = zApiSettings.parse(data);

			return settings;
		}
		catch (error)
		{
			console.error(error);
			return undefined;
		}
	}

	private static async fetch(endpoint: string, method: string, body: BodyInit|undefined = undefined)
	{
		const settings = await Api.settings();

		if (!settings)
		{
			return ApiResult.generalFailure(`${Api.fileName}のフォーマットが不正な形式です。`);
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

			if (!isJsonResponse(response))
			{
				const text = await response.text();
				return ApiResult.generalFailure(text);
			}

			const data = await (response).json();

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

				return ApiResult.generalFailure('APIのレスポンスが不正な形式です。');
			}
			else
			{
				return ApiResult.success(data);
			}
		}
		catch (error)
		{
			return ApiResult.generalFailure((error as FetchError).message);
		}
	}
}
