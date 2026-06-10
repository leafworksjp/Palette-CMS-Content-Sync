import React from 'react';
import {Dispatcher} from '../models/Dispatcher';
import {Content, zContentV1, zContentV2} from '../../common/types/Content';
import {Definitions, zDefinitionsV1, zDefinitionsV2} from '../../common/types/Definitions';
import {zVersion} from '../../common/types/Version';
import {Form} from './Form';
import {Welcome} from './Welcome';

export const App = () =>
{
	const [content, setContent] = React.useState<Content|undefined>();
	const [definitions, setDefinitions] = React.useState<Definitions|undefined>();
	const [fileName, setFileName] = React.useState<string>('');
	const [url, setUrl] = React.useState<string|undefined>();
	const [isReadOnly, setIsReadOnly] = React.useState<boolean>(false);
	const [supportsSheetRefValue, setSupportsSheetRefValue] = React.useState<boolean>(false);

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

						const zContent = versionResult.data === 1 ? zContentV1 : zContentV2;
						const zDefinitions = versionResult.data === 1 ? zDefinitionsV1 : zDefinitionsV2;

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
						setUrl(message.value.url);
						setIsReadOnly(Boolean(message.value.isReadOnly));
						setSupportsSheetRefValue(Boolean(message.value.supportsSheetRefValue));
					}
					break;

				default:
					break;
			}
		});

		Dispatcher.onLoad();
	}, []);

	return content && definitions && url
		? <Form isReadOnly={isReadOnly} supportsSheetRefValue={supportsSheetRefValue} content={content} definitions={definitions} fileName={fileName} url={url} />
		: <Welcome />;
};
