import { AppColors } from './AppColors';

export const Themer = {
  shadow: (color?: (typeof AppColors)[keyof typeof AppColors]) => ({
    shadowColor: color || AppColors.secondaryBg,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  }),

  bottomLine: (
    width: number = 0.7,
    radius: number = 10,
    color?: (typeof AppColors)[keyof typeof AppColors],
  ) => ({
    borderBottomColor: color || AppColors.secondaryBg,
    borderBottomWidth: width,
    borderRadius: radius,
  }),

  bottomShadow: (color?: (typeof AppColors)[keyof typeof AppColors]) => ({
    shadowColor: color || AppColors.secondaryBg,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  }),

  shadowWithBorder: (color?: (typeof AppColors)[keyof typeof AppColors], borderColor?: (typeof AppColors)[keyof typeof AppColors]) => ({
    shadowColor: color || AppColors.secondaryBg,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    borderColor: borderColor || AppColors.secondaryBg,
    borderWidth: 1,
  }),

  iosRadius: (radius: number) => ({
    borderRadius: radius,
    borderCurve: 'continuous' as const,
    overflow: 'hidden' as const,
  }),

  primaryGradient: {
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
    colors: [AppColors.primary, AppColors.secondary],
  },
};
