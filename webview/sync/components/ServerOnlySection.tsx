import React from 'react';
import {Dispatcher} from '../models/Dispatcher';
import {SyncDiff, SyncSelection} from '../../../common/types/SyncPlan';
import {ContentV2} from '../../../common/types/Content';

type Props = {
	items: SyncDiff[],
	selections: Record<string, SyncSelection>,
	executing: boolean,
};

export const ServerOnlySection = ({items, selections, executing}: Props) =>
{
	if (items.length === 0) return null;

	return (
		<div>
			<h3>サーバーのみ ({items.length})</h3>
			<ul>
				{items.map((d, index) =>
				{
					if (d.kind !== 'serverOnly') return null;
					const selection = selections[d.server.page_id];
					const key = `li.server-only.${index}`;
					return <ServerOnlyItem key={key} index={index} content={d.server} selection={selection} disabled={executing} />;
				})}
			</ul>
		</div>
	);
};

const ServerOnlyItem = ({index, content, selection, disabled}: {
	index: number,
	content: ContentV2,
	selection: SyncSelection | undefined,
	disabled: boolean,
}) =>
{
	const [kind, setKind] = React.useState(selection?.kind ?? 'delete');

	React.useEffect(() => setKind(selection?.kind ?? 'delete'), [selection]);

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) =>
	{
		const v = event.target.value;
		if (v !== 'delete' && v !== 'downloadLocal') return;
		setKind(v);
		Dispatcher.updateSelection(content.page_id, {kind: v});
	};

	const name = `server-only.${index}`;
	return (
		<li>
			{content.page_id}:
			<label>
				<input
					type="radio"
					name={name}
					value="delete"
					checked={kind === 'delete'}
					onChange={handleChange}
					disabled={disabled}
				/>
				削除
			</label>
			<label>
				<input
					type="radio"
					name={name}
					value="downloadLocal"
					checked={kind === 'downloadLocal'}
					onChange={handleChange}
					disabled={disabled}
				/>
				取得
			</label>
		</li>
	);
};
