const iframe = document.getElementById('iframe');
const loader = document.getElementById('loader');

iframe.onload = () =>
{
	try
	{
		if (iframe.contentWindow.location.host === 'localhost:8125') return;
	}
	catch (error)
	{
		//nop;
	}

	loader.style.display = 'none';
	iframe.style.display = 'block';
};

const ws = new WebSocket('ws://127.0.0.1:8126');

ws.addEventListener('message', e =>
{
	if (e.data === 'update')
	{
		loader.style.display = 'block';
		iframe.style.display = 'none';
		iframe.src = String(iframe.src);
	}
});
