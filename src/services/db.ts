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

const DB_NAME = 'MusicAppDB';
const DB_VERSION = 1;

class LocalDB {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void>;

  constructor() {
    this.initPromise = this.init();
  }

  private init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Database error:', request.error);
        reject(request.error);
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Users Store
        if (!db.objectStoreNames.contains('users')) {
          const userStore = db.createObjectStore('users', { keyPath: 'id' });
          userStore.createIndex('username', 'username', { unique: true });
        }

        // Tracks Store
        if (!db.objectStoreNames.contains('tracks')) {
          const trackStore = db.createObjectStore('tracks', { keyPath: 'id' });
          trackStore.createIndex('uploaderId', 'uploaderId', { unique: false });
        }

        // Playlists Store
        if (!db.objectStoreNames.contains('playlists')) {
          db.createObjectStore('playlists', { keyPath: 'id' });
        }
      };
    });
  }

  private async getDB(): Promise<IDBDatabase> {
    await this.initPromise;
    if (!this.db) throw new Error('Database not initialized');
    return this.db;
  }

  private transaction<T>(storeName: string, mode: IDBTransactionMode, callback: (store: IDBObjectStore) => IDBRequest<T> | void): Promise<T> {
    return this.getDB().then(db => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);
        
        let request: IDBRequest<T> | void;
        try {
          request = callback(store);
        } catch (e) {
          reject(e);
          return;
        }

        if (request) {
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        } else {
          transaction.oncomplete = () => resolve(undefined as unknown as T);
          transaction.onerror = () => reject(transaction.error);
        }
      });
    });
  }

  // Auth
  async login(username: string, password: string): Promise<User> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('users', 'readonly');
      const store = transaction.objectStore('users');
      const index = store.index('username');
      const request = index.get(username);

      request.onsuccess = () => {
        const user = request.result;
        if (user && user.password === password) {
          const { password: _, ...userData } = user;
          resolve(userData);
        } else {
          reject(new Error('Неверное имя пользователя или пароль'));
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async register(username: string, password: string): Promise<User> {
    const db = await this.getDB();
    
    // Check if user exists
    const exists = await new Promise<boolean>((resolve, reject) => {
      const transaction = db.transaction('users', 'readonly');
      const store = transaction.objectStore('users');
      const index = store.index('username');
      const request = index.get(username);
      request.onsuccess = () => resolve(!!request.result);
      request.onerror = () => reject(request.error);
    });

    if (exists) {
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

    await this.transaction('users', 'readwrite', store => store.add(newUser));

    const { password: _, ...userData } = newUser;
    return userData;
  }

  async getUser(id: string): Promise<User | null> {
    return this.transaction('users', 'readonly', store => store.get(id));
  }

  // Tracks
  async getTracks(): Promise<Track[]> {
    return this.transaction('tracks', 'readonly', store => store.getAll());
  }

  async uploadTrack(trackData: Omit<Track, 'id' | 'uploadedAt' | 'plays'>): Promise<Track> {
    const newTrack: Track = {
      ...trackData,
      id: `track-${Date.now()}`,
      uploadedAt: new Date().toISOString(),
      plays: 0
    };

    await this.transaction('tracks', 'readwrite', store => store.add(newTrack));

    // Update user track count
    const user = await this.getUser(trackData.uploaderId);
    if (user) {
      const updatedUser = { ...user, trackCount: (user.trackCount || 0) + 1 };
      // We need the password to save it back, but we don't have it here. 
      // In a real app, we wouldn't store password in the same object or we'd handle this differently.
      // For this local demo, we'll fetch the full user object including password to update it.
      
      const db = await this.getDB();
      const fullUser = await new Promise<any>((resolve) => {
        db.transaction('users', 'readonly').objectStore('users').get(trackData.uploaderId).onsuccess = (e: any) => resolve(e.target.result);
      });
      
      if (fullUser) {
        fullUser.trackCount = (fullUser.trackCount || 0) + 1;
        await this.transaction('users', 'readwrite', store => store.put(fullUser));
      }
    }

    return newTrack;
  }

  async incrementPlayCount(trackId: string) {
    const db = await this.getDB();
    const transaction = db.transaction('tracks', 'readwrite');
    const store = transaction.objectStore('tracks');
    
    const request = store.get(trackId);
    request.onsuccess = () => {
      const track = request.result;
      if (track) {
        track.plays = (track.plays || 0) + 1;
        store.put(track);
      }
    };
  }

  // Playlists
  async getPlaylists(): Promise<Playlist[]> {
    return this.transaction('playlists', 'readonly', store => store.getAll());
  }

  async createPlaylist(playlistData: Omit<Playlist, 'id' | 'createdAt'>): Promise<Playlist> {
    const newPlaylist: Playlist = {
      ...playlistData,
      id: `playlist-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    await this.transaction('playlists', 'readwrite', store => store.add(newPlaylist));
    return newPlaylist;
  }

  async deletePlaylist(id: string) {
    await this.transaction('playlists', 'readwrite', store => store.delete(id));
  }

  async addTrackToPlaylist(playlistId: string, trackId: string) {
    const db = await this.getDB();
    const transaction = db.transaction('playlists', 'readwrite');
    const store = transaction.objectStore('playlists');
    
    store.get(playlistId).onsuccess = (e: any) => {
      const playlist = e.target.result as Playlist;
      if (playlist && !playlist.tracks.includes(trackId)) {
        playlist.tracks.push(trackId);
        store.put(playlist);
      }
    };
  }

  async removeTrackFromPlaylist(playlistId: string, trackId: string) {
    const db = await this.getDB();
    const transaction = db.transaction('playlists', 'readwrite');
    const store = transaction.objectStore('playlists');
    
    store.get(playlistId).onsuccess = (e: any) => {
      const playlist = e.target.result as Playlist;
      if (playlist) {
        playlist.tracks = playlist.tracks.filter(id => id !== trackId);
        store.put(playlist);
      }
    };
  }

  // User Stats & Likes
  async toggleLike(userId: string, trackId: string) {
    const db = await this.getDB();
    const transaction = db.transaction('users', 'readwrite');
    const store = transaction.objectStore('users');
    
    return new Promise((resolve) => {
      store.get(userId).onsuccess = (e: any) => {
        const user = e.target.result;
        if (user) {
          const likes = user.likes || [];
          if (likes.includes(trackId)) {
            user.likes = likes.filter((id: string) => id !== trackId);
          } else {
            user.likes.push(trackId);
          }
          store.put(user);
          const { password: _, ...userData } = user;
          resolve(userData);
        }
      };
    });
  }

  async updateUserStats(userId: string, stats: { tracksPlayed?: number, minutesListened?: number }) {
    const db = await this.getDB();
    const transaction = db.transaction('users', 'readwrite');
    const store = transaction.objectStore('users');
    
    store.get(userId).onsuccess = (e: any) => {
      const user = e.target.result;
      if (user) {
        if (stats.tracksPlayed) {
          user.tracksPlayed = (user.tracksPlayed || 0) + stats.tracksPlayed;
        }
        if (stats.minutesListened) {
          user.minutesListened = (user.minutesListened || 0) + stats.minutesListened;
        }
        store.put(user);
      }
    };
  }
}

export const db = new LocalDB();
