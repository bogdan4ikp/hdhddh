import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(cors());
app.use(express.json({ limit: '2mb' }));

let db: any;
const googleClientId = process.env.GOOGLE_CLIENT_ID;

const mapUser = (user: any) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  bio: user.bio || '',
  avatar: user.avatar,
  authProvider: user.authProvider,
  createdAt: user.createdAt,
});

async function initDb() {
  db = await open({
    filename: path.join(process.cwd(), 'database.sqlite'),
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT,
      bio TEXT DEFAULT '',
      avatar TEXT NOT NULL,
      googleSub TEXT UNIQUE,
      authProvider TEXT NOT NULL DEFAULT 'local',
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      authorId TEXT NOT NULL,
      content TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (authorId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS post_likes (
      postId TEXT NOT NULL,
      userId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      PRIMARY KEY (postId, userId),
      FOREIGN KEY (postId) REFERENCES posts(id),
      FOREIGN KEY (userId) REFERENCES users(id)
    );
  `);
}

app.get('/api/health', async (_req, res) => {
  const usersCount = await db.get('SELECT COUNT(*) AS count FROM users');
  res.json({ status: 'ok', users: usersCount.count });
});

app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'username, email и password обязательны' });
  }

  const id = `user-${Date.now()}`;
  const avatar = `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(username)}`;

  try {
    await db.run(
      'INSERT INTO users (id, username, email, password, avatar, authProvider, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, username, email.toLowerCase(), password, avatar, 'local', new Date().toISOString()],
    );
    const user = await db.get('SELECT * FROM users WHERE id = ?', [id]);
    return res.json({ user: mapUser(user) });
  } catch (error: any) {
    if (error.message?.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Пользователь с таким username/email уже существует' });
    }
    return res.status(500).json({ error: 'Не удалось создать пользователя' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'username и password обязательны' });
  }

  const user = await db.get(
    'SELECT * FROM users WHERE username = ? AND password = ? AND authProvider = ?',
    [username, password, 'local'],
  );

  if (!user) {
    return res.status(401).json({ error: 'Неверные учетные данные' });
  }

  return res.json({ user: mapUser(user) });
});

app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body;
  if (!googleClientId) {
    return res.status(400).json({ error: 'Google auth не настроен на сервере' });
  }
  if (!credential) {
    return res.status(400).json({ error: 'credential обязателен' });
  }

  try {
    const verifyResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    if (!verifyResponse.ok) {
      return res.status(401).json({ error: 'Google credential невалиден' });
    }

    const payload: any = await verifyResponse.json();
    if (payload.aud !== googleClientId) {
      return res.status(401).json({ error: 'Google audience не совпадает с GOOGLE_CLIENT_ID' });
    }

    if (!payload?.sub || !payload.email) {
      return res.status(400).json({ error: 'Google не вернул необходимые данные' });
    }

    let user = await db.get('SELECT * FROM users WHERE googleSub = ?', [payload.sub]);

    if (!user) {
      const id = `user-${Date.now()}`;
      const username = (payload.name || payload.email.split('@')[0]).replace(/\s+/g, '').slice(0, 24);
      const avatar = payload.picture || `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(username)}`;

      await db.run(
        'INSERT INTO users (id, username, email, avatar, googleSub, authProvider, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, `${username}-${id.slice(-4)}`, payload.email.toLowerCase(), avatar, payload.sub, 'google', new Date().toISOString()],
      );
      user = await db.get('SELECT * FROM users WHERE id = ?', [id]);
    }

    return res.json({ user: mapUser(user) });
  } catch {
    return res.status(401).json({ error: 'Google credential невалиден' });
  }
});

app.get('/api/posts', async (req, res) => {
  const userId = String(req.query.userId || '');
  const posts = await db.all(
    `SELECT p.id,
            p.authorId,
            p.content,
            p.createdAt,
            u.username AS authorName,
            u.avatar AS authorAvatar,
            COUNT(pl.userId) AS likes,
            SUM(CASE WHEN pl.userId = ? THEN 1 ELSE 0 END) AS isLikedByMe
     FROM posts p
     JOIN users u ON u.id = p.authorId
     LEFT JOIN post_likes pl ON pl.postId = p.id
     GROUP BY p.id
     ORDER BY p.createdAt DESC`,
    [userId],
  );

  res.json({
    posts: posts.map((post: any) => ({
      ...post,
      likes: Number(post.likes || 0),
      isLikedByMe: Number(post.isLikedByMe || 0) > 0,
    })),
  });
});

app.post('/api/posts', async (req, res) => {
  const { authorId, content } = req.body;
  if (!authorId || !content?.trim()) {
    return res.status(400).json({ error: 'authorId и content обязательны' });
  }

  const author = await db.get('SELECT id FROM users WHERE id = ?', [authorId]);
  if (!author) {
    return res.status(404).json({ error: 'Автор не найден' });
  }

  const id = `post-${Date.now()}`;
  await db.run('INSERT INTO posts (id, authorId, content, createdAt) VALUES (?, ?, ?, ?)', [
    id,
    authorId,
    content.trim(),
    new Date().toISOString(),
  ]);

  res.status(201).json({ id });
});

app.post('/api/posts/like', async (req, res) => {
  const { postId, userId } = req.body;
  if (!postId || !userId) {
    return res.status(400).json({ error: 'postId и userId обязательны' });
  }

  const existing = await db.get('SELECT * FROM post_likes WHERE postId = ? AND userId = ?', [postId, userId]);
  if (existing) {
    await db.run('DELETE FROM post_likes WHERE postId = ? AND userId = ?', [postId, userId]);
    return res.json({ liked: false });
  }

  await db.run('INSERT INTO post_likes (postId, userId, createdAt) VALUES (?, ?, ?)', [
    postId,
    userId,
    new Date().toISOString(),
  ]);
  return res.json({ liked: true });
});

async function startServer() {
  await initDb();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
