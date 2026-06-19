import {z} from 'zod';
import {ContentV2, zContentV2} from './Content';

export const zSyncDiff = z.discriminatedUnion('kind', [
	z.object({kind: z.literal('matched'), local: zContentV2, server: zContentV2}),
	z.object({kind: z.literal('localOnly'), local: zContentV2}),
	z.object({kind: z.literal('serverOnly'), server: zContentV2}),
]);

export type SyncDiff = z.infer<typeof zSyncDiff>;

export const zSyncAction = z.discriminatedUnion('kind', [
	z.object({kind: z.literal('update'), local: zContentV2}),
	z.object({kind: z.literal('create'), local: zContentV2}),
	z.object({kind: z.literal('replace'), local: zContentV2, targetPageId: z.string()}),
	z.object({kind: z.literal('delete'), pageId: z.string()}),
	z.object({kind: z.literal('downloadLocal'), server: zContentV2}),
]);

export type SyncAction = z.infer<typeof zSyncAction>;

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

export function getConsumedTargets(selections: Record<string, SyncSelection>): Map<string, string[]>
{
	const map = new Map<string, string[]>();
	Object.entries(selections).forEach(([sourcePageId, selection]) =>
	{
		if (selection.kind === 'replace' && selection.targetPageId)
		{
			const sources = map.get(selection.targetPageId) ?? [];
			sources.push(sourcePageId);
			map.set(selection.targetPageId, sources);
		}
	});
	return map;
}

export function findConflicts(actions: SyncAction[]): Conflict[]
{
	const targets = actions.flatMap(a => (a.kind === 'replace' ? [a.targetPageId] : []));

	const seen = new Set<string>();
	const duplicates = new Set<string>();
	targets.forEach(t =>
	{
		if (seen.has(t)) duplicates.add(t);
		else seen.add(t);
	});

	return [...duplicates].map(target => ({
		target,
		sources: actions.flatMap(a => ((a.kind === 'replace' && a.targetPageId === target) ? [a.local.page_id] : [])),
	}));
}

export function buildDefaultSelections(diffs: SyncDiff[]): Record<string, SyncSelection>
{
	const entries: [string, SyncSelection][] = diffs.flatMap((d): [string, SyncSelection][] =>
	{
		if (d.kind === 'matched') return [[d.local.page_id, {kind: 'update'}]];
		return [];
	});
	return Object.fromEntries(entries);
}

export function buildActions(diffs: SyncDiff[], selections: Record<string, SyncSelection>): SyncAction[]
{
	const consumed = getConsumedTargets(selections);

	return diffs.flatMap((diff): SyncAction[] =>
	{
		const pageId = diff.kind === 'serverOnly' ? diff.server.page_id : diff.local.page_id;

		if ((diff.kind === 'matched' || diff.kind === 'serverOnly') && consumed.has(pageId)) return [];

		const selection = selections[pageId];
		if (!selection) return [];

		if (diff.kind === 'matched' && selection.kind === 'update')
		{
			return [{kind: 'update', local: diff.local}];
		}
		if (diff.kind === 'localOnly' && selection.kind === 'create')
		{
			return [{kind: 'create', local: diff.local}];
		}
		if (diff.kind === 'localOnly' && selection.kind === 'replace')
		{
			if (!selection.targetPageId) return [];
			return [{kind: 'replace', local: diff.local, targetPageId: selection.targetPageId}];
		}
		if (diff.kind === 'serverOnly' && selection.kind === 'delete')
		{
			return [{kind: 'delete', pageId: diff.server.page_id}];
		}
		if (diff.kind === 'serverOnly' && selection.kind === 'downloadLocal')
		{
			return [{kind: 'downloadLocal', server: diff.server}];
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
