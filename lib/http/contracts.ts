export type ApiSuccess<T> = {
	ok: true;
	data: T;
};

export type ApiFailure = {
	ok: false;
	message: string;
	code?: string;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export function apiSuccess<T>(data: T): ApiSuccess<T> {
	return {
		ok: true,
		data,
	};
}

export function apiFailure(message: string, code?: string): ApiFailure {
	return {
		ok: false,
		message,
		code,
	};
}

