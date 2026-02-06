import { boards, config } from '$config';
import { sjis } from '$lib/utils';
import type { MiddlewareHandler } from 'hono';

declare const globalThis: {
  __rateLimitStore?: Map<string, { count: number; resetTime: number }>;
};

globalThis.__rateLimitStore = globalThis.__rateLimitStore ?? new Map();
const rateLimitStore = globalThis.__rateLimitStore;

const cleanupRateLimit = (): void => {
  const now = Date.now();
  if (rateLimitStore.size > 500) {
    for (const [key, data] of rateLimitStore.entries()) {
      if (now > data.resetTime) rateLimitStore.delete(key);
    }
  }
};

const CSRF_SECRET = config.security?.csrfSecret ?? 'default-csrf-secret-change-me';
const TOKEN_TTL = 3600000;

export const checkBoard = (): MiddlewareHandler => async (c: any, next) => {
  const board = c.req.param('board');
  if (!(board in boards)) return c.notFound();
  await next();
};

export const realIP = (): MiddlewareHandler => async (c: any, next) => {
  const isCloudflare = !!c.env?.DB;
  c.realip = isCloudflare ? (c.req.header('CF-Connecting-IP') ?? '0.0.0.0') : '127.0.0.1';
  await next();
};

export const sjisResponse = (): MiddlewareHandler => async (c: any, next) => {
  c.sjis = {
    text: (value: string, status: number = 200) => {
      c.header('Content-Type', 'text/plain; charset=shift_jis');
      return c.body(sjis(value), status);
    },
    html: (value: string, status: number = 200) => {
      c.header('Content-Type', 'text/html; charset=shift_jis');
      return c.body(sjis(value), status);
    }
  };
  await next();
};

interface RateLimitOptions {
  windowMs?: number;
  max?: number;
  keyPrefix?: string;
  message?: string;
}

export const rateLimit = (options: RateLimitOptions = {}): MiddlewareHandler => {
  const { windowMs = 60000, max = 10, keyPrefix = 'rate', message = 'ＥＲＲＯＲ: リクエストが多すぎます' } = options;
  
  return async (c: any, next) => {
    cleanupRateLimit();
    const ip = c.realip ?? '127.0.0.1';
    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();
    
    let data = rateLimitStore.get(key);
    if (!data || now > data.resetTime) {
      data = { count: 0, resetTime: now + windowMs };
    }
    
    data.count++;
    rateLimitStore.set(key, data);
    
    c.header('X-RateLimit-Limit', String(max));
    c.header('X-RateLimit-Remaining', String(Math.max(0, max - data.count)));
    
    if (data.count > max) {
      c.header('Retry-After', String(Math.ceil((data.resetTime - now) / 1000)));
      return c.sjis ? c.sjis.text(message, 429) : c.text(message, 429);
    }
    
    await next();
  };
};

const hmacSign = async (data: string): Promise<string> => {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(CSRF_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
};

export const generateCSRFToken = async (): Promise<string> => {
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = Array.from(crypto.getRandomValues(new Uint8Array(12)))
    .map(b => b.toString(16).padStart(2, '0')).join('');
  const payload = `${timestamp}.${nonce}`;
  const sig = await hmacSign(payload);
  return `${timestamp}.${nonce}.${sig.substring(0, 16)}`;
};

export const validateCSRFToken = async (token: string | undefined | null): Promise<boolean> => {
  if (!token || typeof token !== 'string') return false;
  
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  
  const [timestamp, nonce, sig] = parts;
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts)) return false;
  
  const now = Math.floor(Date.now() / 1000);
  if (now - ts > TOKEN_TTL / 1000) return false;
  
  const payload = `${timestamp}.${nonce}`;
  const expectedSig = await hmacSign(payload);
  return sig === expectedSig.substring(0, 16);
};

interface CSRFOptions {
  enforce?: boolean;
  skipPaths?: string[];
}

export const csrf = (options: CSRFOptions = {}): MiddlewareHandler => {
  const { enforce = true, skipPaths = [] } = options;
  
  return async (c: any, next) => {
    c.csrfToken = await generateCSRFToken();
    
    if (['GET', 'HEAD', 'OPTIONS'].includes(c.req.method)) {
      await next();
      return;
    }
    
    const path = c.req.path;
    if (skipPaths.some((p: string) => path.startsWith(p))) {
      await next();
      return;
    }
    
    const contentType = c.req.header('Content-Type') ?? '';
    let token = c.req.header('X-CSRF-Token');
    
    if (!token && (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data'))) {
      try {
        const body = await c.req.parseBody();
        token = body._csrf ?? body.csrf_token;
        c.parsedBody = body;
      } catch {}
    }
    
    const valid = await validateCSRFToken(token);
    if (!valid && enforce) {
      return c.sjis ? c.sjis.text('ＥＲＲＯＲ: 不正なリクエストです', 403) : c.text('Invalid request', 403);
    }
    
    await next();
  };
};

export const securityHeaders = (): MiddlewareHandler => async (c, next) => {
  c.header('X-Frame-Options', 'SAMEORIGIN');
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-XSS-Protection', '1; mode=block');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('Content-Security-Policy', "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; img-src 'self' data: https:; frame-src https://challenges.cloudflare.com; form-action 'self'; frame-ancestors 'self'");
  await next();
};

export const requestLogger = (): MiddlewareHandler => async (c: any, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  console.log(`[${new Date().toISOString()}] ${c.req.method} ${c.req.path} ${c.res.status} ${duration}ms - ${c.realip ?? 'unknown'}`);
};
