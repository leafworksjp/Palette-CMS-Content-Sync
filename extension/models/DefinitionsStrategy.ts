import {z} from 'zod';
import {
	DefinitionsFor,
	DefinitionsInputFor,
	DefinitionsV1,
	DefinitionsV2,
	zDefinitionsV1,
	zDefinitionsV2,
} from '../../common/types/Definitions';
import {Version} from '../../common/types/Version';

export abstract class DefinitionsStrategy<V extends Version = Version>
{
	public static init(version: Version): DefinitionsStrategy
	{
		return version === 1
			? new DefinitionsStrategyV1()
			: new DefinitionsStrategyV2();
	}

	abstract readonly version: V;

	public abstract parse(data: unknown): DefinitionsFor<V>;
	public abstract safeParse(data: unknown): z.SafeParseReturnType<DefinitionsInputFor<V>, DefinitionsFor<V>>;
}

export class DefinitionsStrategyV1 extends DefinitionsStrategy<1>
{
	readonly version = 1 as const;

	public parse(data: unknown): DefinitionsV1
	{
		return zDefinitionsV1.parse(data);
	}

	public safeParse(data: unknown): z.SafeParseReturnType<DefinitionsInputFor<1>, DefinitionsV1>
	{
		return zDefinitionsV1.safeParse(data);
	}
}

export class DefinitionsStrategyV2 extends DefinitionsStrategy<2>
{
	readonly version = 2 as const;

	public parse(data: unknown): DefinitionsV2
	{
		return zDefinitionsV2.parse(data);
	}

	public safeParse(data: unknown): z.SafeParseReturnType<DefinitionsInputFor<2>, DefinitionsV2>
	{
		return zDefinitionsV2.safeParse(data);
	}
}
