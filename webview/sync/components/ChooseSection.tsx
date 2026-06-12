import React from 'react';
import {Dispatcher} from '../models/Dispatcher';
import {SyncDiff, SyncSelection, findReplaceCandidates} from '../../../common/types/SyncPlan';
import {ContentV2} from '../../../common/types/Content';

type Props = {
	items: SyncDiff[],
	diffs: SyncDiff[],
	selections: Record<string, SyncSelection>,
	executing: boolean,
};

export const ChooseSection = ({items, diffs, selections, executing}: Props) =>
{
	if (items.length === 0) return null;

	const list: ContentV2[] = diffs.flatMap(d =>
	{
		if (d.kind === 'update') return [d.server];
		if (d.kind === 'serverOnly') return [d.server];
		return [];
	});

	return (
		<div>
			<h3>置き換え選択 ({items.length})</h3>
			<ul>
				{items.map((d, index) =>
				{
					if (d.kind !== 'choose') return null;
					const candidates = findReplaceCandidates(d.local, list);
					const selection = selections[d.local.page_id];
					const key = `li.choose.${index}`;
					return <ChooseItem key={key} index={index} content={d.local} candidates={candidates} selection={selection} disabled={executing} />;
				})}
			</ul>
		</div>
	);
};

const ChooseItem = ({index, content, candidates, selection, disabled}: {
	index: number,
	content: ContentV2,
	candidates: ContentV2[],
	selection: SyncSelection | undefined,
	disabled: boolean,
}) =>
{
	const [value, setValue] = React.useState(selection?.kind === 'replace' ? selection.targetPageId : '');

	React.useEffect(() =>
	{
		setValue(selection?.kind === 'replace' ? selection.targetPageId : '');
	}, [selection]);

	const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) =>
	{
		const v = event.target.value;
		setValue(v);
		const next: SyncSelection = v === ''
			? {kind: 'create'}
			: {kind: 'replace', targetPageId: v};
		Dispatcher.updateSelection(content.page_id, next);
	};

	const name = `choose.${index}`;
	return (
		<li>
			{content.page_id}:
			<select name={name} value={value} onChange={handleChange} disabled={disabled}>
				<option key={`select.${name}.option.default`} value="">新規作成</option>
				{candidates.map((c, optionIndex) =>
				{
					const optionKey = `select.${name}.option.${optionIndex}`;
					return (
						<option key={optionKey} value={c.page_id}>
							置き換え: {c.page_id}
						</option>
					);
				})}
			</select>
		</li>
	);
};
