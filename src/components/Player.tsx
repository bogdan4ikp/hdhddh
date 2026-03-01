import React, { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, VolumeX, Maximize2, Mic2, Music2, Heart } from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'motion/react';
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
    isPlayerExpanded, setIsPlayerExpanded, setSelectedArtistId, theme,
    toggleLike, likedTracks, closePlayer, isMiniPlayerVisible, setIsMiniPlayerVisible
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

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 100) {
      closePlayer();
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const volumePercent = isMuted ? 0 : volume * 100;

  if (!currentTrack) return null;

  return (
    <>
      {/* Floating Restore Button when Mini Player is hidden */}
      <AnimatePresence>
        {!isMiniPlayerVisible && currentTrack && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsMiniPlayerVisible(true)}
            className={`fixed bottom-24 right-4 md:bottom-8 md:right-8 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl z-50 ${theme === 'light' ? 'bg-black text-white' : 'bg-white text-black'}`}
          >
            <Music2 className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Mini Player */}
      <AnimatePresence>
        {isMiniPlayerVisible && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1, x: 0 }}
            exit={{ y: 100, opacity: 0 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className={`fixed bottom-[5.5rem] md:bottom-8 left-2 right-2 md:left-1/2 md:-translate-x-1/2 md:w-[700px] h-20 ${theme === 'light' ? 'bg-white border-black/10 shadow-xl' : 'bg-[#181818] border-white/10 shadow-2xl shadow-black/50'} backdrop-blur-md border rounded-[2rem] flex items-center justify-between px-4 z-50 cursor-pointer hover:scale-[1.01] transition-all overflow-hidden`}
            onClick={() => setIsPlayerExpanded(true)}
          >
            {/* Track Info */}
            <div className="flex items-center gap-4 w-2/3 md:w-1/2 relative z-10">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-neutral-800 rounded-2xl flex items-center justify-center border border-white/5 flex-shrink-0 overflow-hidden relative shadow-lg">
                {currentTrack ? (
                  <img src={currentTrack.cover} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <Music2 className="w-6 h-6 text-neutral-600" />
                )}
              </div>
              <div className="min-w-0 flex flex-col justify-center">
                <div className={`text-base font-bold truncate ${theme === 'light' ? 'text-black' : 'text-white'}`}>
                  {currentTrack ? currentTrack.title : 'Неизвестный трек'}
                  {currentTrack?.isExplicit && <span className="ml-2 text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-neutral-400 border border-white/5">E</span>}
                </div>
                <div className="text-sm text-neutral-400 truncate font-medium">
                  {currentTrack ? currentTrack.artist : 'Vibe Music'}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 relative z-10">
              <button 
                onClick={(e) => { e.stopPropagation(); if(currentTrack) toggleLike(currentTrack.id); }}
                className="p-3 text-neutral-400 hover:text-pink-500 transition-colors rounded-full hover:bg-white/5"
              >
                <Heart className={`w-6 h-6 ${currentTrack && likedTracks.includes(currentTrack.id) ? 'fill-pink-500 text-pink-500' : ''}`} />
              </button>
              
              <button 
                onClick={handlePlayPause}
                className={`w-12 h-12 flex items-center justify-center rounded-full ${theme === 'light' ? 'bg-black text-white' : 'bg-white text-black'} hover:scale-105 transition-transform shadow-lg`}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 fill-current" />
                ) : (
                  <Play className="w-6 h-6 fill-current ml-0.5" />
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded Player Overlay */}
      <AnimatePresence>
        {isPlayerExpanded && (
          <FullScreenPlayer />
        )}
      </AnimatePresence>
    </>
  );
}
