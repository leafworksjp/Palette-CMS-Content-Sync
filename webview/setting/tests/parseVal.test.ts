import {parseValue} from '../components/SearchInputs';

describe('parseValue', () =>
{
	describe('文字列の val (A/B 形式)', () =>
	{
		test('空文字列', () =>
		{
			expect(parseValue('')).toEqual({kind: 'value', valueString: '', valueSheet: '', valueColRef: ''});
		});

		test('通常文字列', () =>
		{
			expect(parseValue('hoge')).toEqual({kind: 'value', valueString: 'hoge', valueSheet: '', valueColRef: ''});
		});

		test('角括弧の固定クエリ変数文字列', () =>
		{
			expect(parseValue('[login_id]')).toEqual({kind: 'value', valueString: '[login_id]', valueSheet: '', valueColRef: ''});
		});
	});

	describe('オブジェクトの val (C 形式)', () =>
	{
		test('sheet と col を持つオブジェクト', () =>
		{
			expect(parseValue({sheet: 'user_sheet', col: 'user_id'})).toEqual({
				kind: 'sheet',
				valueString: '',
				valueSheet: 'user_sheet',
				valueColRef: 'user_id',
			});
		});

		test('sheet と col が空文字列のオブジェクト', () =>
		{
			expect(parseValue({sheet: '', col: ''})).toEqual({
				kind: 'sheet',
				valueString: '',
				valueSheet: '',
				valueColRef: '',
			});
		});
	});
});
