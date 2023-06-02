
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
		vscode.postMessage({
			command: 'onLoad',
		});
	}

	static updateValue(key: string, value: Array<any>|string)
	{
		vscode.postMessage({
			command: 'updateValue',
			key,
			value,
		});
	}

	static onBlur(key: string, value: Array<any>|string)
	{
		vscode.postMessage({
			command: 'onBlur',
			key,
			value,
		});
	}

	static addSearchQuery(index: number)
	{
		vscode.postMessage({
			command: 'addSearchQuery',
			index,
		});
	}

	static deleteSearchQuery(index: number)
	{
		vscode.postMessage({
			command: 'deleteSearchQuery',
			index,
		});
	}

	static addOrderQuery(index: number)
	{
		vscode.postMessage({
			command: 'addOrderQuery',
			index,
		});
	}

	static deleteOrderQuery(index: number)
	{
		vscode.postMessage({
			command: 'deleteOrderQuery',
			index,
		});
	}
}
