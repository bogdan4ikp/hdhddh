import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getAllTracksFromDB, updateTrackInDB } from '../utils/audioDb';

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
  fileBlob?: Blob; // Added for IndexedDB storage
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
  
  // Auth & Data State
  const [user, setUser] = useState<User | null>(null);
  // Initialize with empty array, will load custom tracks in useEffect
  const [allTracks, setAllTracks] = useState<Track[]>([]);
  const [likedTracks, setLikedTracks] = useState<string[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [accentColor, setAccentColor] = useState<string>('pink');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Refs for event listeners to access latest state
  const userRef = useRef(user);
  const allTracksRef = useRef(allTracks);
  const currentTrackRef = useRef(currentTrack);
  const isPlayingRef = useRef(isPlaying);
  const playTrackRef = useRef<(track: Track) => void>(() => {});

  useEffect(() => {
    userRef.current = user;
    allTracksRef.current = allTracks;
    currentTrackRef.current = currentTrack;
    isPlayingRef.current = isPlaying;
    playTrackRef.current = playTrack;
  });

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
      if (!current || tracks.length === 0) return;
      
      const currentIndex = tracks.findIndex(t => t.id === current.id);
      const nextIndex = (currentIndex + 1) % tracks.length;
      if (playTrackRef.current) {
        playTrackRef.current(tracks[nextIndex]);
      }
    };

    const handleEnded = () => {
      // Increment tracks played and minutes listened
      const currentUser = userRef.current;
      const currentTrack = currentTrackRef.current;
      if (currentUser && audioRef.current) {
        // Calculate minutes played (using track duration or actual played time if we tracked it)
        // For simplicity, we add the full track duration in minutes
        const minutesToAdd = audioRef.current.duration / 60;
        
        const updatedUser = { 
          ...currentUser, 
          tracksPlayed: (currentUser.tracksPlayed || 0) + 1,
          minutesListened: Math.round((currentUser.minutesListened || 0) + minutesToAdd)
        };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      playNextInternal();
    };

    const handleError = (e: Event) => {
      console.error("Audio playback error:", audio.error);
      // If error occurs, try to play next track to avoid stuck state
      setTimeout(() => {
        if (isPlayingRef.current) {
          playNextInternal();
        }
      }, 1000);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    // Check for saved user
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        // Ensure stats exist
        if (parsedUser.minutesListened === undefined) parsedUser.minutesListened = 0;
        if (parsedUser.tracksPlayed === undefined) parsedUser.tracksPlayed = 0;
        
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

    // Load custom tracks from IndexedDB
    const loadTracks = async () => {
      try {
        const tracks = await getAllTracksFromDB();
        const processedTracks = tracks.map(t => {
            if (t.fileBlob) {
                return { ...t, url: URL.createObjectURL(t.fileBlob) };
            }
            return t;
        });
        setAllTracks(processedTracks);
      } catch (e) {
        console.error("Failed to load tracks from DB", e);
      }
    };
    loadTracks();

    // Clear old localStorage customTracks to avoid conflicts/errors
    localStorage.removeItem('customTracks');

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const refreshTracks = async () => {
      try {
        const tracks = await getAllTracksFromDB();
        const processedTracks = tracks.map(t => {
            if (t.fileBlob) {
                return { ...t, url: URL.createObjectURL(t.fileBlob) };
            }
            return t;
        });
        setAllTracks(processedTracks);
      } catch (e) {
        console.error("Failed to load tracks from DB", e);
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
      
      if (!currentTrack.url) {
        console.error("Track has no URL:", currentTrack);
        setIsPlaying(false);
        return;
      }

      // Check if the current src ends with the track url to handle absolute vs relative paths
      const isSameTrack = audio.src === currentTrack.url || audio.src.endsWith(currentTrack.url);
      
      if (!isSameTrack) {
        audio.src = currentTrack.url;
        audio.load(); // Explicitly load the new source
      }
      
      if (isPlaying) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => {
            if (e.name !== 'AbortError') {
              console.error("Play error", e);
              // If play fails immediately (e.g. no supported source), try next track
              if (e.message.includes('no supported source')) {
                 setTimeout(() => {
                    if (isPlayingRef.current) {
                      const tracks = allTracksRef.current;
                      const current = currentTrackRef.current;
                      if (!current || tracks.length === 0) return;
                      
                      const currentIndex = tracks.findIndex(t => t.id === current.id);
                      const nextIndex = (currentIndex + 1) % tracks.length;
                      if (playTrackRef.current) {
                        playTrackRef.current(tracks[nextIndex]);
                      }
                    }
                 }, 1000);
              }
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
    // Increment plays
    const updatedTrack = { ...track, plays: (track.plays || 0) + 1 };
    
    // Update locally
    setAllTracks(prev => prev.map(t => t.id === track.id ? updatedTrack : t));
    
    // Update in DB if it's a user uploaded track
    if (track.uploaderId !== 'system') {
      try {
        await updateTrackInDB(updatedTrack);
      } catch (e) {
        console.error("Failed to update track plays in DB", e);
      }
    }

    // Update user stats
    if (user) {
      const updatedUser = {
        ...user,
        tracksPlayed: (user.tracksPlayed || 0) + 1,
        minutesListened: (user.minutesListened || 0) + 3 // Assuming 3 mins per track for now
      };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }

    setCurrentTrack(updatedTrack);
    setIsPlaying(true);
    setIsMiniPlayerVisible(true);
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
    // Simulate login by saving to local storage
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
