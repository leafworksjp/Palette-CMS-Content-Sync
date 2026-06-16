import {Locale} from '../locales/ja';
import {SyncAction, SyncDiff, SyncSelection, buildActions, findConflicts, orderActions} from '../../../common/types/SyncPlan';

type Props = {
	diffs: SyncDiff[],
	selections: Record<string, SyncSelection>,
};

const sectionOrder: SyncAction['kind'][] = ['update', 'create', 'replace', 'downloadLocal', 'delete'];

export const Confirmation = ({diffs, selections}: Props) =>
{
	const actions = buildActions(diffs, selections);
	const ordered = orderActions(actions);
	const conflicts = findConflicts(actions);

	return (
		<div className="confirmation">
			<h2 className="confirmation__title">{Locale.confirmation.title}</h2>
			{conflicts.length > 0 && (
				<div className="warning">
					<p>{Locale.warning.conflict}</p>
					<ul className="warning__list">
						{conflicts.map((c, index) =>
						{
							const liKey = `li.conflict.${index}`;
							return <li key={liKey}>{c.target} ← {c.sources.join(', ')}</li>;
						})}
					</ul>
				</div>
			)}
			{sectionOrder.map(kind =>
			{
				const items = ordered.filter(a => a.kind === kind);
				if (items.length === 0) return null;

				const sectionKey = `confirm.section.${kind}`;
				return <ConfirmationGroup key={sectionKey} kind={kind} items={items} />;
			})}
		</div>
	);
};

const ConfirmationGroup = ({kind, items}: {
	kind: SyncAction['kind'],
	items: SyncAction[],
}) => (
	<div className="confirmation__group">
		<h3 className="confirmation__label">{Locale.actionLabel[kind]} ({items.length})</h3>
		<ul className="confirmation__list">
			{items.map((a, index) =>
			{
				const liKey = `li.confirm.${kind}.${index}`;
				return <ConfirmationActionItem key={liKey} action={a} />;
			})}
		</ul>
	</div>
);

const ConfirmationActionItem = ({action}: {action: SyncAction}) =>
{
	if (action.kind === 'update') return <li className="confirmation__item">{action.local.page_id}</li>;
	if (action.kind === 'create') return <li className="confirmation__item">{action.local.page_id}</li>;
	if (action.kind === 'replace') return <li className="confirmation__item">{action.targetPageId} ← {action.local.page_id}</li>;
	if (action.kind === 'delete') return <li className="confirmation__item">{action.pageId}</li>;
	return <li className="confirmation__item">{action.server.page_id}</li>;
};
