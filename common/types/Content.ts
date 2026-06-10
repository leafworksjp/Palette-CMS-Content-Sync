import {z} from 'zod';
import {Definitions, DefinitionsFor} from './Definitions';
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

export type RadioProperties = 'use_template_engine'|'state'|'role_key'|'role_key_owner'|'search_query_order_state';

export type CheckBoxProperties = 'permission'|'permission_sheet'|'manager_permission_sheet'|'device_type';

export type SelectProperties = 'contents_type'|'http_header_content_type'|'sheet_id'|'search_query_order_rand';

export type ClientOnlyField = 'is_unsynced';
export const clientOnlyFields: readonly ClientOnlyField[] = ['is_unsynced'];

export type ValidationErrorReason = 'unknown_field' | 'invalid_value' | 'unknown_col';

export type ValidationError = {
	contentPath?: string,
	field: string,
	value: unknown,
	reason: ValidationErrorReason,
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
	public abstract isUploaded(content: Content): boolean;
	public abstract uploadEndpoint(content: Content): string;
	public abstract uploadMethod(content: Content): 'POST' | 'PUT';
	public abstract supportsSheetRefValue(): boolean;

	public serverIdParam(content: Content): string
	{
		return `${this.serverIdField()}=${this.serverId(content)}`;
	}

	public isPageIdServerIdentifier(): boolean
	{
		return this.serverIdField() === 'page_id';
	}

	public validate(content: Content, definitions: Definitions): ValidationError[]
	{
		return validateContent(content, definitions);
	}

	public toServerPayload(content: Content): ContentFor<V>
	{
		const payload = Object.fromEntries(
			Object.entries(content).filter(([column]) => !clientOnlyFields.some(f => f === column))
		);

		return this.parse(payload);
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
		return zContentV2.parse({...baseDefaults(newFileName), is_unsynced: true});
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
		return zContentV2.parse({...v2, page_id: newFileName, state: 0, is_unsynced: true});
	}

	public serverIdField(): 'page_id'
	{
		return 'page_id' as const;
	}

	public serverId(content: Content): string
	{
		return this.narrow(content).page_id;
	}

	public isUploaded(content: Content): boolean
	{
		return !this.narrow(content).is_unsynced;
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
