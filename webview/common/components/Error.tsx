import React from 'react';

export const Error = () =>
{
	const [errors, setErrors] = React.useState<string[]>([]);

	React.useEffect(() =>
	{
		window.addEventListener('message', event =>
		{
			if (event.data.command !== 'setErrors') return;
			setErrors(event.data.value);
		});
	}, []);

	if (errors.length === 0) return null;

	return (
		<ul className="error">
			{errors.map((error, index) =>
			{
				const key = `error.item.${index}`;
				return <li key={key} className="error__item">{error}</li>;
			})}
		</ul>
	);
};
