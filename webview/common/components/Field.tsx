import {ReactNode} from 'react';

type Props = {
	label: ReactNode,
	requiredLabel?: string,
	children: ReactNode,
};

export function Field({label, requiredLabel, children}: Props)
{
	return (
		<dl className="field">
			<dt className="field__label">
				{label}
				{requiredLabel && <span className="field__required">{requiredLabel}</span>}
			</dt>
			<dd className="field__value">{children}</dd>
		</dl>
	);
}
