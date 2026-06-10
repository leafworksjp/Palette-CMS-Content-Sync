import {z} from 'zod';
export const zVersion = z.union([z.literal(1), z.literal(2)]);
export type Version = z.infer<typeof zVersion>;
