type TabItem<K extends string> = {
	key: K,
	label: string,
	count: number,
};

type Props<K extends string> = {
	items: ReadonlyArray<TabItem<K>>,
	active: K | undefined,
	onChange: (key: K) => void,
};

export function Tabs<K extends string>({items, active, onChange}: Props<K>)
{
	return (
		<div className="tabs">
			{items.map(t =>
			{
				const tabKey = `tabs__tab.${t.key}`;
				const className = active === t.key ? 'tabs__tab tabs__tab--active' : 'tabs__tab';
				return (
					<button key={tabKey} className={className} onClick={() => onChange(t.key)}>
						{t.label} ({t.count})
					</button>
				);
			})}
		</div>
	);
}
