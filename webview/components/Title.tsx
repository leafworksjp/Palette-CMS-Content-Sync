import React from 'react';
import {Content, getCodeTypeName} from '../types/Content';
import {Definitions} from '../types/Definitions';

type TitleProps =
{
	content: Content,
	definitions: Definitions,
	fileName: string,
};

const dataNames = new Map([
	['contents', '設定ファイル'],
	['variables', '変数リスト'],
]);

export const Title = ({content, definitions, fileName}: TitleProps) =>
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
	const codeTypeName = getCodeTypeName(definitions, fileName);
	const dataName = dataNames.get(fileName);

	const title = (codeTypeName ?? dataName ?? '不明なファイル') + contentName;

	return (<h1 className="contents__title--head">{title}</h1>);
};
