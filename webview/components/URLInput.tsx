import React from 'react';
import {Locale} from '../locales/ja';
import {Content} from '../../common/types/Content';

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
			<dl>
				<dt>URL</dt>
				<dd>
					<input type="text" key="text.url" value={pageUrl} readOnly={true} />
				</dd>
			</dl>
			<dl>
				<dt></dt>
				<dd>
					<div className="link">
						<a href={pageUrl}>{Locale.openInBrowser}</a>
					</div>
				</dd>
			</dl>
		</>
	);
};
