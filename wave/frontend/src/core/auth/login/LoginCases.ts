import { DataResponse, Json, isFailed } from '../../../config/network/data_response';
import { LoginRepo } from './LoginRepo';

// Matches the backend's `auth` table exactly (see
// backend/src/config/entities/auth.entity.ts) - not a free choice. `id` is
// a UUID (a string), not a sequential number.
export type LoginProfile = {
  id: string;
  fName: string;
  lName: string | null;
  mail: string | null;
  phone: string;
  roles: 'user' | 'admin';
};

export type VerifyOtpData = {
  isNewUser: boolean;
  isBlocked: boolean;
  user: LoginProfile | null;
  accessToken: string;
  refreshToken: string;
};

export const LoginCases = {
  sendOtp: (mobile: string): Promise<DataResponse<Json>> => LoginRepo.sendOtp(mobile),

  verifyOtp: async (mobile: string, otp: number): Promise<DataResponse<VerifyOtpData>> => {
    const response = await LoginRepo.verifyOtp(mobile, otp);
    if (isFailed(response)) {return response;}

    return DataResponse.success({
      isNewUser: response.data.get('isNewUser', false),
      isBlocked: response.data.get('isBlocked', false),
      user: response.data.get<LoginProfile | null>('user', null),
      // The backend's own field is `token`, not `accessToken` (see
      // AuthService.verifyOtp's flat response shape) - renamed back to
      // `accessToken` here since that's what setAuthToken/AStorage and the
      // rest of this app's auth plumbing already call it.
      accessToken: response.data.get('token', ''),
      refreshToken: response.data.get('refreshToken', ''),
    });
  },
};
