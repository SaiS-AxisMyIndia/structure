import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppColors } from '../../theme/AppColors';
import { Themer } from '../../theme/Themer';
import { SvgIcon } from '../images/SvgIcon';
import { SvgIcons } from '../images/svg_icons';
import { NotificationStatus } from './NotificationModel';

export type NotificationTileFrameProps = {
  status: NotificationStatus;
  time: string;
  onPress?: () => void;
  children: React.ReactNode;
};

export function NotificationTileFrame({ status, time, onPress, children }: NotificationTileFrameProps) {
  return (
    <Pressable onPress={onPress} style={[styles.card, Themer.shadow()]}>
      {children}
      <View style={styles.footer}>
        <Text style={status === 'new' ? styles.statusNew : styles.statusRead}>
          {status === 'new' ? 'New' : 'Read'}
        </Text>
        <View style={styles.timeRow}>
          <Text style={styles.time}>{time}</Text>
          <SvgIcon icon={SvgIcons.chevronRight} size={16} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  statusNew: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.primary,
  },
  statusRead: {
    fontSize: 13,
    fontWeight: '500',
    color: AppColors.neutral300,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  time: {
    fontSize: 13,
    color: AppColors.neutral400,
  },
});
