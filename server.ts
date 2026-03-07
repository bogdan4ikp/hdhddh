import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import pg from 'pg';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const { Pool } = pg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

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
let pool;

async function initDb() {
  const connectionString = process.env.DATABASE_URL || "postgresql://postgres:Bogdan4ik01082011@db.hkgukzvwhffyctcdmcnt.supabase.co:5432/postgres";
  
  if (connectionString.includes('db.hkgukzvwhffyctcdmcnt.supabase.co') && connectionString.includes('5432')) {
    console.error('\n================================================================');
    console.error('❌ DATABASE CONNECTION ERROR (IPv6 NOT SUPPORTED):');
    console.error('Supabase direct connections (port 5432) are now IPv6-only.');
    console.error('This environment only supports IPv4.');
    console.error('Please go to your Supabase Dashboard -> Project Settings -> Database');
    console.error('and copy the "Connection pooling" URL (port 6543, pooler.supabase.com).');
    console.error('Set it as the DATABASE_URL environment variable.');
    console.error('================================================================\n');
  }

  pool = new Pool({
    connectionString,
    ssl: connectionString.includes('supabase.co') || connectionString.includes('pooler.supabase.com') ? { rejectUnauthorized: false } : false
  });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE,
        email TEXT,
        hash TEXT,
        salt TEXT,
        avatar TEXT,
        cover TEXT,
        "trackCount" INTEGER DEFAULT 0,
        "minutesListened" INTEGER DEFAULT 0,
        "tracksPlayed" INTEGER DEFAULT 0,
        "createdAt" TEXT,
        likes TEXT DEFAULT '[]',
        "googleId" TEXT UNIQUE
      );
    `);
    try { await pool.query(`ALTER TABLE users ADD COLUMN "googleId" TEXT UNIQUE`); } catch (e) {}
    try { await pool.query(`ALTER TABLE users ALTER COLUMN hash DROP NOT NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE users ALTER COLUMN salt DROP NOT NULL`); } catch (e) {}

    await pool.query(`
      CREATE TABLE IF NOT EXISTS tracks (
        id TEXT PRIMARY KEY,
        title TEXT,
        artist TEXT,
        cover TEXT,
        "audioSrc" TEXT,
        "uploaderId" TEXT,
        plays INTEGER DEFAULT 0,
        "likesCount" INTEGER DEFAULT 0,
        duration INTEGER DEFAULT 0,
        "uploadedAt" TEXT,
        lyrics TEXT,
        "isExplicit" INTEGER DEFAULT 0,
        genre TEXT,
        album TEXT,
        "isPublic" INTEGER DEFAULT 1
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS playlists (
        id TEXT PRIMARY KEY,
        title TEXT,
        cover TEXT,
        "authorId" TEXT,
        tracks TEXT DEFAULT '[]',
        "isPublic" INTEGER DEFAULT 0,
        type TEXT DEFAULT 'playlist',
        "releaseDate" TEXT,
        "createdAt" TEXT
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        "userId" TEXT,
        "trackId" TEXT,
        content TEXT,
        "createdAt" TEXT,
        FOREIGN KEY("userId") REFERENCES users(id),
        FOREIGN KEY("trackId") REFERENCES tracks(id)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS follows (
        "followerId" TEXT,
        "followingId" TEXT,
        "createdAt" TEXT,
        PRIMARY KEY("followerId", "followingId"),
        FOREIGN KEY("followerId") REFERENCES users(id),
        FOREIGN KEY("followingId") REFERENCES users(id)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS likes (
        "userId" TEXT,
        "trackId" TEXT,
        "createdAt" TEXT,
        PRIMARY KEY("userId", "trackId"),
        FOREIGN KEY("userId") REFERENCES users(id),
        FOREIGN KEY("trackId") REFERENCES tracks(id)
      );
    `);
    console.log("Database initialized successfully");
  } catch (e) {
    console.error("Database initialization error:", e);
  }
}

const app = express();
const PORT = 3000;

app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// File upload configuration
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// API Routes

// Auth
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (rows.length > 0) return res.status(400).json({ error: 'User already exists' });

    const { salt, hash } = hashPassword(password);

    const newUser = {
      id: Math.random().toString(36).substr(2, 9),
      username,
      email: '',
      hash,
      salt,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      cover: `https://picsum.photos/seed/${username}/800/200`,
      createdAt: new Date().toISOString()
    };

    await pool.query(
      'INSERT INTO users (id, username, email, hash, salt, avatar, cover, "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [newUser.id, newUser.username, newUser.email, newUser.hash, newUser.salt, newUser.avatar, newUser.cover, newUser.createdAt]
    );

    const { rows: savedUsers } = await pool.query('SELECT * FROM users WHERE id = $1', [newUser.id]);
    const savedUser = savedUsers[0];
    savedUser.likes = JSON.parse(savedUser.likes || '[]');
    const { hash: _h, salt: _s, ...userWithoutPass } = savedUser;
    res.json(userWithoutPass);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/auth/google/url', (req, res) => {
  const origin = req.query.origin || req.headers.origin;
  const redirectUri = `${origin}/auth/callback`;
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'email profile',
    state: origin as string
  });
  res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
});

