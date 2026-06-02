import {z} from 'zod';
import {Definitions, DefinitionsFor, DefinitionsV1, DefinitionsV2} from './Definitions';
import {Version} from './Version';

export const zSearchQueryForWhereVal = z.union([
	z.string(),
	z.object({sheet: z.string(), col: z.string()}),
]);

export const zSearchQueryForWhereV1 = z.object({
	col: z.string(),
	operator: z.string(),
	val: z.string(),
});

export const zSearchQueryForWhere = z.object({
	col: z.string(),
	operator: z.string(),
	val: zSearchQueryForWhereVal,
});

export type SearchQueryForWhere = z.infer<typeof zSearchQueryForWhere>;

export const zSearchQueryForOrder = z.object({
	col: z.string(),
	operator: z.string(),
});

export type SearchQueryForOrder = z.infer<typeof zSearchQueryForOrder>;

const zContentBase = z.object({
	category: z.string(),
	page_id: z.string(),
	static_url: z.string().optional(),
	name: z.string(),
	contents_type: z.string(),
	http_header_content_type: z.string().optional(),
	sheet_id: z.string().optional(),
	role_key: z.string().optional(),
	role_key_owner: z.string().optional(),
	permission: z.array(z.string()).optional(),
	permission_sheet: z.array(z.string()).optional(),
	manager_permission_sheet: z.array(z.string()).optional(),
	permission_url: z.string().optional(),
	auth_key: z.string().optional(),
	auth_pass: z.string().optional(),
	device_type: z.array(z.string()).optional(),
	device_type_url: z.string().optional(),
	use_template_engine: z.number().optional(),
	state: z.number().optional(),
	login_url: z.string().optional(),
	logout_url: z.string().optional(),
	search_row: z.number().optional(),
	search_query_order_state: z.string().optional(),
	search_query_order: z.array(zSearchQueryForOrder).optional(),
	search_query_order_rand: z.string().optional(),
});

export const zContentV1 = z.object({
	id: z.string(),
	...zContentBase.shape,
	search_query_where: z.array(zSearchQueryForWhereV1).optional(),
}).brand<'ContentV1'>();

export const zContentV2 = zContentBase.extend({
	search_query_where: z.array(zSearchQueryForWhere).optional(),
	is_unsynced: z.boolean().optional(),
}).brand<'ContentV2'>();
export type ContentInputFor<V extends Version> = V extends 1 ? z.input<typeof zContentV1> : z.input<typeof zContentV2>;

export type ContentV1 = z.infer<typeof zContentV1>;
export type ContentV2 = z.infer<typeof zContentV2>;
export type ContentFor<V extends Version> = V extends 1 ? ContentV1 : ContentV2;
export type Content = ContentFor<Version>;

type ContentDefaultKeys = 'id'
	| 'page_id'
	| 'category'
	| 'name'
	| 'contents_type'
	| 'http_header_content_type'
	| 'device_type'
	| 'search_row';

//Extract でキーを絞り込んだうえで、Pick でそのキーと値の型を持つオブジェクト型
export type ContentDefaultsFor<V extends Version = Version> = Pick<ContentFor<V>, Extract<ContentDefaultKeys, keyof ContentFor<V>>>;

type TextPropertyKeys = 'id'
	| 'category'
	| 'page_id'
	| 'static_url'
	| 'name'
	| 'contents_type'
	| 'http_header_content_type'
	| 'permission_url'
	| 'auth_key'
	| 'auth_pass'
	| 'device_type_url'
	| 'login_url'
	| 'logout_url'
	| 'search_row';

//TextPropertyKeys のうち ContentFor<V> に実在するキーだけを残した文字列リテラルのユニオン
export type TextPropertiesFor<V extends Version = Version> = Extract<TextPropertyKeys, keyof ContentFor<V>>;

type ConnectIdName = 'id' | 'page_id';
//ConnectIdName のうち ContentFor<V> に実在するキーだけを残した文字列リテラルのユニオン
export type ConnectIdNameFor<V extends Version = Version> = Extract<ConnectIdName, keyof ContentFor<V>>;

