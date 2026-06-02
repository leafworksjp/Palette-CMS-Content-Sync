import React from 'react';
import {Dispatcher} from '../models/Dispatcher';
import {Content, ContentContext, SearchQueryForWhere, getColumns, getColumnName, getSearchQueryOptions} from '../../common/types/Content';
import {Definitions} from '../../common/types/Definitions';

type SearchInputsProps =
{
	contentContext: ContentContext,
	content: Content,
	definitions: Definitions,
};

const name = 'search_query_where';

export const SearchInputs = ({contentContext, content, definitions}: SearchInputsProps) =>
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
						return <SearchInput key={key} index={index} query={query} contentContext={contentContext} content={content} definitions={definitions} />;
					})
				}
			</dd>
		</dl>);
};

const SearchInput = ({index, query, contentContext, definitions, content}: {
	index: number,
	query: SearchQueryForWhere,
	contentContext: ContentContext,
	content: Content,
	definitions: Definitions,
}) => (
	<div className="setting setting--search" key={`search_query_where.${index}`}>
		<SelectCol index={index} query={query} content={content} definitions={definitions}/>
		<SelectOperator index={index} query={query} definitions={definitions}/>
		<ValInput index={index} query={query} contentContext={contentContext}/>
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
		<select className="setting__operator"
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

const valKindOptions = ['value', 'sheet'] as const;
type ValKind = typeof valKindOptions[number];

const isValKind = (value: string): value is ValKind => valKindOptions.some((k:string) => k === value);

const ValInput = ({index, query, contentContext}: {
	index:number,
	query: SearchQueryForWhere,
	contentContext: ContentContext,
}) =>
{
	const initial = parseVal(query.val);

	const [kind, setKind] = React.useState<ValKind>(initial.kind);
	const [valString, setValString] = React.useState(initial.valString);
	const [valSheet, setValSheet] = React.useState(initial.valSheet);
	const [valColRef, setValColRef] = React.useState(initial.valColRef);

	React.useEffect(() =>
	{
		const next = parseVal(query.val);
		setKind(next.kind);
		setValString(next.valString);
		setValSheet(next.valSheet);
		setValColRef(next.valColRef);
	}, [query]);

	const handleKind = (event: React.ChangeEvent<HTMLSelectElement>) =>
	{
		if (!isValKind(event.target.value)) return;
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

	if (!contentContext.supportsSheetRefVal())
	{
		return (
			<input
				type="text"
				key={`search_query_where.val_string.${index}`}
				name="search_query_where.val_string"
				value={valString}
				onChange={handleString}
			/>
		);
	}

	return (
		<div className="setting__val val">
			<select
				className="val__kind"
				key={`search_query_where.val_kind.${index}`}
				name="search_query_where.val_kind"
				value={kind}
				onChange={handleKind}
			>
				<option value="value">値</option>
				<option value="sheet">userシート参照</option>
			</select>
			<div className="val__fields">
				<input
					type="text"
					key={`search_query_where.val_string.${index}`}
					name="search_query_where.val_string"
					value={valString}
					onChange={handleString}
					style={{display: kind === 'value' ? undefined : 'none'}}
				/>
				<input
					type="text"
					key={`search_query_where.val_sheet.${index}`}
					name="search_query_where.val_sheet"
					placeholder="sheet"
					value={valSheet}
					onChange={handleSheet}
					style={{display: kind === 'sheet' ? undefined : 'none'}}
				/>
				<input
					type="text"
					key={`search_query_where.val_col_ref.${index}`}
					name="search_query_where.val_col_ref"
					placeholder="col"
					value={valColRef}
					onChange={handleColRef}
					style={{display: kind === 'sheet' ? undefined : 'none'}}
				/>
			</div>
		</div>
	);
};

export const parseVal = (val: SearchQueryForWhere['val']): {kind: ValKind, valString: string, valSheet: string, valColRef: string} =>
{
	if (typeof val === 'object')
	{
		return {kind: 'sheet', valString: '', valSheet: val.sheet, valColRef: val.col};
	}
	return {kind: 'value', valString: val, valSheet: '', valColRef: ''};
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

	const valKinds = [...document.getElementsByName('search_query_where.val_kind')]
	.filter(isHTMLSelectElement)
	.map(e => (isValKind(e.value) ? e.value : 'value'));

	const valStrings = [...document.getElementsByName('search_query_where.val_string')]
	.filter(isHTMLInputElement)
	.map(e => e.value);

	const valSheets = [...document.getElementsByName('search_query_where.val_sheet')]
	.filter(isHTMLInputElement)
	.map(e => e.value);

	const valColRefs = [...document.getElementsByName('search_query_where.val_col_ref')]
	.filter(isHTMLInputElement)
	.map(e => e.value);

	const values: SearchQueryForWhere[] = cols.map((col, i) => ({
		col,
		operator: operators[i],
		val: valKinds[i] === 'sheet'
			? {sheet: valSheets[i], col: valColRefs[i]}
			: valStrings[i],
	}));

	Dispatcher.updateValue('search_query_where', values);
};
