import React, { useEffect, useRef, useMemo } from 'react';
import { Search as SearchIcon, Play, Heart, ArrowLeft, X, TrendingUp, Music } from 'lucide-react';
import { useAppContext, Track } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';

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

  const filteredTracks = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return allTracks.filter(t => 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.artist.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allTracks, searchQuery]);

  const trendingTracks = useMemo(() => {
    return [...allTracks].sort(() => 0.5 - Math.random()).slice(0, 5);
  }, [allTracks]);

  return (
    <div className={`min-h-full pb-32 px-4 md:px-8 pt-6 ${theme === 'light' ? 'bg-white text-black' : 'bg-[#121212] text-white'}`}>
      {/* Search Header */}
      <div className="sticky top-0 z-30 pt-2 pb-6 -mx-4 px-4 md:-mx-8 md:px-8 bg-inherit/95 backdrop-blur-xl">
        <div className="flex items-center gap-4 max-w-3xl mx-auto">
          <button 
            onClick={() => setView('home')}
            className={`p-3 rounded-full hover:bg-white/10 transition-colors ${theme === 'light' ? 'hover:bg-black/5' : ''}`}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="relative flex-1 group">
            <div className={`absolute inset-0 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-${accentColor}-500/20 to-purple-500/20 blur-xl`} />
            <div className={`relative flex items-center ${theme === 'light' ? 'bg-neutral-100' : 'bg-[#1a1a1a]'} rounded-2xl border ${theme === 'light' ? 'border-neutral-200' : 'border-white/5'} focus-within:border-${accentColor}-500/50 transition-colors overflow-hidden`}>
              <SearchIcon className="ml-4 w-5 h-5 text-neutral-400" />
              <input 
                ref={inputRef}
                type="text" 
                placeholder="Что хотите послушать?" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full bg-transparent border-none py-4 px-4 text-lg placeholder-neutral-500 focus:outline-none focus:ring-0 ${theme === 'light' ? 'text-black' : 'text-white'}`}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="mr-4 p-1 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        <AnimatePresence mode="wait">
          {!searchQuery ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className={`w-5 h-5 text-${accentColor}-500`} />
                  Популярное сейчас
                </h2>
                <div className="space-y-2">
                  {trendingTracks.map((track, i) => (
                    <TrackItem 
                      key={track.id} 
                      track={track} 
                      index={i} 
                      theme={theme} 
                      accentColor={accentColor} 
                      isPlaying={isPlaying} 
                      currentTrack={currentTrack} 
                      playTrack={playTrack} 
                      togglePlay={togglePlay} 
                      isLiked={likedTracks.includes(track.id)} 
                      toggleLike={toggleLike} 
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <h2 className="text-xl font-bold mb-4">
                Результаты поиска
                <span className="ml-2 text-sm font-normal text-neutral-500">
                  Найдено {filteredTracks.length}
                </span>
              </h2>
              
              {filteredTracks.length > 0 ? (
                <div className="space-y-2">
                  {filteredTracks.map((track, i) => (
                    <TrackItem 
                      key={track.id} 
                      track={track} 
                      index={i} 
                      theme={theme} 
                      accentColor={accentColor} 
                      isPlaying={isPlaying} 
                      currentTrack={currentTrack} 
                      playTrack={playTrack} 
                      togglePlay={togglePlay} 
                      isLiked={likedTracks.includes(track.id)} 
                      toggleLike={toggleLike} 
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-20 h-20 bg-neutral-800/50 rounded-full flex items-center justify-center mb-4">
                    <SearchIcon className="w-10 h-10 text-neutral-600" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Ничего не найдено</h3>
                  <p className="text-neutral-500">Попробуйте изменить запрос или поискать по автору</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function TrackItem({ track, index, theme, accentColor, isPlaying, currentTrack, playTrack, togglePlay, isLiked, toggleLike }: any) {
  const isActive = currentTrack?.id === track.id;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => isActive ? togglePlay() : playTrack(track)}
      className={`group flex items-center gap-4 p-3 rounded-2xl transition-all cursor-pointer border border-transparent ${
        isActive 
          ? (theme === 'light' ? 'bg-black/5 border-black/5' : 'bg-white/10 border-white/5') 
          : 'hover:bg-white/5 hover:border-white/5'
      }`}
    >
      <div className="w-14 h-14 rounded-xl overflow-hidden relative shadow-lg group-hover:shadow-xl transition-shadow bg-neutral-800 flex-shrink-0">
        {track.cover ? (
          <img src={track.cover} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-neutral-700">
            <Music className="w-6 h-6 text-neutral-500" />
          </div>
        )}
        
        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          {isActive && isPlaying ? (
            <div className="flex items-end justify-center gap-1 h-5">
              <div className={`w-1 bg-${accentColor}-500 h-full animate-[bounce_1s_infinite]`}></div>
              <div className={`w-1 bg-${accentColor}-500 h-2/3 animate-[bounce_1s_infinite_0.2s]`}></div>
              <div className={`w-1 bg-${accentColor}-500 h-1/2 animate-[bounce_1s_infinite_0.4s]`}></div>
            </div>
          ) : (
            <Play className="w-6 h-6 text-white fill-current" />
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <h3 className={`font-bold text-base truncate mb-0.5 ${isActive ? `text-${accentColor}-500` : (theme === 'light' ? 'text-black' : 'text-white')}`}>
          {track.title}
        </h3>
        <p className="text-neutral-400 text-sm truncate font-medium">{track.artist}</p>
      </div>

      <div className="flex items-center gap-2">
        <motion.button 
          whileTap={{ scale: 0.8 }}
          onClick={(e) => { e.stopPropagation(); toggleLike(track.id); }}
          className={`p-2.5 rounded-full transition-colors ${isLiked ? 'bg-pink-500/10' : 'hover:bg-white/10'}`}
        >
          <Heart className={`w-5 h-5 transition-colors ${isLiked ? 'text-pink-500 fill-pink-500' : 'text-neutral-400 group-hover:text-white'}`} />
        </motion.button>
      </div>
    </motion.div>
  );
}
