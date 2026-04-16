/**
 * 在线简历 Node 服务
 *
 * 接口：
 *   POST /api/auth/send-code   { email }                     → 发送验证码邮件
 *   POST /api/auth/register    { email, code, password }     → 注册
 *   POST /api/auth/login       { email, password }           → 登录
 *   GET  /api/auth/me                                        → 获取当前用户
 *   POST /api/resume/publish   { html, slug? }  (需登录)    → 发布简历
 *   GET  /api/resume/mine      (需登录)                      → 当前用户已发布列表
 *   DELETE /api/resume/published/:slug (需登录)              → 软删除本人已发布简历
 *   GET  /r/:id                                              → 访问已发布简历
 *   POST /api/feedback       { message, email?, page? }      → 提交意见（匿名）
 *   GET  /health                                             → 健康检查
 *
 * 环境变量（见 .env.example）：
 *   PORT, HOST, RESUME_DIR, JWT_SECRET, EMAIL_USER, EMAIL_PASS
 *
 *   HOST：监听地址。默认 0.0.0.0（本机局域网 IP 可访问）；若仅本机可设 127.0.0.1
 */

import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { sendVerifyCode } from './email.js';
import {
  signToken, verifyToken, tokenFromRequest,
  findByEmail, createUser, verifyPassword, setUsersFile,
} from './auth.js';

// ─── 配置 ──────────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 3030;
const HOST = (process.env.HOST || '0.0.0.0').trim() || '0.0.0.0';

const DATA_DIR = path.resolve(
  process.env.RESUME_DIR || path.join(process.cwd(), 'data'),
);
const PUBLISH_DIR = path.join(DATA_DIR, 'published');
const USERS_FILE     = path.join(DATA_DIR, 'users.json');
const FEEDBACK_FILE  = path.join(DATA_DIR, 'feedback.json');
const PUBLISHED_REGISTRY_FILE = path.join(DATA_DIR, 'published-registry.json');

setUsersFile(USERS_FILE);

/** 简历 ID 字符集（去掉易混淆字符） */
const CHARS    = 'abcdefghjkmnpqrstuvwxyz23456789';
const SLUG_RE  = /^[a-z0-9][a-z0-9-]{0,30}[a-z0-9]$|^[a-z0-9]{2,32}$/;
const MAX_BODY = 3 * 1024 * 1024;

/** 验证码：email → { code, exp, attempts } */
const codeSessions = new Map();
/** 发送验证码限速：email → lastSentAt */
const sendRateLimit = new Map();
/** 意见反馈限速：ip → 最近提交时间戳列表 */
const feedbackRateByIp = new Map();

