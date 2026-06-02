import {
	ContentContext,
	ContentStrategyV1,
	ContentStrategyV2,
} from '../types/Content';

describe('ContentContext.supportsSheetRefVal', () =>
{
	test('V1 は false (val: string のみ)', () =>
	{
		const context = new ContentContext(new ContentStrategyV1());
		expect(context.supportsSheetRefVal()).toBe(false);
	});

	test('V2 は true (val: string | {sheet, col})', () =>
	{
		const context = new ContentContext(new ContentStrategyV2());
		expect(context.supportsSheetRefVal()).toBe(true);
	});
});
