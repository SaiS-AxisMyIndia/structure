import { Flavour } from '../flavour/flavour';
import { FeaturesConfig } from '../flavour/FeaturesConfig';
import { ApiSheet } from './api_sheet';
import { AStorage } from '../storage/AStorage';
import { DataResponse, Json, asJson, isFailed, isSuccess } from './data_response';

// authToken/refreshToken/language used to be plain in-memory `let`s here -
// moved to AStorage instead so they survive an app restart. request()
// below reads them fresh from storage on every call rather than keeping
// its own copy that could drift from what's actually persisted.
export const setAuthToken = (token: string | null): Promise<void> => AStorage.setAuthToken(token);
export const setRefreshToken = (token: string | null): Promise<void> => AStorage.setRefreshToken(token);
export const setLanguage = (code: string): Promise<void> => AStorage.setLanguage(code);

function refreshTokens(currentRefreshToken: string): Promise<DataResponse<Json>> {
  return request(
    ApiSheet.auth.refresh,
    { method: 'POST', body: { refreshToken: currentRefreshToken } },
    false,
    false,
  );
}

export type SecureCallOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  timeoutMs?: number;
};

export class SecureCallError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export type SecureCallRequestInterceptor = (
  path: string,
  options: SecureCallOptions,
) => SecureCallOptions | Promise<SecureCallOptions>;


export type SecureCallResponseInterceptor = (
  response: Response,
  path: string,
) => Promise<DataResponse<Json>>;

let requestInterceptors: SecureCallRequestInterceptor[] = [];

function addRequestInterceptor(interceptor: SecureCallRequestInterceptor): () => void {
  requestInterceptors.push(interceptor);
  return () => {
    requestInterceptors = requestInterceptors.filter(i => i !== interceptor);
  };
}

function addResponseInterceptor(interceptor: SecureCallResponseInterceptor): () => void {
  const previous = responseInterceptor;
  responseInterceptor = interceptor;
  return () => {
    responseInterceptor = previous;
  };
}

function defaultMessageForStatus(status: number): string {
  if (status === 200 || status === 201 || status === 204) {return '';}
  if (status === 400) {return 'Bad request.';}
  if (status === 401) {return 'Session expired. Please log in again.';}
  if (status === 403) {return 'You do not have permission to do that.';}
  if (status === 404) {return 'Not found.';}
  if (status === 405) {return 'Method not allowed.';}
  if (status === 406) {return 'Not acceptable.';}
  if (status === 408) {return 'Request timed out.';}
  if (status === 409) {return 'Conflict with the current state.';}
  if (status === 410) {return 'This resource is no longer available.';}
  if (status === 413) {return 'Request payload too large.';}
  if (status === 415) {return 'Unsupported media type.';}
  if (status === 422) {return 'Invalid data submitted.';}
  if (status === 429) {return 'Too many requests. Please try again shortly.';}
  if (status === 500) {return 'Something went wrong on the server.';}
  if (status === 501) {return 'This action is not supported by the server.';}
  if (status === 502) {return 'Server is temporarily unavailable.';}
  if (status === 503) {return 'Server is temporarily unavailable.';}
  if (status === 504) {return 'Server is temporarily unavailable.';}
  if (status >= 500) {return 'Something went wrong on the server.';}
  return 'Request failed.';
}

async function defaultResponseInterceptor(response: Response): Promise<DataResponse<Json>> {
  const statusMessage = defaultMessageForStatus(response.status);
  if (statusMessage) {
    return DataResponse.failed(statusMessage, response.status);
  }

  const body = await response.json().catch(() => ({}));

  if (body.success === false) {
    return DataResponse.failed(body.message, body.errorCode);
  }
  if (body.success === true) {
    // Most routes nest their payload under `data`; some (e.g. the backend's
    // own generate-otp/validate-otp - see its PacketInterceptor.
    // isFinalResponse/finalizeResponse) return a flat, already-final shape
    // with no `data` key at all - fall back to the whole body itself so
    // either shape reads the same way through Json.get().
    const raw = body.data !== undefined ? body.data : body;
    const data = Array.isArray(raw) ? { data: raw } : raw;
    return DataResponse.success(asJson(data), body.message);
  }
  return DataResponse.failed('Request failed.', response.status);
}

let responseInterceptor: SecureCallResponseInterceptor = defaultResponseInterceptor;

// Response.headers is a Headers instance, not a plain object - flattened
// here purely so FeaturesConfig.networkDebug's response log can print it
// the same shape as the plain request-headers object logged alongside it.
function headersToObject(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  headers.forEach((value: string, key: string) => {
    result[key] = value;
  });
  return result;
}

