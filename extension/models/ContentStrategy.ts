import {z} from 'zod';
import {
	Content,
	ContentFor,
	ContentV1,
	ContentV2,
	zContentV1,
	zContentV2,
	baseDefaults,
	getColumns,
	getOptions,
	getSearchQueryOptions,
	RadioProperties,
	SelectProperties,
	CheckBoxProperties,
} from '../../common/types/Content';
import {Version} from '../../common/types/Version';
import {Definitions, DefinitionsFor} from '../../common/types/Definitions';
import {Is} from '../../common/types/Is';
import {ActiveConnectionV2} from './ActiveConnection';
import {findReplaceCandidates} from '../../common/types/SyncPlan';
import {getActiveConnection, getContentCache} from './Services';

export type ValidationErrorReason = 'unknown_field' | 'invalid_value' | 'unknown_col';

export type ValidationError = {
	page_id: string,
	field: string,
	value: unknown,
	reason: ValidationErrorReason,
};

export type UploadPlan =
	| {kind: 'create'}
	| {kind: 'update'}
	| {kind: 'choose', candidates: ContentV2[]}
	| {kind: 'unjudgable'};

const enumFieldsForValidation: ReadonlyArray<RadioProperties | SelectProperties | CheckBoxProperties> = [
	'use_template_engine',
	'state',
	'role_key',
	'role_key_owner',
	'search_query_order_state',
	'contents_type',
	'http_header_content_type',
	'sheet_id',
	'search_query_order_rand',
	'permission',
	'permission_sheet',
	'manager_permission_sheet',
	'device_type',
];

const validateContent = <V extends Version>(
	content: ContentFor<V>,
	definitions: DefinitionsFor<V>
): ValidationError[] =>
{
	const allowedFields = getColumns(definitions, content);

	if (!allowedFields)
	{
		return [{
			page_id: content.page_id,
			field: 'contents_type',
			value: content.contents_type,
			reason: 'invalid_value',
		}];
	}

	const unknownFieldErrors: ValidationError[] = Object.entries(content)
	.filter(([key]) => !allowedFields.includes(key))
	.map(([key, value]) => ({page_id: content.page_id, field: key, value, reason: 'unknown_field'}));

	const enumErrors: ValidationError[] = enumFieldsForValidation
	.filter(key => allowedFields.includes(key))
	.flatMap(key =>
	{
		const value = content[key];
		if (Is.undefined(value)) return [];

		const options = getOptions(definitions, content, key);
		if (!options) return [];

		const values = Is.array(value) ? value : [value];

		return values
		.filter(v => !options.some(o => o.key === v))
		.map(v => ({page_id: content.page_id, field: key, value: v, reason: 'invalid_value'}));
	});

	const getSearchQueryErrors = (
		type: 'where' | 'order',
		items: ReadonlyArray<{col: string, operator: string}>,
		opOptions: ReadonlyArray<{key: string}>
	): ValidationError[] =>
	{
		const colOptions = getSearchQueryOptions(definitions, content, type);

		return items.flatMap(q => [
			q.col === '' || !colOptions || colOptions.some(o => o.key === q.col)
				? undefined
				: {page_id: content.page_id, field: `search_query_${type}.col`, value: q.col, reason: 'unknown_col'} satisfies ValidationError,
			q.operator === '' || opOptions.some(o => o.key === q.operator)
				? undefined
				: {page_id: content.page_id, field: `search_query_${type}.operator`, value: q.operator, reason: 'invalid_value'} satisfies ValidationError,
		].filter(Is.notNullable));
	};

	const whereErrors = getSearchQueryErrors(
		'where',
		content.search_query_where ?? [],
		definitions.column_options.search_query_where
	);

	const orderErrors = getSearchQueryErrors(
		'order',
		content.search_query_order ?? [],
		definitions.column_options.search_query_order
	);

	return [...unknownFieldErrors, ...enumErrors, ...whereErrors, ...orderErrors];
};

type SafeParseContentResultFor<V extends Version> = V extends 1
	? ReturnType<typeof zContentV1.safeParse>
	: ReturnType<typeof zContentV2.safeParse>;

export abstract class ContentStrategy<V extends Version = Version>
{
	public static init(version: Version): ContentStrategy
	{
		return version === 1
			? new ContentStrategyV1()
			: new ContentStrategyV2();
	}

	abstract readonly version: V;

