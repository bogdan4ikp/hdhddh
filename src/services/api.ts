import { User, Track, Playlist } from '../context/AppContext';

export const api = {
  // Auth
  async login(username: string, password: string): Promise<User> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        throw new Error(json.error || text);
      } catch (e) {
        throw new Error(text);
      }
    }
    return res.json();
  },

  async register(username: string, password: string): Promise<User> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        throw new Error(json.error || text);
      } catch (e) {
        throw new Error(text);
      }
    }
    return res.json();
  },

  async getUser(id: string): Promise<User> {
    const res = await fetch(`/api/users/${id}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Tracks
  async getTracks(): Promise<Track[]> {
    const res = await fetch('/api/tracks');
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data.url;
  },

  async createTrack(trackData: Partial<Track>): Promise<Track> {
    const res = await fetch('/api/tracks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trackData)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async incrementPlayCount(trackId: string) {
    await fetch(`/api/tracks/${trackId}/play`, { method: 'POST' });
  },

  // Playlists
  async getPlaylists(): Promise<Playlist[]> {
    const res = await fetch('/api/playlists');
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async createPlaylist(playlistData: Partial<Playlist>): Promise<Playlist> {
    const res = await fetch('/api/playlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(playlistData)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async deletePlaylist(id: string) {
    await fetch(`/api/playlists/${id}`, { method: 'DELETE' });
  },

  async updatePlaylistTracks(id: string, tracks: string[]) {
    await fetch(`/api/playlists/${id}/tracks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tracks })
    });
  },

  // Likes
  async toggleLike(userId: string, trackId: string): Promise<User> {
    const res = await fetch(`/api/users/${userId}/likes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackId })
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async updateUserStats(userId: string, stats: { tracksPlayed?: number, minutesListened?: number }) {
    await fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stats)
    });
  },

  // Comments
  async getComments(trackId: string) {
    const res = await fetch(`/api/tracks/${trackId}/comments`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async addComment(trackId: string, userId: string, content: string) {
    const res = await fetch(`/api/tracks/${trackId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, content })
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Follows
  async toggleFollow(followerId: string, followingId: string) {
    const res = await fetch(`/api/users/${followingId}/follow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ followerId })
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getFollowers(userId: string) {
    const res = await fetch(`/api/users/${userId}/followers`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};
