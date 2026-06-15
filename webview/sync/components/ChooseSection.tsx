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
	const [localSelection, setLocalSelection] = React.useState<SyncSelection | undefined>(selection);

	React.useEffect(() => setLocalSelection(selection), [selection]);

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) =>
	{
		const v = event.target.value;
		const next: SyncSelection = v === 'create'
			? {kind: 'create'}
			: {kind: 'replace', targetPageId: ''};
		setLocalSelection(next);
		Dispatcher.updateSelection(content.page_id, next);
	};

	const handleTargetChange = (event: React.ChangeEvent<HTMLSelectElement>) =>
	{
		const targetPageId = event.target.value;
		if (!targetPageId) return;
		const next: SyncSelection = {kind: 'replace', targetPageId};
		setLocalSelection(next);
		Dispatcher.updateSelection(content.page_id, next);
	};

	const name = `choose.${index}`;
	const targetValue = localSelection?.kind === 'replace' ? localSelection.targetPageId : '';

	return (
		<li>
			{content.page_id}:
			<label>
				<input
					type="radio"
					name={name}
					value="create"
					checked={localSelection?.kind === 'create'}
					onChange={handleChange}
					disabled={disabled}
				/>
				新規作成
			</label>
			<label>
				<input
					type="radio"
					name={name}
					value="replace"
					checked={localSelection?.kind === 'replace'}
					onChange={handleChange}
					disabled={disabled}
				/>
				置き換え
			</label>
			{localSelection?.kind === 'replace' && (
				<select
					name={`${name}.target`}
					value={targetValue}
					onChange={handleTargetChange}
					disabled={disabled}
				>
					<option key={`select.${name}.option.placeholder`} value="" disabled hidden>対象を選択</option>
					{candidates.map((c, optionIndex) =>
					{
						const optionKey = `select.${name}.option.${optionIndex}`;
						return (
							<option key={optionKey} value={c.page_id}>
								{c.page_id}
							</option>
						);
					})}
				</select>
			)}
		</li>
	);
};
