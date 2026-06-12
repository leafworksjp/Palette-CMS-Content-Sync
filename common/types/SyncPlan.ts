import {z} from 'zod';
import {ContentV2, zContentV2} from './Content';

//差分の分類 (ローカル × サーバー突き合わせの結果)。computeSyncDiff の出力。
export const zSyncDiff = z.discriminatedUnion('kind', [
	z.object({kind: z.literal('update'), local: zContentV2, server: zContentV2}),
	z.object({kind: z.literal('choose'), local: zContentV2}),
	z.object({kind: z.literal('serverOnly'), server: zContentV2}),
]);

export type SyncDiff = z.infer<typeof zSyncDiff>;

//実行する操作 (サーバーに送るための完全データ)。orderActions / predictConflicts の入力、実行エンジンが API 呼び出しに使う。
export const zSyncAction = z.discriminatedUnion('kind', [
	z.object({kind: z.literal('update'), local: zContentV2}),
	z.object({kind: z.literal('create'), local: zContentV2}),
	z.object({kind: z.literal('replace'), local: zContentV2, targetPageId: z.string()}),
	z.object({kind: z.literal('delete'), pageId: z.string()}),
	z.object({kind: z.literal('downloadLocal'), server: zContentV2}),
]);

export type SyncAction = z.infer<typeof zSyncAction>;

//ユーザーが選んだ操作種別 (= SyncAction の payload なし版、replace のみ target を持つ)。
//SyncDiff と組み合わせて SyncAction を構築する。webview ↔ extension で受け渡す。
export const zSyncSelection = z.discriminatedUnion('kind', [
	z.object({kind: z.literal('update')}),
	z.object({kind: z.literal('create')}),
	z.object({kind: z.literal('replace'), targetPageId: z.string()}),
	z.object({kind: z.literal('delete')}),
	z.object({kind: z.literal('downloadLocal')}),
]);

export type SyncSelection = z.infer<typeof zSyncSelection>;

export type Conflict = {pageId: string};

export function computeSyncDiff(local: ContentV2[], server: ContentV2[]): SyncDiff[]
{
	const serverByPageId = new Map(server.map(c => [c.page_id, c]));
	const localPageIds = new Set(local.map(c => c.page_id));

	const localDiffs: SyncDiff[] = local.map(l =>
	{
		const s = serverByPageId.get(l.page_id);
		return s
			? {kind: 'update', local: l, server: s}
			: {kind: 'choose', local: l};
	});

	const serverOnlyDiffs: SyncDiff[] = server
	.filter(s => !localPageIds.has(s.page_id))
	.map(s => ({kind: 'serverOnly', server: s}));

	return [...localDiffs, ...serverOnlyDiffs];
}

export function findReplaceCandidates(content: ContentV2, list: ContentV2[]): ContentV2[]
{
	return list.filter(c =>
	{
		return c.page_id !== content.page_id
			&& c.contents_type === content.contents_type
			&& c.sheet_id === content.sheet_id
			&& c.use_template_engine === content.use_template_engine;
	});
}

export function predictConflicts(actions: SyncAction[]): Conflict[]
{
	const targets = actions.flatMap(a =>
	{
		if (a.kind === 'update') return [a.local.page_id];
		if (a.kind === 'replace') return [a.targetPageId];
		if (a.kind === 'delete') return [a.pageId];
		return [];
	});

	const seen = new Set<string>();
	const duplicates = new Set<string>();
	targets.forEach(p =>
	{
		if (seen.has(p)) duplicates.add(p);
		else seen.add(p);
	});

	return [...duplicates].map(pageId => ({pageId}));
}

export function orderActions(actions: SyncAction[]): SyncAction[]
{
	return [...actions].sort((a, b) =>
	{
		if (a.kind === 'delete' && b.kind !== 'delete') return 1;
		if (a.kind !== 'delete' && b.kind === 'delete') return -1;
		return 0;
	});
}