export type RadioProperties = 'use_template_engine'|'state'|'role_key'|'role_key_owner'|'search_query_order_state';

export type CheckBoxProperties = 'permission'|'permission_sheet'|'manager_permission_sheet'|'device_type';

export type SelectProperties = 'contents_type'|'http_header_content_type'|'sheet_id'|'search_query_order_rand';

export type SearchQueryProperties = 'search_query_where'|'search_query_order';

export type ClientOnlyField = 'is_unsynced';
export const clientOnlyFields: readonly ClientOnlyField[] = ['is_unsynced'];

export type ValidationErrorReason = 'unknown_field' | 'invalid_value' | 'unknown_col';

export type ValidationError = {
	contentPath?: string,
	field: string,
	value: unknown,
	reason: ValidationErrorReason,
};

export type ValidationResult = {
	valid: boolean,
	errors: ValidationError[],
};

export const baseDefaults = (newFileName: string) => ({
	category: '未設定',
	page_id: newFileName,
	name: '',
	contents_type: '',
	http_header_content_type: 'html',
	device_type: ['pc', 'smart'],
	search_row: 10,
});

export const getColumnName = (definitions: Definitions, column: string) =>
{
	const {column_names} = definitions;

	return column_names.find(name => name.key === column)?.name;
};

export const getColumns = (definitions: Definitions, content: Content) =>
{
	const {columns} = definitions;

	const defaultColumns = columns[content.contents_type]?.find(c => c.key === 'default')?.options;
	const sheetColumns = columns[content.contents_type]?.find(c => c.key === content.sheet_id)?.options;

	return sheetColumns ?? defaultColumns;
};

type StringOptions = {key: string, name: string}[];
type NumberOptions = {key: number, name: string}[];

/*eslint-disable complexity*/
export const getOptions = (definitions: Definitions, content: Content, column: CheckBoxProperties | SelectProperties | RadioProperties): StringOptions | NumberOptions | undefined =>
{
	const {column_options, sheet_names} = definitions;

	if (
		column === 'device_type'
		|| column === 'contents_type'
		|| column === 'use_template_engine'
		|| column === 'state'
		|| column === 'search_query_order_state'
		|| column === 'search_query_order_rand'
	)
	{
		return column_options[column];
	}

	if (column === 'http_header_content_type')
	{
		if (Array.isArray(column_options[column]))
		{
			return column_options[column] as StringOptions;
		}
		else
		{
			const record = column_options[column] as Record<string, StringOptions>;
			return record?.[content.contents_type];
		}
	}

	if (column === 'permission' || column === 'role_key')
	{
		return column_options[column]?.[content.contents_type];
	}

	if (column === 'sheet_id' || column === 'permission_sheet' || column === 'manager_permission_sheet')
	{
		const defaultOptions = column_options[column]?.[content.contents_type]?.find(c => c.key === 'default')?.options;
		const sheetOptions = column_options[column]?.[content.contents_type]?.find(c => c.key === content.sheet_id)?.options;
		const options = (sheetOptions ?? defaultOptions);

		return options?.map(key => ({
			key,
			name: sheet_names?.find(name => name.key === key)?.name ?? '',
		}));
	}

	if (column === 'role_key_owner')
	{
		const defaultOptions = column_options[column]?.[content.contents_type]?.find(c => c.key === 'default')?.options;
		const sheetOptions = column_options[column]?.[content.contents_type]?.find(c => c.key === content.sheet_id)?.options;
		const options = (sheetOptions ?? defaultOptions);

		return options;
	}

	return undefined;
};
/*eslint-enable complexity*/

export const getSearchQueryOptions = (definitions: Definitions, content: Content, type: 'where' | 'order') =>
{
	const {search_query_keys} = definitions;

	const defaultOptions = search_query_keys[content.contents_type]?.filter(c =>
	{
		return c.type === type;
	})?.at(0)?.options;

	const sheetOptions = search_query_keys[content.contents_type]?.find(c =>
	{
		return c.sheet === content.sheet_id && c.type === type;
	})?.options;

	const options = (sheetOptions ?? defaultOptions);

	return options;
};

