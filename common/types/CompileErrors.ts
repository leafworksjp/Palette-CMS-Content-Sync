import {z} from 'zod';

export const zCompileErrors = z.object({
	compile_errors:
		z.record(
			z.string(),
			z.array(z.object(
				{
					message: z.string(),
					line: z.number().nullish(),
					column: z.number().nullish(),
				}
			))
		)
});
export type CompileErrors = z.infer<typeof zCompileErrors>;
