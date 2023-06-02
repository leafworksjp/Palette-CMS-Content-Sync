import React from 'react';
import {Dispatcher} from '../models/Dispatcher';
import {Content, zContent} from '../types/Content';
import {Definitions, zDefinitions} from '../types/Definitions';
import {Form} from './Form';
import {Welcome} from './Welcome';

export const App = () =>
{
	const [content, setContent] = React.useState<Content|undefined>();
	const [definitions, setDefinitions] = React.useState<Definitions|undefined>();
	const [fileName, setFileName] = React.useState<string>('');

	React.useEffect(() =>
	{
		window.addEventListener('message', event =>
		{
			const message = event.data;

			switch (message.command)
			{
				case 'refresh':
					{
						const contentResult = zContent.safeParse(message.value.content);
						const definitionsResult = zDefinitions.safeParse(message.value.definitions);

						if (contentResult.success)
						{
							setContent(contentResult.data);
						}
						if (definitionsResult.success)
						{
							setDefinitions(definitionsResult.data);
						}
						setFileName(message.value.fileName);
					}
					break;

				default:
					break;
			}
		});

		Dispatcher.onLoad();
	}, []);

	return content && definitions
		? <Form content={content} definitions={definitions} fileName={fileName}/>
		: <Welcome />;
};
