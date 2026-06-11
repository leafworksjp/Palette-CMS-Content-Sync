import {z} from 'zod';
import {
	Content,
	ContentFor,
	ContentInputFor,
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
import {ActiveConnectionV2} from './ActiveConnection';
import {findReplaceCandidates} from './SyncDiff';
import {getActiveConnection, getContentCache} from './Services';

export type ValidationErrorReason = 'unknown_field' | 'invalid_value' | 'unknown_col';

export type ValidationError = {
	contentPath?: string,
	field: string,
	value: unknown,
	reason: ValidationErrorReason,
};

export type UploadPlan =
	| {kind: 'create'}
	| {kind: 'update'}
	| {kind: 'choose', candidates: Content[]}
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

	//contents_type 自体が definitions に存在しない場合の早期 return
	//テスト: common/tests/validateContent.test.ts > "R1: フィールド許可チェック (unknown_field)" > "contents_type 自体が定義にない → エラー"
	if (!allowedFields)
	{
		return [{
			field: 'contents_type',
			value: content.contents_type,
			reason: 'invalid_value',
		}];
	}

	//R1: 動的キー走査で allowedFields にないキーを検出
	//テスト: common/tests/validateContent.test.ts > "R1: フィールド許可チェック (unknown_field)"
	const unknownFieldErrors: ValidationError[] = Object.entries(content)
	.filter(([key]) => !allowedFields.includes(key))
	.map(([key, value]) => ({field: key, value, reason: 'unknown_field'}));

	//R2/R3: 各 enum field を ContentFor<V> 経由で型安全にアクセス
	//テスト: common/tests/validateContent.test.ts > "R2/R3: enum 値チェック (invalid_value)"
	//- 単一値 (state) が許可リストにない
	//- 配列値 (permission) の一部要素が許可リストにない
	//- 配列値 (device_type) の一部要素が許可リストにない
	const enumErrors: ValidationError[] = enumFieldsForValidation
	.filter(key => allowedFields.includes(key))
	.flatMap(key =>
	{
		const value = content[key];
		if (value === undefined || value === null) return [];

		const options = getOptions(definitions, content, key);
		if (!options) return [];

		const values = Array.isArray(value) ? value : [value];

		return values
		.filter(v => !options.some(o => o.key === v))
		.map(v => ({field: key, value: v, reason: 'invalid_value'}));
	});

	//R4: search_query (where / order)
	//テスト: common/tests/validateContent.test.ts > "R4: search_query_where" / "R4: search_query_order"
	//- col が search_query_keys にない → unknown_col
	//- operator が column_options にない → invalid_value
	//- col 空文字列 (未入力) は unknown_col にならない
	//- operator 空文字列 (未入力) は invalid_value にならない
	//- val のシート参照 ({sheet, col}) は validate されない
	const checkSearchQuery = (
		type: 'where' | 'order',
		items: ReadonlyArray<{col: string, operator: string}>,
		opOptions: ReadonlyArray<{key: string}>
	): ValidationError[] =>
	{
		const colOptions = getSearchQueryOptions(definitions, content, type);

		return items.flatMap(q => [
			q.col === '' || !colOptions || colOptions.some(o => o.key === q.col)
				? undefined
				: {field: `search_query_${type}.col`, value: q.col, reason: 'unknown_col'} as const,
			q.operator === '' || opOptions.some(o => o.key === q.operator)
				? undefined
				: {field: `search_query_${type}.operator`, value: q.operator, reason: 'invalid_value'} as const,
		].filter((e): e is NonNullable<typeof e> => e !== undefined));
	};

	const whereErrors = checkSearchQuery(
		'where',
		content.search_query_where ?? [],
		definitions.column_options.search_query_where
	);

	const orderErrors = checkSearchQuery(
		'order',
		content.search_query_order ?? [],
		definitions.column_options.search_query_order
	);

	return [...unknownFieldErrors, ...enumErrors, ...whereErrors, ...orderErrors];
};

export abstract class ContentStrategy<V extends Version = Version>
{
	//abstract メソッドの引数は Content (union) で受ける（V を引数位置に使わない）。
	//これにより V が covariant のみで使われる形になり、
	//ContentStrategy<1> を ContentStrategy<Version> に代入できる（invariance 回避）。
	//サブクラスは内部で型 narrowing して V 専用の処理を実装する。
	public static init(version: Version): ContentStrategy
	{
		return version === 1
			? new ContentStrategyV1()
			: new ContentStrategyV2();
	}

	abstract readonly version: V;

	public abstract parse(data: unknown): ContentFor<V>;
	public abstract safeParse(data: unknown): z.SafeParseReturnType<ContentInputFor<V>, ContentFor<V>>;
	public abstract create(newFileName: string): ContentFor<V>;
	public abstract duplicate(content: Content, newFileName: string): ContentFor<V>;
	public abstract serverIdField(): 'id' | 'page_id';
	public abstract serverId(content: Content): string;
	public abstract isUploaded(content: Content): boolean | undefined;
	public abstract uploadPlan(content: Content): UploadPlan;
	public abstract uploadEndpoint(content: Content): string;
	public abstract uploadMethod(content: Content): 'POST' | 'PUT';
	public abstract supportsSheetRefValue(): boolean;

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

	public safeParse(data: unknown): z.SafeParseReturnType<ContentInputFor<1>, ContentV1>
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
}

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

	public safeParse(data: unknown): z.SafeParseReturnType<ContentInputFor<2>, ContentV2>
	{
		return zContentV2.safeParse(data);
	}

	public safeParseList(data: unknown): z.SafeParseReturnType<ContentInputFor<2>[], ContentV2[]>
	{
		return z.array(zContentV2).safeParse(data);
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
}
