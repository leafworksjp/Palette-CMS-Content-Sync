import {SyncSelection} from '../../../common/types/SyncPlan';

const vscode = acquireVsCodeApi();

export class Dispatcher
{
	static addListener(command: string, callback: (data: any) => void)
	{
		window.addEventListener('message', event =>
		{
			if (event.data.command !== command) return;

			callback(event.data);
		});
	}

	static onLoad()
	{
		vscode.postMessage({command: 'onLoad'});
	}

	static updateSelection(pageId: string, selection: SyncSelection)
	{
		vscode.postMessage({command: 'updateSelection', pageId, selection});
	}

	static execute()
	{
		vscode.postMessage({command: 'execute'});
	}
}
