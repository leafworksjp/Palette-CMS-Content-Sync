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

	public add(subdir: string, content: Content): void
	{
		const list = this.cache.get(subdir);
		if (!list) return;
		this.cache.set(subdir, [...list.filter(c => c.page_id !== content.page_id), content]);
	}

	public remove(subdir: string, pageId: string): void
	{
		const list = this.cache.get(subdir);
		if (!list) return;
		this.cache.set(subdir, list.filter(c => c.page_id !== pageId));
	}
}
