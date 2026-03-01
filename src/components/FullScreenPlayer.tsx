import React, { useEffect, useState } from 'react';
import { motion, PanInfo } from 'motion/react';
import { X, MoreHorizontal, ListMusic, MessageSquareQuote, Volume2, VolumeX, Shuffle, Repeat, Play, Pause, SkipBack, SkipForward, Heart, Share2, Music, ChevronDown } from 'lucide-react';
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
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.2 }}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      className="fixed inset-0 z-[100] flex flex-col bg-black text-white overflow-hidden"
    >
      {/* Dynamic Blurred Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {currentTrack ? (
          <>
            <img 
              src={currentTrack.cover} 
              alt="" 
              className="absolute inset-0 w-full h-full object-cover blur-[100px] scale-150 opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/60 to-black/90"></div>
          </>
        ) : (
          <div className="absolute inset-0 bg-neutral-900"></div>
        )}
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-12 pb-4">
        <button 
          onClick={() => setIsPlayerExpanded(false)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-md"
        >
          <ChevronDown className="w-6 h-6 text-white" />
        </button>
        <div className="text-xs font-bold tracking-widest uppercase opacity-70">Сейчас играет</div>
        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
          <MoreHorizontal className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col px-8 pb-12 overflow-y-auto no-scrollbar">
        
        {/* Album Art */}
        <div className="flex-1 flex items-center justify-center py-8 min-h-[300px]">
          <motion.div 
            className="w-full max-w-[350px] aspect-square rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden border border-white/10"
            animate={{ scale: isPlaying ? 1 : 0.9 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
          >
            {currentTrack ? (
              <img src={currentTrack.cover} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                <Music className="w-24 h-24 text-neutral-600" />
              </div>
            )}
          </motion.div>
        </div>

        {/* Track Info & Like */}
        <div className="mb-8 flex items-end justify-between">
          <div className="flex-1 min-w-0 mr-4">
            <h2 className="text-3xl font-black text-white truncate tracking-tight leading-tight mb-2">
              {currentTrack?.title || 'Не проигрывается'}
            </h2>
            <p className="text-xl font-medium text-white/60 truncate">
              {currentTrack?.artist || 'Неизвестный артист'}
            </p>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); if(currentTrack) toggleLike(currentTrack.id); }}
            className="p-3 rounded-full hover:bg-white/10 transition-colors active:scale-90"
          >
            <Heart className={`w-8 h-8 ${currentTrack && likedTracks.includes(currentTrack.id) ? 'text-pink-500 fill-pink-500' : 'text-white'}`} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-10 group">
          <div 
            className="h-2 bg-white/20 rounded-full cursor-pointer relative mb-3 overflow-hidden"
            onClick={handleSeek}
          >
            <div 
              className="h-full bg-white rounded-full relative"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg scale-0 group-hover:scale-100 transition-transform" />
            </div>
          </div>
          <div className="flex justify-between text-xs font-bold text-white/40 tracking-wider">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-between mb-12">
          <button className="text-white/40 hover:text-white transition-colors">
            <Shuffle className="w-6 h-6" />
          </button>
          
          <button 
            onClick={playPrev}
            className="text-white hover:text-white/80 transition-all active:scale-90"
          >
            <SkipBack className="w-10 h-10 fill-current" />
          </button>
          
          <button 
            onClick={togglePlay}
            className="w-20 h-20 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)]"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 fill-current" />
            ) : (
              <Play className="w-8 h-8 fill-current ml-1" />
            )}
          </button>

          <button 
            onClick={playNext}
            className="text-white hover:text-white/80 transition-all active:scale-90"
          >
            <SkipForward className="w-10 h-10 fill-current" />
          </button>

          <button className="text-white/40 hover:text-white transition-colors">
            <Repeat className="w-6 h-6" />
          </button>
        </div>

        {/* Volume & Actions */}
        <div className="flex items-center gap-4">
          <VolumeX className="w-5 h-5 text-white/40" />
          <div 
            className="flex-1 h-1.5 bg-white/10 rounded-full cursor-pointer relative group"
            onClick={handleVolume}
          >
            <div 
              className="h-full bg-white/60 rounded-full"
              style={{ width: `${volumePercent}%` }}
            ></div>
          </div>
          <Volume2 className="w-5 h-5 text-white/40" />
        </div>
      </div>
    </motion.div>
  );
}
