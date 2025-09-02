import vscode from 'vscode';
import {Content} from '../../common//types/Content';
import {Code} from '../../common/types/Code';
import {Is} from '../../common/types/Is';
import {DefinitionsFile} from './DefinitionsFile';
import {ContentFile} from './ContentFile';
import {FileUtil} from './FileUtil';
import {Definitions} from '../../common/types/Definitions';
import {Locale} from '../locales/ja';
import {DiagnosticReporter} from './DiagnosticReporter';
import {CompileErrors} from '../../common/types/CompileErrors';
import {getDiagnosticReporter} from './Services';

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
	public static templateExtension = 'palette';

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

		const extension = this.getExtension(content);

		const files = await FileUtil.listFiles(resource.srcDirectory);

		const codeList: Code[] = await Promise.all(
			files
			.filter(file => FileUtil.getExt(file) === `.${extension}`)
			.map(async file =>
			{
				const codeType = this.parseCodeType(file);
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

		const codeTypes = this.getCodeTypes(resource.definitions, content);
		if (!codeTypes.length) return;

		await Promise.all(
			codeTypes.map(async codeType =>
			{
				const fileName = this.getFileName(codeType, content);

				const codeUri = FileUtil.join(resource.contentDirectory, 'src', fileName);
				if (!codeUri || await FileUtil.exists(codeUri)) return;

				await FileUtil.writeFile(codeUri, '');
			})
		);
	}

	public static async write(content: Content, codeList: Code[])
	{
		const resource = await Resource.build();
		if (!resource) return;

		const codeTypes = this.getCodeTypes(resource.definitions, content);
		if (!codeTypes.length) return;

		await Promise.all(
			codeTypes.map(async codeType =>
			{
				const fileName = this.getFileName(codeType, content);

				const codeUri = FileUtil.join(resource.contentDirectory, 'src', fileName);
				const code = codeList.find(c => c.html_type === codeType);
				if (!codeUri || !code) return;

				await FileUtil.writeFile(codeUri, code.html);
			})
		);
	}

	public static async getUris(content: Content)
	{
		const resource = await Resource.build();
		if (!resource) return [];

		const codeTypes = this.getCodeTypes(resource.definitions, content);
		if (!codeTypes.length) return [];

		return codeTypes.map(codeType =>
		{
			const fileName = this.getFileName(codeType, content);

			return FileUtil.join(resource.contentDirectory, 'src', fileName);
		});
	}

	public static async changeExtensions(oldLanguage: string, newLanguage: string)
	{
		const resource = await Resource.build();
		if (!resource) return;

		const content = await ContentFile.read();
		if (!content) throw new Error(Locale.pleaseOpenContent);

		const oldExtension = this.extensions.get(oldLanguage);
		const newExtension = this.extensions.get(newLanguage);
		if (!oldExtension || !newExtension || oldExtension === newExtension) return;

		const codeTypes = this.getCodeTypes(resource.definitions, content);
		if (!codeTypes.length) return;

		await Promise.all(
			codeTypes.map(async codeType =>
			{
				const oldFileName = content.use_template_engine
					? `${codeType}.${this.templateExtension}.${oldExtension}`
					: `${codeType}.${oldExtension}`;
				const newFileName = content.use_template_engine
					? `${codeType}.${this.templateExtension}.${newExtension}`
					: `${codeType}.${newExtension}`;

				const oldUri = FileUtil.join(resource.contentDirectory, 'src', oldFileName);
				const newUri = FileUtil.join(resource.contentDirectory, 'src', newFileName);
				if (!oldUri || !newUri) return;
				if (!await FileUtil.exists(oldUri) || await FileUtil.exists(newUri)) return;

				await FileUtil.rename(oldUri, newUri);
			})
		);
	}

	public static async appendCompileErrors(
		compileErrors: CompileErrors,
		uri: vscode.Uri|undefined = undefined
	)
	{
		const resource = await Resource.build(uri);
		if (!resource) return;

		const content = await ContentFile.read(uri);
		if (!content) return;

		Object
		.entries(compileErrors.compile_errors)
		.forEach(([codeType, errors]) =>
		{
			const fileName = this.getFileName(codeType, content);
			const codeUri = FileUtil.join(resource.srcDirectory, fileName);

			errors.forEach(({message, line}) =>
			{
				getDiagnosticReporter().reportError(codeUri, message, line ?? 0);
			});
		});
	}

	public static async clearCompileErrors(
		uri: vscode.Uri|undefined = undefined
	)
	{
		const resource = await Resource.build(uri);
		if (!resource) return;

		const content = await ContentFile.read(uri);
		if (!content) return;

		const codeTypes = this.getCodeTypes(resource.definitions, content);
		if (!codeTypes.length) return;

		codeTypes.forEach(codeType =>
		{
			const fileName = this.getFileName(codeType, content);
			const codeUri = FileUtil.join(resource.srcDirectory, fileName);

			getDiagnosticReporter().clear(codeUri);
		});
	}

	public static parseCodeType(uri: vscode.Uri): string
	{
		return FileUtil.getName(uri).replace(`.${this.templateExtension}`, '');
	}

	public static getCodeTypes(definitions: Definitions, content: Content): string[]
	{
		return content.use_template_engine
			? definitions.template_engine_code_types[content.contents_type] ?? []
			: definitions.code_types[content.contents_type] ?? [];
	}

	private static getExtension(content: Content): string
	{
		return content.http_header_content_type
			? this.extensions.get(content.http_header_content_type) ?? 'html'
			: 'html';
	}

	private static getFileName(codeType: string, content: Content): string
	{
		const extension = this.getExtension(content);
		return content.use_template_engine
			? `${codeType}.${this.templateExtension}.${extension}`
			: `${codeType}.${extension}`;
	}
}
