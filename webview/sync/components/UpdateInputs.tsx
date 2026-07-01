import {Locale} from '../locales/ja';
import {SyncDiff, SyncSelection, getConsumedTargets} from '../../../common/types/SyncPlan';
import {Field} from '../../common/components/Field';
import {ConsumedItem} from './ConsumedItem';

type Props = {
	items: SyncDiff[],
	selections: Record<string, SyncSelection>,
};

export const UpdateInputs = ({items, selections}: Props) =>
{
	if (items.length === 0) return null;

	const consumed = getConsumedTargets(selections);

	return (
		<>
			{items.map((d, index) =>
			{
				if (d.kind !== 'matched') return null;
				const key = `update.${index}`;
				const name = `update.${index}`;
				const updateId = `radio.${name}.update`;
				const consumedSources = consumed.get(d.local.page_id);

				if (consumedSources && consumedSources.length > 0)
				{
					return <ConsumedItem key={key} targetPageId={d.local.page_id} sources={consumedSources} />;
				}

				return (
					<Field key={key} label={d.local.page_id}>
						<div className="flex">
							<div className="radio">
								<input
									type="radio"
									className="radio__input"
									id={updateId}
									name={name}
									value="update"
									defaultChecked
									readOnly
								/>
								<label className="radio__label" htmlFor={updateId}>{Locale.choice.update}</label>
							</div>
						</div>
					</Field>
				);
			})}
		</>
	);
};
