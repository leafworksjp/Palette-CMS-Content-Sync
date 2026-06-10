import {
	ContentStrategyV1,
	ContentStrategyV2,
} from '../types/Content';

describe('ContentStrategy.supportsSheetRefValue', () =>
{
	test('V1 は false (val: string のみ)', () =>
	{
		const strategy = new ContentStrategyV1();
		expect(strategy.supportsSheetRefValue()).toBe(false);
	});

	test('V2 は true (val: string | {sheet, col})', () =>
	{
		const strategy = new ContentStrategyV2();
		expect(strategy.supportsSheetRefValue()).toBe(true);
	});
});
