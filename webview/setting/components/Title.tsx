import React from 'react';
import {Content} from '../../../common/types/Content';

type TitleProps =
{
	content: Content,
	knownTitle: string,
};

export const Title = ({content, knownTitle}: TitleProps) =>
{
	const [name, setName] = React.useState(content.name);

	React.useEffect(() => setName(content.name), [content.name]);

	React.useEffect(() =>
	{
		window.addEventListener('message', event =>
		{
			if (event.data.command !== 'setName') return;

			setName(event.data.value);
		});
	}, []);

	const contentName = name ? '｜' + name : '';
	const title = knownTitle + contentName;

	return (<h1 className="setting-form__title">{title}</h1>);
};
