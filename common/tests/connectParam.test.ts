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

describe('ContentContext.connectParam', () =>
{
	test('V1 で id=xxx を返す', () =>
	{
		const context = new ContentContext(new ContentStrategyV1());
		const content = zContentV1.parse({...baseFields, id: '123'});

		expect(context.connectParam(content)).toBe('id=123');
	});

	test('V1 で id が空文字列なら id= を返す', () =>
	{
		const context = new ContentContext(new ContentStrategyV1());
		const content = zContentV1.parse({...baseFields, id: ''});

		expect(context.connectParam(content)).toBe('id=');
	});

	test('V2 で page_id=xxx を返す', () =>
	{
		const context = new ContentContext(new ContentStrategyV2());
		const content = zContentV2.parse({...baseFields, page_id: 'my-page'});

		expect(context.connectParam(content)).toBe('page_id=my-page');
	});
});
