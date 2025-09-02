import vscode from 'vscode';
import express, {Express} from 'express';
import http from 'http';
import {FileUtil} from './FileUtil';
import {getLogger} from './Services';

export class HttpServer
{
	private app: Express;
	private server?: http.Server;

	public constructor(
		private readonly port: number,
		private readonly root: vscode.Uri,
		private readonly index: string
	)
	{
		this.app = express();

		this.app.use(express.static(this.root.fsPath));

		this.app
		.get('/', async (request, response) =>
		{
			const indexUri = FileUtil.join(this.root, this.index);
			const content = await FileUtil.readFile(indexUri);

			response.type(this.getContentType(indexUri)).send(content);
		});

		this.server = this.app.listen(this.port, () =>
		{
			getLogger().log(`[HttpServer] Listening on http://localhost:${this.port}`);
		});
	}

	public dispose(): void
	{
		if (this.server)
		{
			this.server.close(err =>
			{
				if (err)
				{
					getLogger().error('[HttpServer] Error on close', err);
				}
				else
				{
					getLogger().log('[HttpServer] Server closed');
				}
			});
			this.server = undefined;
		}
	}

	private getContentType(uri: vscode.Uri)
	{
		const extension = FileUtil.getExt(uri);

		const mimeTypes = {
			'.html': 'text/html',
			'.js': 'text/javascript',
			'.css': 'text/css',
			'.json': 'application/json',
			'.png': 'image/png',
			'.jpg': 'image/jpg',
			'.gif': 'image/gif',
			'.svg': 'image/svg+xml',
			'.wav': 'audio/wav',
			'.mp4': 'video/mp4',
			'.woff': 'application/font-woff',
			'.ttf': 'application/font-ttf',
			'.eot': 'application/vnd.ms-fontobject',
			'.otf': 'application/font-otf',
			'.wasm': 'application/wasm'
		};

		if (!Object.keys(mimeTypes).includes(extension))
		{
			return 'application/octet-stream';
		}

		const key = extension as keyof typeof mimeTypes;

		const contentType = mimeTypes[key];

		return contentType;
	}
}
