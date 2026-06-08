import {
	ContentStrategyV1,
	ContentStrategyV2,
	zContentV1,
	zContentV2,
} from '../types/Content';

const baseFields = {
	category: 'cat',
	page_id: 'foo',
	name: 'name',
	contents_type: 'static',
};

describe('ContentStrategy.uploadEndpoint / uploadMethod', () =>
{
	describe('V1 (id ベース分岐)', () =>
	{
		const strategy = new ContentStrategyV1();

		test('id が空文字列なら create / POST', () =>
		{
			const content = zContentV1.parse({...baseFields, id: ''});
			expect(strategy.uploadEndpoint(content)).toBe('create');
			expect(strategy.uploadMethod(content)).toBe('POST');
		});

		test('id に値があれば update / PUT', () =>
		{
			const content = zContentV1.parse({...baseFields, id: '1'});
			expect(strategy.uploadEndpoint(content)).toBe('update');
			expect(strategy.uploadMethod(content)).toBe('PUT');
		});
	});

	describe('V2 (upsert 固定)', () =>
	{
		const strategy = new ContentStrategyV2();

		test('is_unsynced: true でも upsert / PUT', () =>
		{
			const content = zContentV2.parse({...baseFields, is_unsynced: true});
			expect(strategy.uploadEndpoint(content)).toBe('upsert');
			expect(strategy.uploadMethod(content)).toBe('PUT');
		});

		test('is_unsynced 未設定でも upsert / PUT', () =>
		{
			const content = zContentV2.parse({...baseFields});
			expect(strategy.uploadEndpoint(content)).toBe('upsert');
			expect(strategy.uploadMethod(content)).toBe('PUT');
		});
	});
});
