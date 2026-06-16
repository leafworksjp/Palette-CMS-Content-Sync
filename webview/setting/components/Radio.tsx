import React from 'react';
import {Locale} from '../locales/ja';
import {Dispatcher} from '../models/Dispatcher';
import {Content, RadioProperties, getOptions, getColumns, getColumnName} from '../../../common/types/Content';
import {Definitions} from '../../../common/types/Definitions';
import {Field} from '../../common/components/Field';

type RadioProps =
{
	name: RadioProperties,
	content: Content,
	definitions: Definitions,
	required?: boolean,
	readOnly?: boolean,
};

export const Radio = ({name, content, definitions, required, readOnly}: RadioProps) =>
{
	const [value, setValue] = React.useState(String(content[name] ?? ''));

	React.useEffect(() => setValue(String(content[name] ?? '')), [content[name]]);

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) =>
	{
		setValue(event.target.value);
		Dispatcher.updateValue(event.target.name, event.target.value);
	};

	const title = getColumnName(definitions, name);
	const options = getOptions(definitions, content, name);
	const isColumnExists = getColumns(definitions, content)?.includes(name);

	if (!title || !options || !isColumnExists) return <></>;

	return (
		<Field label={title} requiredLabel={required ? Locale.required : undefined}>
			<div className="flex">
				{
					options.map(({name: optionName, key: optionValue}, index) =>
					{
						const checked = (value === String(optionValue));

						const divKey = `div.radio.${name}.${index}`;
						const radioKey = `radio.${name}.${index}`;
						const labelKey = `radio.${name}.label.${index}`;

						return (
							<div className="radio" key={divKey}>
								<input
									type="radio"
									className="radio__input"
									id={radioKey}
									key={radioKey}
									name={name}
									value={String(optionValue)}
									checked={checked}
									onChange={handleChange}
									readOnly={readOnly ?? false}
								/>
								<label className="radio__label" key={labelKey} htmlFor={radioKey}>{optionName}</label>
							</div>
						);
					})
				}
			</div>
		</Field>
	);
};