app.get('/auth/callback', async (req, res) => {
  const { code, state: origin } = req.query;
  const redirectUri = `${origin}/auth/callback`;

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        code: code as string,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
      })
    });
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) throw new Error('No access token');

    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const userData = await userRes.json();

    let { rows } = await pool.query('SELECT * FROM users WHERE "googleId" = $1 OR email = $2', [userData.id, userData.email]);
    let user = rows[0];

    if (!user) {
      const id = `user-${Date.now()}`;
      await pool.query(
        `INSERT INTO users (id, email, "googleId", avatar, "createdAt") VALUES ($1, $2, $3, $4, $5)`,
        [id, userData.email, userData.id, userData.picture, new Date().toISOString()]
      );
      const { rows: newRows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      user = newRows[0];
    } else if (!user.googleId) {
      await pool.query('UPDATE users SET "googleId" = $1, avatar = COALESCE(avatar, $2) WHERE id = $3', [userData.id, userData.picture, user.id]);
      user.googleId = userData.id;
    }

    const { hash, salt, ...safeUser } = user;

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_SUCCESS', token: 'google-oauth', user: ${JSON.stringify(safeUser)} }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. You can close this window.</p>
        </body>
      </html>
    `);
  } catch (e) {
    res.send(`<p>Authentication failed: ${e.message}</p>`);
  }
});

app.post('/api/users/setup-username', async (req, res) => {
  try {
    const { userId, username } = req.body;
    if (!userId || !username) return res.status(400).json({ error: 'User ID and username are required' });
    
    const { rows: existing } = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existing.length > 0) return res.status(400).json({ error: 'Username is already taken' });

    await pool.query('UPDATE users SET username = $1 WHERE id = $2', [username, userId]);
    
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = rows[0];
    const { hash, salt, ...userWithoutPass } = user;
    
    res.json({ token: 'google-oauth', user: userWithoutPass });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = rows[0];
    
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
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    const user = rows[0];
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
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    const user = rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (tracksPlayed) {
      await pool.query('UPDATE users SET "tracksPlayed" = "tracksPlayed" + $1 WHERE id = $2', [tracksPlayed, req.params.id]);
    }
    if (minutesListened) {
      await pool.query('UPDATE users SET "minutesListened" = "minutesListened" + $1 WHERE id = $2', [minutesListened, req.params.id]);
    }

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Uploads
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const fileUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
  res.json({ url: fileUrl });
});

// Tracks
app.get('/api/tracks', async (req, res) => {
  try {
    const { rows: tracks } = await pool.query('SELECT * FROM tracks WHERE "audioSrc" IS NOT NULL AND "audioSrc" != \'\'');
    res.json(tracks.map(t => ({ ...t, isExplicit: !!t.isExplicit, isPublic: !!t.isPublic, url: t.audioSrc })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/tracks', async (req, res) => {
  try {
    const track = req.body;
    const id = `track-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    
    const audioSrc = track.audioSrc || track.url;
    
    if (!audioSrc) {
      return res.status(400).json({ error: 'Audio source is required' });
    }

    await pool.query(
      `INSERT INTO tracks (id, title, artist, cover, "audioSrc", "uploaderId", plays, duration, "uploadedAt", lyrics, "isExplicit", genre, album, "isPublic") 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [id, track.title, track.artist, track.cover, audioSrc, track.uploaderId, 
      0, track.duration || 0, new Date().toISOString(), track.lyrics || '', 
      track.isExplicit ? 1 : 0, track.genre || '', track.album || '', 
      track.isPublic === false ? 0 : 1]
    );

    await pool.query('UPDATE users SET "trackCount" = "trackCount" + 1 WHERE id = $1', [track.uploaderId]);

    const { rows } = await pool.query('SELECT * FROM tracks WHERE id = $1', [id]);
    const newTrack = rows[0];
    res.json({ ...newTrack, isExplicit: !!newTrack.isExplicit, isPublic: !!newTrack.isPublic, url: newTrack.audioSrc });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/tracks/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM tracks WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/tracks/:id/play', async (req, res) => {
  try {
    await pool.query('UPDATE tracks SET plays = plays + 1 WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Comments
app.get('/api/tracks/:id/comments', async (req, res) => {
  try {
    const { rows: comments } = await pool.query(`
      SELECT c.*, u.username, u.avatar 
      FROM comments c 
      JOIN users u ON c."userId" = u.id 
      WHERE c."trackId" = $1 
      ORDER BY c."createdAt" DESC
    `, [req.params.id]);
    res.json(comments);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/tracks/:id/comments', async (req, res) => {
  try {
    const { userId, content } = req.body;
    const id = `comment-${Date.now()}`;
    await pool.query(
      'INSERT INTO comments (id, "userId", "trackId", content, "createdAt") VALUES ($1, $2, $3, $4, $5)',
      [id, userId, req.params.id, content, new Date().toISOString()]
    );
    const { rows } = await pool.query(`
      SELECT c.*, u.username, u.avatar 
      FROM comments c 
      JOIN users u ON c."userId" = u.id 
      WHERE c.id = $1
    `, [id]);
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Follows
app.post('/api/users/:id/follow', async (req, res) => {
  try {
    const { followerId } = req.body;
    const followingId = req.params.id;
    
    const { rows: existing } = await pool.query('SELECT * FROM follows WHERE "followerId" = $1 AND "followingId" = $2', [followerId, followingId]);
    if (existing.length > 0) {
      await pool.query('DELETE FROM follows WHERE "followerId" = $1 AND "followingId" = $2', [followerId, followingId]);
      return res.json({ followed: false });
    } else {
      await pool.query('INSERT INTO follows ("followerId", "followingId", "createdAt") VALUES ($1, $2, $3)', [followerId, followingId, new Date().toISOString()]);
      return res.json({ followed: true });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/users/:id/followers', async (req, res) => {
  try {
    const { rows: followers } = await pool.query(`
      SELECT u.id, u.username, u.avatar 
      FROM follows f 
      JOIN users u ON f."followerId" = u.id 
      WHERE f."followingId" = $1
    `, [req.params.id]);
    res.json(followers);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Playlists
app.get('/api/playlists', async (req, res) => {
  try {
    const { rows: playlists } = await pool.query('SELECT * FROM playlists');
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
    
    await pool.query(
      `INSERT INTO playlists (id, title, cover, "authorId", tracks, "isPublic", type, "releaseDate", "createdAt") 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [id, playlist.title, playlist.cover, playlist.authorId, 
      JSON.stringify(playlist.tracks || []), playlist.isPublic === 'true' || playlist.isPublic === true ? 1 : 0, 
      playlist.type || 'playlist', playlist.releaseDate || null, new Date().toISOString()]
    );

    const { rows } = await pool.query('SELECT * FROM playlists WHERE id = $1', [id]);
    const newPlaylist = rows[0];
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
    await pool.query('DELETE FROM playlists WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/playlists/:id/tracks', async (req, res) => {
  try {
    const { tracks } = req.body;
    await pool.query('UPDATE playlists SET tracks = $1 WHERE id = $2', [JSON.stringify(tracks), req.params.id]);
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
    
    const { rows: existing } = await pool.query('SELECT * FROM likes WHERE "userId" = $1 AND "trackId" = $2', [userId, trackId]);
    
    if (existing.length > 0) {
      await pool.query('DELETE FROM likes WHERE "userId" = $1 AND "trackId" = $2', [userId, trackId]);
      await pool.query('UPDATE tracks SET "likesCount" = GREATEST(0, "likesCount" - 1) WHERE id = $1', [trackId]);
    } else {
      await pool.query('INSERT INTO likes ("userId", "trackId", "createdAt") VALUES ($1, $2, $3)', [userId, trackId, new Date().toISOString()]);
      await pool.query('UPDATE tracks SET "likesCount" = "likesCount" + 1 WHERE id = $1', [trackId]);
    }

    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = rows[0];
    let likes = JSON.parse(user.likes || '[]');
    if (likes.includes(trackId)) {
      likes = likes.filter(id => id !== trackId);
    } else {
      likes.push(trackId);
    }
    await pool.query('UPDATE users SET likes = $1 WHERE id = $2', [JSON.stringify(likes), userId]);
    
    user.likes = likes;
    const { hash: _h, salt: _s, ...userWithoutPass } = user;
    res.json(userWithoutPass);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// User profile update
app.post('/api/users/:id/profile', upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), async (req, res) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    let updateQuery = 'UPDATE users SET ';
    const params = [];
    let paramIndex = 1;

    if (files.avatar) {
      updateQuery += `avatar = $${paramIndex}, `;
      params.push(`data:${files.avatar[0].mimetype};base64,${files.avatar[0].buffer.toString('base64')}`);
      paramIndex++;
    }

    if (files.cover) {
      updateQuery += `cover = $${paramIndex}, `;
      params.push(`data:${files.cover[0].mimetype};base64,${files.cover[0].buffer.toString('base64')}`);
      paramIndex++;
    }

    // Remove trailing comma and space
    updateQuery = updateQuery.slice(0, -2);
    
    if (params.length > 0) {
      updateQuery += ` WHERE id = $${paramIndex}`;
      params.push(req.params.id);
      await pool.query(updateQuery, params);
    }

    res.json({ success: true });
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
