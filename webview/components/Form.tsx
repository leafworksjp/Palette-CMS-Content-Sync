import React from 'react';
import {Locale} from '../locales/ja';
import {Title} from './Title';
import {Error} from './Error';
import {URLInput} from './URLInput';
import {Text} from './Text';
import {Select} from './Select';
import {Check} from './Check';
import {Radio} from './Radio';
import {BasicAuthInput} from './BasicAuthInput';
import {SearchInputs} from './SearchInputs';
import {OrderInputs} from './OrderInputs';
import {Content} from '../../common/types/Content';
import {Definitions} from '../../common//types/Definitions';
import {getColumns} from '../../common//types/Content';

type FormProps =
{
	definitions: Definitions,
	content: Content,
	fileName: string,
};

/*eslint-disable complexity*/
export const Form = ({content, definitions, fileName}: FormProps) =>
{
	if (!content) return <></>;

	const [permission, setPermission] = React.useState(content.permission);
	const [roleKey, setRoleKey] = React.useState(content.role_key);
	const [searchQueryOrderState, setSearchQueryOrderState] = React.useState(content.search_query_order_state);

	React.useEffect(() => setPermission(content.permission), [content.permission]);
	React.useEffect(() => setRoleKey(content.role_key), [content.role_key]);
	React.useEffect(() => setSearchQueryOrderState(content.search_query_order_state), [content.search_query_order_state]);

	React.useEffect(() =>
	{
		window.addEventListener('message', event =>
		{
			switch (event.data.command)
			{
				case 'setPermission':
					setPermission(event.data.value);
					break;

				case 'setRoleKey':
					setRoleKey(event.data.value);
					break;

				case 'setSearchQueryOrderState':
					setSearchQueryOrderState(event.data.value);
					break;

				default:
					break;
			}
		});
	}, []);

	const someColumnExists = (names: Array<string>) => names.some(name => getColumns(definitions, content)?.includes(name) ?? false);

	const isReadOnly = Boolean(content.id);
	const isSheetContent = definitions.columns[content.contents_type]?.at(0)?.options.includes('sheet_id');

	return (
		<div className="contents">
			<div className="contents__inner">
				<Title content={content} definitions={definitions} fileName={fileName} />
			</div>
			<Error />
			{
				someColumnExists(['id'])
				&& content.contents_type !== 'parts'
				&& <div className="contents__inner">
					<h2 className="contents__title">{Locale.title.contentInfo}</h2>
					{
						content.id && <Text name="id" readonly={true} content={content} definitions={definitions} />
					}
					{
						content.contents_type !== 'parts'
						&& <URLInput content={content} definitions={definitions} />
					}
				</div>
			}
			<div className="contents__inner">
				<h2 className="contents__title">{Locale.title.contentSettings}</h2>
				<Text name="page_id" content={content} definitions={definitions} />
				<Text name="static_url" placeholder="/path/to/content/" content={content} definitions={definitions} />
				<Text name="category" content={content} definitions={definitions} />
				<Text name="name" required={true} content={content} definitions={definitions} />
				<Select name="contents_type" required={true} always={true} readOnly={isReadOnly} content={content} definitions={definitions} />
				<Radio name="use_template_engine" required={true} readOnly={isReadOnly} content={content} definitions={definitions} />
				<Select name="sheet_id" required={true} always={isSheetContent} readOnly={isReadOnly} content={content} definitions={definitions} />
				<Select name="http_header_content_type" required={true} content={content} definitions={definitions} />
			</div>
			{
				someColumnExists(['role_key'])
				&& <div className="contents__inner">
					<h2 className="contents__title">{Locale.title.roleSettings}</h2>
					<Radio name="role_key" required={true} content={content} definitions={definitions} />
					{
						someColumnExists(['role_key_owner'])
						&& ['my', 'other'].includes(roleKey ?? '')
						&& <Radio name="role_key_owner" required={true} content={content} definitions={definitions} />
					}
				</div>
			}
			{
				someColumnExists(['login_url', 'logout_url', 'search_row', 'permission', 'permission_url', 'device_type', 'device_type_url', 'auth_key', 'auth_pass', 'state'])
				&& <div className="contents__inner">
					<h2 className="contents__title">{Locale.title.viewSettings}</h2>
					<Text name="login_url" required={true} placeholder="/path/to/content/" content={content} definitions={definitions} />
					<Text name="logout_url" required={true} placeholder="/path/to/content/" content={content} definitions={definitions} />
					<Text name="search_row" required={true} content={content} definitions={definitions} />
					<Check name="permission" required={true} content={content} definitions={definitions} />
					{
						someColumnExists(['permission_sheet'])
						&& permission?.includes('user')
						&& <Check name="permission_sheet" required={true} content={content} definitions={definitions} />
					}
					{
						someColumnExists(['manager_permission_sheet'])
						&& permission?.includes('manager')
						&& <Check name="manager_permission_sheet" required={true} content={content} definitions={definitions} />
					}
					<Text name="permission_url" placeholder="/path/to/content/" content={content} definitions={definitions} />
					<Check name="device_type" required={true} content={content} definitions={definitions} />
					<Text name="device_type_url" placeholder="/path/to/content/" content={content} definitions={definitions} />
					<BasicAuthInput content={content} definitions={definitions} />
					<Radio name="state" required={true} content={content} definitions={definitions} />
				</div>
			}
			{
				someColumnExists(['search_query_where', 'search_query_order_state', 'search_query_order'])
				&& <div className="contents__inner">
					<h2 className="contents__title">{Locale.title.searchQuery}</h2>
					<SearchInputs content={content} definitions={definitions} />
					<Radio name="search_query_order_state" content={content} definitions={definitions} />
					{
						(!searchQueryOrderState || searchQueryOrderState === 'col')
						&& <OrderInputs content={content} definitions={definitions} />
					}
					{
						(searchQueryOrderState === 'rand')
						&& <Select name="search_query_order_rand" content={content} definitions={definitions} />

					}
				</div>
			}
		</div>
	);
};
/*eslint-enable complexity*/
