import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { MOCK_TRACKS } from '../data/tracks';

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

// Convert MOCK_TRACKS to match the Track interface
const INITIAL_TRACKS: Track[] = MOCK_TRACKS.map(t => ({
  id: t.id.toString(),
  title: t.title,
  artist: t.artist,
  cover: t.cover,
  url: t.audioUrl,
  uploaderId: 'system',
  plays: parseInt(t.plays.replace(/\s/g, ''), 10) || 0,
  isExplicit: Math.random() > 0.8,
  status: 'approved'
}));

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
  const [allTracks, setAllTracks] = useState<Track[]>(INITIAL_TRACKS);
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
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        if (parsedUser.likes) {
          setLikedTracks(parsedUser.likes);
        }
      } catch (e) {
        console.error("Failed to parse saved user", e);
        localStorage.removeItem('user');
      }
    }

    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light';
    if (savedTheme) setTheme(savedTheme);
    
    const savedAccent = localStorage.getItem('accentColor');
    if (savedAccent) setAccentColor(savedAccent);

    // Load local playlists if any
    const savedPlaylists = localStorage.getItem('playlists');
    if (savedPlaylists) {
      try {
        setPlaylists(JSON.parse(savedPlaylists));
      } catch (e) {
        console.error("Failed to parse playlists", e);
      }
    }

    // Load custom tracks
    const savedCustomTracks = localStorage.getItem('customTracks');
    if (savedCustomTracks) {
      try {
        const customTracks = JSON.parse(savedCustomTracks);
        setAllTracks([...INITIAL_TRACKS, ...customTracks]);
      } catch (e) {
        console.error("Failed to parse custom tracks", e);
      }
    } else {
      setAllTracks(INITIAL_TRACKS);
    }

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const refreshPlaylists = () => {
    const savedPlaylists = localStorage.getItem('playlists');
    if (savedPlaylists) {
      try {
        setPlaylists(JSON.parse(savedPlaylists));
      } catch (e) {
        console.error("Failed to parse playlists", e);
      }
    }
  };

  const refreshTracks = () => {
    const savedCustomTracks = localStorage.getItem('customTracks');
    if (savedCustomTracks) {
      try {
        const customTracks = JSON.parse(savedCustomTracks);
        setAllTracks([...INITIAL_TRACKS, ...customTracks]);
      } catch (e) {
        console.error("Failed to parse custom tracks", e);
        setAllTracks(INITIAL_TRACKS);
      }
    } else {
      setAllTracks(INITIAL_TRACKS);
    }
  };

  const refreshUser = () => {
    if (!user) return;
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      if (parsedUser.likes) {
        setLikedTracks(parsedUser.likes);
      }
    }
  };

  const toggleLike = async (trackId: string) => {
    if (!user) return;
    
    // Optimistic update
    const newLikedTracks = likedTracks.includes(trackId) 
      ? likedTracks.filter(id => id !== trackId) 
      : [...likedTracks, trackId];
    
    setLikedTracks(newLikedTracks);

    // Update user object in local storage
    const updatedUser = { ...user, likes: newLikedTracks };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
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
    // Simulate login by saving to local storage
    const userWithLikes = { ...userData, likes: userData.likes || [] };
    setUser(userWithLikes);
    setLikedTracks(userWithLikes.likes || []);
    localStorage.setItem('user', JSON.stringify(userWithLikes));
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
