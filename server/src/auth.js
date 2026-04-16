import crypto from 'node:crypto';
import fs from 'node:fs/promises';

// ─── JWT ──────────────────────────────────────────────────────
let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  JWT_SECRET = crypto.randomBytes(32).toString('hex');
  console.warn('[auth] JWT_SECRET 未设置，已使用随机密钥（服务重启后 Token 将失效，建议在 .env 中配置）');
}

const JWT_HEADER = Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url');

export function signToken(payload, expiresInDays = 30) {
  const exp = Math.floor(Date.now() / 1000) + expiresInDays * 86400;
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  const sig = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${JWT_HEADER}.${body}`)
    .digest('base64url');
  return `${JWT_HEADER}.${body}.${sig}`;
}

export function verifyToken(token) {
  const parts = (token || '').split('.');
  if (parts.length !== 3) throw new Error('invalid token');
  const [h, body, sig] = parts;
  const expected = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${h}.${body}`)
    .digest('base64url');
  if (sig !== expected) throw new Error('invalid signature');
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  if (payload.exp < Math.floor(Date.now() / 1000)) throw new Error('token expired');
  return payload;
}

export function tokenFromRequest(req) {
  const auth = req.headers['authorization'] || '';
  if (!auth.startsWith('Bearer ')) return null;
  return auth.slice(7).trim() || null;
}

// ─── 密码 ─────────────────────────────────────────────────────
export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 100_000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

export function verifyPassword(password, hash, salt) {
  const h = crypto.pbkdf2Sync(password, salt, 100_000, 64, 'sha512').toString('hex');
  return h === hash;
}

// ─── 用户存储（JSON 文件） ─────────────────────────────────────
let USERS_FILE = '';

export function setUsersFile(fp) {
  USERS_FILE = fp;
}

async function readUsers() {
  try {
    return JSON.parse(await fs.readFile(USERS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

async function writeUsers(users) {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

export async function findByEmail(email) {
  const users = await readUsers();
  return users.find((u) => u.email === email.toLowerCase()) || null;
}

export async function createUser(email, password) {
  const users = await readUsers();
  if (users.find((u) => u.email === email.toLowerCase())) {
    throw new Error('EMAIL_EXISTS');
  }
  const { hash, salt } = hashPassword(password);
  const user = {
    id: crypto.randomUUID(),
    email: email.toLowerCase(),
    hash,
    salt,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  await writeUsers(users);
  return user;
}
