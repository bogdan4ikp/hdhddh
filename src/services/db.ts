import { User, Track, Playlist } from '../context/AppContext';

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Helper to read file as base64
export const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

class LocalDB {
  private delay = 500; // Simulate network delay

  constructor() {
    this.init();
  }

  private init() {
    if (!localStorage.getItem('users')) {
      localStorage.setItem('users', JSON.stringify([]));
    }
    if (!localStorage.getItem('tracks')) {
      // Initialize with empty tracks
      localStorage.setItem('tracks', JSON.stringify([]));
    }
    if (!localStorage.getItem('playlists')) {
      localStorage.setItem('playlists', JSON.stringify([]));
    }
  }

  private async simulateDelay() {
    return new Promise(resolve => setTimeout(resolve, this.delay));
  }

  // Auth
  async login(username: string, password: string): Promise<User> {
    await this.simulateDelay();
    const users: any[] = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.username === username && u.password === password);
    
    if (!user) {
      throw new Error('Неверное имя пользователя или пароль');
    }
    
    const { password: _, ...userData } = user;
    return userData;
  }

  async register(username: string, password: string): Promise<User> {
    await this.simulateDelay();
    const users: any[] = JSON.parse(localStorage.getItem('users') || '[]');
    
    if (users.find(u => u.username === username)) {
      throw new Error('Пользователь уже существует');
    }

    const newUser = {
      id: generateId(),
      username,
      password,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      cover: `https://picsum.photos/seed/${username}/800/200`,
      trackCount: 0,
      likes: [],
      minutesListened: 0,
      tracksPlayed: 0,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    const { password: _, ...userData } = newUser;
    return userData;
  }

  async getUser(id: string): Promise<User | null> {
    await this.simulateDelay();
    const users: any[] = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.id === id);
    if (!user) return null;
    const { password: _, ...userData } = user;
    return userData;
  }

  // Tracks
  async getTracks(): Promise<Track[]> {
    await this.simulateDelay();
    return JSON.parse(localStorage.getItem('tracks') || '[]');
  }

  async uploadTrack(trackData: Omit<Track, 'id' | 'uploadedAt' | 'plays'>): Promise<Track> {
    await this.simulateDelay();
    const tracks: Track[] = JSON.parse(localStorage.getItem('tracks') || '[]');
    
    const newTrack: Track = {
      ...trackData,
      id: `track-${Date.now()}`,
      uploadedAt: new Date().toISOString(),
      plays: 0
    };

    tracks.unshift(newTrack);
    localStorage.setItem('tracks', JSON.stringify(tracks));

    // Update user track count
    const users: any[] = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.id === trackData.uploaderId);
    if (userIndex !== -1) {
      users[userIndex].trackCount = (users[userIndex].trackCount || 0) + 1;
      localStorage.setItem('users', JSON.stringify(users));
    }

    return newTrack;
  }

  async incrementPlayCount(trackId: string) {
    const tracks: Track[] = JSON.parse(localStorage.getItem('tracks') || '[]');
    const trackIndex = tracks.findIndex(t => t.id === trackId);
    if (trackIndex !== -1) {
      tracks[trackIndex].plays = (tracks[trackIndex].plays || 0) + 1;
      localStorage.setItem('tracks', JSON.stringify(tracks));
    }
  }

  // Playlists
  async getPlaylists(): Promise<Playlist[]> {
    await this.simulateDelay();
    return JSON.parse(localStorage.getItem('playlists') || '[]');
  }

  async createPlaylist(playlistData: Omit<Playlist, 'id' | 'createdAt'>): Promise<Playlist> {
    await this.simulateDelay();
    const playlists: Playlist[] = JSON.parse(localStorage.getItem('playlists') || '[]');
    
    const newPlaylist: Playlist = {
      ...playlistData,
      id: `playlist-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    playlists.unshift(newPlaylist);
    localStorage.setItem('playlists', JSON.stringify(playlists));
    return newPlaylist;
  }

  async deletePlaylist(id: string) {
    await this.simulateDelay();
    let playlists: Playlist[] = JSON.parse(localStorage.getItem('playlists') || '[]');
    playlists = playlists.filter(p => p.id !== id);
    localStorage.setItem('playlists', JSON.stringify(playlists));
  }

  async addTrackToPlaylist(playlistId: string, trackId: string) {
    await this.simulateDelay();
    const playlists: Playlist[] = JSON.parse(localStorage.getItem('playlists') || '[]');
    const playlistIndex = playlists.findIndex(p => p.id === playlistId);
    
    if (playlistIndex !== -1) {
      if (!playlists[playlistIndex].tracks.includes(trackId)) {
        playlists[playlistIndex].tracks.push(trackId);
        localStorage.setItem('playlists', JSON.stringify(playlists));
      }
    }
  }

  async removeTrackFromPlaylist(playlistId: string, trackId: string) {
    await this.simulateDelay();
    const playlists: Playlist[] = JSON.parse(localStorage.getItem('playlists') || '[]');
    const playlistIndex = playlists.findIndex(p => p.id === playlistId);
    
    if (playlistIndex !== -1) {
      playlists[playlistIndex].tracks = playlists[playlistIndex].tracks.filter(id => id !== trackId);
      localStorage.setItem('playlists', JSON.stringify(playlists));
    }
  }

  // User Stats & Likes
  async toggleLike(userId: string, trackId: string) {
    await this.simulateDelay();
    const users: any[] = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex !== -1) {
      const likes = users[userIndex].likes || [];
      if (likes.includes(trackId)) {
        users[userIndex].likes = likes.filter((id: string) => id !== trackId);
      } else {
        users[userIndex].likes.push(trackId);
      }
      localStorage.setItem('users', JSON.stringify(users));
      return users[userIndex];
    }
  }

  async updateUserStats(userId: string, stats: { tracksPlayed?: number, minutesListened?: number }) {
    const users: any[] = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex !== -1) {
      if (stats.tracksPlayed) {
        users[userIndex].tracksPlayed = (users[userIndex].tracksPlayed || 0) + stats.tracksPlayed;
      }
      if (stats.minutesListened) {
        users[userIndex].minutesListened = (users[userIndex].minutesListened || 0) + stats.minutesListened;
      }
      localStorage.setItem('users', JSON.stringify(users));
    }
  }
}

export const db = new LocalDB();
