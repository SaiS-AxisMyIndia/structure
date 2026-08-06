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

const SAMPLE_PROFILE: Profile = {
  id: 'user-1',
  name: 'Priya Sharma',
  email: 'priya.sharma@example.com',
  phone: '+91 98765 43210',
};

const SAMPLE_PROFILE_SECTIONS: ProfileSectionStatus[] = [
  { title: 'About You', percentage: 45 },
  { title: 'Area of Interests', percentage: 60 },
  { title: 'Family Details', percentage: 80 },
  { title: 'Scheme Eligibility', percentage: 100 },
  { title: 'Job Eligibility', percentage: 30 },
  { title: 'Location Details', percentage: 100 },
  { title: 'Other Details', percentage: 20 },
];

export const ProfileRepo = {
  // TODO: swap for a real endpoint once one exists; kept as a single call
  // returning everything the profile screen needs, same shape a real API
  // response would have.
  fetchProfile: (): Promise<ProfileData> =>
    new Promise(resolve =>
      setTimeout(() => resolve({ profile: SAMPLE_PROFILE, sections: SAMPLE_PROFILE_SECTIONS }), 700),
    ),
};
