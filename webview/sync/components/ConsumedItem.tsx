import {Locale} from '../locales/ja';
import {Field} from '../../common/components/Field';

type Props = {
	targetPageId: string,
	sources: string[],
};

export const ConsumedItem = ({targetPageId, sources}: Props) =>
{
	const label = sources.length === 1 ? Locale.consumedByReplace : Locale.conflictByReplace;
	return (
		<Field label={targetPageId}>
			<p className="consumed-item">← {sources.join(', ')} {label}</p>
		</Field>
	);
};
