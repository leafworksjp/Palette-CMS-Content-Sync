import {Success, Failure} from './Result';

export type ApiErrorType = 'GeneralErrorType'|'ValidationErrorType';

export type GeneralFailureArgs = {
	type: 'GeneralErrorType',
	message: string,
};

export type ValidationFailureArgs = {
	type: 'ValidationErrorType',
	messages: string[],
};

export class ApiResult
{
	public static success = <T>(value: T) => new Success(value);

	public static generalFailure = (message: string) => new Failure({
		type: 'GeneralErrorType',
		message,
	} as GeneralFailureArgs);

	public static validationFailure = (messages: string[]) => new Failure({
		type: 'ValidationErrorType',
		messages,
	} as ValidationFailureArgs);
}
