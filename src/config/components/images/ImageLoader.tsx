import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageSourcePropType,
  ImageStyle,
  StyleProp,
  StyleSheet,
  View,
} from 'react-native';

export type ImageLoaderProps = {
  source: ImageSourcePropType;
  style?: StyleProp<ImageStyle>;
};

export function ImageLoader({ source, style }: ImageLoaderProps) {
  const [loading, setLoading] = useState(true);

  return (
    <View style={styles.container}>
      <Image
        source={source}
        style={style}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
      />
      {loading ? (
        <ActivityIndicator style={StyleSheet.absoluteFill} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});