// ─── 工具 ──────────────────────────────────────────────────────
function shortId(len = 8) {
  return Array.from(crypto.randomBytes(len))
    .map((b) => CHARS[b % CHARS.length])
    .join('');
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) { reject(new Error('TOO_LARGE')); req.destroy(); return; }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function parseJson(req) {
  const raw = await readBody(req);
  return JSON.parse(raw.toString('utf8'));
}

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function clientIp(req) {
  const xf = req.headers['x-forwarded-for'];
  if (typeof xf === 'string' && xf.trim()) return xf.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

const FEEDBACK_WINDOW_MS = 60 * 60 * 1000;
const FEEDBACK_MAX_PER_WINDOW = 8;

async function loadFeedbackStore() {
  try {
    const raw = await fs.readFile(FEEDBACK_FILE, 'utf8');
    const j = JSON.parse(raw);
    return Array.isArray(j.items) ? j : { items: [] };
  } catch {
    return { items: [] };
  }
}

async function appendFeedbackItem(entry) {
  const data = await loadFeedbackStore();
  data.items.push(entry);
  if (data.items.length > 3000) data.items = data.items.slice(-3000);
  await fs.writeFile(FEEDBACK_FILE, JSON.stringify(data, null, 2), 'utf8');
}

/** POST /api/feedback */
async function handleFeedback(req, res) {
  if (req.method !== 'POST') { res.writeHead(405); res.end(); return; }

  let body;
  try { body = await parseJson(req); }
  catch { return sendJson(res, 400, { error: '请求格式错误' }); }

  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  if (message.length < 5)  return sendJson(res, 400, { error: '请至少填写 5 个字的意见' });
  if (message.length > 2000) return sendJson(res, 400, { error: '意见内容请控制在 2000 字以内' });

  let email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (email && !isValidEmail(email)) return sendJson(res, 400, { error: '联系邮箱格式不正确' });
  if (!email) email = '';

  let page = typeof body?.page === 'string' ? body.page.trim().slice(0, 500) : '';

  const ip = clientIp(req);
  const now = Date.now();
  let stamps = feedbackRateByIp.get(ip) || [];
  stamps = stamps.filter((t) => now - t < FEEDBACK_WINDOW_MS);
  if (stamps.length >= FEEDBACK_MAX_PER_WINDOW) {
    return sendJson(res, 429, { error: '提交过于频繁，请稍后再试' });
  }
  stamps.push(now);
  feedbackRateByIp.set(ip, stamps);

  const entry = {
    id: shortId(12),
    createdAt: new Date().toISOString(),
    message,
    email,
    page,
    ip,
  };

  try {
    await appendFeedbackItem(entry);
  } catch (e) {
    console.error('[feedback]', e);
    return sendJson(res, 500, { error: '保存失败，请稍后重试' });
  }

  console.log(`[feedback] ${entry.id} from ${ip}`);
  sendJson(res, 200, { ok: true });
}

// ─── 认证路由 ──────────────────────────────────────────────────

/** POST /api/auth/send-code */
async function handleSendCode(req, res) {
  let body;
  try { body = await parseJson(req); } catch { return sendJson(res, 400, { error: '请求格式错误' }); }

  const email = (body?.email || '').trim().toLowerCase();
  if (!isValidEmail(email)) return sendJson(res, 400, { error: '邮箱格式不正确' });

  // 限速：同一邮箱 60s 内只能发一次
  const lastSent = sendRateLimit.get(email) || 0;
  const wait = 60 * 1000 - (Date.now() - lastSent);
  if (wait > 0) {
    return sendJson(res, 429, { error: `请等待 ${Math.ceil(wait / 1000)} 秒后再发送` });
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  codeSessions.set(email, { code, exp: Date.now() + 5 * 60 * 1000, attempts: 0 });
  sendRateLimit.set(email, Date.now());

  try {
    await sendVerifyCode(email, code);
    sendJson(res, 200, { ok: true });
  } catch (err) {
    console.error('[send-code]', err.message);
    sendJson(res, 500, { error: '邮件发送失败，请检查邮箱是否正确' });
  }
}

/** POST /api/auth/register */
async function handleRegister(req, res) {
  let body;
  try { body = await parseJson(req); } catch { return sendJson(res, 400, { error: '请求格式错误' }); }

  const email    = (body?.email    || '').trim().toLowerCase();
  const code     = (body?.code     || '').trim();
  const password = (body?.password || '').trim();

  if (!isValidEmail(email))       return sendJson(res, 400, { error: '邮箱格式不正确' });
  if (!code)                       return sendJson(res, 400, { error: '请输入验证码' });
  if (password.length < 6)        return sendJson(res, 400, { error: '密码至少 6 位' });

  // 校验验证码
  const session = codeSessions.get(email);
  if (!session)                    return sendJson(res, 400, { error: '请先发送验证码' });
  if (Date.now() > session.exp)  { codeSessions.delete(email); return sendJson(res, 400, { error: '验证码已过期，请重新发送' }); }

  session.attempts = (session.attempts || 0) + 1;
  if (session.attempts > 5)        return sendJson(res, 429, { error: '验证码错误次数过多，请重新发送' });
  if (session.code !== code)       return sendJson(res, 400, { error: '验证码不正确' });

  codeSessions.delete(email);

  let user;
  try {
    user = await createUser(email, password);
  } catch (e) {
    if (e.message === 'EMAIL_EXISTS') return sendJson(res, 409, { error: '该邮箱已注册，请直接登录' });
    console.error('[register]', e);
    return sendJson(res, 500, { error: '注册失败，请稍后重试' });
  }

  const token = signToken({ sub: user.id, email: user.email });
  console.log(`[register] ${email}`);
  sendJson(res, 200, { token, user: { id: user.id, email: user.email } });
}

/** POST /api/auth/login */
async function handleLogin(req, res) {
  let body;
  try { body = await parseJson(req); } catch { return sendJson(res, 400, { error: '请求格式错误' }); }

  const email    = (body?.email    || '').trim().toLowerCase();
  const password = (body?.password || '').trim();

  if (!isValidEmail(email)) return sendJson(res, 400, { error: '邮箱格式不正确' });
  if (!password)            return sendJson(res, 400, { error: '请输入密码' });

  const user = await findByEmail(email);
  if (!user || !verifyPassword(password, user.hash, user.salt)) {
    return sendJson(res, 401, { error: '邮箱或密码不正确' });
  }

  const token = signToken({ sub: user.id, email: user.email });
  console.log(`[login] ${email}`);
  sendJson(res, 200, { token, user: { id: user.id, email: user.email } });
}

/** GET /api/auth/me */
function handleMe(req, res) {
  const raw = tokenFromRequest(req);
  if (!raw) return sendJson(res, 401, { error: '未登录' });
  try {
    const payload = verifyToken(raw);
    sendJson(res, 200, { id: payload.sub, email: payload.email });
  } catch {
    sendJson(res, 401, { error: 'Token 无效或已过期，请重新登录' });
  }
}

// ─── 已发布简历登记（slug → userId）────────────────────────────

async function loadPublishedRegistry() {
  try {
    const raw = await fs.readFile(PUBLISHED_REGISTRY_FILE, 'utf8');
    const j = JSON.parse(raw);
    return Array.isArray(j.items) ? j : { items: [] };
  } catch {
    return { items: [] };
  }
}

async function savePublishedRegistry(data) {
  await fs.writeFile(PUBLISHED_REGISTRY_FILE, JSON.stringify(data, null, 2), 'utf8');
}

async function getRegistryEntryBySlug(slug) {
  const { items } = await loadPublishedRegistry();
  return items.find((i) => i.slug === slug) || null;
}

async function upsertPublishedRegistry(entry) {
  const data = await loadPublishedRegistry();
  const idx = data.items.findIndex((i) => i.slug === entry.slug);
  if (idx >= 0) data.items[idx] = entry;
  else data.items.push(entry);
  if (data.items.length > 5000) data.items = data.items.slice(-5000);
  await savePublishedRegistry(data);
}

async function markPublishedRegistryDeleted(slug, deletedAt) {
  const data = await loadPublishedRegistry();
  const idx = data.items.findIndex((i) => i.slug === slug);
  if (idx >= 0) {
    data.items[idx] = {
      ...data.items[idx],
      deletedAt,
    };
  }
  await savePublishedRegistry(data);
}

function authUserId(req, res) {
  const raw = tokenFromRequest(req);
  if (!raw) return null;
  try {
    const payload = verifyToken(raw);
    return payload.sub;
  } catch {
    sendJson(res, 401, { error: '登录已过期，请重新登录' });
    return false;
  }
}

/** GET /api/resume/mine */
async function handleResumeMine(req, res) {
  if (req.method !== 'GET') { res.writeHead(405); res.end(); return; }

  const userId = authUserId(req, res);
  if (userId === null) return sendJson(res, 401, { error: '请先登录' });
  if (userId === false) return;

  const { items } = await loadPublishedRegistry();
  const mine = items
    .filter((i) => i.userId === userId && !i.deletedAt)
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .map((r) => ({
      slug: r.slug,
      publishedAt: r.publishedAt,
      url: `/r/${r.slug}`,
    }));

  sendJson(res, 200, { items: mine });
}

/** DELETE /api/resume/published/:slug */
async function handlePublishedDelete(req, res, slugRaw) {
  if (req.method !== 'DELETE') { res.writeHead(405); res.end(); return; }

  const slug = decodeURIComponent((slugRaw || '').trim().toLowerCase());
  if (!SLUG_RE.test(slug)) {
    return sendJson(res, 400, { error: '无效的链接后缀' });
  }

  const userId = authUserId(req, res);
  if (userId === null) return sendJson(res, 401, { error: '请先登录' });
  if (userId === false) return;

  const reg = await getRegistryEntryBySlug(slug);
  if (!reg || reg.userId !== userId) {
    return sendJson(res, 403, { error: '无权删除该简历或记录不存在' });
  }

  const fp = path.join(PUBLISH_DIR, `${slug}.html`);
  const deletedFp = path.join(PUBLISH_DIR, `${slug}-del.html`);
  try {
    // 假删除：不物理删除，改名留档。
    // 若目标已存在则先覆盖，保证最终只有一份最新留档。
    try { await fs.unlink(deletedFp); } catch (e) { if (e?.code !== 'ENOENT') throw e; }
    await fs.rename(fp, deletedFp);
  } catch (e) {
    if (e?.code !== 'ENOENT') {
      console.error('[delete-published-rename]', e);
      return sendJson(res, 500, { error: '删除失败，请稍后重试' });
    }
    // 文件不存在时仍允许标记为已删除，避免脏数据卡住用户操作。
  }

  await markPublishedRegistryDeleted(slug, new Date().toISOString());
  console.log(`[delete-published] /r/${slug} by ${userId}`);
  sendJson(res, 200, { ok: true });
}

// ─── 简历路由 ──────────────────────────────────────────────────

/** POST /api/resume/publish（需登录） */
async function handlePublish(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  if (req.method !== 'POST')    { res.writeHead(405); res.end(); return; }

  const raw = tokenFromRequest(req);
  if (!raw) return sendJson(res, 401, { error: '请先登录后再发布' });
  let payload;
  try { payload = verifyToken(raw); } catch { return sendJson(res, 401, { error: '登录已过期，请重新登录' }); }
  const userId = payload.sub;

  let rawBody;
  try { rawBody = await readBody(req); }
  catch (e) {
    if (e?.message === 'TOO_LARGE') return sendJson(res, 413, { error: '内容超过 3MB 限制' });
    return sendJson(res, 400, { error: '读取失败' });
  }

  let body;
  try { body = JSON.parse(rawBody.toString('utf8')); }
  catch { return sendJson(res, 400, { error: 'JSON 格式错误' }); }

  const html = body?.html;
  if (typeof html !== 'string' || !html.trim()) {
    return sendJson(res, 400, { error: '缺少 html 字段' });
  }

  // 处理 slug
  let slug = typeof body?.slug === 'string' ? body.slug.trim().toLowerCase() : '';
  if (slug) {
    if (!SLUG_RE.test(slug)) {
      return sendJson(res, 400, { error: '自定义后缀只能用小写字母、数字和连字符（2-32位）' });
    }
    let fileExists = false;
    try {
      await fs.access(path.join(PUBLISH_DIR, `${slug}.html`));
      fileExists = true;
    } catch { /* 不存在 */ }
    if (fileExists) {
      const reg = await getRegistryEntryBySlug(slug);
      if (!reg || reg.userId !== userId) {
        return sendJson(res, 409, { error: `后缀 "${slug}" 已被占用，换一个吧` });
      }
    }
  } else {
    for (let i = 0; i < 5; i++) {
      const id = shortId();
      try {
        await fs.access(path.join(PUBLISH_DIR, `${id}.html`));
      } catch {
        slug = id;
        break;
      }
    }
    if (!slug) return sendJson(res, 500, { error: '生成 ID 失败，请重试' });
  }

  try {
    await fs.writeFile(path.join(PUBLISH_DIR, `${slug}.html`), html, 'utf8');
  } catch (e) {
    console.error(e);
    return sendJson(res, 500, { error: '保存失败' });
  }

  await upsertPublishedRegistry({
    slug,
    userId,
    publishedAt: new Date().toISOString(),
    deletedAt: null,
  });

  console.log(`[publish] /r/${slug}`);
  sendJson(res, 200, { id: slug, url: `/r/${slug}` });
}

/** GET /r/:id */
async function handleView(req, res, id) {
  if (!/^[a-z0-9][a-z0-9-]{0,30}[a-z0-9]$|^[a-z0-9]{1,32}$/.test(id)) {
    res.writeHead(400); res.end('Bad Request'); return;
  }
  const reg = await getRegistryEntryBySlug(id);
  // 软删除后不再对外可见，但文件保留，便于回滚与审计。
  if (reg?.deletedAt) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!doctype html><html><head><meta charset="utf-8"><title>未找到</title></head>
<body style="font-family:sans-serif;text-align:center;padding:80px">
<h2>404 — 简历不存在或已删除</h2></body></html>`);
    return;
  }
  let buf;
  try { buf = await fs.readFile(path.join(PUBLISH_DIR, `${id}.html`)); }
  catch {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!doctype html><html><head><meta charset="utf-8"><title>未找到</title></head>
<body style="font-family:sans-serif;text-align:center;padding:80px">
<h2>404 — 简历不存在或已删除</h2></body></html>`);
    return;
  }
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'public, max-age=300',
  });
  res.end(buf);
}