	public abstract parse(data: unknown): ContentFor<V>;
	public abstract safeParse(data: unknown): SafeParseContentResultFor<V>;
	public abstract create(newFileName: string): ContentFor<V>;
	public abstract duplicate(content: Content, newFileName: string): ContentFor<V>;
	public abstract serverIdField(): 'id' | 'page_id';
	public abstract serverId(content: Content): string;
	public abstract isUploaded(content: Content): boolean | undefined;
	public abstract uploadPlan(content: Content): UploadPlan;
	public abstract uploadEndpoint(content: Content): string;
	public abstract uploadMethod(content: Content): 'POST' | 'PUT';
	public abstract supportsSheetRefValue(): boolean;
	public abstract isPageIdEditable(): boolean;

	public serverIdParam(content: Content): string
	{
		return `${this.serverIdField()}=${this.serverId(content)}`;
	}

	public validate(content: Content, definitions: Definitions): ValidationError[]
	{
		return validateContent(content, definitions);
	}
}

export class ContentStrategyV1 extends ContentStrategy<1>
{
	readonly version = 1 as const;

	private narrow(content: Content): ContentV1
	{
		if (!('id' in content)) throw new Error('ContentStrategyV1: ContentV1 expected');
		return content;
	}

	public create(newFileName: string): ContentV1
	{
		return zContentV1.parse({id: '', ...baseDefaults(newFileName)});
	}

	public parse(data: unknown): ContentV1
	{
		return zContentV1.parse(data);
	}

	public safeParse(data: unknown): ReturnType<typeof zContentV1.safeParse>
	{
		return zContentV1.safeParse(data);
	}

	public duplicate(content: Content, newFileName: string): ContentV1
	{
		const v1 = this.narrow(content);
		return zContentV1.parse({...v1, id: '', page_id: newFileName, state: 0});
	}

	public serverIdField(): 'id'
	{
		return 'id' as const;
	}

	public serverId(content: Content): string
	{
		return this.narrow(content).id;
	}

	public isUploaded(content: Content): boolean
	{
		return Boolean(this.narrow(content).id);
	}

	public uploadPlan(content: Content): UploadPlan
	{
		return this.narrow(content).id ? {kind: 'update'} : {kind: 'create'};
	}

	public uploadEndpoint(content: Content): string
	{
		return this.narrow(content).id ? 'update' : 'create';
	}

	public uploadMethod(content: Content): 'POST' | 'PUT'
	{
		return this.narrow(content).id ? 'PUT' : 'POST';
	}

	public supportsSheetRefValue(): boolean
	{
		return false;
	}

	public isPageIdEditable(): boolean
	{
		return true;
	}
}

const zContentV2ListSchema = z.array(zContentV2);

export class ContentStrategyV2 extends ContentStrategy<2>
{
	readonly version = 2 as const;

	private narrow(content: Content): ContentV2
	{
		if ('id' in content) throw new Error('ContentStrategyV2: ContentV2 expected');
		return content;
	}

	public create(newFileName: string): ContentV2
	{
		return zContentV2.parse(baseDefaults(newFileName));
	}

	public parse(data: unknown): ContentV2
	{
		return zContentV2.parse(data);
	}

	public safeParse(data: unknown): ReturnType<typeof zContentV2.safeParse>
	{
		return zContentV2.safeParse(data);
	}

	public safeParseList(data: unknown): ReturnType<typeof zContentV2ListSchema.safeParse>
	{
		return zContentV2ListSchema.safeParse(data);
	}

	public duplicate(content: Content, newFileName: string): ContentV2
	{
		const v2 = this.narrow(content);
		return zContentV2.parse({...v2, page_id: newFileName, state: 0});
	}

	public serverIdField(): 'page_id'
	{
		return 'page_id' as const;
	}

	public serverId(content: Content): string
	{
		return this.narrow(content).page_id;
	}

	public isUploaded(content: Content): boolean | undefined
	{
		const ac = getActiveConnection();
		if (!(ac instanceof ActiveConnectionV2) || !ac.subdir) return undefined;

		const list = getContentCache().get(ac.subdir);
		if (!list) return undefined;

		return list.some(c => c.page_id === this.narrow(content).page_id);
	}

	public uploadPlan(content: Content): UploadPlan
	{
		const ac = getActiveConnection();
		if (!(ac instanceof ActiveConnectionV2) || !ac.subdir) return {kind: 'unjudgable'};

		const list = getContentCache().get(ac.subdir);
		if (!list) return {kind: 'unjudgable'};

		const v2 = this.narrow(content);
		if (list.some(c => c.page_id === v2.page_id)) return {kind: 'update'};

		return {kind: 'choose', candidates: findReplaceCandidates(v2, list)};
	}

	public uploadEndpoint(_content: Content): string
	{
		return 'upsert';
	}

	public uploadMethod(_content: ContentV2): 'POST' | 'PUT'
	{
		return 'PUT';
	}

	public supportsSheetRefValue(): boolean
	{
		return true;
	}

	public isPageIdEditable(): boolean
	{
		return false;
	}
}
