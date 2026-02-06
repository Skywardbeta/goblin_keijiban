type DateInput = Date | string | number;
type MonthFormat = 'long' | 'short' | 'narrow' | 'numeric' | '2-digit';
type WeekdayFormat = 'long' | 'short' | 'narrow';

interface Timestamp {
  sec: number;
  msec: number;
}

interface ParsedDateResult {
  raw: DateInput;
  date: Date;
  yyyy: string;
  mm: string;
  dd: string;
  HH: string;
  MM: string;
  SS: string;
  SSS: string;
  msec: string;
  dat2ch: string;
  Month: (locale?: string) => string;
  month: (locale?: string) => string;
  Week: (locale?: string) => string;
  week: (locale?: string) => string;
  yymmdd: (s?: string) => string;
  yyyymmdd: (s?: string) => string;
  mmddyy: (s?: string) => string;
  mmddyyyy: (s?: string) => string;
  ddmmyy: (s?: string) => string;
  ddmmyyyy: (s?: string) => string;
}

const zeroPad = (value: number | string, length: number = 2): string => value.toString().padStart(length, '0');
const Join = (arr: string[], separator: string = '-'): string => arr.join(separator);
const isDate = (date: Date): boolean => !Number.isNaN(date.getTime());

const JST_OFFSET = 9 * 60 * 60 * 1000;

export const timestamp = (now: number = Date.now()): Timestamp => ({
  sec: Math.trunc(now / 1000),
  msec: now,
});

export const ParseDate = (raw: DateInput): ParsedDateResult => {
  const utcDate = (raw instanceof Date) ? raw
    : (Number(raw)) ? new Date((String(raw).length === 10) ? Number(raw) * 1000 : Number(raw))
    : new Date(raw);

  if (!isDate(utcDate)) {
    throw new Error('Invalid Date');
  }

  const date = new Date(utcDate.getTime() + JST_OFFSET);

  const yyyy = date.getUTCFullYear().toString();
  const mm = zeroPad(date.getUTCMonth() + 1);
  const dd = zeroPad(date.getUTCDate());
  const HH = zeroPad(date.getUTCHours());
  const MM = zeroPad(date.getUTCMinutes());
  const SS = zeroPad(date.getUTCSeconds());
  const msec = zeroPad(date.getUTCMilliseconds(), 3);

  const Month = (locale: string = 'default', format: MonthFormat = 'long'): string => 
    date.toLocaleString(locale, { month: format, timeZone: 'Asia/Tokyo' });
  const Week = (locale: string = 'default', format: WeekdayFormat = 'long'): string => 
    date.toLocaleString(locale, { weekday: format, timeZone: 'Asia/Tokyo' });

  return {
    raw,
    date,
    yyyy,
    mm,
    dd,
    HH,
    MM,
    SS,
    SSS: msec,
    msec,

    dat2ch: `${yyyy}/${mm}/${dd}(${Week('ja', 'short')}) ${HH}:${MM}:${SS}.${msec}`,

    Month: (locale: string = 'en') => Month(locale, 'long'),
    month: (locale: string = 'en') => Month(locale, 'short'),

    Week: (locale: string = 'en') => Week(locale, 'long'),
    week: (locale: string = 'en') => Week(locale, 'short'),

    yymmdd: (s?: string) => Join([yyyy, mm, dd], s),
    yyyymmdd: (s?: string) => Join([yyyy, mm, dd], s),
    
    mmddyy: (s?: string) => Join([mm, dd, yyyy], s),
    mmddyyyy: (s?: string) => Join([mm, dd, yyyy], s),
    
    ddmmyy: (s?: string) => Join([dd, mm, yyyy], s),
    ddmmyyyy: (s?: string) => Join([dd, mm, yyyy], s),
  };
};
