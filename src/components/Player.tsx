import React, { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, VolumeX, Maximize2, Mic2, Music2, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import FullScreenPlayer from './FullScreenPlayer';

const formatTime = (time: number) => {
  if (isNaN(time)) return '0:00';
  const m = Math.floor(time / 60);
  const s = Math.floor(time % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export default function Player() {
  const { 
    currentTrack, isPlaying, togglePlay, playNext, playPrev, 
    currentTime, duration, seek, volume, setVolume,
    isPlayerExpanded, setIsPlayerExpanded, setSelectedArtistId, theme
  } = useAppContext();
  
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    seek(percent * duration);
  };

  const handleVolume = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setVolume(percent);
    if (percent > 0) setIsMuted(false);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMuted) {
      setIsMuted(false);
      setVolume(1);
    } else {
      setIsMuted(true);
      setVolume(0);
    }
  };

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    togglePlay();
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    playPrev();
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    playNext();
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const volumePercent = isMuted ? 0 : volume * 100;

  return (
    <>
      {/* Mini Player */}
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className={`fixed bottom-20 md:bottom-8 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[600px] h-16 ${theme === 'light' ? 'bg-white/90 border-black/5 shadow-xl' : 'bg-[#1a1a1a]/90 border-white/10 shadow-2xl'} backdrop-blur-3xl border rounded-2xl flex items-center justify-between px-4 z-50 cursor-pointer hover:scale-[1.02] transition-all overflow-hidden`}
        onClick={() => setIsPlayerExpanded(true)}
      >
        {/* Track Info */}
        <div className="flex items-center gap-3 w-2/3 md:w-1/2 relative z-10">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-neutral-800 rounded-lg flex items-center justify-center border border-white/5 flex-shrink-0 overflow-hidden relative shadow-lg">
            {currentTrack ? (
              <img src={currentTrack.cover} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <Music2 className="w-5 h-5 text-neutral-600" />
            )}
          </div>
          <div className="min-w-0">
            <div className={`text-sm md:text-base font-bold truncate ${theme === 'light' ? 'text-black' : 'text-white'}`}>
              {currentTrack ? currentTrack.title : 'Неизвестный трек'}
              {currentTrack?.isExplicit && <span className="ml-2 text-[10px] bg-white/10 px-1 rounded text-neutral-400">E</span>}
            </div>
            <div className="text-xs md:text-sm text-neutral-400 truncate">
              {currentTrack ? currentTrack.artist : 'Vibe Music'}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 relative z-10">
          <button 
            onClick={(e) => { e.stopPropagation(); /* toggleLike logic if available */ }}
            className="p-2 text-neutral-400 hover:text-white transition-colors"
          >
            <Heart className="w-6 h-6" />
          </button>
          
          <button 
            onClick={handlePlayPause}
            className={`w-10 h-10 flex items-center justify-center ${theme === 'light' ? 'text-black' : 'text-white'} hover:scale-110 transition-transform`}
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 fill-current" />
            ) : (
              <Play className="w-8 h-8 fill-current" />
            )}
          </button>
        </div>
      </motion.div>

      {/* Expanded Player Overlay */}
      <AnimatePresence>
        {isPlayerExpanded && (
          <FullScreenPlayer />
        )}
      </AnimatePresence>
    </>
  );
}
