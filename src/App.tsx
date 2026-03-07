import { FormEvent, useEffect, useMemo, useState } from 'react';

type User = {
  id: string;
  username: string;
  email: string;
  bio: string;
  avatar: string;
  authProvider: 'local' | 'google';
  createdAt: string;
};

type Post = {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
  likes: number;
  isLikedByMe: boolean;
};

type GoogleAccounts = {
  id: {
    initialize: (config: {
      client_id: string;
      callback: (response: { credential?: string }) => void;
    }) => void;
    renderButton: (parent: HTMLElement, options: Record<string, string>) => void;
  };
};

declare global {
  interface Window {
    google?: { accounts: GoogleAccounts };
  }
}

const api = async <T,>(url: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    ...options,
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || 'Ошибка запроса к серверу');
  }
  return payload as T;
};

export default function App() {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [authForm, setAuthForm] = useState({ username: '', email: '', password: '' });
  const [postText, setPostText] = useState('');

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const canUseGoogleAuth = useMemo(() => Boolean(googleClientId), [googleClientId]);

  useEffect(() => {
    if (!canUseGoogleAuth) return;

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      const buttonRoot = document.getElementById('google-signin-button');
      if (!buttonRoot || !window.google) return;

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async ({ credential }) => {
          if (!credential) return;
          try {
            const authResponse = await api<{ user: User }>('/api/auth/google', {
              method: 'POST',
              body: JSON.stringify({ credential }),
            });
            setUser(authResponse.user);
            setMessage('Вход через Google выполнен успешно.');
          } catch (error) {
            setMessage((error as Error).message);
          }
        },
      });

      buttonRoot.innerHTML = '';
      window.google.accounts.id.renderButton(buttonRoot, {
        type: 'standard',
        theme: 'outline',
        text: 'continue_with',
        size: 'large',
        shape: 'pill',
      });
    };

    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, [canUseGoogleAuth, googleClientId]);

  useEffect(() => {
    if (!user) return;
    void loadFeed();
  }, [user]);

  const loadFeed = async () => {
    const data = await api<{ posts: Post[] }>(`/api/posts?userId=${user?.id || ''}`);
    setPosts(data.posts);
  };

  const submitAuth = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const payload =
        mode === 'register'
          ? authForm
          : { username: authForm.username, password: authForm.password };

      const authResponse = await api<{ user: User }>(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setUser(authResponse.user);
      setMessage(mode === 'register' ? 'Аккаунт создан.' : 'Вы вошли в систему.');
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const publishPost = async () => {
    if (!user || !postText.trim()) return;
    setLoading(true);

    try {
      await api('/api/posts', {
        method: 'POST',
        body: JSON.stringify({ authorId: user.id, content: postText.trim() }),
      });
      setPostText('');
      await loadFeed();
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const likePost = async (postId: string) => {
    if (!user) return;
    await api('/api/posts/like', {
      method: 'POST',
      body: JSON.stringify({ postId, userId: user.id }),
    });
    await loadFeed();
  };

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 p-6 flex items-center justify-center">
        <section className="w-full max-w-lg bg-slate-900 rounded-2xl p-8 shadow-2xl border border-slate-800">
          <h1 className="text-3xl font-bold">SocialHub</h1>
          <p className="text-slate-400 mt-2">Мини-социальная сеть на React + Express + SQLite.</p>

          <form onSubmit={submitAuth} className="mt-8 space-y-4">
            <input
              className="w-full rounded-xl bg-slate-950 border border-slate-700 p-3"
              placeholder="Имя пользователя"
              value={authForm.username}
              onChange={(e) => setAuthForm((prev) => ({ ...prev, username: e.target.value }))}
              required
            />
            {mode === 'register' && (
              <input
                className="w-full rounded-xl bg-slate-950 border border-slate-700 p-3"
                placeholder="Email"
                type="email"
                value={authForm.email}
                onChange={(e) => setAuthForm((prev) => ({ ...prev, email: e.target.value }))}
                required
              />
            )}
            <input
              className="w-full rounded-xl bg-slate-950 border border-slate-700 p-3"
              placeholder="Пароль"
              type="password"
              value={authForm.password}
              onChange={(e) => setAuthForm((prev) => ({ ...prev, password: e.target.value }))}
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-indigo-500 hover:bg-indigo-400 transition p-3 font-semibold"
            >
              {mode === 'register' ? 'Зарегистрироваться' : 'Войти'}
            </button>
          </form>

          <button
            onClick={() => setMode((current) => (current === 'register' ? 'login' : 'register'))}
            className="mt-4 text-indigo-300"
          >
            {mode === 'register' ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
          </button>

          {canUseGoogleAuth ? (
            <div className="mt-6">
              <p className="text-sm text-slate-400 mb-3">Или продолжить через Google</p>
              <div id="google-signin-button" />
            </div>
          ) : (
            <p className="mt-6 text-xs text-amber-300">Google auth отключен. Укажите VITE_GOOGLE_CLIENT_ID.</p>
          )}

          {message && <p className="mt-4 text-sm text-indigo-300">{message}</p>}
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-3xl mx-auto">
        <header className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-5 flex justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <img src={user.avatar} alt={user.username} className="w-10 h-10 rounded-full" />
            <div>
              <h2 className="font-semibold">{user.username}</h2>
              <p className="text-slate-400 text-sm">{user.email}</p>
            </div>
          </div>
          <button className="text-sm text-rose-300" onClick={() => setUser(null)}>
            Выйти
          </button>
        </header>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <textarea
            className="w-full rounded-xl bg-slate-950 border border-slate-700 p-3 min-h-24"
            placeholder="Поделитесь новостью..."
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
          />
          <button
            onClick={publishPost}
            disabled={loading || !postText.trim()}
            className="mt-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 transition px-4 py-2 font-semibold"
          >
            Опубликовать
          </button>
        </section>

        <section className="mt-6 space-y-4">
          {posts.map((post) => (
            <article key={post.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="flex items-center gap-3 mb-3">
                <img src={post.authorAvatar} alt={post.authorName} className="w-8 h-8 rounded-full" />
                <div>
                  <h3 className="font-medium">{post.authorName}</h3>
                  <p className="text-xs text-slate-500">{new Date(post.createdAt).toLocaleString('ru-RU')}</p>
                </div>
              </div>
              <p>{post.content}</p>
              <button className="mt-3 text-pink-300 text-sm" onClick={() => likePost(post.id)}>
                {post.isLikedByMe ? '💖 Убрать лайк' : '🤍 Лайк'} · {post.likes}
              </button>
            </article>
          ))}
          {posts.length === 0 && <p className="text-slate-500 text-center">Пока нет публикаций.</p>}
        </section>
      </div>
    </main>
  );
}
