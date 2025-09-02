import React from 'react';
import {Locale} from '../locales/ja';
import {Dispatcher} from '../models/Dispatcher';
import {Content, RadioProperties, getOptions, getColumns, getColumnName} from '../../common/types/Content';
import {Definitions} from '../../common//types/Definitions';

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
		<dl>
			<dt>
				{title}
				{required ? <span>{Locale.required}</span> : ''}
			</dt>
			<dd className="flex">
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
									id={radioKey}
									key={radioKey}
									name={name}
									value={String(optionValue)}
									checked={checked}
									onChange={handleChange}
									readOnly={readOnly ?? false}
								/>
								<label key={labelKey} htmlFor={radioKey}>{optionName}</label>
							</div>
						);
					})
				}
			</dd>
		</dl>
	);
};
