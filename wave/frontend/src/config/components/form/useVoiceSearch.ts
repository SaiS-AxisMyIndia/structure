import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import Toast from 'react-native-simple-toast';
import Voice, { SpeechErrorEvent, SpeechResultsEvent } from '@react-native-voice/voice';
import { Permissions } from '../../permission/Permissions';

// @react-native-voice/voice has no web implementation - its native module is
// undefined there, so even Voice.destroy().then(Voice.removeAllListeners) on
// unmount throws ("Cannot set properties of undefined (setting
// 'onSpeechStart')") instead of silently no-op'ing. Skip touching Voice at
// all on web rather than relying on it to fail gracefully.
const isVoiceSupported = Platform.OS !== 'web';

export type VoiceSearchController = {
  isListening: boolean;
  toggle: () => void;
};

// Android's SpeechRecognizer reports the ordinary "didn't catch that" case as
// numeric codes 5 (client-side cancel) or 7 (no match). iOS's SFSpeechRecognizer
// reports the equivalent (silence/timeout) through the same onSpeechError path,
// but as a non-numeric "recognition_fail" code with the underlying NSError code
// embedded in the message (kAFAssistantErrorDomain 1110 = "No speech detected") -
// see @react-native-voice/voice's ios/Voice/Voice.m. Every other iOS error (denied
// permission, restricted, unavailable, etc.) comes through as a bare message with
// no code at all, so it must still surface as a toast rather than be swallowed.
function isNoSpeechDetected(e: SpeechErrorEvent): boolean {
  const code = e.error?.code;
  return code === '5' || code === '7' || (code === 'recognition_fail' && !!e.error?.message?.startsWith('1110/'));
}

// Thin wrapper around @react-native-voice/voice (native SpeechRecognizer on
// Android, native SFSpeechRecognizer on iOS - no cloud transcription API
// involved) that asks for microphone permission via Permissions before
// starting, and reports the final transcript back through `onResult`.
export function useVoiceSearch(onResult: (text: string) => void): VoiceSearchController {
  const [isListening, setIsListening] = useState(false);
  // Voice's event setters are module-level singletons, not tied to this
  // hook instance - stash the latest onResult in a ref so the listener
  // registered once in the effect below always calls the current one.
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => {
    if (!isVoiceSupported) {return;}

    Voice.onSpeechResults = (e: SpeechResultsEvent) => {
      const text = e.value?.[0];
      if (text) {onResultRef.current(text);}
    };
    Voice.onSpeechEnd = () => setIsListening(false);
    Voice.onSpeechError = (e: SpeechErrorEvent) => {
      setIsListening(false);
      if (!isNoSpeechDetected(e)) {
        // __DEV__ suffix surfaces the raw native error so it's actionable
        // without needing to attach a debugger/logcat - strip if this gets noisy.
        const detail = __DEV__ ? ` (${e.error?.code ?? 'no code'}: ${e.error?.message ?? 'no message'})` : '';
        Toast.show(`Couldn't start voice search${detail}`, Toast.LONG);
      }
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const start = async () => {
    if (!isVoiceSupported) {
      Toast.show('Voice search is not available on web.', Toast.SHORT);
      return;
    }

    const permission = await Permissions.request('microphone');
    if (permission === 'blocked') {
      Toast.show('Microphone access is blocked - enable it in Settings.', Toast.LONG);
      Permissions.openSettings();
      return;
    }
    if (permission === 'denied') {
      Toast.show('Microphone permission is required for voice search.', Toast.SHORT);
      return;
    }

    try {
      setIsListening(true);
      await Voice.start('en-US');
    } catch (err) {
      setIsListening(false);
      const detail = __DEV__ ? ` (${err instanceof Error ? err.message : String(err)})` : '';
      Toast.show(`Voice search is unavailable on this device.${detail}`, Toast.LONG);
    }
  };

  const stop = async () => {
    setIsListening(false);
    try {
      await Voice.stop();
    } catch {
      // Rejects if nothing was in progress - safe to ignore.
    }
  };

  return {
    isListening,
    toggle: () => {
      if (isListening) {
        stop();
      } else {
        start();
      }
    },
  };
}
