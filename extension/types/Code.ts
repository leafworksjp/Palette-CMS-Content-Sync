
import {z} from 'zod';

export const zCode = z.object({
	id: z.string().optional(),
	contents: z.string().optional(),
	html_type: z.string(),
	html: z.string(),
});

export type Code = z.infer<typeof zCode>;

export class CodeUtil
{
	public static createEmptyCode = (): Code => ({
		id: '',
		contents: '',
		html_type: '',
		html: '',
	});
}
