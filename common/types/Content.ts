import {z} from 'zod';
import {Definitions} from './Definitions';
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

//V1 places id at the top of contents.json on write, so use z.object + ...shape instead of zContentBase.extend.
//id is V1's server-side internal identifier; preserving the existing field order keeps git diffs clean.
export const zContentV1 = z.object({
	id: z.string(),
	...zContentBase.shape,
	search_query_where: z.array(zSearchQueryForWhereV1).optional(),
}).brand<'ContentV1'>();

export const zContentV2 = zContentBase.extend({
	search_query_where: z.array(zSearchQueryForWhere).optional(),
}).brand<'ContentV2'>();
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

export type TextPropertiesFor<V extends Version> = Extract<TextPropertyKeys, keyof ContentFor<V>>;

export type RadioProperties = 'use_template_engine'|'state'|'role_key'|'role_key_owner'|'search_query_order_state';

export type CheckBoxProperties = 'permission'|'permission_sheet'|'manager_permission_sheet'|'device_type';

export type SelectProperties = 'contents_type'|'http_header_content_type'|'sheet_id'|'search_query_order_rand';

export type UploadChoice =
	| {action: 'create', label: string}
	| {action: 'replace', label: string, targetPageId: string};

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

	if (columns.includes('search_query_where'))
	{
		if (!content.search_query_where?.length)
		{
			content.search_query_where = [{col: '', operator: '=', val: ''}];
		}
	}
	else
	{
		content.search_query_where = undefined;
	}

	if (columns.includes('search_query_order'))
	{
		if (!content.search_query_order?.length)
		{
			content.search_query_order = [{col: '', operator: 'ASC'}];
		}
	}
	else
	{
		content.search_query_order = undefined;
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
