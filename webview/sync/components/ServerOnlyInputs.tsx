import React from 'react';
import {Dispatcher} from '../models/Dispatcher';
import {Locale} from '../locales/ja';
import {SyncDiff, SyncSelection} from '../../../common/types/SyncPlan';
import {ContentV2} from '../../../common/types/Content';
import {Field} from '../../common/components/Field';

type Props = {
	items: SyncDiff[],
	selections: Record<string, SyncSelection>,
	executing: boolean,
};

export const ServerOnlyInputs = ({items, selections, executing}: Props) =>
{
	if (items.length === 0) return null;

	return (
		<>
			{items.map((d, index) =>
			{
				if (d.kind !== 'serverOnly') return null;
				const selection = selections[d.server.page_id];
				const key = `server-only.${index}`;
				return <ServerOnlyItem key={key} index={index} content={d.server} selection={selection} disabled={executing} />;
			})}
		</>
	);
};

const ServerOnlyItem = ({index, content, selection, disabled}: {
	index: number,
	content: ContentV2,
	selection: SyncSelection | undefined,
	disabled: boolean,
}) =>
{
	const [kind, setKind] = React.useState(selection?.kind);

	React.useEffect(() => setKind(selection?.kind), [selection]);

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) =>
	{
		const v = event.target.value;
		if (v !== 'delete' && v !== 'downloadLocal') return;
		setKind(v);
		Dispatcher.updateSelection(content.page_id, {kind: v});
	};

	const name = `server-only.${index}`;
	const deleteId = `radio.${name}.delete`;
	const downloadId = `radio.${name}.downloadLocal`;
	return (
		<Field label={content.page_id}>
			<div className="flex">
				<div className="radio">
					<input
						type="radio"
						className="radio__input"
						id={deleteId}
						name={name}
						value="delete"
						checked={kind === 'delete'}
						onChange={handleChange}
						disabled={disabled}
					/>
					<label className="radio__label" htmlFor={deleteId}>{Locale.choice.delete}</label>
				</div>
				<div className="radio">
					<input
						type="radio"
						className="radio__input"
						id={downloadId}
						name={name}
						value="downloadLocal"
						checked={kind === 'downloadLocal'}
						onChange={handleChange}
						disabled={disabled}
					/>
					<label className="radio__label" htmlFor={downloadId}>{Locale.choice.downloadLocal}</label>
				</div>
			</div>
		</Field>
	);
};
