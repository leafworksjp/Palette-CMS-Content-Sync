import {z} from 'zod';
import {Definitions} from './Definitions';

export const zSearchQueryForWhere = z.object({
	col: z.string(),
	operator: z.string(),
	val: z.string(),
});

export type SearchQueryForWhere = z.infer<typeof zSearchQueryForWhere>;

export const zSearchQueryForOrder = z.object({
	col: z.string(),
	operator: z.string(),
});

export type SearchQueryForOrder = z.infer<typeof zSearchQueryForOrder>;

export const zContent = z.object({
	id: z.string(),
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
	state: z.number().optional(),
	login_url: z.string().optional(),
	logout_url: z.string().optional(),
	search_row: z.number().optional(),
	search_query_where: z.array(zSearchQueryForWhere).optional(),
	search_query_order_state: z.string().optional(),
	search_query_order: z.array(zSearchQueryForOrder).optional(),
	search_query_order_rand: z.string().optional(),
});

export type TextProperties = 'id'
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
	|'search_row';

export type RadioProperties = 'state'|'role_key'|'role_key_owner'|'search_query_order_state';

export type CheckBoxProperties = 'permission'|'permission_sheet'|'manager_permission_sheet'|'device_type';

export type SelectProperties = 'contents_type'|'http_header_content_type'|'sheet_id'|'search_query_order_rand';

export type SearchQuerytProperties = 'search_query_where'|'search_query_order';

export type Content = z.infer<typeof zContent>;

export const createContent = (): Content => ({
	id: '',
	category: '',
	page_id: '',
	name: '',
	contents_type: '',
});

export const convertSearchQueryIntoLegacyFormat = (query: unknown, index: number) =>
{
	const results: {key: string, value: string}[] = [];

	const resultForWhere = zSearchQueryForWhere.safeParse(query);
	if (resultForWhere.success)
	{
		Object.entries(resultForWhere.data).forEach(([key, value]) =>
		{
			results.push({key: `search_query_where_${key}_${index}`, value});
		});
	}

	const resultForOrder = zSearchQueryForOrder.safeParse(query);
	if (resultForOrder.success)
	{
		Object.entries(resultForOrder.data).forEach(([key, value]) =>
		{
			results.push({key: `search_query_order_${key}_${index}`, value});
		});
	}

	return results;
};

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

/*eslint-disable complexity*/
export const getOptions = (definitions: Definitions, content: Content, column: CheckBoxProperties | SelectProperties | RadioProperties) =>
{
	const {column_options, sheet_names} = definitions;

	if (
		column === 'device_type'
		|| column === 'contents_type'
		|| column === 'http_header_content_type'
		|| column === 'state'
		|| column === 'search_query_order_state'
		|| column === 'search_query_order_rand'
	)
	{
		return column_options[column];
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
		content.search_query_order_rand = 'content';
	}
	else
	{
		content.search_query_order_rand = undefined;
	}

	return content;
};
