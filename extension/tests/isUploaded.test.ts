import {ContentStrategyV1} from '../../extension/models/ContentStrategy';
import {zContentV1} from '../../common/types/Content';

const baseFields = {
	category: 'cat',
	page_id: 'foo',
	name: 'name',
	contents_type: 'page',
};

describe('ContentStrategy.isUploaded', () =>
{
	describe('V1 (id ベース)', () =>
	{
		const strategy = new ContentStrategyV1();

		test('id が空文字列なら false (未アップロード)', () =>
		{
			const content = zContentV1.parse({...baseFields, id: ''});
			expect(strategy.isUploaded(content)).toBe(false);
		});

		test('id に値があれば true (アップロード済み)', () =>
		{
			const content = zContentV1.parse({...baseFields, id: '1'});
			expect(strategy.isUploaded(content)).toBe(true);
		});
	});
});
