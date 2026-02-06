# ゴブリン掲示板

A lightweight 2channel-style imageboard built with Hono, deployable on Cloudflare Workers or Bun.

## Features

- 2ch-compatible posting format
- Shift-JIS and UTF-8 support
- Dark mode toggle
- Admin panel for thread management
- CSRF protection
- Rate limiting
- Mobile responsive design

## Quick Start

### Cloudflare Workers

```bash
# Install dependencies
npm install

# Create D1 database
npx wrangler d1 create mychan-db

# Update wrangler.toml with your database_id

# Run migrations
npx wrangler d1 migrations apply mychan-db --remote

# Deploy
npx wrangler deploy --minify src/worker.js
```

### Bun (Local Development)

```bash
# Install dependencies
bun install

# Start dev server
bun run dev
```

## Configuration

Edit `config/index.js` to customize:

```js
export const config = {
  app: { name: 'ゴブリン掲示板' },
  security: {
    uidSecret: process.env.UID_SECRET,
    csrfSecret: process.env.CSRF_SECRET,
  }
};

export const boards = {
  poverty: {
    title: { name: 'ゴブリン掲示板' },
    nanashi: 'セルフホストの名無し',
    description: '何でも書き込める掲示板です',
  }
};
```

## Tech Stack

- **Runtime**: Cloudflare Workers / Bun
- **Framework**: Hono
- **Database**: Cloudflare D1 / SQLite
- **ORM**: Drizzle

## License

MIT
