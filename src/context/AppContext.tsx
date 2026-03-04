import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { db } from '../services/db';

// Types
export interface User {
  id: string;
  username: string;
  avatar: string | null;
  cover: string | null;
  trackCount: number;
  likes?: string[];
  minutesListened?: number;
  tracksPlayed?: number;
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
  lyrics?: string;
  releaseDate?: string;
}

export interface Playlist {
  id: string;
  title: string;
  authorId: string;
  cover: string | null;
  isPublic: boolean;
  tracks: string[];
  createdAt: string;
  type?: 'playlist' | 'album';
  releaseDate?: string;
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
  isMiniPlayerVisible: boolean;
  setIsMiniPlayerVisible: (visible: boolean) => void;
  closePlayer: () => void;
  repeatMode: 'off' | 'all' | 'one';
  setRepeatMode: (mode: 'off' | 'all' | 'one') => void;
  
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
  selectedPlaylistId: string | null;
  setSelectedPlaylistId: (id: string | null) => void;
  
  // Search State
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
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
  const [isMiniPlayerVisible, setIsMiniPlayerVisible] = useState(true);
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  
  // Auth & Data State
  const [user, setUser] = useState<User | null>(null);
  const [allTracks, setAllTracks] = useState<Track[]>([]);
  const [likedTracks, setLikedTracks] = useState<string[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [accentColor, setAccentColor] = useState<string>('pink');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Refs for event listeners to access latest state
  const userRef = useRef(user);
  const allTracksRef = useRef(allTracks);
  const currentTrackRef = useRef(currentTrack);
  const isPlayingRef = useRef(isPlaying);
  const repeatModeRef = useRef(repeatMode);
  const playTrackRef = useRef<(track: Track) => void>(() => {});

  useEffect(() => {
    userRef.current = user;
    allTracksRef.current = allTracks;
    currentTrackRef.current = currentTrack;
    isPlayingRef.current = isPlaying;
    repeatModeRef.current = repeatMode;
    playTrackRef.current = playTrack;
  });

  const refreshTracks = async () => {
    try {
      const tracks = await db.getTracks();
      setAllTracks(tracks);
    } catch (e) {
      console.error('Failed to fetch tracks', e);
    }
  };

  const refreshPlaylists = async () => {
    try {
      const playlists = await db.getPlaylists();
      setPlaylists(playlists);
    } catch (e) {
      console.error('Failed to fetch playlists', e);
    }
  };

  const refreshUser = async () => {
    const currentUser = userRef.current;
    if (!currentUser) return;
    try {
      const userData = await db.getUser(currentUser.id);
      if (userData) {
        setUser(userData);
        setLikedTracks(userData.likes || []);
        localStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (e) {
      console.error('Failed to fetch user', e);
    }
  };

  // Initialize Audio and Load Data
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = volume;

    const audio = audioRef.current;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    
    const playNextInternal = () => {
      const tracks = allTracksRef.current;
      const current = currentTrackRef.current;
      const rMode = repeatModeRef.current;
      
      if (!current || tracks.length === 0) return;
      
      if (rMode === 'one') {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play();
        }
        return;
      }

      const currentIndex = tracks.findIndex(t => t.id === current.id);
      const nextIndex = (currentIndex + 1) % tracks.length;
      
      if (rMode === 'off' && nextIndex === 0) {
        setIsPlaying(false);
        return;
      }

      if (playTrackRef.current) {
        playTrackRef.current(tracks[nextIndex]);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', playNextInternal);

    // Load initial data
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        setLikedTracks(parsed.likes || []);
      } catch (e) {}
    }

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) setTheme(savedTheme as 'dark' | 'light');

    const savedAccent = localStorage.getItem('accentColor');
    if (savedAccent) setAccentColor(savedAccent);

    refreshTracks();
    refreshPlaylists();

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', playNextInternal);
      audio.pause();
      audio.src = '';
    };
  }, []);

  useEffect(() => {
    if (user) {
      refreshUser();
    }
  }, [user?.id]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current && currentTrack) {
      const audio = audioRef.current;
      if (audio.src !== window.location.origin + currentTrack.url && audio.src !== currentTrack.url) {
        audio.src = currentTrack.url;
        audio.load();
      }
      
      if (isPlaying) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error("Audio play failed:", error);
            setIsPlaying(false);
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
    setIsMiniPlayerVisible(true);

    // Clear previous timer
    if (playTimerRef.current) clearTimeout(playTimerRef.current);

    // Set timer to count as a view after 5 seconds
    playTimerRef.current = setTimeout(async () => {
      try {
        await db.incrementPlayCount(track.id);
        refreshTracks();
        
        if (userRef.current) {
          await db.updateUserStats(userRef.current.id, { tracksPlayed: 1, minutesListened: 3 });
          refreshUser();
        }
      } catch (e) {
        console.error("Failed to update stats", e);
      }
    }, 5000);
  };

  const closePlayer = () => {
    setIsPlaying(false);
    setIsMiniPlayerVisible(false);
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
    const userWithLikes = { 
      ...userData, 
      likes: userData.likes || [],
      minutesListened: userData.minutesListened || 0,
      tracksPlayed: userData.tracksPlayed || 0
    };
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

  const toggleLike = async (trackId: string) => {
    if (!user) return;
    try {
      await db.toggleLike(user.id, trackId);
      refreshUser();
    } catch (e) {
      console.error('Failed to toggle like', e);
    }
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
      isMiniPlayerVisible, setIsMiniPlayerVisible, closePlayer,
      repeatMode, setRepeatMode,
      user, login, logout, allTracks, refreshTracks, refreshUser,
      likedTracks, toggleLike,
      playlists, refreshPlaylists,
      selectedArtistId, setSelectedArtistId,
      selectedPlaylistId, setSelectedPlaylistId,
      searchQuery, setSearchQuery,
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
