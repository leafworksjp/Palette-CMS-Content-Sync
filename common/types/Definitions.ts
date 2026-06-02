import {z} from 'zod';
import {Version} from './Version';

export const zDefinitionsBase = z.object({
	columns: z.record(z.string(), z.array(z.object({
		key: z.string(),
		options: z.array(z.string()),
	}))),
	column_names: z.array(z.object({
		key: z.string(),
		name: z.string(),
	})),
	sheet_names: z.array(z.object({
		key: z.string(),
		name: z.string(),
	})).optional(),
	column_options: z.object({
		contents_type: z.array(z.object({
			key: z.string(),
			name: z.string(),
		})),
		http_header_content_type:
			z.union([
				z.array(z.object({
					key: z.string(),
					name: z.string(),
				})),
				z.record(z.string(), z.array(z.object({
					key: z.string(),
					name: z.string(),
				}))),
			]),
		sheet_id: z.record(z.string(), z.array(z.object({
			key: z.string(),
			options: z.array(z.string()),
		}))).optional(),
		role_key: z.record(z.string(), z.array(z.object({
			key: z.string(),
			name: z.string(),
			default: z.boolean().optional(),
		}))).optional(),
		role_key_owner: z.record(z.string(), z.array(z.object({
			key: z.string(),
			options: z.array(z.object({
				key: z.string(),
				name: z.string(),
			})),
		}))).optional(),
		permission: z.record(z.string(), z.array(z.object({
			key: z.string(),
			name: z.string(),
		}))),
		permission_sheet: z.record(z.string(), z.array(z.object({
			key: z.string(),
			options: z.array(z.string()),
		}))).optional(),
		manager_permission_sheet: z.record(z.string(), z.array(z.object({
			key: z.string(),
			options: z.array(z.string()),
		}))).optional(),
		device_type: z.array(z.object({
			key: z.string(),
			name: z.string(),
		})),
		use_template_engine: z.array(z.object({
			key: z.number(),
			name: z.string(),
		})).default([{
			key: 0,
			name: 'コンテンツ変数',
		}]),
		state: z.array(z.object({
			key: z.number(),
			name: z.string(),
		})),
		search_query_where: z.array(z.object({
			key: z.string(),
			name: z.string(),
		})),
		search_query_order_state: z.array(z.object({
			key: z.string(),
			name: z.string(),
		})).optional(),
		search_query_order: z.array(z.object({
			key: z.string(),
			name: z.string(),
		})),
		search_query_order_rand: z.array(z.object({
			key: z.string(),
			name: z.string(),
		})).optional(),
	}),
	code_types: z.record(z.string(), z.array(z.string())),
	template_engine_code_types: z.record(z.string(), z.array(z.string())).default({}),
	code_type_names: z.array(z.object({
		key: z.string(),
		name: z.string(),
	})),
	search_query_keys: z.record(z.string(), z.array(z.object({
		sheet: z.string().optional(),
		type: z.string().optional(),
		options: z.array(z.object({
			key: z.string(),
			name: z.string(),
		})),
	}))),
});

export const zDefinitionsV1 = zDefinitionsBase.extend({url: z.string()}).brand<'DefinitionsV1'>();
export const zDefinitionsV2 = zDefinitionsBase.brand<'DefinitionsV2'>();
export type DefinitionsInputFor<V extends Version> = V extends 1 ? z.input<typeof zDefinitionsV1>: z.input<typeof zDefinitionsV2>;

export type DefinitionsV1 = z.infer<typeof zDefinitionsV1>;
export type DefinitionsV2 = z.infer<typeof zDefinitionsV2>;
export type DefinitionsFor<V extends Version> = V extends 1 ? DefinitionsV1 : DefinitionsV2;
export type Definitions = DefinitionsFor<Version>;

export interface DefinitionsStrategy<V extends Version = Version>
{
	readonly version: V;
	parse(data: unknown): DefinitionsFor<V>;
	safeParse(data: unknown): z.SafeParseReturnType<DefinitionsInputFor<V>, DefinitionsFor<V>>;
}

export class DefinitionsStrategyV1 implements DefinitionsStrategy<1>
{
	readonly version = 1 as const;

	public parse(data: unknown)
	{
		return zDefinitionsV1.parse(data);
	}

	public safeParse(data: unknown)
	{
		return zDefinitionsV1.safeParse(data);
	}
}

export class DefinitionsStrategyV2 implements DefinitionsStrategy<2>
{
	readonly version = 2 as const;

	public parse(data: unknown)
	{
		return zDefinitionsV2.parse(data);
	}

	public safeParse(data: unknown)
	{
		return zDefinitionsV2.safeParse(data);
	}
}

export class DefinitionsContext<V extends Version = Version>
{
	public static init(version: Version)
	{
		return version === 1
			? new DefinitionsContext(new DefinitionsStrategyV1())
			: new DefinitionsContext(new DefinitionsStrategyV2());
	}

	constructor(private strategy: DefinitionsStrategy<V>) {}

	public parse(data: unknown): DefinitionsFor<V>
	{
		return this.strategy.parse(data);
	}

	public safeParse(data: unknown): z.SafeParseReturnType<DefinitionsInputFor<V>, DefinitionsFor<V>>
	{
		return this.strategy.safeParse(data);
	}
}
