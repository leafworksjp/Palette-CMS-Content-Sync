let ws = null;
let retryTimeout = null;
let hasShownError = false;

const connect = () =>
{
	ws = new WebSocket('ws://localhost:35729');

	ws.onopen = () =>
	{
		console.log('✅ Reload socket connected');
		hasShownError = false;
	};

	ws.onmessage = event =>
	{
		if (event.data === 'reload')
		{
			console.log('🔄 Reloading page...');
			location.reload();
		}
	};

	ws.onerror = () =>
	{
		if (!hasShownError)
		{
			console.warn('❗ Reload server unreachable, retrying...');
			hasShownError = true;
		}
	};

	ws.onclose = () =>
	{
		retryTimeout = window.setTimeout(() =>
		{
			connect();
		}, 3000);
	};
};

connect();
