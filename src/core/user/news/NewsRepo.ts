import { ApiSheet } from '../../../config/network/api_sheet';
import { secureCall } from '../../../config/network/secure_call';

export type NewsSummary = {
  greeting: string;
  unreadNewsCount: number;
};

export const NewsRepo = {
  fetchSummary: (): Promise<NewsSummary> => secureCall<NewsSummary>(ApiSheet.user.news),
};
