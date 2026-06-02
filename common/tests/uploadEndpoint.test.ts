import {
	ContentContext,
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

describe('ContentContext.uploadEndpoint / uploadMethod', () =>
{
	describe('V1 (id ベース分岐)', () =>
	{
		const context = new ContentContext(new ContentStrategyV1());

		test('id が空文字列なら create / POST', () =>
		{
			const content = zContentV1.parse({...baseFields, id: ''});
			expect(context.uploadEndpoint(content)).toBe('create');
			expect(context.uploadMethod(content)).toBe('POST');
		});

		test('id に値があれば update / PUT', () =>
		{
			const content = zContentV1.parse({...baseFields, id: '1'});
			expect(context.uploadEndpoint(content)).toBe('update');
			expect(context.uploadMethod(content)).toBe('PUT');
		});
	});

	describe('V2 (upsert 固定)', () =>
	{
		const context = new ContentContext(new ContentStrategyV2());

		test('is_unsynced: true でも upsert / PUT', () =>
		{
			const content = zContentV2.parse({...baseFields, is_unsynced: true});
			expect(context.uploadEndpoint(content)).toBe('upsert');
			expect(context.uploadMethod(content)).toBe('PUT');
		});

		test('is_unsynced 未設定でも upsert / PUT', () =>
		{
			const content = zContentV2.parse({...baseFields});
			expect(context.uploadEndpoint(content)).toBe('upsert');
			expect(context.uploadMethod(content)).toBe('PUT');
		});
	});
});
