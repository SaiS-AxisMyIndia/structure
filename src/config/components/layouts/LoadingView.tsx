import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { BorderButton } from '../buttons/BorderButton';

export type LoadingController = {
  error?: string;
  loading: () => boolean;
  hovering: () => boolean;
  isLoading: () => boolean;
  getMessage: () => string | undefined;
  isHovering: () => boolean;
  setLoading: (loading: boolean) => void;
  setError: (message: string) => void;
  setHover: (loading: boolean) => void;
  stopLoading: () => void;
};

export function useLoadingController(initialLoading = true): LoadingController {
  const [loading, setLoadingState] = useState(initialLoading);
  const [error, setErrorState] = useState<string | undefined>(undefined);
  const [hovering, setHovering] = useState(false);

  const setLoading = (value: boolean) => {
    setLoadingState(value);
    setErrorState(undefined);
  };

  const setError = (message: string) => {
    setErrorState(message);
    stopLoading();
  };

  const stopLoading = () => {
    setLoadingState(false);
    setHovering(false);
  };

  return {
    error,
    loading: () => loading,
    hovering: () => hovering,
    isLoading: () => loading || hovering,
    getMessage: () => error,
    isHovering: () => hovering,
    setLoading,
    setError,
    setHover: setHovering,
    stopLoading,
  };
}

export type LoadingViewProps = {
  controller: LoadingController;
  body: React.ReactNode;
  onRefresh?: () => void;
  error?: (message: string) => React.ReactNode;
};

export function LoadingView({ controller, body, onRefresh, error }: LoadingViewProps) {
  const errorMessage = controller.getMessage();

  return (
    <View style={styles.container}>
      {controller.loading() ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      ) : errorMessage ? (
        error ? (
          error(errorMessage)
        ) : (
          <View style={styles.centered}>
            <Text style={styles.error}>{errorMessage}</Text>
            {onRefresh ? <BorderButton label="Retry" onPress={onRefresh} /> : null}
          </View>
        )
      ) : (
        <>
          {body}
          {controller.isHovering() ? (
            <View style={styles.hoverOverlay}>
              <View style={styles.hoverIndicator}>
                <ActivityIndicator size="small" />
              </View>
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  error: {
    color: '#D93025',
    textAlign: 'center',
  },
  hoverOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  hoverIndicator: {
    backgroundColor: 'rgba(255,255,255,1)',
    borderRadius: 20,
    padding: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
});
