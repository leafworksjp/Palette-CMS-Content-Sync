# Palette CMS Content Sync

*NOTE: This extension only works for [Palette CMS](https://palettecms.jp/).*

## Overview

Edit and synchronize web content in [Palette CMS](https://palettecms.jp/) for VSCode.

## Usage

### Setup

1. Open Palette CMS and log in as administrator.
1. Goto `コンテンツカテゴリ` page from system preferences.
1. Click `ZIPダウンロード` button to download ZIP archive.
1. Extract downloaded ZIP archive.
1. Open folder with VSCode.

### Insert content variable

1. Open downloaded HTML code.
1. Type `[` key to get variable suggestions.

### Configure content settings

1. Open *Palette CMS Content Sync* panel from side bar.
1. Open any HTML code or `contents.json` then you can see content settings in *Palette CMS Content Sync* panel.
1. Any changes made to the settings are immediately saved to `contents.json`.

> ✅ At this time, your settings has not yet been uploaded to the server and can be safely changed.

### Upload

1. Open any HTML code or `contents.json`.
1. Click `アップロード` button on the toolbar.
1. If the upload is successful, the server will reflect the settings.
1. If there are some errors in your settings, an error dialog will be displayed.

### Download

1. Open any HTML code or `contents.json`.
1. Click `ダウンロード` button on the toolbar.
1. Local settings are overwritten by server data.

> ⚠️ Any changes not uploaded will be lost.

### Create new content

1. Click `新規作成` button on the toolbar.

> ✅ Once content is uploaded, empty source code files are automatically generated.
>
> ✅ Columns such as the system ID generated on the server side will be applied to `contents.json`.

### Duplicate a content

1. Click `複製` button on the toolbar.

### Delete a content

1. Click `削除` button on the toolbar.

> ⚠️ Server side data will also be permanently deleted.

> ✅ If you want to delete only local data, please delete from the file browser.

### Change a folder name

1. Click `フォルダ名を更新` button on the toolbar to rename the folder to the name of its content id.

> ✅ Folder names can be changed to any name, including Japanese names.

### Change extensions

1. If you want to change extensions of the source code at once, click `拡張子を変更` button on the toolbar.

> ✅ This function is suitable for changing `HTTPヘッダー｜Content-Type`.

### Reacquire content variable definitions

1. Click `コンテンツ変数を再取得` button on the toolbar to download `variables.json`.

> ✅ This is used when the definition of variables has changed, for example, due to the addition of new optional columns.
>
> ✅ It is also reacquired when downloading content.

### Reacquire all other definitions

1. Click `コンテンツ変数を再取得` button on the toolbar to download `.lwcontent/definitions.json`.

> ✅ For example, due to the addition of new sheet.
