
export const flipMap = <T, U>(map: Map<T, U>) => new Map([...map].map(([key, value]) => [value, key]));

export const groupBy = <K, V>(
	array: readonly V[],
	getKey: (cur: V, idx: number, src: readonly V[]) => K
): [K, V[]][] => Array.from(
		array.reduce((map, cur, idx, src) =>
		{
			const key = getKey(cur, idx, src);
			const list = map.get(key);
			if (list) list.push(cur);
			else map.set(key, [cur]);
			return map;
		}, new Map<K, V[]>())
	);

export const uniqueArray = <T>(array: T[]) => [...new Set(array)];

export const uniqueBy = <T, U>(array: T[], getKey: (t: T) => U) => [...new Map(array.map(item => [getKey(item), item])).values()];

export const removeItem = <T>(array: T[], item: T) =>
{
	const index = array.indexOf(item);
	if (index > -1)
	{
		array.splice(index, 1);
	}
	return array;
};

export const chunk = <T>(array: T[], size: number) => array.reduce<T[][]>((newArray, item, i) => (i % size ? newArray : [...newArray, array.slice(i, i + size)]), []);
