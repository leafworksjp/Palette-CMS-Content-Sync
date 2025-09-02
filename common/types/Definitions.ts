import {z} from 'zod';

export const zDefinitions = z.object({
	url: z.string(),
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

export type Definitions = z.infer<typeof zDefinitions>;

export const createDefinitions = (): Definitions => ({
	url: '',
	columns: {},
	column_names: [],
	sheet_names: [],
	column_options: {
		contents_type: [],
		http_header_content_type: {},
		permission: {},
		device_type: [],
		use_template_engine: [],
		state: [],
		search_query_where: [],
		search_query_order: [],

	},
	code_types: {},
	template_engine_code_types: {},
	code_type_names: [],
	search_query_keys: {},
});