// ─── 主服务器 ──────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  let pathname;
  try {
    pathname = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`).pathname;
  } catch { res.writeHead(400); res.end(); return; }

  if (pathname === '/health') {
    return sendJson(res, 200, { ok: true });
  }

  // 认证路由
  if (pathname === '/api/auth/send-code' && req.method === 'POST') {
    return handleSendCode(req, res);
  }
  if (pathname === '/api/auth/register' && req.method === 'POST') {
    return handleRegister(req, res);
  }
  if (pathname === '/api/auth/login' && req.method === 'POST') {
    return handleLogin(req, res);
  }
  if (pathname === '/api/auth/me' && req.method === 'GET') {
    return handleMe(req, res);
  }
  if (pathname === '/api/feedback') {
    return handleFeedback(req, res);
  }

  // 简历路由
  if (pathname === '/api/resume/publish') {
    return handlePublish(req, res);
  }
  if (pathname === '/api/resume/mine' && req.method === 'GET') {
    return handleResumeMine(req, res);
  }
  const publishedDeleteMatch = pathname.match(/^\/api\/resume\/published\/([^/]+)\/?$/);
  if (publishedDeleteMatch && req.method === 'DELETE') {
    return handlePublishedDelete(req, res, publishedDeleteMatch[1]);
  }
  const viewMatch = pathname.match(/^\/r\/([^/]+)\/?$/);
  if (viewMatch) {
    return handleView(req, res, viewMatch[1]);
  }

  sendJson(res, 404, { error: 'Not Found' });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[error] 端口 ${PORT} 已被占用\n  换端口：$env:PORT=3031; npm run dev`);
  } else {
    console.error(err);
  }
  process.exit(1);
});

await fs.mkdir(PUBLISH_DIR, { recursive: true });
await fs.mkdir(DATA_DIR,    { recursive: true });

server.listen(PORT, HOST, () => {
  const loop = HOST === '0.0.0.0' || HOST === '::' ? `http://127.0.0.1:${PORT}` : `http://${HOST}:${PORT}`;
  console.log(`\n✓ 简历服务已启动  ${loop}  （监听 ${HOST}:${PORT}）`);
  console.log(`  数据目录: ${DATA_DIR}\n`);
});
