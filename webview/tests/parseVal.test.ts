import {parseVal} from '../components/SearchInputs';

describe('parseVal', () =>
{
	describe('文字列の val (A/B 形式)', () =>
	{
		test('空文字列', () =>
		{
			expect(parseVal('')).toEqual({kind: 'value', valString: '', valSheet: '', valColRef: ''});
		});

		test('通常文字列', () =>
		{
			expect(parseVal('hoge')).toEqual({kind: 'value', valString: 'hoge', valSheet: '', valColRef: ''});
		});

		test('角括弧の固定クエリ変数文字列', () =>
		{
			expect(parseVal('[login_id]')).toEqual({kind: 'value', valString: '[login_id]', valSheet: '', valColRef: ''});
		});
	});

	describe('オブジェクトの val (C 形式)', () =>
	{
		test('sheet と col を持つオブジェクト', () =>
		{
			expect(parseVal({sheet: 'user_sheet', col: 'user_id'})).toEqual({
				kind: 'sheet',
				valString: '',
				valSheet: 'user_sheet',
				valColRef: 'user_id',
			});
		});

		test('sheet と col が空文字列のオブジェクト', () =>
		{
			expect(parseVal({sheet: '', col: ''})).toEqual({
				kind: 'sheet',
				valString: '',
				valSheet: '',
				valColRef: '',
			});
		});
	});
});
