import React, { useEffect, useState } from 'react';
import { motion, PanInfo } from 'motion/react';
import { X, MoreHorizontal, ListMusic, MessageSquareQuote, Volume2, VolumeX, Shuffle, Repeat, Play, Pause, SkipBack, SkipForward, Heart, Share2, Music } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const formatTime = (time: number) => {
  if (isNaN(time)) return '0:00';
  const m = Math.floor(time / 60);
  const s = Math.floor(time % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export default function FullScreenPlayer() {
  const { 
    currentTrack, isPlaying, togglePlay, playNext, playPrev, 
    currentTime, duration, seek, volume, setVolume,
    setIsPlayerExpanded, likedTracks, toggleLike, setSelectedArtistId, theme
  } = useAppContext();

  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    if (info.offset.y > 100) {
      setIsPlayerExpanded(false);
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const volumePercent = volume * 100;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    seek(percent * duration);
  };

  const handleVolume = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setVolume(percent);
  };

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.2 }}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
    >
      {/* Dynamic Blurred Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {currentTrack && (
          <img 
            src={currentTrack.cover} 
            alt="" 
            className="w-full h-full object-cover blur-[80px] scale-125 opacity-60"
          />
        )}
        <div className="absolute inset-0 bg-black/60"></div>
      </div>

      {/* Main Card Container */}
      <motion.div 
        className={`relative z-10 w-full max-w-[400px] h-[90vh] max-h-[850px] mx-4 rounded-[3rem] overflow-hidden flex flex-col ${theme === 'light' ? 'bg-white/10' : 'bg-black/40'} backdrop-blur-2xl border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.5)]`}
        animate={{ scale: isDragging ? 0.95 : 1 }}
      >
        {/* Header / Grabber */}
        <div className="w-full flex items-center justify-between px-8 pt-6 pb-2">
          <div className="w-10 h-10"></div> {/* Spacer */}
          <div className="w-10 h-1.5 bg-white/20 rounded-full cursor-grab active:cursor-grabbing"></div>
          <button 
            onClick={() => setIsPlayerExpanded(false)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col px-8 pt-4 pb-12 overflow-y-auto no-scrollbar">
          {/* Album Art Container */}
          <div className="flex-1 flex items-center justify-center mb-8">
            <motion.div 
              className="w-full aspect-square rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.4)] overflow-hidden border border-white/5"
              animate={{ scale: isPlaying ? 1 : 0.92 }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            >
              {currentTrack ? (
                <img src={currentTrack.cover} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-neutral-900 flex items-center justify-center">
                  <Music className="w-20 h-20 text-neutral-800" />
                </div>
              )}
            </motion.div>
          </div>

          {/* Track Info */}
          <div className="mb-6">
            <div className="flex justify-between items-end">
              <div className="min-w-0 flex-1">
                <h2 className="text-2xl font-black text-white truncate tracking-tight leading-tight flex items-center gap-2">
                  {currentTrack?.title || 'Не проигрывается'}
                  {currentTrack?.isExplicit && <span className="inline-flex items-center justify-center w-4 h-4 bg-white/20 text-[8px] rounded font-black">E</span>}
                </h2>
                <p className="text-lg font-medium text-white/60 truncate mt-1">
                  {currentTrack?.artist || 'Неизвестный артист'}
                </p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); if(currentTrack) toggleLike(currentTrack.id); }}
                className="p-2 mb-1"
              >
                <Heart className={`w-6 h-6 ${currentTrack && likedTracks.includes(currentTrack.id) ? 'text-pink-500 fill-pink-500' : 'text-white/20'}`} />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-10">
            <div 
              className="h-1.5 bg-white/10 rounded-full cursor-pointer relative group mb-3"
              onClick={handleSeek}
            >
              <div 
                className="h-full bg-white rounded-full absolute top-0 left-0"
                style={{ width: `${progressPercent}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <div className="flex justify-between text-[11px] font-bold text-white/30">
              <span>{formatTime(currentTime)}</span>
              <span>-{formatTime(duration - currentTime)}</span>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center justify-around mb-12 px-2">
            <button 
              onClick={playPrev}
              className="text-white/80 hover:text-white transition-all active:scale-90"
            >
              <SkipBack className="w-10 h-10 fill-current" />
            </button>
            
            <button 
              onClick={togglePlay}
              className="w-20 h-20 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all"
            >
              {isPlaying ? (
                <Pause className="w-12 h-12 fill-current" />
              ) : (
                <Play className="w-12 h-12 fill-current ml-1" />
              )}
            </button>

            <button 
              onClick={playNext}
              className="text-white/80 hover:text-white transition-all active:scale-90"
            >
              <SkipForward className="w-10 h-10 fill-current" />
            </button>
          </div>

          {/* Volume Slider */}
          <div className="flex items-center gap-4 px-2 mt-auto">
            <VolumeX className="w-4 h-4 text-white/20" />
            <div 
              className="flex-1 h-1.5 bg-white/10 rounded-full cursor-pointer relative group"
              onClick={handleVolume}
            >
              <div 
                className="h-full bg-white/40 rounded-full"
                style={{ width: `${volumePercent}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <Volume2 className="w-4 h-4 text-white/20" />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
