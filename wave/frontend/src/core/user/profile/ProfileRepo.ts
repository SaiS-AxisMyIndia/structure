import { SAMPLE_PROFILE, SAMPLE_PROFILE_SECTIONS } from '../../../mock_data/ProfileMockData';

export type Profile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  // Falls back to a placeholder avatar in the UI when empty/undefined.
  image?: string;
};

export type ProfileSectionStatus = {
  title: string;
  // 0-100; a section is treated as complete/verified at 100.
  percentage: number;
};

export type ProfileData = {
  profile: Profile;
  sections: ProfileSectionStatus[];
};

export const ProfileRepo = {
  // TODO: swap for a real endpoint once one exists; kept as a single call
  // returning everything the profile screen needs, same shape a real API
  // response would have.
  fetchProfile: (): Promise<ProfileData> =>
    new Promise(resolve =>
      setTimeout(() => resolve({ profile: SAMPLE_PROFILE, sections: SAMPLE_PROFILE_SECTIONS }), 700),
    ),
};
