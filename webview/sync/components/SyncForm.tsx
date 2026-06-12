import React from 'react';
import {Dispatcher} from '../models/Dispatcher';
import {SyncDiff, SyncSelection} from '../../../common/types/SyncPlan';
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

	const handleTogglePreview = () => setPreviewOpen(p => !p);
	const handleExecute = () => Dispatcher.execute();

	return (
		<div>
			<div>接続先: {subdir} ({url})</div>
			<UpdateSection items={updateItems} />
			<ChooseSection items={chooseItems} diffs={diffs} selections={selections} executing={executing} />
			<ServerOnlySection items={serverOnlyItems} selections={selections} executing={executing} />
			<div>
				<button onClick={handleTogglePreview} disabled={executing}>
					{previewOpen ? 'プレビューを閉じる' : 'プレビュー'}
				</button>
				<button onClick={handleExecute} disabled={executing}>
					{executing ? '実行中...' : '同期実行'}
				</button>
			</div>
			{previewOpen && <PreviewSection diffs={diffs} selections={selections} />}
		</div>
	);
};
