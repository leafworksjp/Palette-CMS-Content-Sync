import vscode from 'vscode';
import {FileUtil} from './FileUtil';
import {LwContent} from './LwContent';
import {SyncAction} from '../../common/types/SyncPlan';

export type SyncActionRecord = {
	action: SyncAction,
	error?: string,
};

export class SyncLog
{
	public static async write(subdir: string, url: string, records: SyncActionRecord[]): Promise<vscode.Uri | undefined>
	{
		const lwDir = LwContent.dir();
		if (!lwDir) return undefined;

		const now = new Date();
		const timestamp = SyncLog.formatTimestamp(now);
		const fileName = `${timestamp}-${subdir}.log`;
		const logUri = FileUtil.join(lwDir, 'sync-logs', fileName);

		const content = SyncLog.format(now, subdir, url, records);
		await FileUtil.writeFile(logUri, content);

		return logUri;
	}

	private static formatTimestamp(d: Date): string
	{
		const pad = (n: number) => String(n).padStart(2, '0');
		return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
	}

	private static format(now: Date, subdir: string, url: string, records: SyncActionRecord[]): string
	{
		const successes = records.filter(r => !r.error);
		const failures = records.filter(r => r.error);

		const lines: string[] = [
			'# Sync Log',
			'',
			`Date: ${now.toISOString()}`,
			`To: ${subdir} (${url})`,
			'',
			`Success: ${successes.length}`,
			`Failure: ${failures.length}`,
			'',
		];

		if (successes.length > 0)
		{
			lines.push('## Success', '');
			successes.forEach(r => lines.push(`- ${SyncLog.formatAction(r.action)}`));
			lines.push('');
		}

		if (failures.length > 0)
		{
			lines.push('## Failure', '');
			failures.forEach(r => lines.push(`- ${SyncLog.formatAction(r.action)}: ${r.error}`));
		}

		return lines.join('\n');
	}

	private static formatAction(action: SyncAction): string
	{
		if (action.kind === 'update') return `update: ${action.local.page_id}`;
		if (action.kind === 'create') return `create: ${action.local.page_id}`;
		if (action.kind === 'replace') return `replace: ${action.targetPageId} ← ${action.local.page_id}`;
		if (action.kind === 'delete') return `delete: ${action.pageId}`;
		return `downloadLocal: ${action.server.page_id}`;
	}
}
