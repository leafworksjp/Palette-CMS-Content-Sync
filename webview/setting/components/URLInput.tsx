import React from 'react';
import {Locale} from '../locales/ja';
import {Content} from '../../../common/types/Content';
import {Field} from '../../common/components/Field';

type URLInputProps =
{
	content: Content,
	url: string,
};

export const URLInput = ({content, url}: URLInputProps) =>
{
	const [pageId, setPageId] = React.useState(content.page_id);

	React.useEffect(() => setPageId(content.page_id), [content.page_id]);

	React.useEffect(() =>
	{
		window.addEventListener('message', event =>
		{
			if (event.data.command !== 'setPageId') return;

			setPageId(event.data.value);
		});
	}, []);

	const pageUrl = `${url}contents.php?c=${pageId}`;

	return (
		<>
			<Field label="URL">
				<div className="text">
					<input type="text" className="text__input" key="text.url" value={pageUrl} readOnly={true} />
				</div>
			</Field>
			<Field label="">
				<div className="link">
					<a href={pageUrl}>{Locale.openInBrowser}</a>
				</div>
			</Field>
		</>
	);
};
