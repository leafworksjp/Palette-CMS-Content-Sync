import React from 'react';
import {Locale} from '../locales/ja';
import {Dispatcher} from '../models/Dispatcher';
import {Content, getColumnName, getColumns, TextProperties} from '../../common/types/Content';
import {Definitions} from '../../common//types/Definitions';

type TextProps =
{
	name: TextProperties,
	content: Content,
	definitions: Definitions,
	required?: boolean,
	placeholder?: string,
	readonly?: boolean,
};

export const Text = ({name, content, definitions, required, placeholder, readonly}: TextProps) =>
{
	const [value, setValue] = React.useState(content[name] ?? '');

	React.useEffect(() => setValue(content[name] ?? ''), [content[name]]);

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) =>
	{
		setValue(event.target.value);
		Dispatcher.updateValue(event.target.name, event.target.value);
	};

	const handleBlur = (event: React.ChangeEvent<HTMLInputElement>) => Dispatcher.onBlur(event.target.name, event.target.value);

	const title = getColumnName(definitions, name);
	const isColumnExists = getColumns(definitions, content)?.includes(name);

	if (!title || !isColumnExists) return <></>;

	return (
		<dl>
			<dt>
				{title}
				{required ? <span>{Locale.required}</span> : ''}
			</dt>
			<dd>
				<input
					type="text"
					key={`text.${name}`}
					name={name}
					value={value}
					placeholder={placeholder ?? ''}
					onChange={handleChange}
					onBlur={handleBlur}
					readOnly={readonly ?? false}
				/>
			</dd>
		</dl>
	);
};