export const getCodeTypeName = (definitions: Definitions, codeType: string) =>
{
	const {code_type_names} = definitions;

	return code_type_names.find(name => name.key === codeType)?.name;
};

export const updateDefaultValues = (definitions: Definitions, content: Content) =>
{
	const columns = definitions.columns[content.contents_type]?.at(0)?.options;
	if (!columns) return content;

	if (columns.includes('use_template_engine'))
	{
		content.use_template_engine = 1;
	}

	if (columns.includes('http_header_content_type'))
	{
		content.http_header_content_type = content.contents_type === 'keep_js' ? 'javascript' : 'html';
	}

	if (columns.includes('role_key'))
	{
		const options = definitions.column_options.role_key?.[content.contents_type];
		const defaultValue = options?.filter(c => c.default)?.at(0)?.key ?? '';

		content.role_key = defaultValue;
	}

	if (columns.includes('state'))
	{
		content.state = 0;
	}
	else
	{
		content.state = undefined;
	}

	if (columns.includes('search_query_order_state'))
	{
		content.search_query_order_state = 'col';
	}
	else
	{
		content.search_query_order_state = undefined;
	}

	if (columns.includes('search_query_order_rand'))
	{
		content.search_query_order_rand = 'contents';
	}
	else
	{
		content.search_query_order_rand = undefined;
	}

	return content;
};

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
): ValidationResult =>
{
	const allowedFields = getColumns(definitions, content);

	//contents_type 自体が definitions に存在しない場合の早期 return
	//テスト: common/tests/validateContent.test.ts > "R1: フィールド許可チェック (unknown_field)" > "contents_type 自体が定義にない → エラー"
	if (!allowedFields)
	{
		return {
			valid: false,
			errors: [{
				field: 'contents_type',
				value: content.contents_type,
				reason: 'invalid_value',
			}],
		};
	}

	//R1: 動的キー走査で allowedFields にないキーを検出
	//テスト: common/tests/validateContent.test.ts > "R1: フィールド許可チェック (unknown_field)"
	const unknownFieldErrors: ValidationError[] = Object.entries(content)
	.filter(([key]) => !clientOnlyFields.some(f => f === key) && !allowedFields.includes(key))
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

	const errors = [...unknownFieldErrors, ...enumErrors, ...whereErrors, ...orderErrors];

	return {valid: errors.length === 0, errors};
};

export interface ContentStrategy<V extends Version = Version>
{
	readonly version: V;
	parse(data: unknown): ContentFor<V>;
	safeParse(data: unknown): z.SafeParseReturnType<ContentInputFor<V>, ContentFor<V>>;
	createContent(newFileName: string): ContentDefaultsFor<V>;
	duplicateContent(content: ContentFor<V>, newFileName: string): ContentFor<V>;
	connectIdName(): ConnectIdNameFor<V>;
	connectId(content: ContentFor<V>): string;
	isUploaded(content: ContentFor<V>): boolean;
	uploadEndpoint(content: ContentFor<V>): string;
	uploadMethod(content: ContentFor<V>): 'POST' | 'PUT';
	supportsSheetRefVal(): boolean;
	validate(content: ContentFor<V>, definitions: DefinitionsFor<V>): ValidationResult;
}

export class ContentStrategyV1 implements ContentStrategy<1>
{
	readonly version = 1 as const;

	public createContent(newFileName: string)
	{
		return {id: '', ...baseDefaults(newFileName)};
	}

	public parse(data: unknown)
	{
		return zContentV1.parse(data);
	}

	public safeParse(data: unknown)
	{
		return zContentV1.safeParse(data);
	}

	public duplicateContent(content: ContentV1, newFileName: string)
	{
		return {...content, id: '', page_id: newFileName, state: 0};
	}

	public connectIdName()
	{
		return 'id' as const;
	}

	public connectId(content: ContentV1)
	{
		return content.id;
	}

