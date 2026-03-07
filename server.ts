import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

import crypto from 'crypto';

// ... existing imports ...

// Helper to hash password
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, hash) {
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

// Database setup
let db;

async function initDb() {
  db = await open({
    filename: path.join(__dirname, 'database.sqlite'),
    driver: sqlite3.Database
  });

  // Check if users table has the old schema (simple password column) and migrate if needed
  try {
    const columns = await db.all("PRAGMA table_info(users)");
    const hasSalt = columns.some(col => col.name === 'salt');
    
    if (!hasSalt && columns.length > 0) {
      console.log('Migrating users table to new schema...');
      await db.exec('DROP TABLE users');
    }
  } catch (e) {
    console.error('Error checking schema:', e);
  }

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      email TEXT,
      hash TEXT,
      salt TEXT,
      avatar TEXT,
      cover TEXT,
      trackCount INTEGER DEFAULT 0,
      minutesListened INTEGER DEFAULT 0,
      tracksPlayed INTEGER DEFAULT 0,
      createdAt TEXT,
      likes TEXT DEFAULT '[]'
    );
  `);

  // Migration: Ensure email column exists
  try {
    const columns = await db.all("PRAGMA table_info(users)");
    const hasEmail = columns.some(col => col.name === 'email');
    if (!hasEmail) {
      await db.exec("ALTER TABLE users ADD COLUMN email TEXT");
    }
  } catch (e) {
    console.error("Migration error (users):", e);
  }

  // Migration: Ensure createdAt column exists
  try {
    const columns = await db.all("PRAGMA table_info(users)");
    const hasCreatedAt = columns.some(col => col.name === 'createdAt');
    if (!hasCreatedAt) {
      await db.exec("ALTER TABLE users ADD COLUMN createdAt TEXT");
    }
  } catch (e) {
    console.error("Migration error:", e);
  }

  await db.exec(`
    CREATE TABLE IF NOT EXISTS tracks (
      id TEXT PRIMARY KEY,
      title TEXT,
      artist TEXT,
      cover TEXT,
      audioSrc TEXT,
      uploaderId TEXT,
      plays INTEGER DEFAULT 0,
      likesCount INTEGER DEFAULT 0,
      duration INTEGER DEFAULT 0,
      uploadedAt TEXT,
      lyrics TEXT,
      isExplicit INTEGER DEFAULT 0,
      genre TEXT,
      album TEXT,
      isPublic INTEGER DEFAULT 1
    );
  `);

  // Migration: Ensure new columns exist
  try {
    const columns = await db.all("PRAGMA table_info(tracks)");
    const columnNames = columns.map(col => col.name);
    
    if (!columnNames.includes('audioSrc')) await db.exec("ALTER TABLE tracks ADD COLUMN audioSrc TEXT");
    if (!columnNames.includes('likesCount')) await db.exec("ALTER TABLE tracks ADD COLUMN likesCount INTEGER DEFAULT 0");
    if (!columnNames.includes('genre')) await db.exec("ALTER TABLE tracks ADD COLUMN genre TEXT");
    if (!columnNames.includes('album')) await db.exec("ALTER TABLE tracks ADD COLUMN album TEXT");
    if (!columnNames.includes('isPublic')) await db.exec("ALTER TABLE tracks ADD COLUMN isPublic INTEGER DEFAULT 1");
  } catch (e) {
    console.error("Migration error (tracks):", e);
  }

  await db.exec(`
    CREATE TABLE IF NOT EXISTS playlists (
      id TEXT PRIMARY KEY,
      title TEXT,
      cover TEXT,
      authorId TEXT,
      tracks TEXT DEFAULT '[]',
      isPublic INTEGER DEFAULT 0,
      type TEXT DEFAULT 'playlist',
      releaseDate TEXT,
      createdAt TEXT
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      userId TEXT,
      trackId TEXT,
      content TEXT,
      createdAt TEXT,
      FOREIGN KEY(userId) REFERENCES users(id),
      FOREIGN KEY(trackId) REFERENCES tracks(id)
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS follows (
      followerId TEXT,
      followingId TEXT,
      createdAt TEXT,
      PRIMARY KEY(followerId, followingId),
      FOREIGN KEY(followerId) REFERENCES users(id),
      FOREIGN KEY(followingId) REFERENCES users(id)
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS likes (
      userId TEXT,
      trackId TEXT,
      createdAt TEXT,
      PRIMARY KEY(userId, trackId),
      FOREIGN KEY(userId) REFERENCES users(id),
      FOREIGN KEY(trackId) REFERENCES tracks(id)
    );
  `);
}

const app = express();
const PORT = 3000;

app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// API Routes

// Auth
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const existing = await db.get('SELECT * FROM users WHERE username = ?', username);
    if (existing) return res.status(400).json({ error: 'User already exists' });

    const { salt, hash } = hashPassword(password);

    const newUser = {
      id: Math.random().toString(36).substr(2, 9),
      username,
      email: '', // Keep empty email for backward compatibility with DB schema
      hash,
      salt,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      cover: `https://picsum.photos/seed/${username}/800/200`,
      createdAt: new Date().toISOString()
    };

    await db.run(
      'INSERT INTO users (id, username, email, hash, salt, avatar, cover, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      newUser.id, newUser.username, newUser.email, newUser.hash, newUser.salt, newUser.avatar, newUser.cover, newUser.createdAt
    );

    const savedUser = await db.get('SELECT * FROM users WHERE id = ?', newUser.id);
    savedUser.likes = JSON.parse(savedUser.likes || '[]');
    const { hash: _h, salt: _s, ...userWithoutPass } = savedUser;
    res.json(userWithoutPass);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await db.get('SELECT * FROM users WHERE username = ?', username);
    
    if (!user || !verifyPassword(password, user.salt, user.hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    user.likes = JSON.parse(user.likes || '[]');
    const { hash: _h, salt: _s, ...userWithoutPass } = user;
    res.json(userWithoutPass);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await db.get('SELECT * FROM users WHERE id = ?', req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    user.likes = JSON.parse(user.likes || '[]');
    const { hash: _h, salt: _s, ...userWithoutPass } = user;
    res.json(userWithoutPass);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.patch('/api/users/:id', async (req, res) => {
  try {
    const { tracksPlayed, minutesListened } = req.body;
    const user = await db.get('SELECT * FROM users WHERE id = ?', req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (tracksPlayed) {
      await db.run('UPDATE users SET tracksPlayed = tracksPlayed + ? WHERE id = ?', tracksPlayed, req.params.id);
    }
    if (minutesListened) {
      await db.run('UPDATE users SET minutesListened = minutesListened + ? WHERE id = ?', minutesListened, req.params.id);
    }

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Uploads
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

// Tracks
app.get('/api/tracks', async (req, res) => {
  try {
    const tracks = await db.all('SELECT * FROM tracks WHERE audioSrc IS NOT NULL AND audioSrc != ""');
    res.json(tracks.map(t => ({ ...t, isExplicit: !!t.isExplicit, isPublic: !!t.isPublic, url: t.audioSrc })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/tracks', async (req, res) => {
  try {
    const track = req.body;
    const id = `track-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    
    // Handle both 'url' and 'audioSrc' from frontend
    const audioSrc = track.audioSrc || track.url;
    
    if (!audioSrc) {
      return res.status(400).json({ error: 'Audio source is required' });
    }

    await db.run(
      `INSERT INTO tracks (id, title, artist, cover, audioSrc, uploaderId, plays, duration, uploadedAt, lyrics, isExplicit, genre, album, isPublic) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id, track.title, track.artist, track.cover, audioSrc, track.uploaderId, 
      0, track.duration || 0, new Date().toISOString(), track.lyrics || '', 
      track.isExplicit ? 1 : 0, track.genre || '', track.album || '', 
      track.isPublic === false ? 0 : 1
    );

    // Update user track count
    await db.run('UPDATE users SET trackCount = trackCount + 1 WHERE id = ?', track.uploaderId);

    const newTrack = await db.get('SELECT * FROM tracks WHERE id = ?', id);
    res.json({ ...newTrack, isExplicit: !!newTrack.isExplicit, isPublic: !!newTrack.isPublic, url: newTrack.audioSrc });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/tracks/:id/play', async (req, res) => {
  try {
    await db.run('UPDATE tracks SET plays = plays + 1 WHERE id = ?', req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Comments
app.get('/api/tracks/:id/comments', async (req, res) => {
  try {
    const comments = await db.all(`
      SELECT c.*, u.username, u.avatar 
      FROM comments c 
      JOIN users u ON c.userId = u.id 
      WHERE c.trackId = ? 
      ORDER BY c.createdAt DESC
    `, req.params.id);
    res.json(comments);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/tracks/:id/comments', async (req, res) => {
  try {
    const { userId, content } = req.body;
    const id = `comment-${Date.now()}`;
    await db.run(
      'INSERT INTO comments (id, userId, trackId, content, createdAt) VALUES (?, ?, ?, ?, ?)',
      id, userId, req.params.id, content, new Date().toISOString()
    );
    const newComment = await db.get(`
      SELECT c.*, u.username, u.avatar 
      FROM comments c 
      JOIN users u ON c.userId = u.id 
      WHERE c.id = ?
    `, id);
    res.json(newComment);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Follows
app.post('/api/users/:id/follow', async (req, res) => {
  try {
    const { followerId } = req.body;
    const followingId = req.params.id;
    
    const existing = await db.get('SELECT * FROM follows WHERE followerId = ? AND followingId = ?', followerId, followingId);
    if (existing) {
      await db.run('DELETE FROM follows WHERE followerId = ? AND followingId = ?', followerId, followingId);
      return res.json({ followed: false });
    } else {
      await db.run('INSERT INTO follows (followerId, followingId, createdAt) VALUES (?, ?, ?)', followerId, followingId, new Date().toISOString());
      return res.json({ followed: true });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/users/:id/followers', async (req, res) => {
  try {
    const followers = await db.all(`
      SELECT u.id, u.username, u.avatar 
      FROM follows f 
      JOIN users u ON f.followerId = u.id 
      WHERE f.followingId = ?
    `, req.params.id);
    res.json(followers);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Playlists
app.get('/api/playlists', async (req, res) => {
  try {
    const playlists = await db.all('SELECT * FROM playlists');
    res.json(playlists.map(p => ({ 
      ...p, 
      tracks: JSON.parse(p.tracks || '[]'),
      isPublic: !!p.isPublic 
    })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/playlists', async (req, res) => {
  try {
    const playlist = req.body;
    const id = `playlist-${Date.now()}`;
    
    await db.run(
      `INSERT INTO playlists (id, title, cover, authorId, tracks, isPublic, type, releaseDate, createdAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id, playlist.title, playlist.cover, playlist.authorId, 
      JSON.stringify(playlist.tracks || []), playlist.isPublic === 'true' || playlist.isPublic === true ? 1 : 0, 
      playlist.type || 'playlist', playlist.releaseDate || null, new Date().toISOString()
    );

    const newPlaylist = await db.get('SELECT * FROM playlists WHERE id = ?', id);
    res.json({ 
      ...newPlaylist, 
      tracks: JSON.parse(newPlaylist.tracks),
      isPublic: !!newPlaylist.isPublic 
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/playlists/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM playlists WHERE id = ?', req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/playlists/:id/tracks', async (req, res) => {
  try {
    const { tracks } = req.body;
    await db.run('UPDATE playlists SET tracks = ? WHERE id = ?', JSON.stringify(tracks), req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Likes
app.post('/api/users/:id/likes', async (req, res) => {
  try {
    const { trackId } = req.body;
    const userId = req.params.id;
    
    const existing = await db.get('SELECT * FROM likes WHERE userId = ? AND trackId = ?', userId, trackId);
    
    if (existing) {
      await db.run('DELETE FROM likes WHERE userId = ? AND trackId = ?', userId, trackId);
      await db.run('UPDATE tracks SET likesCount = MAX(0, likesCount - 1) WHERE id = ?', trackId);
    } else {
      await db.run('INSERT INTO likes (userId, trackId, createdAt) VALUES (?, ?, ?)', userId, trackId, new Date().toISOString());
      await db.run('UPDATE tracks SET likesCount = likesCount + 1 WHERE id = ?', trackId);
    }

    // Still update the user's likes JSON for backward compatibility with frontend if needed
    // but the source of truth is now the likes table.
    const user = await db.get('SELECT * FROM users WHERE id = ?', userId);
    let likes = JSON.parse(user.likes || '[]');
    if (likes.includes(trackId)) {
      likes = likes.filter(id => id !== trackId);
    } else {
      likes.push(trackId);
    }
    await db.run('UPDATE users SET likes = ? WHERE id = ?', JSON.stringify(likes), userId);
    
    user.likes = likes;
    const { hash: _h, salt: _s, ...userWithoutPass } = user;
    res.json(userWithoutPass);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Vite Middleware
async function startServer() {
  await initDb();
  
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files from dist
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
