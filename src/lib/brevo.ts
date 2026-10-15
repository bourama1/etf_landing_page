import { mkdir, writeFile } from 'node:fs/promises';

export type Brevo = {
  getContact(email: string): Promise<{ attributes: Record<string, unknown> } | null>;
  upsertContact(email: string, attributes: Record<string, unknown>, listIds: number[]): Promise<void>;
  sendEmail(msg: { to: string; subject: string; html: string; text: string }): Promise<void>;
};

const API = 'https://api.brevo.com/v3';

export function brevoFromEnv(env: Record<string, string | undefined>, fetchFn: typeof fetch): Brevo {
  const key = env.BREVO_API_KEY;
  if (!key) {
    // Dry-run has no memory, so the 24 h dedupe is only covered by unit tests.
    const log = (m: string, d?: object) => console.log(JSON.stringify({ m, ...d }));
    return {
      async getContact() { return null; },
      async upsertContact(_email, attributes) { log('dry-run upsert', { attributes: Object.keys(attributes) }); },
      async sendEmail(msg) {
        await mkdir('.dev', { recursive: true });
        await writeFile('.dev/last-email.html', msg.html);
        log('dry-run send', { subject: msg.subject });
      },
    };
  }

  // Errors carry the status only: the address must not reach the logs.
  const call = async (path: string, init: RequestInit = {}, ok404 = false) => {
    const res = await fetchFn(API + path, {
      ...init,
      headers: { 'api-key': key, 'content-type': 'application/json', accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok && !(ok404 && res.status === 404)) throw new Error(`Brevo ${init.method ?? 'GET'} ${path.split('/')[1]} failed: ${res.status}`);
    return res;
  };
  const post = (path: string, body: object) => call(path, { method: 'POST', body: JSON.stringify(body) });

  return {
    async getContact(email) {
      const res = await call(`/contacts/${encodeURIComponent(email)}`, {}, true);
      if (res.status === 404) return null;
      return { attributes: ((await res.json()) as { attributes?: Record<string, unknown> }).attributes ?? {} };
    },
    async upsertContact(email, attributes, listIds) {
      await post('/contacts', { email, attributes, listIds, updateEnabled: true });
    },
    async sendEmail({ to, subject, html, text }) {
      await post('/smtp/email', {
        sender: { name: env.BREVO_SENDER_NAME || 'ETF Dvojče', email: env.BREVO_SENDER_EMAIL },
        to: [{ email: to }],
        ...(env.BREVO_REPLY_TO ? { replyTo: { email: env.BREVO_REPLY_TO } } : {}),
        subject,
        htmlContent: html,
        textContent: text,
      });
    },
  };
}
