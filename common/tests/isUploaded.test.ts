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
	contents_type: 'page',
};

describe('ContentContext.isUploaded', () =>
{
	describe('V1 (id ベース)', () =>
	{
		const context = new ContentContext(new ContentStrategyV1());

		test('id が空文字列なら false (未アップロード)', () =>
		{
			const content = zContentV1.parse({...baseFields, id: ''});
			expect(context.isUploaded(content)).toBe(false);
		});

		test('id に値があれば true (アップロード済み)', () =>
		{
			const content = zContentV1.parse({...baseFields, id: '1'});
			expect(context.isUploaded(content)).toBe(true);
		});
	});

	describe('V2 (is_unsynced ベース)', () =>
	{
		const context = new ContentContext(new ContentStrategyV2());

		test('is_unsynced: true なら false (未同期)', () =>
		{
			const content = zContentV2.parse({...baseFields, is_unsynced: true});
			expect(context.isUploaded(content)).toBe(false);
		});

		test('is_unsynced: false なら true (同期済み)', () =>
		{
			const content = zContentV2.parse({...baseFields, is_unsynced: false});
			expect(context.isUploaded(content)).toBe(true);
		});

		test('is_unsynced 未設定なら true (同期済み)', () =>
		{
			const content = zContentV2.parse({...baseFields});
			expect(context.isUploaded(content)).toBe(true);
		});
	});
});
