import {Content} from '../../common//types/Content';
import {getLogger} from './Services';

export class ContentFormatter
{
	public static for(content: Content)
	{
		return new ContentFormatter(content);
	}

	private constructor(public content: Content)
	{

	}

	public formatValue(key: keyof Content, value: any)
	{
		switch (key)
		{
			case 'search_row':
			case 'use_template_engine':
			case 'state':
				this.content[key] = Number(value);
				break;

			default:
				this.content[key] = value;
		}

		return this;
	}

	public addSearchQuery(index: number)
	{
		if (this.content.search_query_where)
		{
			this.content.search_query_where.splice(index + 1, 0, {col: '', operator: '=', val: ''});
		}
		else
		{
			this.content.search_query_where = [{col: '', operator: '=', val: ''}];
		}

		return this;
	}

	public deleteSearchQuery(index: number)
	{
		if (this.content.search_query_where)
		{
			this.content.search_query_where.splice(index, 1);

			if (this.content.search_query_where.length === 0)
			{
				this.content.search_query_where.push({col: '', operator: '=', val: ''});
			}
		}
		else
		{
			this.content.search_query_where = [{col: '', operator: '=', val: ''}];
		}

		return this;
	}

	public addOrderQuery(index: number)
	{
		if (this.content.search_query_order)
		{
			this.content.search_query_order.splice(index + 1, 0, {col: '', operator: 'ASC'});
		}
		else
		{
			this.content.search_query_order = [{col: '', operator: 'ASC'}];
		}

		return this;
	}

	public deleteOrderQuery(index: number)
	{
		if (this.content.search_query_order)
		{
			this.content.search_query_order.splice(index, 1);

			if (this.content.search_query_order.length === 0)
			{
				this.content.search_query_order.push({col: '', operator: 'ASC'});
			}
		}
		else
		{
			this.content.search_query_order = [{col: '', operator: 'ASC'}];
		}

		return this;
	}
}
