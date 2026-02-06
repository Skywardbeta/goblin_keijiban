import type { AppConfig, Boards, BoardConfig } from '../src/types';

export const config: AppConfig = {
  app: {
    name: 'ゴブリン掲示板',
    version: '0.2.0',
  },
  security: {
    uidSecret: process.env.UID_SECRET ?? 'change-this-in-production',
    csrfSecret: process.env.CSRF_SECRET ?? 'change-this-in-production',
  },
  turnstile: {
    enabled: process.env.TURNSTILE_ENABLED === 'true',
    siteKey: process.env.TURNSTILE_SITE_KEY ?? '',
    secretKey: process.env.TURNSTILE_SECRET_KEY ?? '',
  },
  moderation: {
    adminPasswordHash: process.env.ADMIN_PASSWORD_HASH ?? null,
    bannedWords: (process.env.BANNED_WORDS ?? '').split(',').filter(Boolean),
    maxPostsPerThread: 1000,
  },
};

export const boards: Boards = {
  poverty: {
    cookie: false,
    turnstile: false,
    title: { name: 'ゴブリン掲示板', logo: null },
    nanashi: 'ホスト名',
    description: '',
    limit: { subject: 128, name: 96, mail: 96, message: 4096, thread: 8 },
    rules: ['荒らし・スパム歓迎', '個人情報の投稿歓迎', '法律に違反する内容禁止', 'Vibecoder禁止'],
  },
};

export const getBoardConfig = (boardName: string): BoardConfig | null => {
  const board = boards[boardName];
  if (!board) return null;
  return { ...board, limit: { subject: 128, name: 96, mail: 96, message: 4096, thread: 8, ...board.limit } };
};
