import vscode from 'vscode';
import {Browser} from './Browser';
import {HttpServer} from './HttpServer';
import {CodeFile} from './CodeFile';
import {ContentFile} from './ContentFile';
import {DefinitionsFile} from './DefinitionsFile';
import {Api, ApiSettings} from './Api';
import {Content, convertSearchQueryIntoLegacyFormat, SearchQueryForWhere, SearchQueryForOrder} from '../types/Content';
import {Code} from '../types/Code';
import {Is} from '../types/Is';
import {FileUtil} from './FileUtil';
import escapeHtml from 'escape-html';
import {WSServer} from './WSServer';

export class PreviewError extends Error
{
	constructor(message: string)
	{
		super(message);
		this.name = 'PreviewError';
	}
}

export class Preview
{
	private browser = new Browser();
	private httpServer = new HttpServer();
	private wsServer = new WSServer();

	public constructor(private extensionUri: vscode.Uri)
	{

	}

	public async open()
	{
		await this.writePreview();

		this.wsServer.create({port: 8126});

		this.httpServer.create({
			port: 8125,
			root: this.rootUri,
			index: 'index.html',
		});

		this.browser.open('http://localhost:8125/');
	}

	public async update()
	{
		await this.writePreview();

		this.wsServer.sendMessage('update');
	}

	private get rootUri()
	{
		return FileUtil.join(this.extensionUri, 'media', 'preview');
	}

	private async writePreview()
	{
		const fileUri = vscode.window.activeTextEditor?.document?.uri;
		if (!fileUri) throw new PreviewError('ファイルを開いてください。');

		const apiSettings = await Api.settings();
		if (!apiSettings) throw new PreviewError('API設定の読み込みに失敗しました。');

		const definitions = await DefinitionsFile.read();
		if (!definitions) throw new PreviewError('定義ファイルの読み込みに失敗しました。');

		const content = await ContentFile.read();
		if (!content) throw new PreviewError('コンテンツ設定の読み込みに失敗しました。');
		if (content.contents_type === 'parts') throw new PreviewError('"parts"コンテンツはプレビューできません。');

		const codeTypes = definitions.code_types[content.contents_type];
		const codeType = FileUtil.getName(fileUri);

		const codeList = await CodeFile.read();
		if (!codeTypes?.includes(codeType)) throw new PreviewError('このファイルはプレビューできません。');

		const rootUri = FileUtil.join(this.extensionUri, 'media', 'preview');

		const preview = this.createPreviewForm(apiSettings, content, codeList, codeType);

		const previewUri = FileUtil.join(rootUri, 'preview.html');

		await FileUtil.writeFile(previewUri, preview);
	}

	private createPreviewForm(apiSettings: ApiSettings, content: Content, codeList: Code[], codeType: string)
	{
		const inputs: string[] = [];
		Object.entries(content).forEach(([key, value]) =>
		{
			if (Is.string(value) || Is.number(value))
			{
				inputs.push(`<input type="hidden" name="${key}" value="${value}" />`);
			}
			else if (Is.array<string | SearchQueryForWhere | SearchQueryForOrder>(value))
			{
				value.forEach((v, i) =>
				{
					if (Is.string(v) || Is.number(v))
					{
						inputs.push(`<input type="hidden" name="${key}[]" value="${value.join('\t')}" />`);
					}
					else
					{
						convertSearchQueryIntoLegacyFormat(v, i)
						.forEach(query => inputs.push(`<input type="hidden" name="${query.key}" value="${query.value}" />`));
					}
				});
			}
		});

		const textareas: string[] = [];
		codeList.forEach((code: Code) =>
		{
			const escaped = escapeHtml(code.html);
			textareas.push(`<textarea name="${code.html_type}_html" style="display:none;">${escaped}</textarea>`);
		});

		return `
<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Auto-Submit Form</title>
</head>
<body onload="document.form.submit();">
<form name="form" action="${apiSettings.url}contents.php?preview=external" method="post">
<input type="hidden" name="x-auth-token" value="${apiSettings.id}:${apiSettings.pass}">
<input type="hidden" name="page" value="${codeType}">
${inputs.join('\n')}
${textareas.join('\n')}
</form>
</body>
</html>
`;
	}
}
