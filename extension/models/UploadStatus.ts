import * as vscode from 'vscode';

export class UploadStatus
{
	private readonly item: vscode.StatusBarItem;

	public constructor()
	{
		this.item = vscode.window.createStatusBarItem(
			vscode.StatusBarAlignment.Left,
			10000
		);
	}

	public showUploading()
	{
		this.item.text = '$(sync~spin) アップロード中...';
		this.item.tooltip = 'テンプレートをサーバーにアップロードしています';
		this.item.color = undefined;
		this.item.show();
	}

	public showCompleted()
	{
		this.item.text = '$(check) アップロード完了';
		this.item.tooltip = 'アップロードが正常に完了しました';

		setTimeout(() =>
		{
			this.item.hide();
		}, 3000);
	}

	public showError()
	{
		this.item.text = '$(error) アップロードに失敗しました';
		this.item.tooltip = 'エラーが発生しました';
		this.item.color = new vscode.ThemeColor('errorForeground');

		setTimeout(() => this.item.hide(), 5000);
	}

	public hide()
	{
		this.item.hide();
	}

	public dispose()
	{
		this.item.dispose();
	}
}
