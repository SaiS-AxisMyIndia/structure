import { RefObject } from 'react';
import WebView, { WebViewMessageEvent } from 'react-native-webview';

type WebViewInstance = InstanceType<typeof WebView>;

export type WebviewMessage = {
  type: string;
  payload?: unknown;
};

// Android delivers native->web messages on `document`, iOS on `window`; this
// relays both onto a single DOM event so page JS only has to listen once.
export const INJECTED_BRIDGE_JS = `
(function () {
  function relay(event) {
    document.dispatchEvent(new CustomEvent('rnbridgemessage', { detail: event.data }));
  }
  document.addEventListener('message', relay);
  window.addEventListener('message', relay);
  true;
})();
`;

export function parseWebviewMessage(raw: string): WebviewMessage | null {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.type === 'string') return parsed as WebviewMessage;
  } catch {
    // ignore malformed payloads from the page
  }
  return null;
}

export function postToWeb(ref: RefObject<WebViewInstance | null>, type: string, payload?: unknown) {
  ref.current?.postMessage(JSON.stringify({ type, payload }));
}

export function onWebMessage(
  event: WebViewMessageEvent,
  handlers: Partial<Record<string, (payload?: unknown) => void>>,
) {
  const message = parseWebviewMessage(event.nativeEvent.data);
  if (!message) return;
  handlers[message.type]?.(message.payload);
}
