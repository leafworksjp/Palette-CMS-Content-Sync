import React from 'react';
import {Dispatcher} from '../models/Dispatcher';
import {Content, SearchQueryForWhere, getColumns, getColumnName, getSearchQueryOptions} from '../../common/types/Content';
import {Definitions} from '../../common//types/Definitions';

type SearchInputsProps =
{
	content: Content,
	definitions: Definitions,
};

const name = 'search_query_where';

export const SearchInputs = ({content, definitions}: SearchInputsProps) =>
{
	const [queries, setQueries] = React.useState(content.search_query_where);

	React.useEffect(() => setQueries(content.search_query_where), [content.search_query_where]);

	React.useEffect(() =>
	{
		window.addEventListener('message', event =>
		{
			if (event.data.command !== 'setSearchQueries') return;

			setQueries(event.data.value);
		});
	}, []);

	const title = getColumnName(definitions, name);
	const isColumnExists = getColumns(definitions, content)?.includes(name);

	if (!title || !isColumnExists) return <></>;

	return (
		<dl>
			<dt>{title}</dt>
			<dd>
				{
					queries?.map((query, index) =>
					{
						const key = `search_input.${index}`;
						return <SearchInput key={key} index={index} query={query} content={content} definitions={definitions} />;
					})
				}
			</dd>
		</dl>);
};

const SearchInput = ({index, query, definitions, content}: {
	index: number,
	query: SearchQueryForWhere,
	content: Content,
	definitions: Definitions,
}) => (
	<div className="setting" key={`search_query_where.${index}`}>
		<SelectCol index={index} query={query} content={content} definitions={definitions}/>
		<SelectOperator index={index} query={query} definitions={definitions}/>
		<TextVal index={index} query={query}/>
		<div className="btn">
			<div className="btn__add" onClick={() => Dispatcher.addSearchQuery(index)}>＋</div>
			<div className="btn__subtract" onClick={() => Dispatcher.deleteSearchQuery(index)}>ー</div>
		</div>
	</div>
);

const SelectCol = ({index, query, content, definitions}: {
	index:number,
	query: SearchQueryForWhere,
	content: Content,
	definitions: Definitions,
}) =>
{
	const [col, setCol] = React.useState(query.col);

	React.useEffect(() => setCol(query.col), [query.col]);

	const handleChangeCol = (event: React.ChangeEvent<HTMLSelectElement>) =>
	{
		setCol(event.target.value);
		updateValue();
	};

	const options = getSearchQueryOptions(definitions, content, 'where');

	if (!options) return <></>;

	return (
		<select
			key={`search_query_where.col.${index}`}
			name="search_query_where.col"
			value={col}
			onChange={handleChangeCol}
		>
			<option key={`search_query_where.operator.${index}.option.empty}`}/>
			{
				options.map(({key: optionValue, name: optionName}, j) =>
				{
					const key = `search_query_where.operator.${index}.option.${j}`;
					return <option key={key} value={optionValue}>{optionName}</option>;
				})
			}
		</select>
	);
};

const SelectOperator = ({index, query, definitions}: {
	index:number,
	query: SearchQueryForWhere,
	definitions: Definitions,
}) =>
{
	const {column_options} = definitions;
	const [operator, setOperator] = React.useState(query.operator);

	React.useEffect(() => setOperator(query.operator), [query.operator]);

	const handleChangeOperator = (event: React.ChangeEvent<HTMLSelectElement>) =>
	{
		setOperator(event.target.value);
		updateValue();
	};

	const operators = column_options.search_query_where;

	return (
		<select
			key={`search_query_where.operator.${index}`}
			name="search_query_where.operator"
			value={operator}
			onChange={handleChangeOperator}
		>
			{
				operators.map(({key: optionValue, name: optionName}, j) =>
				{
					const key = `search_query_where.operator.${index}.option.${j}`;
					return <option key={key} value={optionValue}>{optionName}</option>;
				})
			}
		</select>
	);
};

const TextVal = ({index, query}: {
	index:number,
	query: SearchQueryForWhere,
}) =>
{
	const [val, setVal] = React.useState(query.val);

	React.useEffect(() => setVal(query.val), [query]);

	const handleChangeVal = (event: React.ChangeEvent<HTMLInputElement>) =>
	{
		setVal(event.target.value);
		updateValue();
	};

	return (
		<input
			type="text"
			key={`search_query_where.val.${index}`}
			name="search_query_where.val"
			value={val}
			onChange={handleChangeVal}
		/>
	);
};

const isHTMLInputElement = (e: HTMLElement): e is HTMLInputElement => e instanceof HTMLInputElement;
const isHTMLSelectElement = (e: HTMLElement): e is HTMLSelectElement => e instanceof HTMLSelectElement;

const updateValue = () =>
{
	const cols = [...document.getElementsByName('search_query_where.col')]
	.filter(isHTMLSelectElement)
	.map(e => e.value);

	const operators = [...document.getElementsByName('search_query_where.operator')]
	.filter(isHTMLSelectElement)
	.map(e => e.value);

	const vals = [...document.getElementsByName('search_query_where.val')]
	.filter(isHTMLInputElement)
	.map(e => e.value);

	const values = cols.map((col, i) => ({
		col,
		operator: operators[i],
		val: vals[i],
	}));

	Dispatcher.updateValue('search_query_where', values);
};
