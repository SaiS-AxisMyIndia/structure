import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppColors } from '../../theme/AppColors';
import { Themer } from '../../theme/Themer';
import { SvgIcon } from '../images/SvgIcon';
import { SvgIcons } from '../images/svg_icons';
import { CircularProgress } from './CircularProgress';
import { IncompleteProfileCardItem, ProfileProgressCardItem, VerifiedProfileCardItem } from './ProfileProgressModel';

type ProfileProgressCardFrameProps = {
  title: string;
  actionLabel: string;
  actionColor?: (typeof AppColors)[keyof typeof AppColors];
  // Small dot flagging this card needs attention, e.g. an incomplete section.
  showAlertDot?: boolean;
  onPress?: () => void;
  children: React.ReactNode;
};

function ProfileProgressCardFrame({
  title,
  actionLabel,
  actionColor = AppColors.secondary,
  showAlertDot = false,
  onPress,
  children,
}: ProfileProgressCardFrameProps) {
  return (
    <Pressable onPress={onPress} style={[styles.card, Themer.shadowWithBorder()]}>
      {showAlertDot ? <View style={styles.alertDot} /> : null}
      <View style={styles.indicator}>{children}</View>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.actionRow}>
        <Text style={[styles.actionLabel, { color: actionColor }]} numberOfLines={1}>
          {actionLabel}
        </Text>
        <SvgIcon icon={SvgIcons.arrowUpRight} size={14} color={actionColor} />
      </View>
    </Pressable>
  );
}

export type VerifiedProfileCardProps = VerifiedProfileCardItem & {
  onPress?: () => void;
};

export function VerifiedProfileCard({ title, actionLabel = 'Edit', onPress }: VerifiedProfileCardProps) {
  return (
    <ProfileProgressCardFrame title={title} actionLabel={actionLabel} onPress={onPress}>
      <View style={styles.badgeOuter}>
        <View style={styles.badgeInner}>
          <SvgIcon icon={SvgIcons.check} size={18} color={AppColors.white} />
        </View>
      </View>
    </ProfileProgressCardFrame>
  );
}

export type IncompleteProfileCardProps = IncompleteProfileCardItem & {
  onPress?: () => void;
};

export function IncompleteProfileCard({
  title,
  percentage,
  actionLabel = 'Complete Now',
  onPress,
}: IncompleteProfileCardProps) {
  return (
    <ProfileProgressCardFrame title={title} actionLabel={actionLabel} showAlertDot onPress={onPress}>
      <CircularProgress percentage={percentage} />
    </ProfileProgressCardFrame>
  );
}

export function renderProfileProgressCard(item: ProfileProgressCardItem, onPress: () => void) {
  switch (item.kind) {
    case 'verified':
      return <VerifiedProfileCard {...item} onPress={onPress} />;
    case 'incomplete':
      return <IncompleteProfileCard {...item} onPress={onPress} />;
  }
}

const styles = StyleSheet.create({
  card: {
    width: 150,
    height: 140,
    alignItems: 'center',
    backgroundColor: AppColors.white,
    borderRadius: 10,
    paddingVertical: 20,
    paddingHorizontal: 12,
    gap: 8,
  },
  alertDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AppColors.secondary,
  },
  indicator: {
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.neutral500,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  badgeOuter: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: AppColors.tertiaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
