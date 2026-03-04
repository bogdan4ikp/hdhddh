import express from 'express';
import cors from 'cors';
import multer from 'multer';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Setup Multer for file uploads
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

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static(uploadsDir));

let db: any;

async function initDb() {
  console.log('Initializing database...');
  db = await open({
    filename: path.join(process.cwd(), 'database.sqlite'),
    driver: sqlite3.Database
  });
  console.log('Database opened successfully.');

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      password TEXT,
      avatar TEXT,
      cover TEXT,
      trackCount INTEGER DEFAULT 0,
      minutesListened INTEGER DEFAULT 0,
      tracksPlayed INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS tracks (
      id TEXT PRIMARY KEY,
      title TEXT,
      artist TEXT,
      cover TEXT,
      url TEXT,
      uploaderId TEXT,
      plays INTEGER DEFAULT 0,
      uploadedAt TEXT,
      isExplicit BOOLEAN DEFAULT 0,
      status TEXT DEFAULT 'approved',
      lyrics TEXT,
      releaseDate TEXT,
      FOREIGN KEY (uploaderId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS playlists (
      id TEXT PRIMARY KEY,
      title TEXT,
      authorId TEXT,
      cover TEXT,
      isPublic BOOLEAN DEFAULT 0,
      type TEXT DEFAULT 'playlist',
      createdAt TEXT,
      releaseDate TEXT,
      FOREIGN KEY (authorId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS playlist_tracks (
      playlistId TEXT,
      trackId TEXT,
      position INTEGER,
      FOREIGN KEY (playlistId) REFERENCES playlists(id),
      FOREIGN KEY (trackId) REFERENCES tracks(id)
    );

    CREATE TABLE IF NOT EXISTS likes (
      userId TEXT,
      trackId TEXT,
      PRIMARY KEY (userId, trackId),
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (trackId) REFERENCES tracks(id)
    );
  `);

  try { await db.exec("ALTER TABLE tracks ADD COLUMN lyrics TEXT"); } catch (e) {}
  try { await db.exec("ALTER TABLE tracks ADD COLUMN releaseDate TEXT"); } catch (e) {}
  try { await db.exec("ALTER TABLE playlists ADD COLUMN releaseDate TEXT"); } catch (e) {}
}

// API Routes

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    dbConnected: !!db,
    time: new Date().toISOString()
  });
});

// Auth
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  
  const id = 'user-' + Date.now();
  try {
    await db.run('INSERT INTO users (id, username, password) VALUES (?, ?, ?)', [id, username, password]);
    const user = await db.get('SELECT id, username, avatar, cover, trackCount, minutesListened, tracksPlayed FROM users WHERE id = ?', [id]);
    res.json(user);
  } catch (e: any) {
    if (e.message.includes('UNIQUE')) return res.status(400).json({ error: 'Username already exists' });
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await db.get('SELECT id, username, avatar, cover, trackCount, minutesListened, tracksPlayed FROM users WHERE username = ? AND password = ?', [username, password]);
  if (user) {
    res.json(user);
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.get('/api/users/:id', async (req, res) => {
  const user = await db.get('SELECT id, username, avatar, cover, trackCount, minutesListened, tracksPlayed FROM users WHERE id = ?', [req.params.id]);
  if (user) {
    const likes = await db.all('SELECT trackId FROM likes WHERE userId = ?', [user.id]);
    user.likes = likes.map((l: any) => l.trackId);
    res.json(user);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

app.post('/api/users/:id/stats', async (req, res) => {
  const { tracksPlayed, minutesListened } = req.body;
  await db.run('UPDATE users SET tracksPlayed = tracksPlayed + ?, minutesListened = minutesListened + ? WHERE id = ?', [tracksPlayed || 0, minutesListened || 0, req.params.id]);
  res.json({ success: true });
});

app.post('/api/users/:id/profile', upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), async (req, res) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  
  let updates = [];
  let params = [];

  if (files.avatar && files.avatar.length > 0) {
    updates.push('avatar = ?');
    params.push('/uploads/' + files.avatar[0].filename);
  }

  if (files.cover && files.cover.length > 0) {
    updates.push('cover = ?');
    params.push('/uploads/' + files.cover[0].filename);
  }

  if (updates.length > 0) {
    params.push(req.params.id);
    await db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
  }
  
  const user = await db.get('SELECT id, username, avatar, cover, trackCount, minutesListened, tracksPlayed FROM users WHERE id = ?', [req.params.id]);
  if (user) {
    const likes = await db.all('SELECT trackId FROM likes WHERE userId = ?', [user.id]);
    user.likes = likes.map((l: any) => l.trackId);
    res.json(user);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// Tracks
app.get('/api/tracks', async (req, res) => {
  const tracks = await db.all('SELECT * FROM tracks ORDER BY uploadedAt DESC');
  // Convert boolean
  tracks.forEach((t: any) => t.isExplicit = !!t.isExplicit);
  res.json(tracks);
});

app.post('/api/tracks', upload.any(), async (req, res) => {
  const { title, artist, uploaderId, isExplicit, releaseType, releaseDate } = req.body;
  const files = req.files as Express.Multer.File[];
  
  const audioFiles = files.filter(f => f.fieldname.startsWith('audio_'));
  if (audioFiles.length === 0) return res.status(400).json({ error: 'Audio file required' });

  const albumCoverFile = files.find(f => f.fieldname === 'cover');
  let albumCoverUrl = '';
  if (albumCoverFile) {
    albumCoverUrl = '/uploads/' + albumCoverFile.filename;
  }

  const uploadedTracks = [];
  const trackIds = [];

  for (let i = 0; i < audioFiles.length; i++) {
    const file = audioFiles[i];
    const index = file.fieldname.split('_')[1]; // get the index
    
    const trackId = 'track-' + Date.now() + '-' + i;
    const trackTitle = req.body[`title_${index}`] || (releaseType === 'album' ? file.originalname.replace(/\.[^/.]+$/, "") : title);
    const trackLyrics = req.body[`lyrics_${index}`] || '';
    const trackUrl = '/uploads/' + file.filename;
    
    // Check for individual cover
    const individualCoverFile = files.find(f => f.fieldname === `cover_${index}`);
    const trackCoverUrl = individualCoverFile ? '/uploads/' + individualCoverFile.filename : albumCoverUrl;
    
    await db.run(
      'INSERT INTO tracks (id, title, artist, cover, url, uploaderId, uploadedAt, isExplicit, lyrics, releaseDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [trackId, trackTitle, artist, trackCoverUrl, trackUrl, uploaderId, new Date().toISOString(), isExplicit === 'true' ? 1 : 0, trackLyrics, releaseDate || null]
    );
    
    const track = await db.get('SELECT * FROM tracks WHERE id = ?', [trackId]);
    track.isExplicit = !!track.isExplicit;
    uploadedTracks.push(track);
    trackIds.push(trackId);
  }

  // Update user track count
  await db.run('UPDATE users SET trackCount = trackCount + ? WHERE id = ?', [audioFiles.length, uploaderId]);

  if (releaseType === 'album' && trackIds.length > 0) {
    const playlistId = 'playlist-' + Date.now();
    await db.run(
      'INSERT INTO playlists (id, title, authorId, cover, isPublic, type, createdAt, releaseDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [playlistId, title, uploaderId, albumCoverUrl, 1, 'album', new Date().toISOString(), releaseDate || null]
    );
    for (let i = 0; i < trackIds.length; i++) {
      await db.run('INSERT INTO playlist_tracks (playlistId, trackId, position) VALUES (?, ?, ?)', [playlistId, trackIds[i], i]);
    }
  }

  res.json({ success: true, tracks: uploadedTracks });
});

app.post('/api/tracks/:id/play', async (req, res) => {
  await db.run('UPDATE tracks SET plays = plays + 1 WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

app.delete('/api/tracks/:id', async (req, res) => {
  const { id } = req.params;
  const track = await db.get('SELECT url, cover FROM tracks WHERE id = ?', [id]);
  if (track) {
    try {
      if (track.url) fs.unlinkSync(path.join(process.cwd(), track.url));
      // Not deleting cover as it might be shared
    } catch (e) {}
    await db.run('DELETE FROM tracks WHERE id = ?', [id]);
    await db.run('DELETE FROM playlist_tracks WHERE trackId = ?', [id]);
    await db.run('DELETE FROM likes WHERE trackId = ?', [id]);
  }
  res.json({ success: true });
});

// Playlists
app.get('/api/playlists', async (req, res) => {
  const playlists = await db.all('SELECT * FROM playlists ORDER BY createdAt DESC');
  for (const p of playlists) {
    p.isPublic = !!p.isPublic;
    const tracks = await db.all('SELECT trackId FROM playlist_tracks WHERE playlistId = ? ORDER BY position ASC', [p.id]);
    p.tracks = tracks.map((t: any) => t.trackId);
  }
  res.json(playlists);
});

app.post('/api/playlists', upload.single('cover'), async (req, res) => {
  const { title, authorId, isPublic, tracks, type, releaseDate } = req.body;
  const playlistId = 'playlist-' + Date.now();
  
  let coverUrl = '';
  if (req.file) {
    coverUrl = '/uploads/' + req.file.filename;
  }

  await db.run(
    'INSERT INTO playlists (id, title, authorId, cover, isPublic, type, createdAt, releaseDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [playlistId, title, authorId, coverUrl, isPublic === 'true' ? 1 : 0, type || 'playlist', new Date().toISOString(), releaseDate || null]
  );

  if (tracks) {
    const trackIds = JSON.parse(tracks);
    for (let i = 0; i < trackIds.length; i++) {
      await db.run('INSERT INTO playlist_tracks (playlistId, trackId, position) VALUES (?, ?, ?)', [playlistId, trackIds[i], i]);
    }
  }

  res.json({ success: true, id: playlistId });
});

app.delete('/api/playlists/:id', async (req, res) => {
  await db.run('DELETE FROM playlists WHERE id = ?', [req.params.id]);
  await db.run('DELETE FROM playlist_tracks WHERE playlistId = ?', [req.params.id]);
  res.json({ success: true });
});

app.post('/api/playlists/:id/tracks', async (req, res) => {
  const { tracks } = req.body;
  await db.run('DELETE FROM playlist_tracks WHERE playlistId = ?', [req.params.id]);
  for (let i = 0; i < tracks.length; i++) {
    await db.run('INSERT INTO playlist_tracks (playlistId, trackId, position) VALUES (?, ?, ?)', [req.params.id, tracks[i], i]);
  }
  res.json({ success: true });
});

// Likes
app.post('/api/likes', async (req, res) => {
  const { userId, trackId } = req.body;
  const existing = await db.get('SELECT * FROM likes WHERE userId = ? AND trackId = ?', [userId, trackId]);
  
  if (existing) {
    await db.run('DELETE FROM likes WHERE userId = ? AND trackId = ?', [userId, trackId]);
    res.json({ liked: false });
  } else {
    await db.run('INSERT INTO likes (userId, trackId) VALUES (?, ?)', [userId, trackId]);
    res.json({ liked: true });
  }
});

async function startServer() {
  await initDb();

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