	public isUploaded(content: ContentV1)
	{
		return Boolean(content.id);
	}

	public uploadEndpoint(content: ContentV1)
	{
		return content.id ? 'update' : 'create';
	}

	public uploadMethod(content: ContentV1): 'POST' | 'PUT'
	{
		return content.id ? 'PUT' : 'POST';
	}

	public supportsSheetRefVal()
	{
		return false;
	}

	public validate(content: ContentV1, definitions: DefinitionsV1)
	{
		return validateContent(content, definitions);
	}
}

export class ContentStrategyV2 implements ContentStrategy<2>
{
	readonly version = 2 as const;

	public createContent(newFileName: string)
	{
		return {...baseDefaults(newFileName), is_unsynced: true};
	}

	public parse(data: unknown)
	{
		return zContentV2.parse(data);
	}

	public safeParse(data: unknown)
	{
		return zContentV2.safeParse(data);
	}

	public duplicateContent(content: ContentV2, newFileName: string)
	{
		return {...content, page_id: newFileName, state: 0, is_unsynced: true};
	}

	public connectIdName()
	{
		return 'page_id' as const;
	}

	public connectId(content: ContentV2)
	{
		return content.page_id;
	}

	public isUploaded(content: ContentV2)
	{
		return !content.is_unsynced;
	}

	public uploadEndpoint(_content: ContentV2)
	{
		return 'upsert';
	}

	public uploadMethod(_content: ContentV2): 'POST' | 'PUT'
	{
		return 'PUT';
	}

	public supportsSheetRefVal()
	{
		return true;
	}

	public validate(content: ContentV2, definitions: DefinitionsV2)
	{
		return validateContent(content, definitions);
	}
}

export class ContentContext<V extends Version = Version>
{
	public static init(version: Version)
	{
		return version === 1
			? new ContentContext(new ContentStrategyV1())
			: new ContentContext(new ContentStrategyV2());
	}

	constructor(public strategy: ContentStrategy<V>) {}

	public get version(): V
	{
		return this.strategy.version;
	}

	public createContent(newFileName: string): ContentDefaultsFor<V>
	{
		return this.strategy.createContent(newFileName);
	}

	public parse(data: unknown): ContentFor<V>
	{
		return this.strategy.parse(data);
	}

	public safeParse(data: unknown): z.SafeParseReturnType<ContentInputFor<V>, ContentFor<V>>
	{
		return this.strategy.safeParse(data);
	}

	public duplicateContent(content: ContentFor<V>, newFileName: string): ContentFor<V>
	{
		return this.strategy.duplicateContent(content, newFileName);
	}

	public connectIdName(): ConnectIdNameFor<V>
	{
		return this.strategy.connectIdName();
	}

	public connectId(content: ContentFor<V>): string
	{
		return this.strategy.connectId(content);
	}

	public connectParam(content: ContentFor<V>): string
	{
		return `${this.strategy.connectIdName()}=${this.strategy.connectId(content)}`;
	}

	public isPageIdServerIdentifier(): boolean
	{
		return this.strategy.connectIdName() === 'page_id';
	}

	public isUploaded(content: ContentFor<V>): boolean
	{
		return this.strategy.isUploaded(content);
	}

	public uploadEndpoint(content: ContentFor<V>): string
	{
		return this.strategy.uploadEndpoint(content);
	}

	public uploadMethod(content: ContentFor<V>): 'POST' | 'PUT'
	{
		return this.strategy.uploadMethod(content);
	}

	public supportsSheetRefVal(): boolean
	{
		return this.strategy.supportsSheetRefVal();
	}

	public validate(content: ContentFor<V>, definitions: DefinitionsFor<V>): ValidationResult
	{
		return this.strategy.validate(content, definitions);
	}

	public toServerPayload(content: ContentFor<V>): ContentFor<V>
	{
		const payload = Object.fromEntries(
			Object.entries(content).filter(([column]) => !clientOnlyFields.some(f => f === column))
		);

		return this.strategy.parse(payload);
	}
}
