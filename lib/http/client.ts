import type { ApiResponse } from "@/lib/http/contracts";

type Primitive = string | number | boolean;
type QueryValue = Primitive | null | undefined;
type QueryParams = Record<string, QueryValue | QueryValue[]>;

type RequestOptions = Omit<RequestInit, "body"> & {
	query?: QueryParams;
	body?: BodyInit | object | null;
	timeoutMs?: number;
};

type ApiErrorOptions = {
	status: number;
	url: string;
	message: string;
	code?: string;
	details?: unknown;
};

export class ApiError extends Error {
	readonly status: number;
	readonly url: string;
	readonly code?: string;
	readonly details?: unknown;

	constructor({ status, url, message, code, details }: ApiErrorOptions) {
		super(message);
		this.name = "ApiError";
		this.status = status;
		this.url = url;
		this.code = code;
		this.details = details;
	}
}

export function isApiError(error: unknown): error is ApiError {
	return error instanceof ApiError;
}

type UnwrapApiResponseOptions = {
	url: string;
	status?: number;
};

function buildUrl(input: string, query?: QueryParams) {
	if (!query) {
		return input;
	}

	const url = new URL(input, "http://local");

	for (const [key, value] of Object.entries(query)) {
		if (value == null) {
			continue;
		}

		const values = Array.isArray(value) ? value : [value];

		for (const item of values) {
			if (item == null) {
				continue;
			}

			url.searchParams.append(key, String(item));
		}
	}

	return input.startsWith("http") ? url.toString() : `${url.pathname}${url.search}`;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function buildRequestBody(
	body: RequestOptions["body"],
	headers: Headers,
): BodyInit | null | undefined {
	if (body == null || typeof body === "string" || body instanceof FormData) {
		return body;
	}

	if (
		body instanceof Blob ||
		body instanceof ArrayBuffer ||
		body instanceof URLSearchParams ||
		body instanceof ReadableStream
	) {
		return body;
	}

	if (isPlainObject(body)) {
		if (!headers.has("content-type")) {
			headers.set("content-type", "application/json");
		}

		return JSON.stringify(body);
	}

	return body as BodyInit;
}

async function parseResponseBody(response: Response) {
	const contentType = response.headers.get("content-type") ?? "";

	if (contentType.includes("application/json")) {
		return response.json();
	}

	return response.text();
}

function createTimeoutSignal(timeoutMs: number) {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort("Request timed out"), timeoutMs);

	return {
		signal: controller.signal,
		clear: () => clearTimeout(timeout),
	};
}

export async function requestJson<T>(input: string, options: RequestOptions = {}) {
	const { query, body, timeoutMs, headers: initHeaders, signal, ...init } = options;
	const headers = new Headers(initHeaders);
	const url = buildUrl(input, query);

	const timeout = timeoutMs ? createTimeoutSignal(timeoutMs) : null;
	const compositeSignal = timeout
		? AbortSignal.any(
				[signal, timeout.signal].filter((value): value is AbortSignal => Boolean(value)),
			)
		: signal;

	try {
		const response = await fetch(url, {
			...init,
			headers,
			body: buildRequestBody(body, headers),
			signal: compositeSignal,
		});

		const payload = await parseResponseBody(response);

		if (!response.ok) {
			const message =
				isPlainObject(payload) && typeof payload.message === "string"
					? payload.message
					: response.statusText || "Request failed";
			const code =
				isPlainObject(payload) && typeof payload.code === "string"
					? payload.code
					: undefined;

			throw new ApiError({
				status: response.status,
				url,
				message,
				code,
				details: payload,
			});
		}

		return payload as T;
	} catch (error) {
		if (error instanceof ApiError) {
			throw error;
		}

		if (error instanceof Error && error.name === "AbortError") {
			throw new ApiError({
				status: 499,
				url,
				message: "Request was aborted",
				code: "REQUEST_ABORTED",
				details: error,
			});
		}

		throw new ApiError({
			status: 0,
			url,
			message: error instanceof Error ? error.message : "Unknown request error",
			code: "NETWORK_ERROR",
			details: error,
		});
	} finally {
		timeout?.clear();
	}
}

export function unwrapApiResponse<T>(
	response: ApiResponse<T>,
	{ url, status = 400 }: UnwrapApiResponseOptions,
): T {
	if (!response.ok) {
		throw new ApiError({
			status,
			url,
			message: response.message,
			code: response.code,
			details: response,
		});
	}

	return response.data;
}

export const httpClient = {
	get<T>(input: string, options?: Omit<RequestOptions, "method" | "body">) {
		return requestJson<T>(input, { ...options, method: "GET" });
	},
	post<T>(input: string, options?: Omit<RequestOptions, "method">) {
		return requestJson<T>(input, { ...options, method: "POST" });
	},
};
