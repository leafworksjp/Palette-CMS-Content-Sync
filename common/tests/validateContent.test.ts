import {
	ContentStrategyV2,
	zContentV2,
} from '../types/Content';
import {zDefinitionsV2} from '../types/Definitions';

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
	describe('正常系', () =>
	{
		test('整合する content / definitions で valid: true', () =>
		{
			const content = zContentV2.parse(baseContentData);
			const result = strategy.validate(content, definitions);
			expect(result.valid).toBe(true);
			expect(result.errors).toEqual([]);
		});
	});

	describe('R1: フィールド許可チェック (unknown_field)', () =>
	{
		test('contents_type 自体が定義にない → エラー', () =>
		{
			const content = zContentV2.parse({...baseContentData, contents_type: 'nonexistent_type'});
			const result = strategy.validate(content, definitions);
			expect(result.valid).toBe(false);
			expect(result.errors[0].field).toBe('contents_type');
			expect(result.errors[0].reason).toBe('invalid_value');
		});
	});

	describe('R2/R3: enum 値チェック (invalid_value)', () =>
	{
		test('単一値 (state) が許可リストにない', () =>
		{
			const content = zContentV2.parse({...baseContentData, state: 999});
			const result = strategy.validate(content, definitions);
			expect(result.valid).toBe(false);
			expect(result.errors.some(e => e.field === 'state' && e.value === 999 && e.reason === 'invalid_value')).toBe(true);
		});

		test('配列値 (permission) の一部要素が許可リストにない', () =>
		{
			const content = zContentV2.parse({...baseContentData, permission: ['nobody', 'admin']});
			const result = strategy.validate(content, definitions);
			expect(result.valid).toBe(false);
			expect(result.errors.some(e => e.field === 'permission' && e.value === 'admin' && e.reason === 'invalid_value')).toBe(true);
		});

		test('配列値 (device_type) の一部要素が許可リストにない', () =>
		{
			const content = zContentV2.parse({...baseContentData, device_type: ['pc', 'tablet']});
			const result = strategy.validate(content, definitions);
			expect(result.valid).toBe(false);
			expect(result.errors.some(e => e.field === 'device_type' && e.value === 'tablet')).toBe(true);
		});
	});

	describe('R4: search_query_where', () =>
	{
		test('col が search_query_keys にない → unknown_col', () =>
		{
			const content = zContentV2.parse({
				...baseContentData,
				search_query_where: [{col: 'unknown_col', operator: '=', val: 'x'}],
			});
			const result = strategy.validate(content, definitions);
			expect(result.valid).toBe(false);
			expect(result.errors.some(e => e.field === 'search_query_where.col' && e.value === 'unknown_col' && e.reason === 'unknown_col')).toBe(true);
		});

		test('operator が column_options にない → invalid_value', () =>
		{
			const content = zContentV2.parse({
				...baseContentData,
				search_query_where: [{col: 'pre', operator: '~~', val: 'x'}],
			});
			const result = strategy.validate(content, definitions);
			expect(result.valid).toBe(false);
			expect(result.errors.some(e => e.field === 'search_query_where.operator' && e.value === '~~' && e.reason === 'invalid_value')).toBe(true);
		});

		test('val のシート参照は validate されない', () =>
		{
			const content = zContentV2.parse({
				...baseContentData,
				search_query_where: [{col: 'pre', operator: '=', val: {sheet: 'whatever', col: 'whatever'}}],
			});
			const result = strategy.validate(content, definitions);
			expect(result.valid).toBe(true);
		});

		test('col が空文字列 (未入力) なら unknown_col にならない', () =>
		{
			const content = zContentV2.parse({
				...baseContentData,
				search_query_where: [{col: '', operator: '=', val: ''}],
			});
			const result = strategy.validate(content, definitions);
			expect(result.valid).toBe(true);
		});

		test('operator が空文字列 (未入力) なら invalid_value にならない', () =>
		{
			const content = zContentV2.parse({
				...baseContentData,
				search_query_where: [{col: 'pre', operator: '', val: ''}],
			});
			const result = strategy.validate(content, definitions);
			expect(result.valid).toBe(true);
		});
	});

	describe('R4: search_query_order', () =>
	{
		test('col が search_query_keys にない → unknown_col', () =>
		{
			const content = zContentV2.parse({
				...baseContentData,
				search_query_order: [{col: 'unknown_col', operator: 'ASC'}],
			});
			const result = strategy.validate(content, definitions);
			expect(result.valid).toBe(false);
			expect(result.errors.some(e => e.field === 'search_query_order.col' && e.value === 'unknown_col' && e.reason === 'unknown_col')).toBe(true);
		});

		test('operator が column_options にない → invalid_value', () =>
		{
			const content = zContentV2.parse({
				...baseContentData,
				search_query_order: [{col: 'date', operator: 'RANDOM'}],
			});
			const result = strategy.validate(content, definitions);
			expect(result.valid).toBe(false);
			expect(result.errors.some(e => e.field === 'search_query_order.operator' && e.value === 'RANDOM')).toBe(true);
		});

		test('col が空文字列 (未入力) なら unknown_col にならない', () =>
		{
			const content = zContentV2.parse({
				...baseContentData,
				search_query_order: [{col: '', operator: 'ASC'}],
			});
			const result = strategy.validate(content, definitions);
			expect(result.valid).toBe(true);
		});
	});

	describe('R5: TextProperties は対象外', () =>
	{
		test('name に任意文字列が入っていても valid', () =>
		{
			const content = zContentV2.parse({...baseContentData, name: '何でもいいテキスト'});
			const result = strategy.validate(content, definitions);
			expect(result.valid).toBe(true);
		});
	});

	describe('R6: clientOnlyFields は対象外', () =>
	{
		test('is_unsynced: true でも valid', () =>
		{
			const content = zContentV2.parse({...baseContentData, is_unsynced: true});
			const result = strategy.validate(content, definitions);
			expect(result.valid).toBe(true);
		});
	});
});
