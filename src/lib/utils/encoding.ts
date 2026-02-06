import iconv from 'iconv-lite';

export const sjis = (v: string): Buffer => iconv.encode(v, 'SJIS');
export const utf8 = (v: Buffer | Uint8Array): string => iconv.decode(Buffer.from(v), 'SJIS');

const percent2bytes = (encoded: string): Uint8Array => {
  const data: number[] = [];
  // Convert + to space (0x20) as per form URL encoding standard
  const normalized = encoded.replace(/\+/g, ' ');

  for (let i = 0; i < normalized.length; i++) {
    if (normalized[i] === '%' && i + 2 < normalized.length) {
      const hex = normalized.slice(i + 1, i + 3);
      const byte = parseInt(hex, 16);
      if (!isNaN(byte)) {
        data.push(byte);
        i += 2;
        continue;
      }
    }
    data.push(normalized.charCodeAt(i));
  }

  return new Uint8Array(data);
};

export const sjis2utf8 = (body: ArrayBuffer | Uint8Array): string => {
  const str = new TextDecoder().decode(body);

  try {
    // For UTF-8 encoded forms: + becomes space, %2B becomes +
    const normalized = str.replace(/\+/g, ' ');
    return decodeURIComponent(normalized);
  } catch {
    return iconv.decode(Buffer.from(percent2bytes(str)), 'Shift_JIS');
  }
};
