import React, { useEffect, useState } from 'react';
import { Play, Pause, Heart, Search, Settings2, History, User, SlidersHorizontal } from 'lucide-react';
import { useAppContext, Track } from '../context/AppContext';
import { motion } from 'motion/react';

export default function MainContent() {
  const { playTrack, currentTrack, isPlaying, togglePlay, allTracks, user, likedTracks, toggleLike, setView, theme, accentColor } = useAppContext();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [trends, setTrends] = useState<Track[]>([]);
  const [recommendations, setRecommendations] = useState<Track[]>([]);
  const [isWavePlaying, setIsWavePlaying] = useState(false);

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trendsRes, recsRes] = await Promise.all([
          fetch('/api/trends'),
          user ? fetch(`/api/recommendations/${user.id}`) : Promise.resolve(null)
        ]);

        if (trendsRes.ok) setTrends(await trendsRes.json());
        if (recsRes && recsRes.ok) setRecommendations(await recsRes.json());
      } catch (e) {
        console.error('Failed to fetch dashboard data', e);
      }
    };
    fetchData();
  }, [user]);

  const handlePlayWave = () => {
    // Filter tracks to get full track objects for liked tracks
    const favoriteTracks = allTracks.filter(t => likedTracks.includes(t.id));
    // Use favorites if available, otherwise fallback to all tracks
    const source = favoriteTracks.length > 0 ? favoriteTracks : allTracks;

    if (source.length > 0) {
      const randomIndex = Math.floor(Math.random() * source.length);
      playTrack(source[randomIndex]);
      setIsWavePlaying(true);
    }
  };

  const handleToggleWave = () => {
    if (isWavePlaying && isPlaying) {
      togglePlay();
    } else if (isWavePlaying && !isPlaying) {
      togglePlay();
    } else {
      handlePlayWave();
    }
  };

  // Sync wave playing state with actual player state
  useEffect(() => {
    if (!isPlaying) {
      setIsWavePlaying(false);
    }
  }, [isPlaying]);

  const filteredTracks = allTracks.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`relative min-h-full pb-32 overflow-x-hidden flex flex-col ${theme === 'light' ? 'bg-white' : 'bg-[#121212]'}`}>
      {/* Animated Background - More Immersive */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-20 -left-20 w-[600px] h-[600px] ${getAccentClass('bg')} opacity-[0.05] rounded-full mix-blend-screen filter blur-[150px] animate-pulse`}></div>
        <div className={`absolute top-1/2 -right-20 w-[500px] h-[500px] ${getAccentClass('bg')} opacity-[0.05] rounded-full mix-blend-screen filter blur-[130px] animate-pulse animation-delay-2000`}></div>
      </div>
      <div className="relative z-10 flex flex-col flex-1 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 px-4 md:px-8 relative z-50">
          {user ? (
            <div 
              onClick={() => setView('profile')}
              className={`w-10 h-10 rounded-full ${theme === 'light' ? 'bg-black/5 border-black/5' : 'bg-white/10 border-white/10'} border flex items-center justify-center overflow-hidden cursor-pointer hover:bg-white/20 transition-colors`}
            >
              {user.avatar ? (
                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className={`w-5 h-5 ${theme === 'light' ? 'text-black' : 'text-white'}`} />
              )}
            </div>
          ) : <div className="w-10 h-10"></div>}

          <div className="flex items-center gap-2">
            <span className={`text-xl font-bold tracking-tight ${theme === 'light' ? 'text-black' : 'text-white'}`}>Vibe</span>
            <div className={`w-5 h-5 ${getAccentClass('text')}`}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
              </svg>
            </div>
            <span className={`text-xl font-bold tracking-tight ${theme === 'light' ? 'text-black' : 'text-white'}`}>Music</span>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setView('profile')}
              className={`w-10 h-10 flex items-center justify-center hover:bg-black/5 rounded-full transition-colors relative z-50 ${theme === 'light' ? 'text-black' : 'text-white'}`}
            >
              <Settings2 className="w-6 h-6" />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setSearchQuery(' '); // Open search view
                setTimeout(() => {
                  const searchInput = document.getElementById('search-input') as HTMLInputElement;
                  if (searchInput) {
                    searchInput.focus();
                    searchInput.select();
                  }
                }, 50);
              }}
              className={`w-10 h-10 flex items-center justify-center hover:bg-black/5 rounded-full transition-colors relative z-50 ${theme === 'light' ? 'text-black' : 'text-white'}`}
            >
              <Search className="w-6 h-6" />
            </button>
          </div>
        </div>

        {searchQuery !== '' ? (
          /* Search Results */
          <div className="flex-1 overflow-y-auto pb-20 px-4 md:px-8 relative z-10">
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input 
                id="search-input"
                type="text" 
                placeholder="Поиск треков, артистов..." 
                value={searchQuery.trim()}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full ${theme === 'light' ? 'bg-black/5 border-black/5 text-black' : 'bg-white/10 border-white/10 text-white'} border rounded-full py-3 pl-12 pr-4 placeholder-neutral-400 focus:outline-none focus:ring-2 ${getAccentClass('ring')}/50 transition-all backdrop-blur-md`}
                autoFocus
              />
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black text-sm"
              >
                Отмена
              </button>
            </div>
            <h2 className={`text-2xl font-bold mb-6 ${theme === 'light' ? 'text-black' : 'text-white'}`}>Результаты поиска</h2>
            <div className="space-y-2">
              {filteredTracks.length > 0 ? filteredTracks.map((track, i) => {
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
                      <h3 className={`font-medium truncate ${isActive ? getAccentClass('text') : (theme === 'light' ? 'text-black' : 'text-white')}`}>
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
                <div className="text-neutral-400 text-center py-10">Ничего не найдено</div>
              )}
            </div>
          </div>
        ) : (
          /* Main Dashboard */
          <div className="flex-1 flex flex-col py-6 overflow-y-auto no-scrollbar">
            
            {/* My Wave Centerpiece - Miniature Version */}
            <div className="flex flex-col items-center justify-center mb-10 relative w-full h-[380px] flex-shrink-0 overflow-hidden">
              {/* Vibrant Glowing Background - Intense Colors */}
              <div className="absolute inset-0 z-0">
                <motion.div 
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 120, 0],
                  }}
                  transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] ${getAccentClass('from')} via-purple-600/30 to-transparent blur-[100px] rounded-full mix-blend-screen`}
                />
                <motion.div 
                  animate={{ 
                    scale: [1.2, 1, 1.2],
                    rotate: [0, -120, 0],
                  }}
                  transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%] h-[100%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-500 via-yellow-400/20 to-transparent blur-[80px] rounded-full mix-blend-screen"
                />
              </div>
              
              <div className="relative z-10 flex flex-col items-center cursor-pointer" onClick={handleToggleWave}>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-4 mb-6"
                >
                  <Play className={`w-12 h-12 ${theme === 'light' ? 'text-black fill-black' : 'text-white fill-white'} drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]`} />
                  <h2 className={`text-4xl md:text-6xl font-black tracking-tighter drop-shadow-2xl ${theme === 'light' ? 'text-black' : 'text-white'}`}>Мой вайб</h2>
                </motion.div>
                
                <p className={`text-sm font-medium ${theme === 'light' ? 'text-black/60' : 'text-white/60'} max-w-xs text-center`}>
                  Бесконечный поток вашей любимой музыки
                </p>
              </div>
            </div>

            {/* Bottom Cards - Miniature & Refined */}
            <div className="w-full max-w-4xl mx-auto mb-12 px-4 md:px-8 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* For You - Pill Style */}
                <div 
                  className={`${theme === 'light' ? 'bg-black/5 border-black/5' : 'bg-white/5 border-white/5'} hover:bg-white/10 border rounded-full p-3 flex items-center gap-3 cursor-pointer transition-all backdrop-blur-md`}
                  onClick={() => recommendations.length > 0 && playTrack(recommendations[0])}
                >
                  <div className="flex -space-x-3 ml-1">
                    {recommendations.slice(0, 3).map((t, i) => (
                      <div key={i} className={`w-10 h-10 rounded-full border-2 ${theme === 'light' ? 'border-white' : 'border-[#121212]'} overflow-hidden bg-neutral-800 shadow-md`}>
                        {t.cover ? <img src={t.cover} alt="" className="w-full h-full object-cover" /> : <User className="w-full h-full p-2 text-neutral-500" />}
                      </div>
                    ))}
                  </div>
                  <div className="min-w-0 ml-1">
                    <h3 className={`font-bold text-base ${theme === 'light' ? 'text-black' : 'text-white'}`}>Для вас</h3>
                    <p className="text-neutral-500 text-xs truncate">
                      {recommendations.slice(0, 2).map(t => t.artist).join(', ') || 'Персональный поток'}
                    </p>
                  </div>
                </div>

                {/* Trends - Pill Style */}
                <div 
                  className={`${theme === 'light' ? 'bg-black/5 border-black/5' : 'bg-white/5 border-white/5'} hover:bg-white/10 border rounded-full p-3 flex items-center gap-3 cursor-pointer transition-all backdrop-blur-md`}
                  onClick={() => trends.length > 0 && playTrack(trends[0])}
                >
                  <div className="flex -space-x-3 ml-1">
                    {trends.slice(0, 3).map((t, i) => (
                      <div key={i} className={`w-10 h-10 rounded-full border-2 ${theme === 'light' ? 'border-white' : 'border-[#121212]'} overflow-hidden bg-neutral-800 shadow-md`}>
                        {t.cover ? <img src={t.cover} alt="" className="w-full h-full object-cover" /> : <Play className="w-full h-full p-2 text-neutral-500 fill-current" />}
                      </div>
                    ))}
                  </div>
                  <div className="min-w-0 ml-1">
                    <h3 className={`font-bold text-base ${theme === 'light' ? 'text-black' : 'text-white'}`}>Тренды</h3>
                    <p className="text-neutral-500 text-xs truncate">
                      {trends.slice(0, 2).map(t => t.artist).join(', ') || 'Популярное сейчас'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Favorites - Square Style */}
                <div 
                  className={`${theme === 'light' ? 'bg-black/5 border-black/5' : 'bg-white/5 border-white/5'} hover:bg-white/10 border rounded-[1.5rem] p-4 flex items-center justify-between cursor-pointer transition-all backdrop-blur-md`}
                  onClick={() => setView('favorites')}
                >
                  <div className="min-w-0">
                    <h3 className={`font-bold text-base mb-0.5 ${theme === 'light' ? 'text-black' : 'text-white'}`}>Мне нравится</h3>
                    <p className="text-neutral-500 text-[10px] uppercase tracking-wider font-bold">{likedTracks.length} треков</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getAccentClass('from')} to-rose-600 flex items-center justify-center shadow-md`}>
                    <Heart className="w-5 h-5 text-white fill-white" />
                  </div>
                </div>

                {/* History - Square Style */}
                <div className={`${theme === 'light' ? 'bg-black/5 border-black/5' : 'bg-white/5 border-white/5'} hover:bg-white/10 border rounded-[1.5rem] p-4 flex items-center justify-between cursor-pointer transition-all backdrop-blur-md`}>
                  <div className="min-w-0">
                    <h3 className={`font-bold text-base mb-0.5 ${theme === 'light' ? 'text-black' : 'text-white'}`}>История</h3>
                    <p className="text-neutral-500 text-[10px] uppercase tracking-wider font-bold">Недавно</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center shadow-md">
                    <History className="w-5 h-5 text-neutral-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* All Tracks Section */}
            <div className="w-full max-w-4xl mx-auto px-4 md:px-8">
              <h2 className={`text-xl font-bold mb-4 ${theme === 'light' ? 'text-black' : 'text-white'}`}>Все треки</h2>
              <div className="space-y-1">
                {allTracks.map((track) => {
                  const isActive = currentTrack?.id === track.id;
                  const isLiked = likedTracks.includes(track.id);
                  
                  return (
                    <div 
                      key={track.id} 
                      onClick={() => isActive ? togglePlay() : playTrack(track)}
                      className={`group flex items-center gap-3 p-2 rounded-xl transition-all cursor-pointer border border-transparent ${
                        isActive ? (theme === 'light' ? 'bg-black/5' : 'bg-white/10') : 'hover:bg-black/5'
                      }`}
                    >
                      <div className="w-10 h-10 bg-neutral-800 rounded-lg flex-shrink-0 overflow-hidden relative shadow-sm">
                        {track.cover ? (
                          <img src={track.cover} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-neutral-700">
                            <Play className="w-4 h-4 text-neutral-500" />
                          </div>
                        )}
                        {isActive && isPlaying && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <div className="flex items-end justify-center gap-0.5 h-3">
                              <div className={`w-0.5 ${getAccentClass('bg')} h-full animate-[bounce_1s_infinite]`}></div>
                              <div className={`w-0.5 ${getAccentClass('bg')} h-2/3 animate-[bounce_1s_infinite_0.2s]`}></div>
                              <div className={`w-0.5 ${getAccentClass('bg')} h-1/2 animate-[bounce_1s_infinite_0.4s]`}></div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className={`text-sm font-medium truncate ${isActive ? getAccentClass('text') : (theme === 'light' ? 'text-black' : 'text-white')}`}>
                          {track.title}
                        </h3>
                        <p className="text-neutral-500 text-xs truncate">{track.artist}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <motion.button 
                          whileTap={{ scale: 0.8 }}
                          onClick={(e) => { e.stopPropagation(); toggleLike(track.id); }}
                          className="p-1.5 hover:bg-black/5 rounded-full transition-colors"
                        >
                          <Heart className={`w-4 h-4 transition-colors ${isLiked ? getAccentClass('text') + ' ' + getAccentClass('fill') : 'text-neutral-400 hover:text-black'}`} />
                        </motion.button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
