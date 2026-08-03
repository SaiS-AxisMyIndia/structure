import React from 'react';
import { ImageSourcePropType, Pressable, StyleSheet, Text, View } from 'react-native';
import { SvgIcon } from '../images/SvgIcon';
import { SvgIcons } from '../images/svg_icons';
import { AppColors } from '../../theme/AppColors';
import { Themer } from '../../theme/Themer';

export const SurveyorBottomType = {
  dashboard: 'dashboard',
  surveys: 'surveys',
  needs: 'needs',
  settings: 'settings',
} as const;

export type SurveyorBottomType = (typeof SurveyorBottomType)[keyof typeof SurveyorBottomType];

export type SurveyorBottomBarProps = {
  value: SurveyorBottomType;
  onChange: (value: SurveyorBottomType) => void;
};

const TABS: Array<{ type: SurveyorBottomType; label: string; icon: ImageSourcePropType }> = [
  { type: SurveyorBottomType.dashboard, label: 'Dashboard', icon: SvgIcons.dashboard },
  { type: SurveyorBottomType.surveys, label: 'Surveys', icon: SvgIcons.survey },
  { type: SurveyorBottomType.needs, label: 'Needs', icon: SvgIcons.needs },
  { type: SurveyorBottomType.settings, label: 'Settings', icon: SvgIcons.settings },
];

export function SurveyorBottomBar({ value, onChange }: SurveyorBottomBarProps) {
  return (
    <View style={styles.container}>
      {TABS.map(tab => {
        const active = tab.type === value;
        const color = active ? AppColors.primary : AppColors.neutral400;

        return (
          <Pressable
            key={tab.type}
            onPress={() => onChange(tab.type)}
            hitSlop={8}
            style={styles.tab}
          >
            <SvgIcon icon={tab.icon} size={24} color={color} />
            <Text style={[styles.label, { color }]} numberOfLines={1}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: AppColors.white,
    paddingVertical: 8,
    ...Themer.bottomShadow(),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
});
