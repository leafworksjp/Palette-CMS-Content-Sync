import React from 'react';
import {Dispatcher} from '../models/Dispatcher';
import {Content, ContentContext} from '../../common/types/Content';
import {Definitions, DefinitionsContext} from '../../common/types/Definitions';
import {zVersion} from '../../common/types/Version';
import {Form} from './Form';
import {Welcome} from './Welcome';

export const App = () =>
{
	const [content, setContent] = React.useState<Content|undefined>();
	const [definitions, setDefinitions] = React.useState<Definitions|undefined>();
	const [fileName, setFileName] = React.useState<string>('');
	const [url, setUrl] = React.useState<string|undefined>();
	const [contentContext, setContentContext] = React.useState<ContentContext|undefined>();

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

						const viewContentContext = ContentContext.init(versionResult.data);
						const viewDefinitionsContext = DefinitionsContext.init(versionResult.data);

						const contentResult = viewContentContext.safeParse(message.value.content);
						const definitionsResult = viewDefinitionsContext.safeParse(message.value.definitions);

						setContentContext(viewContentContext);

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

	return content && definitions && contentContext && url
		? <Form contentContext={contentContext} content={content} definitions={definitions} fileName={fileName} url={url} />
		: <Welcome />;
};
