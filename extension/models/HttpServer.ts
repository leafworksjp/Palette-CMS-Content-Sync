import vscode from 'vscode';
import express, {Express} from 'express';
import {FileUtil} from './FileUtil';

export class HttpServer
{
	private app?: Express;

	public create(options: {
		port: number,
		root: vscode.Uri,
		index: string,
	})
	{
		if (this.app) return;

		const {port, root, index} = options;

		const indexUri = FileUtil.join(root, index);

		this.app = express();

		this.app
		.get('/', async (request, response) =>
		{
			const content = await FileUtil.readFile(indexUri);

			response.writeHead(200, {'Content-Type': this.getContentType(indexUri)});
			response.write(content, 'utf-8');
			response.end();
		})
		.listen(port);

		if (root)
		{
			this.app.use(express.static(root.fsPath));
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
