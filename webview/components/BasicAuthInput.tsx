import React from 'react';
import {Locale} from '../locales/ja';
import {Dispatcher} from '../models/Dispatcher';
import {Content, getColumns} from '../../common/types/Content';
import {Definitions} from '../../common//types/Definitions';

type BasicAuthInputProps =
{
	content: Content,
	definitions: Definitions,
};

export const BasicAuthInput = ({content, definitions}: BasicAuthInputProps) =>
{
	const {columns} = definitions;
	const [authKey, setAuthKey] = React.useState(content.auth_key);
	const [authPass, setAuthPass] = React.useState(content.auth_pass);

	React.useEffect(() => setAuthKey(content.auth_key), [content.auth_key]);
	React.useEffect(() => setAuthPass(content.auth_pass), [content.auth_pass]);

	const handleChangeAuthKey = (event: React.ChangeEvent<HTMLInputElement>) =>
	{
		setAuthKey(event.target.value);
		Dispatcher.updateValue('auth_key', event.target.value);
	};
	const handleChangeAuthPass = (event: React.ChangeEvent<HTMLInputElement>) =>
	{
		setAuthPass(event.target.value);
		Dispatcher.updateValue('auth_pass', event.target.value);
	};

	const columnExists = (column: string) => getColumns(definitions, content)?.includes(column);

	if (!columnExists('auth_key') || !columnExists('auth_pass')) return <></>;

	return (
		<dl>
			<dt>{Locale.basicAuthentication}</dt>
			<dd className="basic">
				<input
					type="text"
					key="text.auth_key"
					name="auth_key"
					value={authKey}
					onChange={handleChangeAuthKey}
					placeholder="USER"
				/>
				<input
					type="password"
					key="text.auth_pass"
					name="auth_pass"
					value={authPass}
					onChange={handleChangeAuthPass}
					placeholder="PASS"
				/>
			</dd>
		</dl>
	);
};
