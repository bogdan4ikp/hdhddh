import React, { useEffect, useRef } from 'react';
import { Search as SearchIcon, Play, Heart, ArrowLeft } from 'lucide-react';
import { useAppContext, Track } from '../context/AppContext';
import { motion } from 'motion/react';

export default function Search() {
  const { 
    allTracks, 
    playTrack, 
    currentTrack, 
    isPlaying, 
    togglePlay, 
    likedTracks, 
    toggleLike, 
    searchQuery, 
    setSearchQuery,
    setView,
    theme,
    accentColor
  } = useAppContext();

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const getAccentClass = (type: 'text' | 'bg' | 'from' | 'to' | 'ring' | 'fill') => {
    const colors: Record<string, string> = {
      pink: 'pink-500',
      purple: 'purple-500',
      blue: 'blue-500',
      green: 'emerald-500',
      orange: 'orange-500',
      red: 'red-500'
    };
    const color = colors[accentColor] || 'pink-500';
    return `${type}-${color}`;
  };

  const filteredTracks = allTracks.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`min-h-full pb-32 px-4 md:px-8 pt-6 ${theme === 'light' ? 'bg-white text-black' : 'bg-[#121212] text-white'}`}>
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => setView('home')}
          className={`p-2 rounded-full hover:bg-white/10 transition-colors ${theme === 'light' ? 'hover:bg-black/5' : ''}`}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="relative flex-1">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input 
            ref={inputRef}
            type="text" 
            placeholder="Поиск треков, артистов..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full ${theme === 'light' ? 'bg-black/5 border-black/5 text-black' : 'bg-white/10 border-white/10 text-white'} border rounded-full py-3 pl-12 pr-4 placeholder-neutral-400 focus:outline-none focus:ring-2 ${getAccentClass('ring')}/50 transition-all`}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-sm"
            >
              Очистить
            </button>
          )}
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-6">Результаты поиска</h2>
      
      <div className="space-y-2">
        {filteredTracks.length > 0 ? filteredTracks.map((track) => {
          const isActive = currentTrack?.id === track.id;
          const isLiked = likedTracks.includes(track.id);
          
          return (
            <div 
              key={track.id} 
              onClick={() => isActive ? togglePlay() : playTrack(track)}
              className={`group flex items-center gap-4 p-3 rounded-xl transition-all cursor-pointer border border-transparent ${
                isActive ? (theme === 'light' ? 'bg-black/5' : 'bg-white/10') : 'hover:bg-black/5'
              }`}
            >
              <div className="w-12 h-12 bg-neutral-800 rounded-lg flex-shrink-0 overflow-hidden relative shadow-md">
                {track.cover ? (
                  <img src={track.cover} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-neutral-700">
                    <Play className="w-5 h-5 text-neutral-500" />
                  </div>
                )}
                {isActive && isPlaying && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="flex items-end justify-center gap-0.5 h-4">
                      <div className={`w-1 ${getAccentClass('bg')} h-full animate-[bounce_1s_infinite]`}></div>
                      <div className={`w-1 ${getAccentClass('bg')} h-2/3 animate-[bounce_1s_infinite_0.2s]`}></div>
                      <div className={`w-1 ${getAccentClass('bg')} h-1/2 animate-[bounce_1s_infinite_0.4s]`}></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className={`font-medium truncate ${isActive ? getAccentClass('text') : 'text-white'}`}>
                  {track.title}
                </h3>
                <p className="text-neutral-400 text-sm truncate">{track.artist}</p>
              </div>

              <div className="flex items-center gap-4">
                <motion.button 
                  whileTap={{ scale: 0.8 }}
                  onClick={(e) => { e.stopPropagation(); toggleLike(track.id); }}
                  className="p-2 hover:bg-black/5 rounded-full transition-colors"
                >
                  <Heart className={`w-5 h-5 transition-colors ${isLiked ? getAccentClass('text') + ' ' + getAccentClass('fill') : 'text-neutral-400 hover:text-black'}`} />
                </motion.button>
              </div>
            </div>
          );
        }) : (
          <div className="text-neutral-400 text-center py-10">
            {searchQuery ? 'Ничего не найдено' : 'Введите запрос для поиска'}
          </div>
        )}
      </div>
    </div>
  );
}
