import {computeSyncDiff, findReplaceCandidates, orderActions, predictConflicts, SyncAction} from '../../extension/models/SyncDiff';
import {zContentV2} from '../../common/types/Content';

const make = (pageId: string, overrides: Record<string, unknown> = {}) => zContentV2.parse({
	category: 'cat',
	page_id: pageId,
	name: 'name',
	contents_type: 'page',
	...overrides,
});

describe('computeSyncDiff', () =>
{
	test('空 × 空 → 空配列', () =>
	{
		expect(computeSyncDiff([], [])).toEqual([]);
	});

	test('ローカルのみ → choose', () =>
	{
		const local = [make('a')];
		const result = computeSyncDiff(local, []);
		expect(result).toEqual([{kind: 'choose', local: local[0]}]);
	});

	test('サーバーのみ → serverOnly', () =>
	{
		const server = [make('a')];
		const result = computeSyncDiff([], server);
		expect(result).toEqual([{kind: 'serverOnly', server: server[0]}]);
	});

	test('同 page_id が両方 → update', () =>
	{
		const local = [make('a')];
		const server = [make('a')];
		const result = computeSyncDiff(local, server);
		expect(result).toEqual([{kind: 'update', local: local[0], server: server[0]}]);
	});

	test('混在: update + choose + serverOnly', () =>
	{
		const local = [make('a'), make('b')];
		const server = [make('a'), make('c')];
		const result = computeSyncDiff(local, server);

		expect(result).toHaveLength(3);
		expect(result).toContainEqual({kind: 'update', local: local[0], server: server[0]});
		expect(result).toContainEqual({kind: 'choose', local: local[1]});
		expect(result).toContainEqual({kind: 'serverOnly', server: server[1]});
	});
});

describe('findReplaceCandidates', () =>
{
	test('空 list → 空配列', () =>
	{
		const content = make('self');
		expect(findReplaceCandidates(content, [])).toEqual([]);
	});

	test('自分自身 (同 page_id) は除外', () =>
	{
		const content = make('self');
		const list = [make('self')];
		expect(findReplaceCandidates(content, list)).toEqual([]);
	});

	test('contents_type 不一致は除外', () =>
	{
		const content = make('self', {contents_type: 'page'});
		const other = make('other', {contents_type: 'block'});
		expect(findReplaceCandidates(content, [other])).toEqual([]);
	});

	test('sheet_id 不一致は除外', () =>
	{
		const content = make('self', {sheet_id: 'a'});
		const other = make('other', {sheet_id: 'b'});
		expect(findReplaceCandidates(content, [other])).toEqual([]);
	});

	test('use_template_engine 不一致は除外', () =>
	{
		const content = make('self', {use_template_engine: 1});
		const other = make('other', {use_template_engine: 0});
		expect(findReplaceCandidates(content, [other])).toEqual([]);
	});

	test('全フィールド一致 (異 page_id) → 候補に含む', () =>
	{
		const content = make('self', {sheet_id: 'a', use_template_engine: 1});
		const other = make('other', {sheet_id: 'a', use_template_engine: 1});
		expect(findReplaceCandidates(content, [other])).toEqual([other]);
	});

	test('sheet_id が両方 undefined → 一致扱い', () =>
	{
		const content = make('self');
		const other = make('other');
		expect(findReplaceCandidates(content, [other])).toEqual([other]);
	});

	test('混在: 一致と不一致が同居', () =>
	{
		const content = make('self', {use_template_engine: 1});
		const matching = make('m1', {use_template_engine: 1});
		const notMatching = make('m2', {use_template_engine: 0});
		expect(findReplaceCandidates(content, [matching, notMatching])).toEqual([matching]);
	});
});

