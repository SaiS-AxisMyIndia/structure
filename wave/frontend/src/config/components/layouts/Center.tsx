import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { AppConstants } from '../../constants/AppConstants';

export type CenterProps = {
  children?: React.ReactNode;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  style?: StyleProp<ViewStyle>;
};

export function Center({ children, minWidth, maxWidth, minHeight, maxHeight, style }: CenterProps) {
  return (
    <View style={[styles.container, { minWidth, maxWidth, minHeight, maxHeight }, style]}>
      {children}
    </View>
  );
}

export type SizedCenterProps = Omit<CenterProps, 'maxWidth'>;

export function MobileCenter(props: SizedCenterProps) {
  return <Center {...props} maxWidth={AppConstants.maxWidth.mobile} />;
}

export function TabletCenter(props: SizedCenterProps) {
  return <Center {...props} maxWidth={AppConstants.maxWidth.tablet} />;
}

export function WebCenter(props: SizedCenterProps) {
  return <Center {...props} maxWidth={AppConstants.maxWidth.web} />;
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    // Centers this box itself within its parent once `maxWidth` caps it -
    // not its children, which should stretch to fill this box's own width.
    alignSelf: 'center',
    alignItems: 'stretch',
    justifyContent: 'center',
  },
});
