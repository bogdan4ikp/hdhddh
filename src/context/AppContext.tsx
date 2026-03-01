import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

// Types
export interface User {
  id: string;
  username: string;
  avatar: string | null;
  cover: string | null;
  trackCount: number;
  likes?: string[];
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  cover: string;
  url: string;
  uploaderId: string;
  plays?: number;
  uploadedAt?: string;
  isExplicit?: boolean;
  status?: 'pending' | 'approved' | 'rejected';
}

export interface Playlist {
  id: string;
  title: string;
  authorId: string;
  cover: string | null;
  isPublic: boolean;
  tracks: string[];
  createdAt: string;
}

interface AppContextType {
  currentView: string;
  setView: (view: string) => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  togglePlay: () => void;
  playTrack: (track: Track) => void;
  playNext: () => void;
  playPrev: () => void;
  currentTime: number;
  duration: number;
  seek: (time: number) => void;
  volume: number;
  setVolume: (vol: number) => void;
  isPlayerExpanded: boolean;
  setIsPlayerExpanded: (expanded: boolean) => void;
  
  // Auth & Data
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  allTracks: Track[];
  refreshTracks: () => void;
  refreshUser: () => void;
  likedTracks: string[];
  toggleLike: (trackId: string) => Promise<void>;
  
  // Playlists
  playlists: Playlist[];
  refreshPlaylists: () => void;
  selectedArtistId: string | null;
  setSelectedArtistId: (id: string | null) => void;
  
  // Theme & Customization
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentView, setView] = useState('home');
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
  
  // Auth & Data State
  const [user, setUser] = useState<User | null>(null);
  const [allTracks, setAllTracks] = useState<Track[]>([]);
  const [likedTracks, setLikedTracks] = useState<string[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [accentColor, setAccentColor] = useState<string>('pink');

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Audio
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = volume;

    const audio = audioRef.current;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => playNext();

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    // Check for saved user
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      if (parsedUser.likes) {
        setLikedTracks(parsedUser.likes);
      }
    }

    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light';
    if (savedTheme) setTheme(savedTheme);
    
    const savedAccent = localStorage.getItem('accentColor');
    if (savedAccent) setAccentColor(savedAccent);

    refreshTracks();
    refreshPlaylists();

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const refreshPlaylists = async () => {
    try {
      const res = await fetch('/api/playlists');
      if (res.ok) {
        const data = await res.json();
        setPlaylists(data);
      }
    } catch (error) {
      console.error('Failed to fetch playlists', error);
    }
  };

  const refreshTracks = async () => {
    try {
      const res = await fetch('/api/tracks');
      if (res.ok) {
        const data = await res.json();
        setAllTracks(data);
      }
    } catch (error) {
      console.error('Failed to fetch tracks', error);
    }
  };

  const refreshUser = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/users/${user.id}`);
      if (res.ok) {
        const updatedUser = await res.json();
        setUser(updatedUser);
        if (updatedUser.likes) {
          setLikedTracks(updatedUser.likes);
        }
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Failed to refresh user', error);
    }
  };

  const toggleLike = async (trackId: string) => {
    if (!user) return;
    try {
      // Optimistic update
      setLikedTracks(prev => 
        prev.includes(trackId) ? prev.filter(id => id !== trackId) : [...prev, trackId]
      );

      const res = await fetch(`/api/users/${user.id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId })
      });
      
      if (res.ok) {
        const data = await res.json();
        setLikedTracks(data.likes);
        
        // Update user object in local storage
        const updatedUser = { ...user, likes: data.likes };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Failed to toggle like', error);
      // Revert optimistic update
      refreshUser();
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (currentTrack && audioRef.current) {
      const audio = audioRef.current;
      // Check if the current src ends with the track url to handle absolute vs relative paths
      const isSameTrack = audio.src.endsWith(currentTrack.url);
      
      if (!isSameTrack) {
        audio.src = currentTrack.url;
      }
      
      if (isPlaying) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => {
            if (e.name !== 'AbortError') {
              console.error("Play error", e);
            }
          });
        }
      } else {
        audio.pause();
      }
    }
  }, [currentTrack, isPlaying]);

  const togglePlay = () => {
    if (!currentTrack && allTracks.length > 0) {
      playTrack(allTracks[0]);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const playTrack = async (track: Track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    
    // Increment play count
    try {
      await fetch(`/api/tracks/${track.id}/play`, { method: 'POST' });
    } catch (e) {
      console.error('Failed to increment play count', e);
    }
  };

  const playNext = () => {
    if (!currentTrack || allTracks.length === 0) return;
    const currentIndex = allTracks.findIndex(t => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % allTracks.length;
    playTrack(allTracks[nextIndex]);
  };

  const playPrev = () => {
    if (!currentTrack || allTracks.length === 0) return;
    const currentIndex = allTracks.findIndex(t => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + allTracks.length) % allTracks.length;
    playTrack(allTracks[prevIndex]);
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const login = (userData: User) => {
    setUser(userData);
    if (userData.likes) {
      setLikedTracks(userData.likes);
    }
    localStorage.setItem('user', JSON.stringify(userData));
    setView('home');
  };

  const logout = () => {
    setUser(null);
    setLikedTracks([]);
    localStorage.removeItem('user');
    setView('auth');
  };

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('accentColor', accentColor);
  }, [accentColor]);

  return (
    <AppContext.Provider value={{
      currentView, setView,
      currentTrack, isPlaying, togglePlay, playTrack, playNext, playPrev,
      currentTime, duration, seek,
      volume, setVolume,
      isPlayerExpanded, setIsPlayerExpanded,
      user, login, logout, allTracks, refreshTracks, refreshUser,
      likedTracks, toggleLike,
      playlists, refreshPlaylists,
      selectedArtistId, setSelectedArtistId,
      theme, setTheme,
      accentColor, setAccentColor
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
