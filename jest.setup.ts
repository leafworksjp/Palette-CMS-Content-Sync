import {jest} from '@jest/globals';

Object.defineProperty(globalThis, 'acquireVsCodeApi', {
	writable: true,
	value: jest.fn(() => ({
		postMessage: jest.fn(),
		getState: jest.fn(),
		setState: jest.fn(),
	})),
});
