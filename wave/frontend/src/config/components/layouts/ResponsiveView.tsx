import React from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { AppConstants } from '../../constants/AppConstants';

export type ResponsiveViewProps = {
  mobile: React.ReactNode;
  tablet?: React.ReactNode;
  web?: React.ReactNode;
};

function NoTierView({ tier }: { tier: string }) {
  return (
    <View style={styles.noTier}>
      <Text>{`There is no ${tier} view for this application`}</Text>
    </View>
  );
}

export function ResponsiveView({ mobile, tablet, web }: ResponsiveViewProps) {
  const { width } = useWindowDimensions();

  if (width >= AppConstants.breakPoints.tablet) {
    return <>{web ?? <NoTierView tier="Web" />}</>;
  }
  if (width >= AppConstants.breakPoints.mobile) {
    return <>{tablet ?? <NoTierView tier="Tablet" />}</>;
  }
  return <>{mobile}</>;
}

const styles = StyleSheet.create({
  noTier: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
