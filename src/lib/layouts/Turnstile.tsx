import { html } from 'hono/html';
import { config } from '$config';

interface TurnstileProps {
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
  action?: string;
}

export const Turnstile = (props: TurnstileProps) => {
  const { 
    theme = 'auto', 
    size = 'normal',
    action = 'submit'
  } = props;

  const siteKey = config.turnstile?.siteKey ?? '';
  
  if (!siteKey || !config.turnstile?.enabled) {
    return null;
  }

  return html`
    <div class="form__group">
      <div 
        class="cf-turnstile" 
        data-sitekey="${siteKey}"
        data-theme="${theme}"
        data-size="${size}"
        data-action="${action}"
        data-callback="onTurnstileSuccess"
        data-error-callback="onTurnstileError"
      ></div>
      <noscript>
        <p class="form__error">CAPTCHAを表示するにはJavaScriptを有効にしてください。</p>
      </noscript>
    </div>
  `;
};

export const TurnstileScript = () => {
  if (!config.turnstile?.enabled) {
    return null;
  }

  return html`
    <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
    <script>
      function onTurnstileSuccess(token) {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
          let input = form.querySelector('input[name="cf-turnstile-response"]');
          if (!input) {
            input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'cf-turnstile-response';
            form.appendChild(input);
          }
          input.value = token;
        });
      }
      
      function onTurnstileError() {
        console.error('Turnstile error');
      }
    </script>
  `;
};

interface VerifyResult {
  success: boolean;
  error?: string;
  codes?: string[];
}

export const verifyTurnstile = async (token: string | null, ip: string | null): Promise<VerifyResult> => {
  if (!config.turnstile?.enabled) {
    return { success: true };
  }

  if (!token) {
    return { success: false, error: 'CAPTCHA token missing' };
  }

  const secretKey = config.turnstile?.secretKey ?? '';
  if (!secretKey) {
    console.error('[Turnstile] Secret key not configured');
    return { success: false, error: 'CAPTCHA not configured' };
  }

  try {
    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (ip) {
      formData.append('remoteip', ip);
    }

    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        body: formData,
      }
    );

    const result = await response.json() as { success: boolean; 'error-codes'?: string[] };

    if (result.success) {
      return { success: true };
    }

    console.warn('[Turnstile] Verification failed:', result['error-codes']);
    return { 
      success: false, 
      error: 'CAPTCHA verification failed',
      codes: result['error-codes']
    };
  } catch (err) {
    console.error('[Turnstile] Verification error:', err);
    return { success: false, error: 'CAPTCHA verification error' };
  }
};

export default Turnstile;
