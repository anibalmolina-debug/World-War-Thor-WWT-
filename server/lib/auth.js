import crypto from 'crypto';
import { db } from './db.js';

const SALT_LEN = 16;
const ITERATIONS = 100000;
const KEYLEN = 64;
const DIGEST = 'sha512';

export const Auth = {
  async hash(password) {
    const salt = crypto.randomBytes(SALT_LEN);
    const derivedKey = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST);
    return Buffer.concat([salt, derivedKey]).toString('base64');
  },

  async verify(password, hash) {
    const buffer = Buffer.from(hash, 'base64');
    const salt = buffer.subarray(0, SALT_LEN);
    const key = buffer.subarray(SALT_LEN);
    const derivedKey = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST);
    return crypto.timingSafeEqual(key, derivedKey);
  },

  normalizeCodeword(code) {
    return code.trim().toLowerCase().replace(/[^\w]/g, '');
  },

  async createSession(role, nationId = null) {
    const token = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000);

    await db.query('INSERT INTO sessions (token_hash, role, nation_id, expires_at) VALUES ($1, $2, $3, $4)',
      [hash, role, nationId, expiresAt]);

    return token;
  },

  async verifySession(token) {
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const res = await db.query('SELECT * FROM sessions WHERE token_hash = $1 AND expires_at > now()', [hash]);
    return res.rows[0];
  }
};

export async function loginStudent({ ip }, codeword) {
  const normalized = Auth.normalizeCodeword(codeword);
  const res = await db.query('SELECT * FROM nations WHERE key = $1 AND playable = true', [normalized]);
  if (res.rows.length === 0) return { ok: false, status: 401 };

  const nation = res.rows[0];
  const token = await Auth.createSession('student', nation.id);
  return { ok: true, token, session: { role: 'student', nationId: nation.id } };
}

export async function loginGm({ ip }, password) {
  // Simplified for now - would normally check GM password hash in DB
  if (password === 'admin') {
    const token = await Auth.createSession('gm');
    return { ok: true, token, session: { role: 'gm' } };
  }
  return { ok: false, status: 401 };
}

export async function logout(token) {
  if (!token) return;
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  await db.query('DELETE FROM sessions WHERE token_hash = $1', [hash]);
}

export function attachSessionCookie(cookies, token) {
  cookies.pending.push(`session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/`);
}

export function clearSessionCookie(cookies) {
  cookies.pending.push(`session=; Max-Age=0; Path=/`);
}

export function readToken(cookies) {
  return cookies.find(c => c.startsWith('session='))?.split('=')[1];
}

export async function me(token) {
  return Auth.verifySession(token);
}
