import {Content} from '../../common/types/Content';

export class ListCache
{
	private readonly cache = new Map<string, Content[]>();

	public get(subdir: string): Content[] | undefined
	{
		return this.cache.get(subdir);
	}

	public set(subdir: string, contents: Content[]): void
	{
		this.cache.set(subdir, contents);
	}

	public clear(subdir: string): void
	{
		this.cache.delete(subdir);
	}
}
