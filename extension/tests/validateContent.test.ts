import {
	ContentStrategyV2,
} from '../../extension/models/ContentStrategy';
import {zContentV2} from '../../common/types/Content';
import {zDefinitionsV2} from '../../common/types/Definitions';

const baseDefinitionsData = {
	columns: {
		item_view: [
			{
				key: 'products',
				options: [
					'category',
					'page_id',
					'name',
					'contents_type',
					'sheet_id',
					'permission',
					'device_type',
					'use_template_engine',
					'state',
					'search_query_where',
					'search_query_order_state',
					'search_query_order',
				],
			},
		],
	},
	column_names: [],
	sheet_names: [{key: 'products', name: 'products'}],
	column_options: {
		contents_type: [{key: 'item_view', name: 'item view'}],
		http_header_content_type: {item_view: [{key: 'html', name: 'html'}]},
		sheet_id: {item_view: [{key: 'default', options: ['products']}]},
		permission: {item_view: [{key: 'nobody', name: '一般'}, {key: 'user', name: 'ユーザー'}]},
		permission_sheet: {item_view: [{key: 'products', options: ['users']}]},
		device_type: [{key: 'pc', name: 'PC'}, {key: 'smart', name: 'スマート'}],
		use_template_engine: [{key: 1, name: 'テンプレ'}, {key: 0, name: '変数'}],
		state: [{key: 1, name: '公開'}, {key: 0, name: '非公開'}],
		search_query_where: [{key: '=', name: '='}, {key: '!=', name: '!='}],
		search_query_order_state: [{key: 'col', name: 'col'}],
		search_query_order: [{key: 'ASC', name: 'asc'}, {key: 'DESC', name: 'desc'}],
	},
	code_types: {item_view: ['base']},
	code_type_names: [],
	search_query_keys: {
		item_view: [
			{sheet: 'products', type: 'where', options: [{key: 'pre', name: 'pre'}, {key: 'event', name: 'event'}]},
			{sheet: 'products', type: 'order', options: [{key: 'date', name: 'date'}, {key: 'data_id', name: 'data_id'}]},
		],
	},
};

const baseContentData = {
	category: 'test',
	page_id: 'foo',
	name: 'name',
	contents_type: 'item_view',
	sheet_id: 'products',
	permission: ['nobody', 'user'],
	device_type: ['pc', 'smart'],
	use_template_engine: 1,
	state: 1,
	search_query_where: [{col: 'pre', operator: '=', val: 'P02'}],
	search_query_order_state: 'col',
	search_query_order: [{col: 'date', operator: 'DESC'}],
};

const strategy = new ContentStrategyV2();
const definitions = zDefinitionsV2.parse(baseDefinitionsData);

describe('ContentStrategy.validate', () =>
{
	describe('valid content', () =>
	{
		test('returns empty errors when content and definitions are consistent', () =>
		{
			const content = zContentV2.parse(baseContentData);
			const result = strategy.validate(content, definitions);
			expect(result).toEqual([]);
		});
	});

	describe('unknown_field', () =>
	{
		test('contents_type not defined in definitions returns invalid_value', () =>
		{
			const content = zContentV2.parse({...baseContentData, contents_type: 'nonexistent_type'});
			const result = strategy.validate(content, definitions);
			expect(result[0].field).toBe('contents_type');
			expect(result[0].reason).toBe('invalid_value');
		});
	});

	describe('enum invalid_value', () =>
	{
		test('scalar value (state) not in allowed list', () =>
		{
			const content = zContentV2.parse({...baseContentData, state: 999});
			const result = strategy.validate(content, definitions);
			expect(result.some(e => e.field === 'state' && e.value === 999 && e.reason === 'invalid_value')).toBe(true);
		});

		test('array value (permission) contains invalid element', () =>
		{
			const content = zContentV2.parse({...baseContentData, permission: ['nobody', 'admin']});
			const result = strategy.validate(content, definitions);
			expect(result.some(e => e.field === 'permission' && e.value === 'admin' && e.reason === 'invalid_value')).toBe(true);
		});

		test('array value (device_type) contains invalid element', () =>
		{
			const content = zContentV2.parse({...baseContentData, device_type: ['pc', 'tablet']});
			const result = strategy.validate(content, definitions);
			expect(result.some(e => e.field === 'device_type' && e.value === 'tablet')).toBe(true);
		});
	});

	describe('search_query_where', () =>
	{
		test('col not in search_query_keys returns unknown_col', () =>
		{
			const content = zContentV2.parse({
				...baseContentData,
				search_query_where: [{col: 'unknown_col', operator: '=', val: 'x'}],
			});
			const result = strategy.validate(content, definitions);
			expect(result.some(e => e.field === 'search_query_where.col' && e.value === 'unknown_col' && e.reason === 'unknown_col')).toBe(true);
		});

		test('operator not in column_options returns invalid_value', () =>
		{
			const content = zContentV2.parse({
				...baseContentData,
				search_query_where: [{col: 'pre', operator: '~~', val: 'x'}],
			});
			const result = strategy.validate(content, definitions);
			expect(result.some(e => e.field === 'search_query_where.operator' && e.value === '~~' && e.reason === 'invalid_value')).toBe(true);
		});

		test('val with sheet reference is not validated', () =>
		{
			const content = zContentV2.parse({
				...baseContentData,
				search_query_where: [{col: 'pre', operator: '=', val: {sheet: 'whatever', col: 'whatever'}}],
			});
			const result = strategy.validate(content, definitions);
			expect(result).toEqual([]);
		});

		test('empty col (unentered) does not produce unknown_col', () =>
		{
			const content = zContentV2.parse({
				...baseContentData,
				search_query_where: [{col: '', operator: '=', val: ''}],
			});
			const result = strategy.validate(content, definitions);
			expect(result).toEqual([]);
		});

		test('empty operator (unentered) does not produce invalid_value', () =>
		{
			const content = zContentV2.parse({
				...baseContentData,
				search_query_where: [{col: 'pre', operator: '', val: ''}],
			});
			const result = strategy.validate(content, definitions);
			expect(result).toEqual([]);
		});
	});

	describe('search_query_order', () =>
	{
		test('col not in search_query_keys returns unknown_col', () =>
		{
			const content = zContentV2.parse({
				...baseContentData,
				search_query_order: [{col: 'unknown_col', operator: 'ASC'}],
			});
			const result = strategy.validate(content, definitions);
			expect(result.some(e => e.field === 'search_query_order.col' && e.value === 'unknown_col' && e.reason === 'unknown_col')).toBe(true);
		});

		test('operator not in column_options returns invalid_value', () =>
		{
			const content = zContentV2.parse({
				...baseContentData,
				search_query_order: [{col: 'date', operator: 'RANDOM'}],
			});
			const result = strategy.validate(content, definitions);
			expect(result.some(e => e.field === 'search_query_order.operator' && e.value === 'RANDOM')).toBe(true);
		});

		test('empty col (unentered) does not produce unknown_col', () =>
		{
			const content = zContentV2.parse({
				...baseContentData,
				search_query_order: [{col: '', operator: 'ASC'}],
			});
			const result = strategy.validate(content, definitions);
			expect(result).toEqual([]);
		});
	});

	describe('TextProperties not validated', () =>
	{
		test('arbitrary string in name is valid', () =>
		{
			const content = zContentV2.parse({...baseContentData, name: 'any text content'});
			const result = strategy.validate(content, definitions);
			expect(result).toEqual([]);
		});
	});
});
