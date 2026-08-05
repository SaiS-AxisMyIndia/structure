export type ProfileProgressCardBase = {
  title: string;
};

export type VerifiedProfileCardItem = ProfileProgressCardBase & {
  kind: 'verified';
  actionLabel?: string;
};

export type IncompleteProfileCardItem = ProfileProgressCardBase & {
  kind: 'incomplete';
  // 0-100
  percentage: number;
  actionLabel?: string;
};

export type ProfileProgressCardItem = VerifiedProfileCardItem | IncompleteProfileCardItem;
