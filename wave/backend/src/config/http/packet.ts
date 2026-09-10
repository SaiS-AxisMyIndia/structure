// Wire-compatible with the frontend's own DataResponse (see
// frontend/src/config/network/data_response.ts): every response this API
// sends - success or failure - is shaped like this, so SecureCall's
// `defaultResponseInterceptor` (which reads `body.success`/`body.data`/
// `body.message`) can unwrap it without any per-route special-casing.
//
// Flat, not nested under a `data` field: Packet.success(fields) merges
// `success: true` (and `message`, if given) directly onto `fields` - e.g.
// Packet<VerifyOtpResponse> is VerifyOtpResponse itself plus `success`,
// not `{ data: VerifyOtpResponse }`. A non-object value (a bare string/
// number/array - nothing to merge fields onto) falls back to
// `{ success: true, data: value }` instead, since there's no way to spread
// `success` onto something that isn't a keyed object.
//
// `httpStatus` is a transport concern, not a body field - it's read by
// PacketInterceptor/PacketExceptionFilter to set the real response
// status, then stripped before the rest goes out as JSON. It defaults to
// 200 for both success() and failed() (same default either side), and
// only needs to be passed explicitly when the wire-level status should
// actually reflect the result (e.g. 201 Created, or a failure a
// controller builds by hand rather than throwing).
export type PacketFailed = {
  success: false;
  message: string;
  errorCode?: number;
  httpStatus: number;
};

type MergedSuccess<T> = T extends Record<string, unknown>
  ? T & { success: true; httpStatus: number }
  : { success: true; data: T; httpStatus: number };

export type Packet<T> = MergedSuccess<T> | PacketFailed;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export const Packet = {
  success<T>(data: T, message?: string, httpStatus = 200): Packet<T> {
    const meta = { success: true as const, httpStatus, ...(message !== undefined ? { message } : {}) };
    return (isPlainObject(data) ? { ...data, ...meta } : { ...meta, data }) as Packet<T>;
  },
  failed(message: string, errorCode?: number, httpStatus = 200): PacketFailed {
    return { success: false, message, errorCode, httpStatus };
  },
};

// A field every response this API sends carries, whether it's a Packet<T>
// built via Packet.success/failed or a route's own hand-built final
// shape. `httpStatus` is optional (defaults to 200 - see finalizeResponse
// below) since most callers building one by hand don't care to set it.
type FinalResponse = { success: boolean; httpStatus?: number };

// A controller/service can return ANY object already shaped like a
// response (carrying its own `success` field) to skip
// PacketInterceptor's auto-wrapping entirely and have that object sent
// verbatim as the body - not just something built via Packet.success/
// failed. Duck-typed on `success` alone.
export function isFinalResponse(value: unknown): value is FinalResponse {
  return typeof value === 'object' && value !== null && typeof (value as { success?: unknown }).success === 'boolean';
}

// Splits any FinalResponse into what actually goes on the wire (the body)
// vs. what only steers the response itself (httpStatus, defaulting to 200
// when the value never set one).
export function finalizeResponse<T extends FinalResponse>(value: T): { body: Omit<T, 'httpStatus'>; httpStatus: number } {
  const { httpStatus = 200, ...body } = value;
  return { body, httpStatus };
}
