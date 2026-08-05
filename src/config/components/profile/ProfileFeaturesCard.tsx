import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import LinearGradient from 'react-native-linear-gradient';
import { AppColors } from '../../theme/AppColors';
import { Themer } from '../../theme/Themer';
import { SvgIcon } from '../images/SvgIcon';
import { SvgIcons } from '../images/svg_icons';
import { ProfileFeatureItem } from './ProfileFeaturesModel';

const ICON_SIZE = 20;

function GradientIcon({ icon }: { icon: ProfileFeatureItem['icon'] }) {
  return (
    <MaskedView maskElement={<SvgIcon icon={icon} size={ICON_SIZE} color={AppColors.primary} />}>
      <LinearGradient
        start={Themer.primaryGradient.start}
        end={Themer.primaryGradient.end}
        colors={Themer.primaryGradient.colors}
        style={styles.iconGradient}
      />
    </MaskedView>
  );
}

export type ProfileFeaturesCardProps = {
  title?: string;
  items: ProfileFeatureItem[];
  onItemPress?: (item: ProfileFeatureItem) => void;
};

export function ProfileFeaturesCard({ title = 'Features', items, onItemPress }: ProfileFeaturesCardProps) {
  return (
    <View style={[styles.card, Themer.shadow()]}>
      <MaskedView maskElement={<Text style={styles.title}>{title}</Text>}>
        <LinearGradient
          start={Themer.primaryGradient.start}
          end={Themer.primaryGradient.end}
          colors={Themer.primaryGradient.colors}
        >
          <Text style={[styles.title, styles.titleMaskSpacer]}>{title}</Text>
        </LinearGradient>
      </MaskedView>
      {items.map(item => (
        <Pressable key={item.title} onPress={() => onItemPress?.(item)} style={styles.row}>
          <GradientIcon icon={item.icon} />
          <Text style={styles.label} numberOfLines={1}>
            {item.title}
          </Text>
          <SvgIcon icon={SvgIcons.chevronRight} size={18} color={AppColors.neutral300} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.primaryBg,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.primary,
    marginBottom: 4,
  },
  titleMaskSpacer: {
    opacity: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  label: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: AppColors.neutral500,
  },
  iconGradient: {
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
});
