import React from 'react';
import {Locale} from '../locales/ja';
import {Dispatcher} from '../models/Dispatcher';
import {SyncDiff, SyncSelection, findReplaceCandidates} from '../../../common/types/SyncPlan';
import {ContentV2} from '../../../common/types/Content';
import {Field} from '../../common/components/Field';

type Props = {
	items: SyncDiff[],
	diffs: SyncDiff[],
	selections: Record<string, SyncSelection>,
	executing: boolean,
};

export const ChooseInputs = ({items, diffs, selections, executing}: Props) =>
{
	if (items.length === 0) return null;

	const list: ContentV2[] = diffs.flatMap(d =>
	{
		if (d.kind === 'update') return [d.server];
		if (d.kind === 'serverOnly') return [d.server];
		return [];
	});

	return (
		<>
			{items.map((d, index) =>
			{
				if (d.kind !== 'choose') return null;
				const candidates = findReplaceCandidates(d.local, list);
				const selection = selections[d.local.page_id];
				const key = `choose.${index}`;
				return <ChooseItem key={key} index={index} content={d.local} candidates={candidates} selection={selection} disabled={executing} />;
			})}
		</>
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
	const createId = `radio.${name}.create`;
	const replaceId = `radio.${name}.replace`;
	const targetValue = localSelection?.kind === 'replace' ? localSelection.targetPageId : '';

	return (
		<Field label={content.page_id}>
			<div className="flex">
				<div className="radio">
					<input
						type="radio"
						className="radio__input"
						id={createId}
						name={name}
						value="create"
						checked={localSelection?.kind === 'create'}
						onChange={handleChange}
						disabled={disabled}
					/>
					<label className="radio__label" htmlFor={createId}>{Locale.choice.create}</label>
				</div>
				<div className="radio">
					<input
						type="radio"
						className="radio__input"
						id={replaceId}
						name={name}
						value="replace"
						checked={localSelection?.kind === 'replace'}
						onChange={handleChange}
						disabled={disabled}
					/>
					<label className="radio__label" htmlFor={replaceId}>{Locale.choice.replace}</label>
				</div>
				{localSelection?.kind === 'replace' && (
					<div className="select">
						<select
							className="select__input"
							name={`${name}.target`}
							value={targetValue}
							onChange={handleTargetChange}
							disabled={disabled}
						>
							<option key={`select.${name}.option.placeholder`} value="" disabled hidden>{Locale.placeholder.replaceTarget}</option>
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
					</div>
				)}
			</div>
		</Field>
	);
};
