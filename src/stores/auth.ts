import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface AuthUser {
  id: string;
  email: string;
}

export interface PublishedResumeItem {
  slug: string;
  publishedAt: string;
  url: string;
}

const TOKEN_KEY = 'resume_token';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>(localStorage.getItem(TOKEN_KEY) || '');
  const user = ref<AuthUser | null>(null);

  const isLoggedIn = computed(() => !!token.value);

  function apiBase(): string {
    return (import.meta.env.VITE_PUBLISH_API_BASE ?? '').replace(/\/$/, '');
  }

  function authHeader(): Record<string, string> {
    return token.value ? { Authorization: `Bearer ${token.value}` } : {};
  }

  function setToken(t: string) {
    token.value = t;
    localStorage.setItem(TOKEN_KEY, t);
  }

  function logout() {
    token.value = '';
    user.value = null;
    localStorage.removeItem(TOKEN_KEY);
  }

  /** 验证 token 是否有效，顺带刷新 user 信息 */
  async function fetchMe(): Promise<boolean> {
    if (!token.value) return false;
    try {
      const res = await fetch(`${apiBase()}/api/auth/me`, {
        headers: { ...authHeader() },
      });
      if (!res.ok) { logout(); return false; }
      user.value = await res.json() as AuthUser;
      return true;
    } catch {
      return false;
    }
  }

  /** 登录，返回错误信息或 null（成功） */
  async function login(email: string, password: string): Promise<string | null> {
    try {
      const res = await fetch(`${apiBase()}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json() as { token?: string; user?: AuthUser; error?: string };
      if (!res.ok) return data.error ?? '登录失败';
      setToken(data.token!);
      user.value = data.user!;
      return null;
    } catch {
      return '网络错误，请稍后重试';
    }
  }

  /** 发送验证码，返回错误信息或 null（成功） */
  async function sendCode(email: string): Promise<string | null> {
    try {
      const res = await fetch(`${apiBase()}/api/auth/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) return data.error ?? '发送失败';
      return null;
    } catch {
      return '网络错误，请稍后重试';
    }
  }

  /** 注册，返回错误信息或 null（成功） */
  /** 当前用户已发布的在线简历列表 */
  async function fetchMyPublishedResumes(): Promise<
    { ok: true; items: PublishedResumeItem[] } | { ok: false; error: string }
  > {
    if (!token.value) return { ok: false, error: '未登录' };
    try {
      const res = await fetch(`${apiBase()}/api/resume/mine`, {
        headers: { ...authHeader() },
      });
      const data = (await res.json()) as { items?: PublishedResumeItem[]; error?: string };
      if (res.status === 401) {
        logout();
        return { ok: false, error: data.error ?? '登录已过期' };
      }
      if (!res.ok) return { ok: false, error: data.error ?? '加载失败' };
      return { ok: true, items: data.items ?? [] };
    } catch {
      return { ok: false, error: '网络错误，请稍后重试' };
    }
  }

  /** 删除已发布简历；成功返回 null，失败返回错误文案 */
  async function deletePublishedResume(slug: string): Promise<string | null> {
    try {
      const res = await fetch(`${apiBase()}/api/resume/published/${encodeURIComponent(slug)}`, {
        method: 'DELETE',
        headers: { ...authHeader() },
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.status === 401) {
        logout();
        return data.error ?? '登录已过期';
      }
      if (!res.ok) return data.error ?? '删除失败';
      return null;
    } catch {
      return '网络错误，请稍后重试';
    }
  }

  async function register(email: string, code: string, password: string): Promise<string | null> {
    try {
      const res = await fetch(`${apiBase()}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, password }),
      });
      const data = await res.json() as { token?: string; user?: AuthUser; error?: string };
      if (!res.ok) return data.error ?? '注册失败';
      setToken(data.token!);
      user.value = data.user!;
      return null;
    } catch {
      return '网络错误，请稍后重试';
    }
  }

  return {
    token,
    user,
    isLoggedIn,
    authHeader,
    apiBase,
    fetchMe,
    login,
    sendCode,
    register,
    logout,
    fetchMyPublishedResumes,
    deletePublishedResume,
  };
});
