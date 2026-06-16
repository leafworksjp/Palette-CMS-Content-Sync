import {z} from 'zod';
import {ContentV2, zContentV2} from './Content';

//差分の分類 (ローカル × サーバー突き合わせの結果)。computeSyncDiff の出力。
export const zSyncDiff = z.discriminatedUnion('kind', [
	z.object({kind: z.literal('matched'), local: zContentV2, server: zContentV2}),
	z.object({kind: z.literal('localOnly'), local: zContentV2}),
	z.object({kind: z.literal('serverOnly'), server: zContentV2}),
]);

export type SyncDiff = z.infer<typeof zSyncDiff>;

//実行する操作 (サーバーに送るための完全データ)。orderActions / findConflicts の入力、実行エンジンが API 呼び出しに使う。
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

export type Conflict = {target: string, sources: string[]};

export function computeSyncDiff(local: ContentV2[], server: ContentV2[]): SyncDiff[]
{
	const serverByPageId = new Map(server.map(c => [c.page_id, c]));
	const localPageIds = new Set(local.map(c => c.page_id));

	const localDiffs: SyncDiff[] = local.map(l =>
	{
		const s = serverByPageId.get(l.page_id);
		return s
			? {kind: 'matched', local: l, server: s}
			: {kind: 'localOnly', local: l};
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

const conflictTarget = (a: SyncAction): string | undefined =>
{
	if (a.kind === 'update') return a.local.page_id;
	if (a.kind === 'replace') return a.targetPageId;
	if (a.kind === 'delete') return a.pageId;
	return undefined;
};

export function findConflicts(actions: SyncAction[]): Conflict[]
{
	const ordered = orderActions(actions);

	const targets = ordered.flatMap(a =>
	{
		const t = conflictTarget(a);
		return t ? [t] : [];
	});

	const seen = new Set<string>();
	const duplicates = new Set<string>();
	targets.forEach(t =>
	{
		if (seen.has(t)) duplicates.add(t);
		else seen.add(t);
	});

	return [...duplicates].map(target => ({
		target,
		sources: ordered.flatMap(a => ((a.kind === 'replace' && a.targetPageId === target) ? [a.local.page_id] : [])),
	}));
}

//各 diff にデフォルト selection を割り当てる (page_id をキーにした Record)。
//要件 6.6「更新候補は確認のみ、それ以外は明示選択」 に従い、update のみデフォルトを持つ。
//localOnly / serverOnly は entry なし (= 未選択) で初期化し、ユーザーの明示操作を待つ。
export function buildDefaultSelections(diffs: SyncDiff[]): Record<string, SyncSelection>
{
	const entries: [string, SyncSelection][] = diffs.flatMap((d): [string, SyncSelection][] =>
	{
		if (d.kind === 'matched') return [[d.local.page_id, {kind: 'update'}]];
		return [];
	});
	return Object.fromEntries(entries);
}

//SyncDiff[] と selections (page_id キー) を組み合わせて SyncAction[] を構築する。
//diff 種別と selection 種別の組み合わせが整合しないものはスキップ。
export function buildActions(diffs: SyncDiff[], selections: Record<string, SyncSelection>): SyncAction[]
{
	return diffs.flatMap((d): SyncAction[] =>
	{
		const pageId = d.kind === 'serverOnly' ? d.server.page_id : d.local.page_id;
		const s = selections[pageId];
		if (!s) return [];

		if (d.kind === 'matched' && s.kind === 'update')
		{
			return [{kind: 'update', local: d.local}];
		}
		if (d.kind === 'localOnly' && s.kind === 'create')
		{
			return [{kind: 'create', local: d.local}];
		}
		if (d.kind === 'localOnly' && s.kind === 'replace')
		{
			if (!s.targetPageId) return [];
			return [{kind: 'replace', local: d.local, targetPageId: s.targetPageId}];
		}
		if (d.kind === 'serverOnly' && s.kind === 'delete')
		{
			return [{kind: 'delete', pageId: d.server.page_id}];
		}
		if (d.kind === 'serverOnly' && s.kind === 'downloadLocal')
		{
			return [{kind: 'downloadLocal', server: d.server}];
		}
		return [];
	});
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
