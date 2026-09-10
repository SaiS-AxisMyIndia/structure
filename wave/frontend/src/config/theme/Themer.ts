import { AppColors } from './AppColors';

export const Themer = {
  shadow: (color?: (typeof AppColors)[keyof typeof AppColors]) => ({
    shadowColor: color || AppColors.secondary100,
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
    borderBottomColor: color || AppColors.secondary100,
    borderBottomWidth: width,
    borderRadius: radius,
  }),

  bottomShadow: (color?: (typeof AppColors)[keyof typeof AppColors]) => ({
    shadowColor: color || AppColors.secondary100,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  }),

  shadowWithBorder: (color?: (typeof AppColors)[keyof typeof AppColors], borderColor?: (typeof AppColors)[keyof typeof AppColors]) => ({
    shadowColor: color || AppColors.secondary100,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    borderColor: borderColor || AppColors.secondary100,
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
    colors: [AppColors.primaryG1, AppColors.primaryG2],
    // locations: [0.1, 0.5],
  },
  secondaryGradient: {
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
    colors: [AppColors.secondaryG1, AppColors.secondary],
    locations: [0.1, 0.5],
  },

  teritaryGradient: {
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
    colors: [AppColors.teritaryG1, AppColors.teritaryG2],
  },

  greenGradient: {
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
    colors: [AppColors.green200, AppColors.white],
  },
  yellowGradient: {
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
    colors: [AppColors.yellow200, AppColors.white],
  },
  purpleGradient: {
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
    colors: [AppColors.purple200, AppColors.white],
  },
  pealGradient: {
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
    colors: [AppColors.pealG1, AppColors.pealG2],
  },

  greenBorder: AppColors.green200,
  yellowBorder: AppColors.yellow200,
  purpleBorder: AppColors.purple200,
};
