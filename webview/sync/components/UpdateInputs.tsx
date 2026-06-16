import {Locale} from '../locales/ja';
import {SyncDiff} from '../../../common/types/SyncPlan';
import {Field} from '../../common/components/Field';

type Props = {
	items: SyncDiff[],
};

export const UpdateInputs = ({items}: Props) =>
{
	if (items.length === 0) return null;

	return (
		<>
			{items.map((d, index) =>
			{
				if (d.kind !== 'matched') return null;
				const key = `update.${index}`;
				const name = `update.${index}`;
				const updateId = `radio.${name}.update`;
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
