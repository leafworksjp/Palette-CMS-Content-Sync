import React from 'react';
import {SyncDiff} from '../../../common/types/SyncPlan';

type Props = {
	items: SyncDiff[],
};

export const UpdateSection = ({items}: Props) =>
{
	if (items.length === 0) return null;

	return (
		<div>
			<h3>更新候補 ({items.length})</h3>
			<ul>
				{items.map((d, index) =>
				{
					if (d.kind !== 'update') return null;
					const liKey = `li.update.${index}`;
					return <li key={liKey}>{d.local.page_id} (確認のみ)</li>;
				})}
			</ul>
		</div>
	);
};
