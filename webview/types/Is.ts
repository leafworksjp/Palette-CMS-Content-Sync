
export class Is
{
	public static undefined = (x: unknown): x is undefined|null => typeof x === 'undefined' || x === null;

	public static object = (x: unknown): x is object => x !== null && (typeof x === 'object' || typeof x === 'function');

	public static array = <T>(x: T | readonly T[]): x is T[] => Array.isArray(x);

	public static string = (x: unknown): x is string => typeof x === 'string' || x instanceof String;

	public static number = (x: unknown): x is number => typeof x === 'number' || x instanceof Number;

	public static nullableObject = (x: unknown): x is object|undefined|null => Is.object(x) || Is.undefined(x);

	public static nullableString = (x: unknown): x is string|undefined|null => Is.string(x) || Is.undefined(x);

	public static nullableNumber = (x: unknown): x is number|undefined|null => Is.number(x) || Is.undefined(x);

	public static arrayBuffer = (x: unknown): x is ArrayBuffer => x instanceof ArrayBuffer;

	public static htmlInputElement = (x: unknown): x is HTMLInputElement => x instanceof HTMLInputElement;

	public static htmlSelectElement = (x: unknown): x is HTMLSelectElement => x instanceof HTMLSelectElement;

	public static htmlElement = (x: unknown): x is HTMLElement => x instanceof HTMLElement;

	public static dragEvent = (x: unknown): x is DragEvent => x instanceof DragEvent;

	public static mouseEvent = (x: unknown): x is MouseEvent => x instanceof MouseEvent;

	public static file = (x: unknown): x is File => x instanceof File;

	public static fileList = (x: unknown): x is FileList => x instanceof FileList;

	public static error = (x: unknown): x is Error => x instanceof Error;

	public static notNullable = <T>(x: T | null | undefined): x is T => x !== null && x !== undefined;
}
