import WebSocket, {WebSocketServer} from 'ws';

export class WSServer
{
	private wss?: WebSocket.Server<WebSocket.WebSocket>;
	private clients: WebSocket.WebSocket[] = [];

	public create(options: {port: number})
	{
		if (this.wss) return;

		const {port} = options;

		this.wss = new WebSocketServer({port});

		this.wss.on('connection', client =>
		{
			this.clients.push(client);

			client.on('close', () =>
			{
				const index = this.clients.indexOf(client);
				if (index === -1) return;

				this.clients.splice(index, 1);
			});
		});
	}

	public sendMessage(message: string)
	{
		this.clients.forEach(client => client.send(message));
	}
}
