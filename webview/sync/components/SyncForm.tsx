import React from 'react';
import {Dispatcher} from '../models/Dispatcher';
import {Locale} from '../locales/ja';
import {SyncDiff, SyncSelection} from '../../../common/types/SyncPlan';
import {Error} from '../../common/components/Error';
import {Tabs} from '../../common/components/Tabs';
import {UpdateInputs} from './UpdateInputs';
import {ChooseInputs} from './ChooseInputs';
import {ServerOnlyInputs} from './ServerOnlyInputs';
import {Confirmation} from './Confirmation';

type Props = {
	diffs: SyncDiff[],
	selections: Record<string, SyncSelection>,
	subdir: string,
	url: string,
	executing: boolean,
};

export const SyncForm = ({diffs, selections, subdir, url, executing}: Props) =>
{
	const [isConfirming, setIsConfirming] = React.useState<boolean>(false);

	return (
		<div className="sync-form">
			{isConfirming
				? <ConfirmationView
					diffs={diffs}
					selections={selections}
					subdir={subdir}
					url={url}
					executing={executing}
					onBack={() => setIsConfirming(false)}
				/>
				: <SelectionView
					diffs={diffs}
					selections={selections}
					subdir={subdir}
					url={url}
					executing={executing}
					onConfirm={() => setIsConfirming(true)}
				/>}
		</div>
	);
};

const Header = ({subdir, url, children}: {
	subdir: string,
	url: string,
	children?: React.ReactNode,
}) => (
	<div className="sync-form__header">
		<h1 className="sync-form__title">{Locale.connection}: {subdir} ({url})</h1>
		<Error />
		{children}
	</div>
);

type SelectionViewProps = {
	diffs: SyncDiff[],
	selections: Record<string, SyncSelection>,
	subdir: string,
	url: string,
	executing: boolean,
	onConfirm: () => void,
};

const SelectionView = ({diffs, selections, subdir, url, executing, onConfirm}: SelectionViewProps) =>
{
	const matchedItems = diffs.filter(d => d.kind === 'matched');
	const localOnlyItems = diffs.filter(d => d.kind === 'localOnly');
	const serverOnlyItems = diffs.filter(d => d.kind === 'serverOnly');

	const tabs = [
		{key: 'matched' as const, label: Locale.tab.matched, count: matchedItems.length},
		{key: 'localOnly' as const, label: Locale.tab.localOnly, count: localOnlyItems.length},
		{key: 'serverOnly' as const, label: Locale.tab.serverOnly, count: serverOnlyItems.length},
	].filter(t => t.count > 0);

	const [activeTab, setActiveTab] = React.useState<typeof tabs[number]['key'] | undefined>(tabs[0]?.key);

	const mainRef = React.useRef<HTMLDivElement>(null);

	React.useEffect(() =>
	{
		if (mainRef.current) mainRef.current.scrollTop = 0;
	}, [activeTab]);

	const isComplete = (d: SyncDiff): boolean =>
	{
		if (d.kind === 'matched') return true;
		const pageId = d.kind === 'localOnly' ? d.local.page_id : d.server.page_id;
		const selection = selections[pageId];
		if (!selection) return false;
		if (selection.kind === 'replace' && !selection.targetPageId) return false;
		return true;
	};

	const hasIncomplete = !diffs.every(isComplete);

	return (
		<>
			<Header subdir={subdir} url={url}>
				<Tabs items={tabs} active={activeTab} onChange={setActiveTab} />
			</Header>
			<div className="sync-form__main" ref={mainRef}>
				{activeTab === 'matched' && <UpdateInputs items={matchedItems} />}
				{activeTab === 'localOnly' && <ChooseInputs items={localOnlyItems} diffs={diffs} selections={selections} executing={executing} />}
				{activeTab === 'serverOnly' && <ServerOnlyInputs items={serverOnlyItems} selections={selections} executing={executing} />}
			</div>
			<div className="sync-form__footer">
				{hasIncomplete && <p className="warning warning--inline">{Locale.warning.incomplete}</p>}
				<div className="actions">
					<button className="actions__button secondary" onClick={() => Dispatcher.cancel()} disabled={executing}>
						{Locale.button.cancel}
					</button>
					<button className="actions__button" onClick={onConfirm} disabled={executing || hasIncomplete}>
						{Locale.button.confirm}
					</button>
				</div>
			</div>
		</>
	);
};

type ConfirmationViewProps = {
	diffs: SyncDiff[],
	selections: Record<string, SyncSelection>,
	subdir: string,
	url: string,
	executing: boolean,
	onBack: () => void,
};

const ConfirmationView = ({diffs, selections, subdir, url, executing, onBack}: ConfirmationViewProps) => (
	<>
		<Header subdir={subdir} url={url} />
		<div className="sync-form__main">
			<Confirmation diffs={diffs} selections={selections} />
		</div>
		<div className="sync-form__footer">
			<div className="actions">
				<button className="actions__button secondary" onClick={() => Dispatcher.cancel()} disabled={executing}>
					{Locale.button.cancel}
				</button>
				<button className="actions__button secondary" onClick={onBack} disabled={executing}>
					{Locale.button.back}
				</button>
				<button className="actions__button" onClick={() => Dispatcher.execute()} disabled={executing}>
					{executing ? Locale.button.executing : Locale.button.execute}
				</button>
			</div>
		</div>
	</>
);
