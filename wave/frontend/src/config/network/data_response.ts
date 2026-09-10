
// What `SecureCall` actually hands back as response data - not a plain
// parsed value a caller has to cast itself, but this: something that
// already knows how to read one field at a time with a default,
// `.get<Type>(key, fallback)`, the way `Map.get`/`URLSearchParams.get`
// already read in this codebase. `fallback` doubles as `Type`'s example
// value and its default - nothing downstream ever needs its own `as
// Partial<Domain>` cast or `unknown` handling; SecureCall builds this
// once (see `asJson`/`toDataResponse` in secure_call.ts) and every
// caller just gets one back already wrapped.
export type Json = {
  get: <T>(key: string, fallback: T) => T;
};

export function asJson(value: unknown): Json {
  return {
    get: <T>(key: string, fallback: T): T => {
      if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        return fallback;
      }
      const field = (value as Record<string, unknown>)[key];
      return field === undefined || field === null ? fallback : (field as T);
    },
  };
}

export type DataSuccess<T> = {
  status: true;
  data: T;
  message?: string;
};

export type DataFailed = {
  status: false;
  message: string;
  errorCode?: number;
};

export type DataResponse<T> = DataSuccess<T> | DataFailed;

export function isSuccess<T>(response: DataResponse<T>): response is DataSuccess<T> {
  return response.status;
}

export function isFailed<T>(response: DataResponse<T>): response is DataFailed {
  return !response.status;
}

export const DataResponse = {
  success: <T>(data: T, message?: string): DataSuccess<T> => ({ status: true, data, message }),
  failed: (message: string, errorCode?: number): DataFailed => ({ status: false, message, errorCode }),
};
