import { ApiSheet } from '../../../config/network/api_sheet';
import { SecureCall } from '../../../config/network/secure_call';

export type NewsSummary = {
  greeting: string;
  unreadNewsCount: number;
};

export const NewsRepo = {
  fetchSummary: (): Promise<NewsSummary> => SecureCall<NewsSummary>(ApiSheet.user.news),
};
