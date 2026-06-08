import React from 'react';
import {Dispatcher} from '../models/Dispatcher';
import {Content, ContentStrategy} from '../../common/types/Content';
import {Definitions, DefinitionsStrategy} from '../../common/types/Definitions';
import {zVersion} from '../../common/types/Version';
import {Form} from './Form';
import {Welcome} from './Welcome';

export const App = () =>
{
	const [content, setContent] = React.useState<Content|undefined>();
	const [definitions, setDefinitions] = React.useState<Definitions|undefined>();
	const [fileName, setFileName] = React.useState<string>('');
	const [url, setUrl] = React.useState<string|undefined>();
	const [contentStrategy, setContentStrategy] = React.useState<ContentStrategy|undefined>();

	React.useEffect(() =>
	{
		window.addEventListener('message', event =>
		{
			const message = event.data;
			switch (message.command)
			{
				case 'refresh':
					{
						const versionResult = zVersion.safeParse(message.value.version);
						if (!versionResult.success) break;

						const viewContentStrategy = ContentStrategy.init(versionResult.data);
						const viewDefinitionsStrategy = DefinitionsStrategy.init(versionResult.data);

						const contentResult = viewContentStrategy.safeParse(message.value.content);
						const definitionsResult = viewDefinitionsStrategy.safeParse(message.value.definitions);

						setContentStrategy(viewContentStrategy);

						if (contentResult.success)
						{
							setContent(contentResult.data);
						}
						if (definitionsResult.success)
						{
							setDefinitions(definitionsResult.data);
						}

						setFileName(message.value.fileName);
						setUrl(message.value.url);
					}
					break;

				default:
					break;
			}
		});

		Dispatcher.onLoad();
	}, []);

	return content && definitions && contentStrategy && url
		? <Form contentStrategy={contentStrategy} content={content} definitions={definitions} fileName={fileName} url={url} />
		: <Welcome />;
};
