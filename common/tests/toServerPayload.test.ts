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
	name: 'preserved-name',
	contents_type: 'page',
};

describe('ContentContext.toServerPayload', () =>
{
	describe('V1', () =>
	{
		const context = new ContentContext(new ContentStrategyV1());

		test('全フィールドが保持される (除外対象なし)', () =>
		{
			const content = zContentV1.parse({...baseFields, id: '1'});
			const payload = context.toServerPayload(content);

			expect(payload.id).toBe('1');
			expect(payload.page_id).toBe('foo');
			expect(payload.name).toBe('preserved-name');
			expect(payload.contents_type).toBe('page');
			expect(payload.category).toBe('cat');
		});
	});

	describe('V2', () =>
	{
		const context = new ContentContext(new ContentStrategyV2());

		test('is_unsynced を除外する', () =>
		{
			const content = zContentV2.parse({...baseFields, is_unsynced: true});
			const payload = context.toServerPayload(content);

			expect(payload).not.toHaveProperty('is_unsynced');
		});

		test('is_unsynced 以外のフィールドは保持される', () =>
		{
			const content = zContentV2.parse({...baseFields, is_unsynced: true});
			const payload = context.toServerPayload(content);

			expect(payload.page_id).toBe('foo');
			expect(payload.name).toBe('preserved-name');
			expect(payload.contents_type).toBe('page');
			expect(payload.category).toBe('cat');
		});

		test('is_unsynced 未設定でも他フィールドは保持される', () =>
		{
			const content = zContentV2.parse({...baseFields});
			const payload = context.toServerPayload(content);

			expect(payload).not.toHaveProperty('is_unsynced');
			expect(payload.name).toBe('preserved-name');
		});
	});
});
