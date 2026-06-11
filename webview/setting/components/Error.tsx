import React from 'react';
import {Dispatcher} from '../models/Dispatcher';

export const Error = () =>
{
	const [errors, setErrors] = React.useState<string[]>([]);

	React.useEffect(() =>
	{
		Dispatcher.addListener('setErrors', data =>
		{
			setErrors(data.value);
		});
	}, []);

	return (
		<div>
			{
				errors.length
					? <ul className="error">
						{
							errors.map((error, index) =>
							{
								const key = `error.item.${index}`;
								return (<li key={key} className ="error__item">{error}</li>);
							})
						}
					</ul>
					: <div></div>
			}
		</div>
	);
};
