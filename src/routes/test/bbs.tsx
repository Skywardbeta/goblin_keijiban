import { z } from 'zod';
import { sjis2utf8, DAT, genUID } from '$lib/utils';
import { boards, config } from '$config';
import { createThread, updateThread, getThread } from '$db';
import { verifyTurnstile } from '$lib/layouts';
import { validateCSRFToken } from '$lib/middlewares';

const containsBannedWords = (content) => {
  const bannedWords = config.moderation?.bannedWords ?? [];
  if (bannedWords.length === 0) return false;
  const lower = content.toLowerCase();
  return bannedWords.some(w => w && lower.includes(w.toLowerCase()));
};

const validateContent = (message) => {
  if (!message?.trim()) return { valid: false, error: '本文を入力してください' };
  if (containsBannedWords(message)) return { valid: false, error: '禁止されている単語が含まれています' };
  if (/(.)\1{20,}/.test(message)) return { valid: false, error: '連続した文字の繰り返しは禁止されています' };
  if ((message.match(/https?:\/\//gi) || []).length > 10) return { valid: false, error: 'URLが多すぎます' };
  return { valid: true };
};

const decodeFormData = (str) => {
  const result = {};
  for (const pair of str.split('&')) {
    if (!pair) continue;
    const idx = pair.indexOf('=');
    if (idx === -1) continue;
    const key = pair.slice(0, idx);
    const value = pair.slice(idx + 1);
    try {
      // + is space in form encoding, %2B is literal +
      result[decodeURIComponent(key.replace(/\+/g, ' '))] = 
        decodeURIComponent(value.replace(/\+/g, ' '));
    } catch {
      result[key] = value;
    }
  }
  return result;
};

export default {
  validator: async (c, next) => {
    const arrayBuffer = await c.req.arrayBuffer();
    const decode = new TextDecoder().decode(arrayBuffer);
    const isUtf8 = decode.includes('新規スレッド作成') || decode.includes('書き込む');
    const form = isUtf8 ? decodeFormData(decode) : decodeFormData(sjis2utf8(arrayBuffer));

    // Validate CSRF token
    const csrfToken = form._csrf;
    const csrfValid = await validateCSRFToken(csrfToken);
    if (!csrfValid) {
      return c.sjis.text('ＥＲＲＯＲ: 不正なリクエストです。ページを再読み込みしてください。', 403);
    }

    if (!(form.bbs in boards)) {
      return c.sjis.text('ＥＲＲＯＲ: 板が存在しません', 400);
    }

    const limit = boards[form.bbs].limit ?? {};
    const schema = z.object({
      bbs: z.string().trim().min(1),
      key: z.coerce.number().positive().optional(),
      FROM: z.string().trim().max(limit.name ?? 96).optional().default(''),
      mail: z.string().trim().max(limit.mail ?? 96).optional().default(''),
      subject: z.string().trim().max(limit.subject ?? 128).optional(),
      MESSAGE: z.string().min(1).max(limit.message ?? 4096),
      submit: z.string(),
      _csrf: z.string().optional(),
      'cf-turnstile-response': z.string().optional(),
    });

    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      return c.sjis.text('ＥＲＲＯＲ: 入力内容に問題があります', 400);
    }

    c.req.addValidatedData('form', parsed.data);
    await next();
  },

  post: async c => {
    const { bbs, key, FROM, mail, subject, MESSAGE, submit, 'cf-turnstile-response': turnstileToken } = c.req.valid('form');

    if (!['書き込む', '新規スレッド作成'].includes(submit)) {
      return c.sjis.text('ＥＲＲＯＲ: 不正なリクエストです', 400);
    }

    const boardConfig = boards[bbs];
    const isNewThread = !key;

    if (isNewThread && !subject?.trim()) {
      return c.sjis.text('ＥＲＲＯＲ: スレッドタイトルを入力してください', 400);
    }

    const contentCheck = validateContent(MESSAGE);
    if (!contentCheck.valid) {
      return c.sjis.text(`ＥＲＲＯＲ: ${contentCheck.error}`, 400);
    }

    if (boardConfig.turnstile && config.turnstile?.enabled) {
      const result = await verifyTurnstile(turnstileToken, c.realip);
      if (!result.success) {
        return c.sjis.text('ＥＲＲＯＲ: CAPTCHA認証に失敗しました', 403);
      }
    }

    if (key) {
      const existingThread = await getThread(c, key);
      if (!existingThread) return c.sjis.text('ＥＲＲＯＲ: スレッドが見つかりません', 404);
      if (existingThread.archived) return c.sjis.text('ＥＲＲＯＲ: このスレッドは過去ログです', 403);
      if (existingThread.board !== bbs) return c.sjis.text('ＥＲＲＯＲ: 板が一致しません', 400);
    }

    const uid = await genUID(c, bbs);
    const dat = DAT({
      id: uid,
      name: FROM || boardConfig.nanashi || '名無し',
      mail: mail || '',
      subject: isNewThread ? subject : '',
      message: MESSAGE,
    });

    let data;
    if (key) {
      data = await updateThread(c, key, dat);
      if (!data) return c.sjis.text('ＥＲＲＯＲ: 書き込みに失敗しました', 500);
    } else {
      data = await createThread(c, bbs, dat);
      if (!data) return c.sjis.text('ＥＲＲＯＲ: スレッドを作成できません', 500);
    }

    const redirectPath = `/test/read.cgi/${data.board}/${data.id}`;
    
    return c.sjis.html(
<html lang="ja">
<head>
  <meta charset="Shift_JIS" />
  <meta http-equiv="refresh" content={`1;URL=${redirectPath}`} />
  <title>書きこみました</title>
</head>
<body style="font-family: sans-serif; background: #f5f5f5; color: #333; text-align: center; padding: 2rem;">
  <h2>書きこみが終わりました。</h2>
  <p><a href={redirectPath}>移動しない場合はこちら</a></p>
</body>
</html>
    );
  }
};