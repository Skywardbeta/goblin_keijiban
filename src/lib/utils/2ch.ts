import { sha1, ParseDate } from '$lib/utils';
import { config } from '$config';
import type { Comment, ParsedDat, DATOptions } from '../../types';

export const genUID = async (c: any, bbs: string): Promise<string> => {
  const ip = await sha1(c.realip ?? '127.0.0.1');
  const date = ParseDate(new Date()).yyyymmdd();
  const secret = c.env?.UID_SECRET ?? process.env.UID_SECRET ?? config.security?.uidSecret ?? 'default-secret';
  const data = ip.hex.slice(-4) + bbs + date + secret;
  const { hex } = await sha1(data);
  return btoa(hex).replace(/[+/=]/g, '').slice(0, 8);
};

export const DAT = (options: DATOptions = {}): string => {
  const { id, name, mail, message, subject } = options;
  const timestamp = ParseDate(new Date()).dat2ch;
  const safe = (s: string | undefined): string => (s ?? '').replace(/<>/g, '＜＞');
  
  return [
    safe(name),
    safe(mail),
    `${timestamp} ID:${id ?? '???'}`,
    safe(message).replace(/\r?\n/g, '<br>'),
    safe(subject)
  ].join('<>') + '\n';
};

export const parseDat = (dat: string | null | undefined): ParsedDat => {
  if (!dat || typeof dat !== 'string') return { res: 0, subject: '', comments: [] };

  const lines = dat.split('\n').filter(line => line.trim());
  if (lines.length === 0) return { res: 0, subject: '', comments: [] };

  const firstLineParts = lines[0].split('<>');
  const subject = firstLineParts[4] ?? firstLineParts.pop() ?? '';

  const comments: Comment[] = lines.map((line, index) => {
    const parts = line.split('<>');
    if (parts.length < 4) {
      return { id: index + 1, name: '???', mail: '', date: null, rawDate: '', uid: '???', be: null, message: '', rawMessage: '' };
    }

    const [name, mail, meta, rawMessage] = parts;
    const [rawDate, uid, be] = (meta ?? '').split(/ ID:| BE:/);

    let date: Date | null = null;
    if (rawDate) {
      const m = rawDate.match(/(\d{4})\/(\d{2})\/(\d{2})\([^)]+\)\s*(\d{2}):(\d{2}):(\d{2})\.?(\d{0,3})?/);
      if (m) {
        date = new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10), parseInt(m[4], 10), parseInt(m[5], 10), parseInt(m[6], 10), parseInt(m[7] || '0', 10));
      }
    }

    return {
      id: index + 1,
      name: name ?? '',
      mail: mail ?? '',
      date,
      rawDate: rawDate ?? '',
      uid: uid ?? '',
      be: be ?? null,
      message: rawMessage ?? '',
      rawMessage: rawMessage ?? '',
    };
  });

  return { res: comments.length, subject, comments };
};
