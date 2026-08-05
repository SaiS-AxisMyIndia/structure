import { Profile, ProfileRepo, ProfileSectionStatus } from './ProfileRepo';
import { ProfileProgressCardItem } from '../../../config/components/profile/ProfileProgressModel';

export type ProfileOverview = {
  profile: Profile;
  progressCards: ProfileProgressCardItem[];
};

// Incomplete sections need attention, so surface them ahead of ones already
// verified/complete. Stable sort keeps each group's original relative order.
function incompleteFirst(sections: ProfileSectionStatus[]): ProfileSectionStatus[] {
  return [...sections].sort((a, b) => Number(a.percentage >= 100) - Number(b.percentage >= 100));
}

function toProgressCard(section: ProfileSectionStatus): ProfileProgressCardItem {
  return section.percentage >= 100
    ? { kind: 'verified', title: section.title }
    : { kind: 'incomplete', title: section.title, percentage: section.percentage };
}

export const ProfileCases = {
  getProfile: async (): Promise<ProfileOverview> => {
    const { profile, sections } = await ProfileRepo.fetchProfile();
    return { profile, progressCards: incompleteFirst(sections).map(toProgressCard) };
  },
  // "Inactive" sections are ones still under 100% - i.e. not yet complete/verified.
  listInactiveProgressCards: async (): Promise<ProfileProgressCardItem[]> => {
    const { sections } = await ProfileRepo.fetchProfile();
    return sections.filter(section => section.percentage < 100).map(toProgressCard);
  },
};
