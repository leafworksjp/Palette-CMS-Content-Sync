import React from 'react';
import {SyncAction, SyncDiff, SyncSelection, predictConflicts, orderActions} from '../../../common/types/SyncPlan';

type Props = {
	diffs: SyncDiff[],
	selections: Record<string, SyncSelection>,
};

export const PreviewSection = ({diffs, selections}: Props) =>
{
	const actions = buildActions(diffs, selections);
	const ordered = orderActions(actions);
	const conflicts = predictConflicts(actions);

	return (
		<div>
			<h3>プレビュー</h3>
			{conflicts.length > 0 && (
				<div>
					<p>⚠ 衝突 (削除最後の順序で先勝ち・後失敗の可能性):</p>
					<ul>
						{conflicts.map((c, index) =>
						{
							const liKey = `li.conflict.${index}`;
							return <li key={liKey}>{c.pageId}</li>;
						})}
					</ul>
				</div>
			)}
			<ul>
				{ordered.map((a, index) =>
				{
					const liKey = `li.preview.${index}`;
					if (a.kind === 'update') return <li key={liKey}>update: {a.local.page_id}</li>;
					if (a.kind === 'create') return <li key={liKey}>create: {a.local.page_id}</li>;
					if (a.kind === 'replace') return <li key={liKey}>replace: {a.targetPageId} ← {a.local.page_id}</li>;
					if (a.kind === 'delete') return <li key={liKey}>delete: {a.pageId}</li>;
					return <li key={liKey}>取得: {a.server.page_id}</li>;
				})}
			</ul>
		</div>
	);
};

const buildActions = (diffs: SyncDiff[], selections: Record<string, SyncSelection>): SyncAction[] =>
{
	return diffs.flatMap((d): SyncAction[] =>
	{
		const pageId = d.kind === 'serverOnly' ? d.server.page_id : d.local.page_id;
		const s = selections[pageId];
		if (!s) return [];

		if (d.kind === 'update' && s.kind === 'update')
		{
			return [{kind: 'update', local: d.local}];
		}
		if (d.kind === 'choose' && s.kind === 'create')
		{
			return [{kind: 'create', local: d.local}];
		}
		if (d.kind === 'choose' && s.kind === 'replace')
		{
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
};
