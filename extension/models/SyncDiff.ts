import {Content} from '../../common/types/Content';

export type SyncDiff =
	| {kind: 'update', local: Content, server: Content}
	| {kind: 'choose', local: Content}
	| {kind: 'serverOnly', server: Content};

export function computeSyncDiff(local: Content[], server: Content[]): SyncDiff[]
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

export function findReplaceCandidates(content: Content, list: Content[]): Content[]
{
	return list.filter(c =>
	{
		return c.page_id !== content.page_id
			&& c.contents_type === content.contents_type
			&& c.sheet_id === content.sheet_id
			&& c.use_template_engine === content.use_template_engine;
	});
}

export type SyncAction =
	| {kind: 'update', local: Content}
	| {kind: 'create', local: Content}
	| {kind: 'replace', local: Content, targetPageId: string}
	| {kind: 'delete', pageId: string}
	| {kind: 'downloadLocal', server: Content};

export type Conflict = {pageId: string};

export function predictConflicts(actions: SyncAction[]): Conflict[]
{
	const targets = actions.flatMap(a =>
	{
		if (a.kind === 'update') return [a.local.page_id];
		if (a.kind === 'replace') return [a.targetPageId];
		if (a.kind === 'delete') return [a.pageId];
		return [];
	});

	const duplicates = Array.from(new Set(
		targets.filter((p, i, arr) => arr.indexOf(p) !== i)
	));

	return duplicates.map(pageId => ({pageId}));
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
