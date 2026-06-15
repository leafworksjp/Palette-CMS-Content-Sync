import {SyncSelection} from '../../../common/types/SyncPlan';

const vscode = acquireVsCodeApi();

export class Dispatcher
{
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