async function request(
  path: string,
  options: SecureCallOptions = {},
  isRetry = false,
  allowAuthRefresh = true,
): Promise<DataResponse<Json>> {
  let resolvedOptions = options;
  for (const interceptor of requestInterceptors) {
    resolvedOptions = await interceptor(path, resolvedOptions);
  }

  const {
    body,
    timeoutMs = 15000,
    headers,
    signal: externalSignal,
    credentials = 'omit',
    cache = 'no-store',
    mode = 'cors',
    redirect = 'follow',
    referrerPolicy = 'no-referrer',
    keepalive = false,
    ...rest
  } = resolvedOptions;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const onExternalAbort = () => controller.abort();
  externalSignal?.addEventListener('abort', onExternalAbort);

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const method = (rest.method as string | undefined) ?? 'GET';
  const url = `${Flavour.getBaseUrl()}${path}`;
  const startedAt = Date.now();

  // Read fresh from AStorage on every call rather than keeping a local
  // copy - see the note above setAuthToken/setRefreshToken/setLanguage.
  const [authToken, refreshToken, language] = await Promise.all([
    AStorage.getAuthToken(),
    AStorage.getRefreshToken(),
    AStorage.getLanguage(),
  ]);

  const requestHeaders: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json', 'x-org-code': 'DEFAULT' }),
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    preferredlanguage: language ?? 'en',
    ...(headers as Record<string, string> | undefined),
  };

  if (FeaturesConfig.networkDebug) {
    console.log(`➡️ SecureCall ${method} ${url}`, {
      headers: requestHeaders,
      payload: isFormData ? '<FormData>' : body,
    });
  }

  try {
    const response = await fetch(url, {
      ...rest,
      mode,
      credentials,
      cache,
      redirect,
      referrerPolicy,
      keepalive,
      signal: controller.signal,
      headers: requestHeaders,
      body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
    });

    if (FeaturesConfig.networkDebug) {
      // .clone() reads an independent copy of the body stream - the
      // original `response` still needs its own body consumed below
      // (responseInterceptor, or refreshTokens's own recursive request()),
      // which a direct .text() here would have already drained.
      response
        .clone()
        .text()
        .then(text => {
          let responseBody: unknown = text;
          try {
            responseBody = text ? JSON.parse(text) : text;
          } catch {
            // Not JSON (plain text/html) - log the raw text as-is.
          }
          console.log(`⬅️ SecureCall ${method} ${url} [${response.status}] (${Date.now() - startedAt}ms)`, {
            headers: headersToObject(response.headers),
            // Repeats what the ➡️ line above already logged as `payload` -
            // so this line is self-contained (what was sent, right next to
            // what came back) rather than making you scroll up to match
            // request/response pairs by URL alone.
            requestPayload: isFormData ? '<FormData>' : body,
            response: responseBody,
          });
        })
        .catch(() => {});
    }

    if (response.status === 401 && allowAuthRefresh && !isRetry && refreshToken) {
      const refreshResponse = await refreshTokens(refreshToken);
      if (isSuccess(refreshResponse)) {
        // The backend's own field is `token`, not `authToken` (see
        // AuthService.refreshToken's response shape).
        const newAuthToken = refreshResponse.data.get('token', '');
        const newRefreshToken = refreshResponse.data.get('refreshToken', '');
        if (newAuthToken && newRefreshToken) {
          // Both awaited - the retry below re-reads through AStorage,
          // so it must not race ahead of these writes actually landing.
          await Promise.all([setAuthToken(newAuthToken), setRefreshToken(newRefreshToken)]);
          return await request(path, options, true);
        }
      }
    }

    return await responseInterceptor(response, path);
  } catch (err) {
    if (FeaturesConfig.networkDebug) {
      console.log(`✖ SecureCall ${method} ${url} threw (${Date.now() - startedAt}ms)`, err);
    }
    return DataResponse.failed(err instanceof Error ? err.message : 'Network request failed');
  } finally {
    clearTimeout(timeout);
    externalSignal?.removeEventListener('abort', onExternalAbort);
  }
}

export const SecureCall = {
  get: (path: string, options?: SecureCallOptions): Promise<DataResponse<Json>> =>
    request(path, { ...options, method: 'GET' }),
  post: (path: string, body?: unknown, options?: SecureCallOptions): Promise<DataResponse<Json>> =>
    request(path, { ...options, method: 'POST', body }),
  put: (path: string, body?: unknown, options?: SecureCallOptions): Promise<DataResponse<Json>> =>
    request(path, { ...options, method: 'PUT', body }),
  patch: (path: string, body?: unknown, options?: SecureCallOptions): Promise<DataResponse<Json>> =>
    request(path, { ...options, method: 'PATCH', body }),
  delete: (path: string, options?: SecureCallOptions): Promise<DataResponse<Json>> =>
    request(path, { ...options, method: 'DELETE' }),
  file: (path: string, formData: FormData, options?: SecureCallOptions): Promise<DataResponse<Json>> =>
    request(path, { timeoutMs: 60000, ...options, method: 'POST', body: formData }),
  addRequestInterceptor,
  addResponseInterceptor,
};

export function unwrap(response: DataResponse<Json>): Json {
  if (isFailed(response)) {
    throw new SecureCallError(response.errorCode ?? 0, response.message);
  }
  return response.data;
}
