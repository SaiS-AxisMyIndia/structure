// Wire-compatible with the frontend's own DataResponse (see
// frontend/src/config/network/data_response.ts): every response this API
// sends - success or failure - is shaped like this, so SecureCall's
// `defaultResponseInterceptor` (which reads `body.success`/`body.data`/
// `body.message`) can unwrap it without any per-route special-casing.
//
// Mirrors the same idea as Gerogo\Packet on the PHP side (see
// ap/packages/gerogo/Packet.php): `httpStatus` is a transport concern, not
// a body field - it's read by PacketInterceptor/PacketExceptionFilter to
// set the real response status, then stripped before the rest goes out as
// JSON. It defaults to 200 for both success() and failed() (same default
// either side), and only needs to be passed explicitly when the wire-level
// status should actually reflect the result (e.g. 201 Created, or a
// failure a controller builds by hand rather than throwing).
export type PacketSuccess<T> = {
  success: true;
  data: T;
  message?: string;
  httpStatus: number;
};

export type PacketFailed = {
  success: false;
  message: string;
  errorCode?: number;
  httpStatus: number;
};

export type Packet<T> = PacketSuccess<T> | PacketFailed;

export const Packet = {
  success: <T>(data: T, message?: string, httpStatus = 200): PacketSuccess<T> => ({
    success: true,
    data,
    message,
    httpStatus,
  }),
  failed: (message: string, errorCode?: number, httpStatus = 200): PacketFailed => ({
    success: false,
    message,
    errorCode,
    httpStatus,
  }),
};

// A controller can return a Packet directly (e.g. `Packet.success(user,
// 'Created', 201)`) to control its own httpStatus/message instead of
// getting auto-wrapped - PacketInterceptor uses this to tell the two
// apart. Duck-typed on shape rather than `instanceof` since Packet.success/
// failed build plain objects, not class instances.
export function isPacket(value: unknown): value is Packet<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { success?: unknown }).success === 'boolean' &&
    typeof (value as { httpStatus?: unknown }).httpStatus === 'number'
  );
}

// Splits a Packet into what actually goes on the wire (the JSON body) vs.
// what only steers the response itself (httpStatus) - see the docblock
// above and Gerogo\Packet::toArray()'s own "httpStatus never appears here
// at all" note.
export function packetBody<T>(packet: Packet<T>): Omit<Packet<T>, 'httpStatus'> {
  const { httpStatus: _httpStatus, ...body } = packet;
  return body;
}
