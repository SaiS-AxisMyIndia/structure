import { AppColors } from './AppColors';

export type SchemeTagColor = {
  textColor: (typeof AppColors)[keyof typeof AppColors];
  backgroundColor: (typeof AppColors)[keyof typeof AppColors];
};

const KNOWN_TAG_COLORS: Record<string, SchemeTagColor> = {
  'Central Govt': { textColor: AppColors.primary, backgroundColor: AppColors.primary100 },
  'State Govt': { textColor: AppColors.primary, backgroundColor: AppColors.primary200 },
  Matched: { textColor: AppColors.tertiary, backgroundColor: AppColors.tertiary200 },
};

const DEFAULT_TAG_COLOR: SchemeTagColor = { textColor: AppColors.primary, backgroundColor: AppColors.primary200 };

export function getSchemeTagColor(label: string): SchemeTagColor {
  return KNOWN_TAG_COLORS[label] ?? DEFAULT_TAG_COLOR;
}
