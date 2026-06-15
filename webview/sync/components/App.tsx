import React from 'react';
import {z} from 'zod';
import {Dispatcher} from '../models/Dispatcher';
import {SyncDiff, SyncSelection, zSyncDiff, zSyncSelection} from '../../../common/types/SyncPlan';
import {SyncForm} from './SyncForm';
import {Welcome} from './Welcome';

export const App = () =>
{
	const [diffs, setDiffs] = React.useState<SyncDiff[] | undefined>(undefined);
	const [selections, setSelections] = React.useState<Record<string, SyncSelection>>({});
	const [subdir, setSubdir] = React.useState<string>('');
	const [url, setUrl] = React.useState<string>('');
	const [executing, setExecuting] = React.useState<boolean>(false);

	React.useEffect(() =>
	{
		window.addEventListener('message', event =>
		{
			const message = event.data;
			switch (message.command)
			{
				case 'refresh':
					{
						const diffsResult = z.array(zSyncDiff).safeParse(message.value.diffs);
						const selectionsResult = z.record(z.string(), zSyncSelection).safeParse(message.value.selections);

						if (diffsResult.success) setDiffs(diffsResult.data);
						if (selectionsResult.success) setSelections(selectionsResult.data);
						setSubdir(message.value.subdir);
						setUrl(message.value.url);
						setExecuting(Boolean(message.value.executing));
					}
					break;

				default:
					break;
			}
		});

		Dispatcher.onLoad();
	}, []);

	return diffs
		? <SyncForm
			diffs={diffs}
			selections={selections}
			subdir={subdir}
			url={url}
			executing={executing}
		/>
		: <Welcome />;
};
