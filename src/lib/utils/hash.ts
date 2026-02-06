type HashAlgorithm = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';

interface HashResult {
  buffer: ArrayBuffer;
  hex: string;
}

export const sha = async (value: string, algo: HashAlgorithm = 'SHA-1'): Promise<HashResult> => {
  const data = new TextEncoder().encode(value);
  const buffer = await crypto.subtle.digest(algo, data);

  return {
    buffer,
    hex: [...new Uint8Array(buffer)]
      .map(b => b.toString(16).padStart(2, '0'))
      .join(''),
  };
};

export const sha1 = (v: string): Promise<HashResult> => sha(v, 'SHA-1');
export const sha256 = (v: string): Promise<HashResult> => sha(v, 'SHA-256');
export const sha384 = (v: string): Promise<HashResult> => sha(v, 'SHA-384');
export const sha512 = (v: string): Promise<HashResult> => sha(v, 'SHA-512');
