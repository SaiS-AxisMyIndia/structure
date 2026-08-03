import { ApiSheet } from '../../../config/network/api_sheet';
import { secureCall } from '../../../config/network/secure_call';

export type Profile = {
  id: string;
  name: string;
  email: string;
  phone: string;
};

export const ProfileRepo = {
  fetchProfile: (): Promise<Profile> => secureCall<Profile>(ApiSheet.user.profile),
};
