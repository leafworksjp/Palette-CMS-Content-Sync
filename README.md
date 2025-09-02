# Palette CMS Content Sync

[![License](https://img.shields.io/badge/license-MIT-green.svg?style=flat)](https://raw.githubusercontent.com/IBM-Bluemix/vscode-log-output-colorizer/master/LICENSE)

*NOTE: This extension only works for [Palette CMS](https://palettecms.jp/).*

日本語は[こちら](./README_ja.md)

---

## Overview

Edit and synchronize web contents in [Palette CMS](https://palettecms.jp/) for VS Code.

## Setup

1. Open Palette CMS and log in as administrator.
1. Go to `コンテンツカテゴリ` page from system preferences.
1. Click `ZIPダウンロード` button to download ZIP archive.
1. Extract downloaded ZIP archive.
1. Open folder with VS Code.

### Adjusting the extension position

VS Code can freely change the display position of extensions.

Drag *Palette CMS Content Sync* extension icon from the left sidebar to the desired position.

Move it to the right side of the window to see the file browser and content settings at the same time.

![](/media/doc/move_extension.gif)

## Usage

1. Open *Palette CMS Content Sync* panel from side bar.

### Insert content variables

1. Open downloaded HTML code.
1. Type `[` key to get variable suggestions.

![](/media/doc/content_variables.gif)

### Configure content settings

1. Open HTML code or `contents.json` then you can see content settings in *Palette CMS Content Sync* panel.
1. It automatically saves in `contents.json` when you change the settings.

> ✅ At this time, your settings has not yet been uploaded to the server and can be safely changed.

![](/media/doc/content_settings.png)


### Upload

1. Open any HTML code or `contents.json`.
1. Click `アップロード` button from the toolbar.
1. If the upload is successful, the server will reflect the settings and HTML.

![](/media/doc/upload_content.png)

If there are some errors in your settings, an error dialog will be displayed.

![](/media/doc/error.png)

### Download

1. Open any HTML code or `contents.json`.
1. Click `ダウンロード` button from the toolbar.
1. Local settings are overwritten by server data.

> ⚠️ If you do not upload the changed settings, it will be lost.

![](/media/doc/download_content.png)

### Create new content

1. Click `新規作成` button from the toolbar.

> ✅ After uploading content, empty source code files are automatically generated.
>
> ✅ System ID and some other columns are automatically generated on the server side and they will be applied into `contents.json`.

### Duplicate a content

1. Click `複製` button from the toolbar.

### Delete a content

1. Click `削除` button from the toolbar.

> ⚠️ Server side data will be permanently deleted.

> ✅ If you want to delete only local data, please delete from the file browser.

### Change a folder name

1. When you click `フォルダ名を更新` button from the toolbar, it will be renamed by content id.

> ✅ You can change names anything you want even Japanese names.

![](/media/doc/rename_folder.png)

### Change extensions

1. If you want to change all extentions at once, please click `拡張子を変更` button from the toolbar.

> ✅ This function makes it easy to change the all extentions, after changing `HTTPヘッダー｜Content-Type`.

### Reget content variable definitions

1. Click `コンテンツ変数を再取得` button from the toolbar to download content variable's definitions.

> ✅ When you add the new optional columns on Palette CMS, the content variable's definitions should be reget.
>
> ✅ It is also reget when downloading content.

### Reget all other definitions

1. Click `コンテンツ変数を再取得` button from the toolbar to download all other definitions.

> ✅ When you add new sheets on Palette CMS, all other definitions should be reget.
