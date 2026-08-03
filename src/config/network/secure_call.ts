import { getBaseUrl } from '../flavour/flavour';

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export type SecureCallOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  timeoutMs?: number;
};

export class SecureCallError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function secureCall<T>(
  path: string,
  options: SecureCallOptions = {},
): Promise<T> {
  const { body, timeoutMs = 15000, headers, ...rest } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${getBaseUrl()}${path}`, {
      ...rest,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new SecureCallError(response.status, await response.text());
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}
