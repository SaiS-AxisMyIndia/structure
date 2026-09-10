// NumberFormatter.ts

export const NumberFormatter = {
  /**
   * Generates a unique survey ID formatted as:
   * <year(4)><month(2)><day(2)><24hours(2)><minutes(2)><milliseconds(3)><random4digits(4)>
   * Example output: "2026082116221004444"
   */
  surveyIdGenerator(): string {
    const now = new Date();

    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const milliseconds = now.getMilliseconds().toString().padStart(3, '0');

    // Generates a 4-digit random number between 1000 and 9999
    const random4Digits = Math.floor(1000 + Math.random() * 9000).toString();

    return `${year}${month}${day}${hours}${minutes}${milliseconds}${random4Digits}`;
  },

  mask(value: string | number | null | undefined, visibleStart: number = 2, visibleEnd: number = 2, maskChar: string = '*'): string {
    if (!value) return '';
    const str = value.toString();
    if (str.length <= visibleStart + visibleEnd) return str;

    const start = str.slice(0, visibleStart);
    const end = str.slice(-visibleEnd);
    const masked = maskChar.repeat(str.length - (visibleStart + visibleEnd));

    return `${start}${masked}${end}`;
  },

  formatBytes(bytes: number | null | undefined, decimals: number = 2): string {
    if (!bytes || bytes <= 0) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = (bytes / Math.pow(1024, i)).toFixed(decimals);

    return `${parseFloat(size)} ${units[i]}`;
  },
  compact(value: number | string | null | undefined, decimals: number = 1): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (!num || Number.isNaN(num)) return '0';

    const lookup = [
      { value: 1e9, symbol: 'B' },
      { value: 1e6, symbol: 'M' },
      { value: 1e3, symbol: 'K' },
    ];

    const item = lookup.find((l) => Math.abs(num) >= l.value);
    if (!item) return num.toString();

    const formatted = (num / item.value).toFixed(decimals).replace(/\.0+$|(\.[0-9]*[1-9])0+$/, '$1');
    return `${formatted}${item.symbol}`;
  },
  /**
 * Formats a number with commas based on locale/country code (defaults to India 'en-IN').
 *
 * Examples:
 * - withCommas(1234567.89)            -> "12,34,567.89" (Default: Lakhs/Crores)
 * - withCommas(1234567.89, 'en-US')   -> "1,234,567.89"
 * - withCommas(1234567.89, 'de-DE')   -> "1.234.567,89"
 */
withCommas(
  value: number | string | null | undefined,
  locale: string = 'en-IN',
  options?: Intl.NumberFormatOptions
): string {
  if (value === null || value === undefined || value === '') return '0';

  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(num)) return '0';

  // Preserve decimal length if string input has decimals
  const decimals = typeof value === 'string' && value.includes('.')
    ? value.split('.')[1].length
    : undefined;

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: options?.minimumFractionDigits ?? (decimals !== undefined ? Math.min(decimals, 20) : undefined),
    maximumFractionDigits: options?.maximumFractionDigits ?? (decimals !== undefined ? Math.min(decimals, 20) : undefined),
    ...options,
  }).format(num);
},
};