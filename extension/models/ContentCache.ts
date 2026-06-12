import {ContentV2} from '../../common/types/Content';

export class ContentCache
{
	private readonly cache = new Map<string, ContentV2[]>();

	public get(subdir: string): ContentV2[] | undefined
	{
		return this.cache.get(subdir);
	}

	public set(subdir: string, contents: ContentV2[]): void
	{
		this.cache.set(subdir, contents);
	}

	public clear(subdir: string): void
	{
		this.cache.delete(subdir);
	}

	public add(subdir: string, content: ContentV2): void
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
