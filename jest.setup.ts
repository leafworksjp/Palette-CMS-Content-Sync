import {jest} from '@jest/globals';

Object.defineProperty(globalThis, 'acquireVsCodeApi', {
	writable: true,
	value: jest.fn(() => ({
		postMessage: jest.fn(),
		getState: jest.fn(),
		setState: jest.fn(),
	})),
});

jest.mock('vscode', () =>
{
	function stubTarget() {}
	const stub: typeof stubTarget = new Proxy(stubTarget, {
		get: () => stub,
		construct: () => stub,
	});
	return {
		default: stub,
		workspace: stub,
		window: stub,
		Uri: stub,
		ConfigurationTarget: stub,
		FileType: stub,
		RelativePattern: stub,
		StatusBarAlignment: stub,
	};
}, {virtual: true});

jest.mock('prettier', () => ({
	format: jest.fn((input: string) => Promise.resolve(input)),
}));
