import React from 'react';
import {Dispatcher} from '../models/Dispatcher';
import {SyncDiff, SyncSelection} from '../../../common/types/SyncPlan';
import {Error} from './Error';
import {UpdateSection} from './UpdateSection';
import {ChooseSection} from './ChooseSection';
import {ServerOnlySection} from './ServerOnlySection';
import {PreviewSection} from './PreviewSection';

type Props = {
	diffs: SyncDiff[],
	selections: Record<string, SyncSelection>,
	subdir: string,
	url: string,
	executing: boolean,
};

export const SyncForm = ({diffs, selections, subdir, url, executing}: Props) =>
{
	const [previewOpen, setPreviewOpen] = React.useState<boolean>(false);

	const updateItems = diffs.filter(d => d.kind === 'update');
	const chooseItems = diffs.filter(d => d.kind === 'choose');
	const serverOnlyItems = diffs.filter(d => d.kind === 'serverOnly');

	const isComplete = (d: SyncDiff): boolean =>
	{
		if (d.kind === 'update') return true;
		const pageId = d.kind === 'choose' ? d.local.page_id : d.server.page_id;
		const selection = selections[pageId];
		if (!selection) return false;
		if (selection.kind === 'replace' && !selection.targetPageId) return false;
		return true;
	};

	const hasIncomplete = !diffs.every(isComplete);

	const handleTogglePreview = () => setPreviewOpen(p => !p);
	const handleExecute = () => Dispatcher.execute();

	return (
		<div>
			<div>接続先: {subdir} ({url})</div>
			<Error />
			<UpdateSection items={updateItems} />
			<ChooseSection items={chooseItems} diffs={diffs} selections={selections} executing={executing} />
			<ServerOnlySection items={serverOnlyItems} selections={selections} executing={executing} />
			<div>
				<button onClick={handleTogglePreview} disabled={executing}>
					{previewOpen ? 'プレビューを閉じる' : 'プレビュー'}
				</button>
				<button onClick={handleExecute} disabled={executing || hasIncomplete}>
					{executing ? '実行中...' : '同期実行'}
				</button>
				{hasIncomplete && <p>未選択の項目があります。すべての項目に対する操作を選択してください。</p>}
			</div>
			{previewOpen && <PreviewSection diffs={diffs} selections={selections} />}
		</div>
	);
};
