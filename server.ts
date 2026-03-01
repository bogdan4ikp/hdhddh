import express from 'express';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data directories exist
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const AVATARS_DIR = path.join(UPLOADS_DIR, 'avatars');
const COVERS_DIR = path.join(UPLOADS_DIR, 'covers');
const TRACKS_DIR = path.join(UPLOADS_DIR, 'tracks');

[DATA_DIR, UPLOADS_DIR, AVATARS_DIR, COVERS_DIR, TRACKS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Database Files
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const TRACKS_FILE = path.join(DATA_DIR, 'tracks.json');
const PLAYLISTS_FILE = path.join(DATA_DIR, 'playlists.json');

// Helper to read/write DB
const readDb = (file: string) => {
  if (!fs.existsSync(file)) return [];
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch (e) {
    return [];
  }
};

const writeDb = (file: string, data: any) => {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  
  // Serve uploaded files
  app.use('/uploads', express.static(UPLOADS_DIR));

  // Multer Configuration
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      if (file.fieldname === 'avatar') cb(null, AVATARS_DIR);
      else if (file.fieldname === 'cover') cb(null, COVERS_DIR);
      else if (file.fieldname === 'track') cb(null, TRACKS_DIR);
      else cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  });

  const upload = multer({ storage });

  // --- API Routes ---

  // Check if username exists
  app.get('/api/check-user/:username', (req, res) => {
    const users = readDb(USERS_FILE);
    const exists = users.some((u: any) => u.username.toLowerCase() === req.params.username.toLowerCase());
    res.json({ exists });
  });

  // Register
  app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
    
    const users = readDb(USERS_FILE);
    if (users.find((u: any) => u.username === username)) {
      return res.status(400).json({ error: 'Username taken' });
    }

    const newUser = {
      id: uuidv4(),
      username,
      password, // In a real app, hash this!
      avatar: null,
      cover: null,
      trackCount: 0,
      likes: [],
      joinedAt: new Date().toISOString()
    };

    users.push(newUser);
    writeDb(USERS_FILE, users);
    
    // Don't send password back
    const { password: _, ...userWithoutPass } = newUser;
    res.json(userWithoutPass);
  });

  // Login
  app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const users = readDb(USERS_FILE);
    const user = users.find((u: any) => u.username === username && u.password === password);
    
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    
    const { password: _, ...userWithoutPass } = user;
    res.json(userWithoutPass);
  });

  // Get User Profile
  app.get('/api/users/:id', (req, res) => {
    const users = readDb(USERS_FILE);
    const user = users.find((u: any) => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Ensure likes array exists for older users
    if (!user.likes) {
      user.likes = [];
      writeDb(USERS_FILE, users);
    }

    const { password: _, ...userWithoutPass } = user;
    res.json(userWithoutPass);
  });

  // Update Profile (Avatar/Cover)
  app.post('/api/users/:id/update', upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), (req, res) => {
    const users = readDb(USERS_FILE);
    const userIndex = users.findIndex((u: any) => u.id === req.params.id);
    
    if (userIndex === -1) return res.status(404).json({ error: 'User not found' });

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    if (files.avatar) {
      users[userIndex].avatar = `/uploads/avatars/${files.avatar[0].filename}`;
    }
    if (files.cover) {
      users[userIndex].cover = `/uploads/covers/${files.cover[0].filename}`;
    }

    writeDb(USERS_FILE, users);
    const { password: _, ...userWithoutPass } = users[userIndex];
    res.json(userWithoutPass);
  });

  // Upload Track
  app.post('/api/upload', upload.fields([{ name: 'track', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), (req, res) => {
    const { title, artist, userId } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!files.track || !title || !userId) {
      return res.status(400).json({ error: 'Missing track file or info' });
    }

    const tracks = readDb(TRACKS_FILE);
    const users = readDb(USERS_FILE);
    const userIndex = users.findIndex((u: any) => u.id === userId);

    if (userIndex === -1) return res.status(404).json({ error: 'User not found' });

    const newTrack = {
      id: uuidv4(),
      title,
      artist: artist || users[userIndex].username,
      url: `/uploads/tracks/${files.track[0].filename}`,
      cover: files.cover ? `/uploads/covers/${files.cover[0].filename}` : null,
      uploaderId: userId,
      uploadedAt: new Date().toISOString(),
      plays: 0,
      isExplicit: req.body.isExplicit === 'true',
      status: 'pending' // Tracks start as pending
    };

    tracks.push(newTrack);
    writeDb(TRACKS_FILE, tracks);

    // Update user track count
    users[userIndex].trackCount = (users[userIndex].trackCount || 0) + 1;
    writeDb(USERS_FILE, users);

    // Simulate moderation after 1 minute
    setTimeout(() => {
      const currentTracks = readDb(TRACKS_FILE);
      const trackIdx = currentTracks.findIndex((t: any) => t.id === newTrack.id);
      if (trackIdx !== -1) {
        currentTracks[trackIdx].status = 'approved';
        // Randomly mark some as explicit if they contain certain words (simulated)
        const vulgarWords = ['fuck', 'shit', 'bitch', 'ass', 'sex', 'politics'];
        const hasVulgar = vulgarWords.some(word => title.toLowerCase().includes(word));
        if (hasVulgar) {
          currentTracks[trackIdx].isExplicit = true;
        }
        writeDb(TRACKS_FILE, currentTracks);
      }
    }, 60000); // 1 minute moderation simulation

    res.json(newTrack);
  });

  // Approve/Reject track (Admin/Moderator simulation)
  app.post('/api/tracks/:id/moderate', (req, res) => {
    const { status, isExplicit } = req.body;
    const tracks = readDb(TRACKS_FILE);
    const index = tracks.findIndex((t: any) => t.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Track not found' });
    
    if (status) tracks[index].status = status;
    if (isExplicit !== undefined) tracks[index].isExplicit = isExplicit;
    
    writeDb(TRACKS_FILE, tracks);
    res.json(tracks[index]);
  });

  // Get All Tracks
  app.get('/api/tracks', (req, res) => {
    const tracks = readDb(TRACKS_FILE);
    // Sort by newest
    res.json(tracks.reverse());
  });

  // Get User Tracks
  app.get('/api/users/:id/tracks', (req, res) => {
    const tracks = readDb(TRACKS_FILE);
    const userTracks = tracks.filter((t: any) => t.uploaderId === req.params.id);
    res.json(userTracks.reverse());
  });

  // Toggle Like
  app.post('/api/users/:id/like', (req, res) => {
    const { trackId } = req.body;
    const users = readDb(USERS_FILE);
    const userIndex = users.findIndex((u: any) => u.id === req.params.id);
    
    if (userIndex === -1) return res.status(404).json({ error: 'User not found' });
    
    if (!users[userIndex].likes) {
      users[userIndex].likes = [];
    }

    const likeIndex = users[userIndex].likes.indexOf(trackId);
    if (likeIndex === -1) {
      users[userIndex].likes.push(trackId);
    } else {
      users[userIndex].likes.splice(likeIndex, 1);
    }

    writeDb(USERS_FILE, users);
    res.json({ likes: users[userIndex].likes });
  });

  // Increment Play Count
  app.post('/api/tracks/:id/play', (req, res) => {
    const tracks = readDb(TRACKS_FILE);
    const trackIndex = tracks.findIndex((t: any) => t.id === req.params.id);
    
    if (trackIndex !== -1) {
      tracks[trackIndex].plays = (tracks[trackIndex].plays || 0) + 1;
      writeDb(TRACKS_FILE, tracks);
      res.json({ success: true, plays: tracks[trackIndex].plays });
    } else {
      res.status(404).json({ error: 'Track not found' });
    }
  });

  // Get Trends (Top played tracks)
  app.get('/api/trends', (req, res) => {
    const tracks = readDb(TRACKS_FILE);
    const trends = [...tracks].sort((a: any, b: any) => (b.plays || 0) - (a.plays || 0)).slice(0, 10);
    res.json(trends);
  });

  // Get Recommendations (Based on likes, or just random/new if no likes)
  app.get('/api/recommendations/:userId', (req, res) => {
    const users = readDb(USERS_FILE);
    const tracks = readDb(TRACKS_FILE);
    const user = users.find((u: any) => u.id === req.params.userId);
    
    if (!user || !user.likes || user.likes.length === 0) {
      // Return random tracks if no likes
      const shuffled = [...tracks].sort(() => 0.5 - Math.random());
      return res.json(shuffled.slice(0, 10));
    }

    // Find artists of liked tracks
    const likedTracks = tracks.filter((t: any) => user.likes.includes(t.id));
    const likedArtists = [...new Set(likedTracks.map((t: any) => t.artist))];

    // Find other tracks by these artists, excluding already liked ones
    let recommendations = tracks.filter((t: any) => 
      likedArtists.includes(t.artist) && !user.likes.includes(t.id)
    );

    // If not enough recommendations, pad with random tracks
    if (recommendations.length < 10) {
      const otherTracks = tracks.filter((t: any) => 
        !recommendations.includes(t) && !user.likes.includes(t.id)
      );
      const shuffled = [...otherTracks].sort(() => 0.5 - Math.random());
      recommendations = [...recommendations, ...shuffled].slice(0, 10);
    }

    res.json(recommendations);
  });

  // --- Playlists API ---

  // Get all public playlists
  app.get('/api/playlists', (req, res) => {
    const playlists = readDb(PLAYLISTS_FILE);
    res.json(playlists.filter((p: any) => p.isPublic));
  });

  // Get user playlists
  app.get('/api/users/:id/playlists', (req, res) => {
    const playlists = readDb(PLAYLISTS_FILE);
    res.json(playlists.filter((p: any) => p.authorId === req.params.id));
  });

  // Create playlist
  app.post('/api/playlists', upload.single('cover'), (req, res) => {
    const { title, authorId, isPublic, tracks } = req.body;
    if (!title || !authorId) return res.status(400).json({ error: 'Missing fields' });

    const playlists = readDb(PLAYLISTS_FILE);
    const newPlaylist = {
      id: uuidv4(),
      title,
      authorId,
      cover: req.file ? `/uploads/covers/${req.file.filename}` : null,
      isPublic: isPublic === 'true' || isPublic === true,
      tracks: tracks ? JSON.parse(tracks) : [],
      createdAt: new Date().toISOString()
    };

    playlists.push(newPlaylist);
    writeDb(PLAYLISTS_FILE, playlists);
    res.json(newPlaylist);
  });

  // Update playlist
  app.put('/api/playlists/:id', upload.single('cover'), (req, res) => {
    const { title, isPublic, tracks } = req.body;
    const playlists = readDb(PLAYLISTS_FILE);
    const index = playlists.findIndex((p: any) => p.id === req.params.id);
    
    if (index === -1) return res.status(404).json({ error: 'Playlist not found' });

    if (title) playlists[index].title = title;
    if (isPublic !== undefined) playlists[index].isPublic = isPublic === 'true' || isPublic === true;
    if (tracks) playlists[index].tracks = JSON.parse(tracks);
    if (req.file) playlists[index].cover = `/uploads/covers/${req.file.filename}`;

    writeDb(PLAYLISTS_FILE, playlists);
    res.json(playlists[index]);
  });

  // Delete playlist
  app.delete('/api/playlists/:id', (req, res) => {
    const playlists = readDb(PLAYLISTS_FILE);
    const index = playlists.findIndex((p: any) => p.id === req.params.id);
    
    if (index === -1) return res.status(404).json({ error: 'Playlist not found' });

    playlists.splice(index, 1);
    writeDb(PLAYLISTS_FILE, playlists);
    res.json({ success: true });
  });

  // Delete track
  app.delete('/api/tracks/:id', (req, res) => {
    const { userId } = req.query; // Need to verify author
    const tracks = readDb(TRACKS_FILE);
    const index = tracks.findIndex((t: any) => t.id === req.params.id);
    
    if (index === -1) return res.status(404).json({ error: 'Track not found' });
    if (tracks[index].uploaderId !== userId) return res.status(403).json({ error: 'Unauthorized' });

    // Remove track from DB
    const deletedTrack = tracks.splice(index, 1)[0];
    writeDb(TRACKS_FILE, tracks);

    // Update user track count
    const users = readDb(USERS_FILE);
    const userIndex = users.findIndex((u: any) => u.id === userId);
    if (userIndex !== -1) {
      users[userIndex].trackCount = Math.max(0, (users[userIndex].trackCount || 1) - 1);
      writeDb(USERS_FILE, users);
    }

    // Remove track from all playlists
    const playlists = readDb(PLAYLISTS_FILE);
    let playlistsUpdated = false;
    playlists.forEach((p: any) => {
      const tIndex = p.tracks.indexOf(req.params.id);
      if (tIndex !== -1) {
        p.tracks.splice(tIndex, 1);
        playlistsUpdated = true;
      }
    });
    if (playlistsUpdated) writeDb(PLAYLISTS_FILE, playlists);

    res.json({ success: true, trackId: deletedTrack.id });
  });

  // Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
