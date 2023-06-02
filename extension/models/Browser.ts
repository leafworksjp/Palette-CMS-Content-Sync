import open from 'open';

export class Browser
{
	public constructor()
	{
	}

	public open(url: string)
	{
		open(url);
	}
}
