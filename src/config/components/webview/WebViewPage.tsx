import React, { useEffect, useState } from 'react';
import { NativeSyntheticEvent, StyleSheet, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { ScreenView } from '../layouts/ScreenView';
import { WebViewBar } from '../appbar/WebViewBar';
import { LoadingView, useLoadingController } from '../layouts/LoadingView';
import { getFlavour } from '../../flavour/flavour';
import { AppConstants, WebviewTag } from '../../constants/AppConstants';
import { INJECTED_BRIDGE_JS, onWebMessage } from './webviewBridge';

type WebviewQuery = {
  url?: string;
  tag?: WebviewTag;
};

export function WebViewPage() {
  const { params } = useRoute();
  const { url: queryUrl, tag } = (params ?? {}) as WebviewQuery;

  const url = tag ? AppConstants.webviewTags[tag].url[getFlavour()] : queryUrl;

  const [title, setTitle] = useState('WebView');
  const loadingController = useLoadingController();

  useEffect(() => {
    if (!url) loadingController.setError('Unable to load this page.');
  }, [url]);

  const handleMessage = (event: WebViewMessageEvent) => {
    onWebMessage(event, {
      // Extend with page-specific message types as the bridge grows.
    });
  };

  const handleLoadEnd = (event: NativeSyntheticEvent<{ title: string }>) => {
    if (event.nativeEvent.title) setTitle(event.nativeEvent.title);
    loadingController.setLoading(false);
  };

  const showOverlay = loadingController.isLoading() || !!loadingController.getMessage();

  return (
    <ScreenView
      appbar={<WebViewBar title={title} />}
      body={
        <View style={styles.body}>
          {url ? (
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
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'white',
  },
});