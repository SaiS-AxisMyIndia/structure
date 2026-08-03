import { Profile, ProfileRepo } from './ProfileRepo';

export const ProfileCases = {
  getProfile: (): Promise<Profile> => ProfileRepo.fetchProfile(),
};
