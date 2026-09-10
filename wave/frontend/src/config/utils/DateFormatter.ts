// Fixed English abbreviations rather than Intl.DateTimeFormat - keeps this
// dependency-free and locale-stable, matching the hardcoded English mock
// strings ('Today'/'Yesterday') already used elsewhere in the app.
const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export const DateFormatter = {
  // Ports the app's DateTime.smart() extension (Dart side) to TS: 'Today'/
  // 'Yesterday' for the last two days, 'N Year(s)' once a year old, the
  // weekday name within the last week, and 'day month' otherwise.
  // Takes the raw server value directly (ISO UTC string or Date) - callers
  // shouldn't have to parse it themselves. Unparseable input returns ''
  // rather than throwing or rendering "Invalid Date".
  smart(input: string | Date): string {
    const date = input instanceof Date ? input : new Date(input);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const today = startOfDay(new Date());
    const yesterday = new Date(today.getTime() - MS_PER_DAY);
    const target = startOfDay(date);

    if (target.getTime() === today.getTime()) {
      return 'Today';
    }
    if (target.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    }

    const daysDiff = Math.round((today.getTime() - target.getTime()) / MS_PER_DAY);

    if (daysDiff >= 365) {
      const years = Math.floor(daysDiff / 365);
      return `${years} ${years === 1 ? 'Year' : 'Years'}`;
    }

    if (daysDiff > 0 && daysDiff < 7) {
      return `${target.getDate()} ${WEEKDAYS_SHORT[target.getDay()]}`;
    }

    return `${target.getDate()} ${MONTHS_SHORT[target.getMonth()]}`;
  },

  // "19 May 2022" - day + full month name + year, for a fixed-date
  // "Since ..."/"Joined ..." style label where smart()'s relative
  // "N Years"/"day month" (no year at all) forms would be too vague.
  // Same unparseable-input convention as smart(): '' rather than
  // throwing or rendering "Invalid Date".
  full(input: string | Date): string {
    const date = input instanceof Date ? input : new Date(input);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return `${date.getDate()} ${MONTHS_FULL[date.getMonth()]} ${date.getFullYear()}`;
  },

  // "MM:SS" - a resend/retry countdown label (e.g. LoginController's own
  // "Resend in 00:42"), not a clock time. Negative input clamps to '00:00'
  // rather than rendering a negative minute.
  countdown(totalSeconds: number): string {
    const seconds = Math.max(0, totalSeconds);
    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${secs}`;
  },

  iso(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },
};
