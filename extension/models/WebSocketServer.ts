import WebSocket, {WebSocketServer as NodeJsWebSocketServer} from 'ws';
import {getLogger} from './Services';

export class WebSocketServer
{
	private wss: WebSocket.Server<WebSocket.WebSocket>;

	public constructor(
		private readonly port: number,
		private readonly handleMessage?: (message: string) => void
	)
	{
		this.wss = new NodeJsWebSocketServer({port: this.port});

		this.wss.on('connection', socket =>
		{
			getLogger().log('[WebSocket] Client connected');

			socket.on('close', () =>
			{
				getLogger().log('[WebSocket] Client disconnected');
			});

			socket.on('message', msg =>
			{
				this.handleMessage?.(msg.toString());
			});
		});

		getLogger().log(`[WebSocket] Server started on ws://localhost:${this.port}`);
	}

	public postMessage(data: unknown): void
	{
		this.wss.clients.forEach(client =>
		{
			if (client.readyState === WebSocket.OPEN)
			{
				const message = JSON.stringify(data);

				client.send(
					message,
					error =>
					{
						if (error)
						{
							getLogger().error('[WebSocket] Error sending message', error);
						}
					}
				);
			}
		});
	}

	public dispose(): void
	{
		for (const client of this.wss.clients)
		{
			client.terminate();
		}

		this.wss.close(error =>
		{
			if (error)
			{
				getLogger().error('[WebSocket] Error on close', error);
			}
			else
			{
				getLogger().log('[WebSocket] Server closed');
			}
		});
	}
}
