import { ApiSheet } from '../../../config/network/api_sheet';
import { SecureCall } from '../../../config/network/secure_call';
import { DataResponse, Json } from '../../../config/network/data_response';
import { DeviceInfo } from '../../../config/device/DeviceInfo';

export const LoginRepo = {
  // `identifier` - not `mobileNumber` - since the backend accepts either a
  // phone number or an email here (see backend/src/core/user/auth/
  // auth.controller.ts's own GenerateOtpDto/ValidateOtpDto).
  sendOtp: async (identifier: string): Promise<DataResponse<Json>> => {
    const deviceId = await DeviceInfo.getDeviceId();
    return SecureCall.post(ApiSheet.user.generateOtp, { identifier, deviceId });
  },

  verifyOtp: async (identifier: string, otp: number): Promise<DataResponse<Json>> => {
    const [deviceId, deviceName] = await Promise.all([DeviceInfo.getDeviceId(), DeviceInfo.getDeviceName()]);
    return SecureCall.post(
      ApiSheet.user.validateOtp,
      { identifier, otp, deviceId },
      { headers: { 'x-device-name': deviceName } },
    );
  },
};
