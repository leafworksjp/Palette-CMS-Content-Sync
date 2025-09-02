import React from 'react';
import {Dispatcher} from '../models/Dispatcher';
import {Content, SearchQueryForOrder, getColumns, getColumnName, getSearchQueryOptions} from '../../common/types/Content';
import {Definitions} from '../../common//types/Definitions';

type OrderInputsProps =
{
	content: Content,
	definitions: Definitions,
};

const name = 'search_query_order';

export const OrderInputs = ({content, definitions}: OrderInputsProps) =>
{
	const [queries, setQueries] = React.useState(content.search_query_order);

	React.useEffect(() => setQueries(content.search_query_order), [content.search_query_order]);

	React.useEffect(() =>
	{
		window.addEventListener('message', event =>
		{
			if (event.data.command !== 'setOrderQueries') return;

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
					queries?.map((query, i) =>
					{
						const key = `order_input.${i}`;
						return <OrderInput key={key} index={i} query={query} content={content} definitions={definitions} />;
					})
				}
			</dd>
		</dl>);
};

const OrderInput = ({index, query, content, definitions}: {
	index: number,
	query: SearchQueryForOrder,
	content: Content,
	definitions: Definitions,
}) => (
	<div className="setting" key={`search_query_order.${index}`}>
		<SelectCol index={index} query={query} content={content} definitions={definitions}/>
		<SelectOperator index={index} query={query} definitions={definitions}/>
		<div className="btn">
			<div className="btn__add" onClick={() => Dispatcher.addOrderQuery(index)}>＋</div>
			<div className="btn__subtract" onClick={() => Dispatcher.deleteOrderQuery(index)}>ー</div>
		</div>
	</div>
);

const SelectCol = ({index, query, content, definitions}: {
	index:number,
	query: SearchQueryForOrder,
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

	const options = getSearchQueryOptions(definitions, content, 'order');

	if (!options) return <></>;

	return (
		<select
			key={`search_query_order.col.${index}`}
			name="search_query_order.col"
			value={col}
			onChange={handleChangeCol}
		>
			<option key={`search_query_order.operator.${index}.option.empty}`}/>
			{
				options.map(({key: optionValue, name: optionName}, j) =>
				{
					const key = `search_query_order.operator.${index}.option.${j}`;
					return <option key={key} value={optionValue}>{optionName}</option>;
				})
			}
		</select>
	);
};

const SelectOperator = ({index, query, definitions}: {
	index:number,
	query: SearchQueryForOrder,
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

	const operators = column_options.search_query_order;

	return (
		<select
			key={`search_query_order.operator.${index}`}
			name="search_query_order.operator"
			value={operator}
			onChange={handleChangeOperator}
		>
			{
				operators.map(({key: optionValue, name: optionName}, j) =>
				{
					const key = `search_query_order.operator.${index}.option.${j}`;
					return <option key={key} value={optionValue}>{optionName}</option>;
				})
			}
		</select>
	);
};

const isHTMLSelectElement = (e: HTMLElement): e is HTMLSelectElement => e instanceof HTMLSelectElement;

const updateValue = () =>
{
	const cols = [...document.getElementsByName('search_query_order.col')]
	.filter(isHTMLSelectElement)
	.map(e => e.value);

	const operators = [...document.getElementsByName('search_query_order.operator')]
	.filter(isHTMLSelectElement)
	.map(e => e.value);

	const values = cols.map((col, i) => ({
		col,
		operator: operators[i],
	}));

	Dispatcher.updateValue('search_query_order', values);
};