describe('predictConflicts', () =>
{
	test('空 → 空', () =>
	{
		expect(predictConflicts([])).toEqual([]);
	});

	test('1 操作だけ → 空', () =>
	{
		expect(predictConflicts([{kind: 'update', local: make('a')}])).toEqual([]);
	});

	test('replace.target が update.local.page_id と重複 → 1 件', () =>
	{
		const actions: SyncAction[] = [
			{kind: 'update', local: make('a')},
			{kind: 'replace', local: make('x'), targetPageId: 'a'},
		];
		expect(predictConflicts(actions)).toEqual([{pageId: 'a'}]);
	});

	test('replace.target が delete.pageId と重複 → 1 件', () =>
	{
		const actions: SyncAction[] = [
			{kind: 'replace', local: make('x'), targetPageId: 'b'},
			{kind: 'delete', pageId: 'b'},
		];
		expect(predictConflicts(actions)).toEqual([{pageId: 'b'}]);
	});

	test('複数の replace が同 target → 重複 1 件', () =>
	{
		const actions: SyncAction[] = [
			{kind: 'replace', local: make('x'), targetPageId: 'a'},
			{kind: 'replace', local: make('y'), targetPageId: 'a'},
		];
		expect(predictConflicts(actions)).toEqual([{pageId: 'a'}]);
	});

	test('複数衝突', () =>
	{
		const actions: SyncAction[] = [
			{kind: 'update', local: make('a')},
			{kind: 'replace', local: make('x'), targetPageId: 'a'},
			{kind: 'replace', local: make('y'), targetPageId: 'b'},
			{kind: 'delete', pageId: 'b'},
			{kind: 'delete', pageId: 'c'},
		];
		const result = predictConflicts(actions);
		expect(result).toHaveLength(2);
		expect(result).toContainEqual({pageId: 'a'});
		expect(result).toContainEqual({pageId: 'b'});
	});

	test('create / downloadLocal は衝突判定対象外', () =>
	{
		const actions: SyncAction[] = [
			{kind: 'create', local: make('x')},
			{kind: 'downloadLocal', server: make('y')},
			{kind: 'update', local: make('a')},
		];
		expect(predictConflicts(actions)).toEqual([]);
	});

	test('衝突なし: 各操作が別 page_id を対象', () =>
	{
		const actions: SyncAction[] = [
			{kind: 'update', local: make('a')},
			{kind: 'replace', local: make('x'), targetPageId: 'b'},
			{kind: 'delete', pageId: 'c'},
		];
		expect(predictConflicts(actions)).toEqual([]);
	});
});

describe('orderActions', () =>
{
	test('空 → 空', () =>
	{
		expect(orderActions([])).toEqual([]);
	});

	test('削除のみ → そのまま', () =>
	{
		const actions: SyncAction[] = [
			{kind: 'delete', pageId: 'a'},
			{kind: 'delete', pageId: 'b'},
		];
		expect(orderActions(actions)).toEqual(actions);
	});

	test('非削除のみ → そのまま', () =>
	{
		const actions: SyncAction[] = [
			{kind: 'update', local: make('a')},
			{kind: 'create', local: make('b')},
		];
		expect(orderActions(actions)).toEqual(actions);
	});

	test('混在 → 非削除が先、削除が後', () =>
	{
		const update: SyncAction = {kind: 'update', local: make('a')};
		const del1: SyncAction = {kind: 'delete', pageId: 'x'};
		const create: SyncAction = {kind: 'create', local: make('b')};
		const del2: SyncAction = {kind: 'delete', pageId: 'y'};
		const replace: SyncAction = {kind: 'replace', local: make('c'), targetPageId: 'z'};

		const ordered = orderActions([del1, update, del2, create, replace]);
		expect(ordered).toEqual([update, create, replace, del1, del2]);
	});

	test('同種内の順序は保持 (stable)', () =>
	{
		const a: SyncAction = {kind: 'update', local: make('a')};
		const b: SyncAction = {kind: 'update', local: make('b')};
		const c: SyncAction = {kind: 'update', local: make('c')};
		expect(orderActions([a, b, c])).toEqual([a, b, c]);
	});
});
