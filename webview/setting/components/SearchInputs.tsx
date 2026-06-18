import React from 'react';
import {Locale} from '../locales/ja';
import {Dispatcher} from '../models/Dispatcher';
import {Content, SearchQueryForWhere, getColumns, getColumnName, getSearchQueryOptions} from '../../../common/types/Content';
import {Definitions} from '../../../common/types/Definitions';
import {Field} from '../../common/components/Field';

type SearchInputsProps =
{
	supportsSheetRefValue: boolean,
	content: Content,
	definitions: Definitions,
};

const name = 'search_query_where';

export const SearchInputs = ({supportsSheetRefValue, content, definitions}: SearchInputsProps) =>
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
		<Field label={title}>
			{
				queries?.map((query, index) =>
				{
					const key = `search_input.${index}`;
					return <SearchInput key={key} index={index} query={query} supportsSheetRefValue={supportsSheetRefValue} content={content} definitions={definitions} />;
				})
			}
		</Field>
	);
};

const SearchInput = ({index, query, supportsSheetRefValue, definitions, content}: {
	index: number,
	query: SearchQueryForWhere,
	supportsSheetRefValue: boolean,
	content: Content,
	definitions: Definitions,
}) => (
	<div className="query-where" key={`search_query_where.${index}`}>
		<SelectCol index={index} query={query} content={content} definitions={definitions}/>
		<SelectOperator index={index} query={query} definitions={definitions}/>
		<ValueInput index={index} query={query} supportsSheetRefValue={supportsSheetRefValue}/>
		<div className="btn">
			<div className="btn__icon btn__icon--add" onClick={() => Dispatcher.addSearchQuery(index)}>＋</div>
			<div className="btn__icon btn__icon--subtract" onClick={() => Dispatcher.deleteSearchQuery(index)}>ー</div>
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
		<div className="select query-where__col">
			<select
				className="select__input"
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
		</div>
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
		<div className="select query-where__operator">
			<select
				className="select__input"
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
		</div>
	);
};

const valueKindOptions = ['value', 'sheet'] as const;
type ValueKind = typeof valueKindOptions[number];

const isValueKind = (value: string): value is ValueKind => valueKindOptions.some((k:string) => k === value);

const ValueInput = ({index, query, supportsSheetRefValue}: {
	index:number,
	query: SearchQueryForWhere,
	supportsSheetRefValue: boolean,
}) =>
{
	const initial = parseValue(query.val);

	const [kind, setKind] = React.useState<ValueKind>(initial.kind);
	const [valueString, setValString] = React.useState(initial.valueString);
	const [valueSheet, setValSheet] = React.useState(initial.valueSheet);
	const [valueColRef, setValColRef] = React.useState(initial.valueColRef);

	React.useEffect(() =>
	{
		const next = parseValue(query.val);
		setKind(next.kind);
		setValString(next.valueString);
		setValSheet(next.valueSheet);
		setValColRef(next.valueColRef);
	}, [query]);

	const handleKind = (event: React.ChangeEvent<HTMLSelectElement>) =>
	{
		if (!isValueKind(event.target.value)) return;
		setKind(event.target.value);
		updateValue();
	};

	const handleString = (event: React.ChangeEvent<HTMLInputElement>) =>
	{
		setValString(event.target.value);
		updateValue();
	};

	const handleSheet = (event: React.ChangeEvent<HTMLInputElement>) =>
	{
		setValSheet(event.target.value);
		updateValue();
	};

	const handleColRef = (event: React.ChangeEvent<HTMLInputElement>) =>
	{
		setValColRef(event.target.value);
		updateValue();
	};

	if (!supportsSheetRefValue)
	{
		return (
			<div className="text query-where__value">
				<input
					type="text"
					className="text__input"
					key={`search_query_where.val_string.${index}`}
					name="search_query_where.val_string"
					value={valueString}
					onChange={handleString}
				/>
			</div>
		);
	}

	return (
		<div className="query-where__value">
			<div className="select query-where__kind">
				<select
					className="select__input"
					key={`search_query_where.val_kind.${index}`}
					name="search_query_where.val_kind"
					value={kind}
					onChange={handleKind}
				>
					<option value="value">{Locale.searchValueKind.value}</option>
					<option value="sheet">{Locale.searchValueKind.sheet}</option>
				</select>
			</div>
			<div className="query-where__fields">
				<div className="text query-where__field" style={{display: kind === 'value' ? undefined : 'none'}}>
					<input
						type="text"
						className="text__input"
						key={`search_query_where.val_string.${index}`}
						name="search_query_where.val_string"
						value={valueString}
						onChange={handleString}
					/>
				</div>
				<div className="text query-where__field" style={{display: kind === 'sheet' ? undefined : 'none'}}>
					<input
						type="text"
						className="text__input"
						key={`search_query_where.val_sheet.${index}`}
						name="search_query_where.val_sheet"
						placeholder="sheet"
						value={valueSheet}
						onChange={handleSheet}
					/>
				</div>
				<div className="text query-where__field" style={{display: kind === 'sheet' ? undefined : 'none'}}>
					<input
						type="text"
						className="text__input"
						key={`search_query_where.val_col_ref.${index}`}
						name="search_query_where.val_col_ref"
						placeholder="col"
						value={valueColRef}
						onChange={handleColRef}
					/>
				</div>
			</div>
		</div>
	);
};

export const parseValue = (val: SearchQueryForWhere['val']): {kind: ValueKind, valueString: string, valueSheet: string, valueColRef: string} =>
{
	if (typeof val === 'object')
	{
		return {kind: 'sheet', valueString: '', valueSheet: val.sheet, valueColRef: val.col};
	}
	return {kind: 'value', valueString: val, valueSheet: '', valueColRef: ''};
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

	const valueKinds = [...document.getElementsByName('search_query_where.val_kind')]
	.filter(isHTMLSelectElement)
	.map(e => (isValueKind(e.value) ? e.value : 'value'));

	const valueStrings = [...document.getElementsByName('search_query_where.val_string')]
	.filter(isHTMLInputElement)
	.map(e => e.value);

	const valueSheets = [...document.getElementsByName('search_query_where.val_sheet')]
	.filter(isHTMLInputElement)
	.map(e => e.value);

	const valueColRefs = [...document.getElementsByName('search_query_where.val_col_ref')]
	.filter(isHTMLInputElement)
	.map(e => e.value);

	const values: SearchQueryForWhere[] = cols.map((col, i) => ({
		col,
		operator: operators[i],
		val: valueKinds[i] === 'sheet'
			? {sheet: valueSheets[i], col: valueColRefs[i]}
			: valueStrings[i],
	}));

	Dispatcher.updateValue('search_query_where', values);
};
