import vscode from 'vscode';
import {Content} from '../types/Content';
import {Code} from '../types/Code';
import {Is} from '../types/Is';
import {DefinitionsFile} from './DefinitionsFile';
import {ContentFile} from './ContentFile';
import {FileUtil} from './FileUtil';
import {Definitions} from '../types/Definitions';
import {Locale} from '../locales/ja';

class Resource
{
	private constructor(
		public definitions: Definitions,
		public contentDirectory: vscode.Uri,
		public srcDirectory: vscode.Uri
	)
	{
	}

	public static async build(uri: vscode.Uri|undefined = undefined)
	{
		const definitions = await DefinitionsFile.read();
		const contentDirectory = await ContentFile.getDirectoryPath(uri);

		if (!definitions || !contentDirectory) return undefined;

		const srcDirectory = FileUtil.join(contentDirectory, 'src');

		return new Resource(definitions, contentDirectory, srcDirectory);
	}
}

export class CodeFile
{
	public static extensions = new Map(Object.entries({
		html: 'html',
		css: 'css',
		javascript: 'js',
		json: 'json',
		xml: 'xml',
	}));

	public static async read(uri: vscode.Uri|undefined = undefined)
	{
		const resource = await Resource.build(uri);
		if (!resource) return [];

		const content = await ContentFile.read(uri);
		if (!content) throw new Error(Locale.pleaseOpenContent);

		const extension = content.http_header_content_type
			? CodeFile.extensions.get(content.http_header_content_type) ?? 'html'
			: 'html';

		const files = await FileUtil.listFiles(resource.srcDirectory);

		const codeList: Code[] = await Promise.all(
			files
			.filter(file => FileUtil.getExt(file) === `.${extension}`)
			.map(async file =>
			{
				const codeType = FileUtil.getName(file);
				const code = await FileUtil.readFile(file);

				return {
					html_type: codeType,
					html: code
				};
			})
			.filter(Is.notNullable)
		);

		return codeList;
	}

	public static async create(content: Content)
	{
		const resource = await Resource.build();
		if (!resource) return;

		const codeTypes = resource.definitions.code_types[content.contents_type];
		if (!codeTypes) return;

		await Promise.all(
			codeTypes.map(async codeType =>
			{
				const extension = content.http_header_content_type
					? CodeFile.extensions.get(content.http_header_content_type) ?? 'html'
					: 'html';

				const codeUri = FileUtil.join(resource.contentDirectory, 'src', `${codeType}.${extension}`);
				if (!codeUri || await FileUtil.exists(codeUri)) return;

				await FileUtil.writeFile(codeUri, '');
			})
		);
	}

	public static async write(content: Content, codeList: Code[])
	{
		const resource = await Resource.build();
		if (!resource) return;

		const codeTypes = resource.definitions.code_types[content.contents_type];
		if (!codeTypes) return;

		await Promise.all(
			codeTypes.map(async codeType =>
			{
				const extension = content.http_header_content_type
					? CodeFile.extensions.get(content.http_header_content_type) ?? 'html'
					: 'html';

				const codeUri = FileUtil.join(resource.contentDirectory, 'src', `${codeType}.${extension}`);
				const code = codeList.find(c => c.html_type === codeType);
				if (!codeUri || !code) return;

				await FileUtil.writeFile(codeUri, code.html);
			})
		);
	}

	public static async changeExtensions(oldLanguage: string, newLanguage: string)
	{
		const resource = await Resource.build();
		if (!resource) return;

		const content = await ContentFile.read();
		if (!content) throw new Error(Locale.pleaseOpenContent);

		const oldExtension = CodeFile.extensions.get(oldLanguage);
		const newExtension = CodeFile.extensions.get(newLanguage);
		if (!oldExtension || !newExtension || oldExtension === newExtension) return;

		const codeTypes = resource.definitions.code_types[content.contents_type];
		if (!codeTypes) return;

		await Promise.all(
			codeTypes.map(async codeType =>
			{
				const oldUri = FileUtil.join(resource.contentDirectory, 'src', `${codeType}.${oldExtension}`);
				const newUri = FileUtil.join(resource.contentDirectory, 'src', `${codeType}.${newExtension}`);
				if (!oldUri || !newUri) return;
				if (!await FileUtil.exists(oldUri) || await FileUtil.exists(newUri)) return;

				await FileUtil.reaname(oldUri, newUri);
			})
		);
	}
}
