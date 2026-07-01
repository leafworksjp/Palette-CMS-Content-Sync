import React from 'react';
import {Locale} from '../locales/ja';
import {Dispatcher} from '../models/Dispatcher';
import {Content, SelectProperties, getOptions, getColumns, getColumnName} from '../../../common/types/Content';
import {Definitions} from '../../../common/types/Definitions';
import {Field} from '../../common/components/Field';

type SelectProps =
{
	name: SelectProperties,
	content: Content,
	definitions: Definitions,
	required?: boolean,
	readOnly?: boolean,
	always?: boolean,
};

export const Select = ({name, content, definitions, required, readOnly, always}: SelectProps) =>
{
	const [value, setValue] = React.useState(content[name] ?? '');

	React.useEffect(() => setValue(content[name] ?? ''), [content[name]]);

	const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) =>
	{
		setValue(event.target.value);
		Dispatcher.updateValue(event.target.name, event.target.value);
	};

	const title = getColumnName(definitions, name);
	const options = getOptions(definitions, content, name);
	const isColumnExists = getColumns(definitions, content)?.includes(name);

	if (!title || !options || (!always && !isColumnExists)) return <></>;

	return (
		<Field label={title} requiredLabel={required ? Locale.required : undefined}>
			<div className="select">
				<select
					className="select__input"
					key={`select_${name}`}
					name={name}
					value={value}
					onChange={handleChange}
				>
					<option key={`select.${name}.option.default`} hidden={true}>{Locale.pleaseSelect}</option>
					{
						options.map(({name: optionName, key: optionValue}, index) =>
						{
							const key = `select.${name}.option.${index}`;
							return (
								<option
									key={key}
									value={optionValue}
									hidden={readOnly && value !== optionValue}>
									{optionName}
								</option>
							);
						})
					}
				</select>
			</div>
		</Field>
	);
};
