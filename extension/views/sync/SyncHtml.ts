import vscode from 'vscode';

export class SyncHtml
{
	public static get(webview: vscode.Webview, extensionUri: vscode.Uri)
	{
		const nonce = SyncHtml.getNonce();

		const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'css', 'reset.css'));
		const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'css', 'vscode.css'));
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'dist', 'sync.bundle.js'));

		return `
			<!DOCTYPE html>
			<html lang="ja">
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}' 'unsafe-eval';">

				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">

				<script defer nonce="${nonce}" src="${scriptUri}"></script>
			</head>
			<body>
				<div id="root"></div>
			</body>
			</html>
			`;
	}

	private static getNonce()
	{
		let text = '';
		const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		for (let i = 0; i < 32; i++)
		{
			text += possible.charAt(Math.floor(Math.random() * possible.length));
		}
		return text;
	}
}
