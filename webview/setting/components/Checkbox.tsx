import React from 'react';
import {Locale} from '../locales/ja';
import {Dispatcher} from '../models/Dispatcher';
import {Content, CheckBoxProperties, getOptions, getColumns, getColumnName} from '../../../common/types/Content';
import {Definitions} from '../../../common/types/Definitions';
import {Field} from '../../common/components/Field';

type CheckboxProps =
{
	name: CheckBoxProperties,
	content: Content,
	definitions: Definitions,
	required: boolean,
};


export const Checkbox = ({name, content, definitions, required}: CheckboxProps) =>
{
	const [values, setValue] = React.useState(content[name] ?? []);

	React.useEffect(() => setValue(content[name] ?? []), [content[name]]);

	const isHTMLInputElement = (e: HTMLElement): e is HTMLInputElement => e instanceof HTMLInputElement;

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) =>
	{
		const newValues = [...document.getElementsByName(event.target.name)]
		.filter(isHTMLInputElement)
		.filter(e => e.checked)
		.map(e => e.value);

		setValue(newValues);
		Dispatcher.updateValue(event.currentTarget.name, newValues);
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
						const checked = values && values.includes(String(optionValue));

						const divKey = `div.check.${name}.${index}`;
						const checkKey = `check.${name}.${index}`;
						const labelKey = `check.${name}.label.${index}`;

						return (
							<div className="checkbox checkbox--inline" key={divKey}>
								<input
									type="checkbox"
									className="checkbox__input"
									id={checkKey}
									key={checkKey}
									name={name}
									value={optionValue}
									checked={checked}
									onChange={handleChange}
								/>
								<label className="checkbox__label" key={labelKey} htmlFor={checkKey}>{optionName}</label>
							</div>
						);
					})
				}
			</div>
		</Field>
	);
};
