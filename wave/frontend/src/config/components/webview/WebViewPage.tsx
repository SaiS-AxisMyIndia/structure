import React, { useEffect, useState } from 'react';
import { Linking, NativeSyntheticEvent, Platform, StyleSheet, Text, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { ScreenView } from '../layouts/ScreenView';
import { WebViewBar } from '../appbar/WebViewBar';
import { LoadingView, useLoadingController } from '../layouts/LoadingView';
import { ElevatedButton } from '../buttons/ElevatedButton';
import { AppColors } from '../../theme/AppColors';
import { getEnvironment } from '../../flavour/flavour';
import { AppConstants, WebviewTag } from '../../constants/AppConstants';
import { INJECTED_BRIDGE_JS, onWebMessage } from './webviewBridge';

type WebviewQuery = {
  url?: string;
  tag?: WebviewTag;
};

export function WebViewPage() {
  const { params } = useRoute();
  const { url: queryUrl, tag } = (params ?? {}) as WebviewQuery;

  const url = tag ? AppConstants.webviewTags[tag].url[getEnvironment()] : queryUrl;

  const [title, setTitle] = useState('WebView');
  const loadingController = useLoadingController();
  const isWeb = Platform.OS === 'web';

  useEffect(() => {
    if (!url) {
      loadingController.setError('Unable to load this page.');
      return;
    }
    if (isWeb) {
      Linking.openURL(url).catch(() => {});
      loadingController.setLoading(false);
    }
    // loadingController is a fresh object every render (see
    // useLoadingController) - only url/isWeb actually changing should
    // re-run this, not every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, isWeb]);

  const handleMessage = (event: WebViewMessageEvent) => {
    onWebMessage(event, {
    });
  };

  const handleLoadEnd = (event: NativeSyntheticEvent<{ title: string }>) => {
    if (event.nativeEvent?.title) {setTitle(event.nativeEvent.title);}
    loadingController.setLoading(false);
  };

  const showOverlay = loadingController.isLoading() || !!loadingController.getMessage();

  return (
    <ScreenView
      appbar={<WebViewBar title={title} />}
      body={
        <View style={styles.body}>
          {url && isWeb ? (
            <View style={styles.externalFallback}>
              <Text style={styles.externalFallbackText}>
                This page can't be shown inside the app on web - it should have opened in a new
                browser tab. If nothing happened, your browser likely blocked the popup.
              </Text>
              <ElevatedButton label="Open in new tab" onPress={() => Linking.openURL(url).catch(() => {})} />
            </View>
          ) : null}
          {url && !isWeb ? (
            <WebView
              source={{ uri: url }}
              style={styles.webview}
              injectedJavaScript={INJECTED_BRIDGE_JS}
              onMessage={handleMessage}
              onLoad={handleLoadEnd}
              onLoadEnd={handleLoadEnd}
              onError={() => loadingController.setError('Failed to load this page.')}
            />
          ) : null}
          {showOverlay ? (
            <View style={styles.overlay}>
              <LoadingView controller={loadingController} body={null} />
            </View>
          ) : null}
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  externalFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  externalFallbackText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    color: AppColors.neutral400,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'white',
  },
});
