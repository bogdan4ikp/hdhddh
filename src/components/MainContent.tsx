import React from 'react';
import { Search, Settings2, User, Play, Pause, Heart, Music, ArrowDown, Disc3, Trash2, Clock } from 'lucide-react';
import { useAppContext, Track } from '../context/AppContext';
import { isFutureRelease } from '../utils/date';

export default function MainContent() {
  const { user, setView, theme, allTracks, currentTrack, isPlaying, togglePlay, playTrack, likedTracks, toggleLike, playlists, setSelectedPlaylistId, refreshTracks } = useAppContext();
  
  // Format numbers with commas/spaces
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ru-RU').format(num);
  };

  // Filter only user uploaded tracks for "My Tracks"
  const myTracks = allTracks.filter(t => t.uploaderId === user?.id);
  
  // Get public albums
  const publicAlbums = playlists.filter(p => p.type === 'album' && p.isPublic);

  const handleDeleteTrack = async (trackId: string) => {
    if (!confirm('Удалить этот трек?')) return;
    try {
      const res = await fetch(`/api/tracks/${trackId}`, { method: 'DELETE' });
      if (res.ok) {
        refreshTracks();
      }
    } catch (e) {
      console.error('Failed to delete track', e);
    }
  };

  return (
    <div className={`relative h-full overflow-hidden flex flex-col ${theme === 'light' ? 'bg-white' : 'bg-[#121212]'}`}>
      <style>{`
        @keyframes float-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(100px, -50px) scale(1.4); }
          50% { transform: translate(50px, 100px) scale(0.9); }
          75% { transform: translate(-50px, 50px) scale(1.2); }
        }
        @keyframes float-2 {
          0%, 100% { transform: translate(0, 0) scale(1.2); }
          33% { transform: translate(-100px, 80px) scale(0.8); }
          66% { transform: translate(80px, -80px) scale(1.5); }
        }
        @keyframes float-3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(60px, -40px) scale(1.4); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.8; }
        }
        .blob-1 { animation: float-1 15s infinite ease-in-out alternate, pulse-glow 8s infinite ease-in-out; }
        .blob-2 { animation: float-2 20s infinite ease-in-out alternate, pulse-glow 10s infinite ease-in-out; }
        .blob-3 { animation: float-3 12s infinite ease-in-out alternate, pulse-glow 6s infinite ease-in-out; }
      `}</style>
      
      {/* Full Screen Fixed Animated Background - Optimized */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[#121212]">
          <div className="absolute -top-[20%] -left-[20%] w-[80%] h-[80%] bg-[#FF7A00] rounded-full blur-[100px] opacity-60 blob-1 will-change-transform mix-blend-screen" />
          <div className="absolute top-[20%] -right-[20%] w-[90%] h-[90%] bg-[#FF006E] rounded-full blur-[120px] opacity-60 blob-2 will-change-transform mix-blend-screen" />
          <div className="absolute bottom-[-10%] left-[10%] w-[70%] h-[70%] bg-[#FF0000] rounded-full blur-[110px] opacity-50 blob-3 will-change-transform mix-blend-screen" />
        </div>
        {/* Dark vignette effect around the edges */}
        <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.9)] mix-blend-multiply pointer-events-none"></div>
      </div>

      {/* Scrollable Content Container */}
      <div className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pb-24 scroll-smooth">
        
        {/* Slide 1: Stats (Full Screen) */}
        <div className="min-h-[90vh] flex flex-col px-4 md:px-8 pt-6 relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            {user ? (
              <div 
                onClick={() => setView('profile')}
                className="w-10 h-10 rounded-full bg-white/10 border-white/10 border flex items-center justify-center overflow-hidden cursor-pointer hover:bg-white/20 transition-colors backdrop-blur-md"
              >
                {user.avatar ? (
                  <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-white" />
                )}
              </div>
            ) : <div className="w-10 h-10"></div>}

            <div className="flex items-center gap-2 backdrop-blur-md px-4 py-2 rounded-full bg-white/5 border border-white/5">
              <span className="text-xl font-bold tracking-tight text-white">Vibe</span>
              <div className="w-5 h-5 text-pink-500">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
                </svg>
              </div>
              <span className="text-xl font-bold tracking-tight text-white">Music</span>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setView('search')}
                className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors backdrop-blur-md text-white"
              >
                <Search className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Stats Content */}
          <div className="flex-1 flex flex-col justify-center text-white font-sans pb-20">
            <div className="w-full max-w-md space-y-12">
              <div className="space-y-10 text-left">
                <div>
                  <h3 className="text-lg font-medium opacity-90 mb-2 uppercase tracking-widest">Прослушано в этом году</h3>
                  <div className="text-6xl md:text-7xl font-black tracking-tighter leading-none drop-shadow-2xl">
                    {formatNumber(user?.tracksPlayed || 0)}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium opacity-90 mb-2 uppercase tracking-widest">Минут музыки</h3>
                  <div className="text-6xl md:text-7xl font-black tracking-tighter leading-none drop-shadow-2xl">
                    {formatNumber(user?.minutesListened || 0)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-10 border-t border-white/20">
                <div className="text-left">
                  <h3 className="text-sm font-bold opacity-80 mb-4 uppercase tracking-widest">Топ города</h3>
                  {myTracks.length > 0 && (user?.tracksPlayed || 0) > 0 ? (
                    <div className="space-y-1 text-2xl font-black leading-tight uppercase tracking-tight">
                      <div>MOSCOW</div>
                      <div>ST. PETERSBURG</div>
                      <div>YEKATERINBURG</div>
                    </div>
                  ) : (
                    <div className="text-white/40 text-sm font-medium">
                      Загрузите треки и начните слушать, чтобы увидеть статистику по городам.
                    </div>
                  )}
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-bold opacity-80 mb-4 uppercase tracking-widest">Топ жанры</h3>
                  <div className="space-y-1 text-2xl font-black leading-tight uppercase tracking-tight">
                    <div>HIP-HOP</div>
                    <div>POP</div>
                    <div>ELECTRONIC</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce opacity-50">
            <ArrowDown className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Content Below Slide */}
        <div className="px-4 md:px-8 pb-10">
          
          {/* Albums Section */}
          {publicAlbums.length > 0 && (
            <div className="mb-16 pt-10">
              <h2 className="text-3xl font-bold text-white mb-8 px-2 tracking-tight">Новые альбомы</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {publicAlbums.map(album => (
                  <div 
                    key={album.id} 
                    className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 group relative hover:bg-white/10 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedPlaylistId(album.id);
                      setView('playlist');
                    }}
                  >
                    <div className="absolute top-2 right-2 z-10 bg-black/50 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 flex items-center gap-1.5">
                      <Disc3 className="w-3 h-3 text-pink-500" />
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider">Альбом</span>
                    </div>
                    {isFutureRelease(album.releaseDate) && (
                      <div className="absolute top-2 left-2 z-10 bg-pink-500/80 backdrop-blur-md px-2 py-1 rounded-lg border border-pink-500/20 flex items-center gap-1.5 shadow-lg">
                        <Clock className="w-3 h-3 text-white" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">Скоро</span>
                      </div>
                    )}
                    <div className="aspect-square bg-neutral-800 rounded-xl mb-4 overflow-hidden relative shadow-lg">
                      {album.cover ? (
                        <img src={album.cover} alt={album.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-700 to-neutral-900">
                          <Disc3 className="w-12 h-12 text-neutral-500" />
                        </div>
                      )}
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isFutureRelease(album.releaseDate)) return;
                          if (album.tracks.length > 0) {
                            const firstTrack = allTracks.find(t => t.id === album.tracks[0]);
                            if (firstTrack) playTrack(firstTrack);
                          }
                        }}
                        className={`absolute bottom-2 right-2 w-12 h-12 rounded-full flex items-center justify-center text-white opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all shadow-xl hover:scale-105 ${isFutureRelease(album.releaseDate) ? 'bg-neutral-600 cursor-not-allowed' : 'bg-pink-500 hover:bg-pink-400'}`}
                      >
                        <Play className="w-6 h-6 fill-white ml-1" />
                      </button>
                    </div>
                    
                    <div className="min-w-0">
                      <h3 className="font-bold text-white truncate text-lg">{album.title}</h3>
                      <p className="text-sm text-neutral-400 truncate mt-1">
                        {album.tracks.length} треков
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* My Tracks Section */}
          {myTracks.length > 0 && (
            <div className="mb-16 pt-10">
              <h2 className="text-3xl font-bold text-white mb-8 px-2 tracking-tight">Мои треки</h2>
              <div className="space-y-3">
                {myTracks.map((track) => (
                  <div 
                    key={track.id}
                    className="group flex items-center gap-4 p-4 rounded-3xl hover:bg-white/10 transition-all backdrop-blur-md border border-white/5 hover:border-white/10"
                  >
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-neutral-800 flex-shrink-0 shadow-lg">
                      {track.cover ? (
                        <img src={track.cover} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-white/10">
                          <Music className="w-8 h-8 text-white/50" />
                        </div>
                      )}
                      <button 
                        onClick={() => {
                          if (isFutureRelease(track.releaseDate)) return;
                          currentTrack?.id === track.id && isPlaying ? togglePlay() : playTrack(track)
                        }}
                        className={`absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${isFutureRelease(track.releaseDate) ? 'cursor-not-allowed' : ''}`}
                      >
                        {isFutureRelease(track.releaseDate) ? (
                          <Clock className="w-8 h-8 text-white" />
                        ) : currentTrack?.id === track.id && isPlaying ? (
                          <Pause className="w-8 h-8 text-white fill-current" />
                        ) : (
                          <Play className="w-8 h-8 text-white fill-current ml-1" />
                        )}
                      </button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className={`text-lg font-bold truncate ${currentTrack?.id === track.id ? 'text-pink-500' : 'text-white'}`}>
                          {track.title}
                        </h3>
                        {isFutureRelease(track.releaseDate) && (
                          <span className="text-[10px] font-bold text-pink-500 uppercase tracking-wider bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20">
                            Скоро
                          </span>
                        )}
                      </div>
                      <p className="text-base text-neutral-400 truncate font-medium">{track.artist}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => toggleLike(track.id)}
                        className={`p-3 rounded-full transition-colors ${likedTracks.includes(track.id) ? 'text-pink-500' : 'text-neutral-500 hover:text-white'}`}
                      >
                        <Heart className={`w-6 h-6 ${likedTracks.includes(track.id) ? 'fill-current' : ''}`} />
                      </button>
                      <button 
                        onClick={() => handleDeleteTrack(track.id)}
                        className="p-3 text-neutral-500 hover:text-red-500 hover:bg-white/5 rounded-full transition-colors"
                        title="Удалить трек"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Chart Section */}
          <div className="mb-8 pt-4">
            <h2 className="text-3xl font-bold text-white mb-8 px-2 tracking-tight">Топ чарт</h2>
            {allTracks.length > 0 ? (
              <div className="space-y-3">
                {[...allTracks].sort((a, b) => (b.plays || 0) - (a.plays || 0)).slice(0, 10).map((track, index) => (
                  <div 
                    key={track.id}
                    className="group flex items-center gap-4 p-4 rounded-3xl hover:bg-white/10 transition-all backdrop-blur-md border border-white/5 hover:border-white/10"
                  >
                    <div className="w-8 text-center font-black text-xl text-white/50">{index + 1}</div>
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-neutral-800 flex-shrink-0 shadow-lg">
                      {track.cover ? (
                        <img src={track.cover} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-white/10">
                          <Music className="w-8 h-8 text-white/50" />
                        </div>
                      )}
                      <button 
                        onClick={() => {
                          if (isFutureRelease(track.releaseDate)) return;
                          currentTrack?.id === track.id && isPlaying ? togglePlay() : playTrack(track)
                        }}
                        className={`absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${isFutureRelease(track.releaseDate) ? 'cursor-not-allowed' : ''}`}
                      >
                        {isFutureRelease(track.releaseDate) ? (
                          <Clock className="w-8 h-8 text-white" />
                        ) : currentTrack?.id === track.id && isPlaying ? (
                          <Pause className="w-8 h-8 text-white fill-current" />
                        ) : (
                          <Play className="w-8 h-8 text-white fill-current ml-1" />
                        )}
                      </button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className={`text-lg font-bold truncate ${currentTrack?.id === track.id ? 'text-pink-500' : 'text-white'}`}>
                          {track.title}
                        </h3>
                        {isFutureRelease(track.releaseDate) && (
                          <span className="text-[10px] font-bold text-pink-500 uppercase tracking-wider bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20">
                            Скоро
                          </span>
                        )}
                      </div>
                      <p className="text-base text-neutral-400 truncate font-medium">{track.artist}</p>
                    </div>
                    <div className="text-sm font-bold text-neutral-500 mr-4 flex items-center gap-1">
                      <Play className="w-3 h-3 fill-current" />
                      {track.plays || 0}
                    </div>
                    <button 
                      onClick={() => toggleLike(track.id)}
                      className={`p-3 rounded-full transition-colors ${likedTracks.includes(track.id) ? 'text-pink-500' : 'text-neutral-500 hover:text-white'}`}
                    >
                      <Heart className={`w-6 h-6 ${likedTracks.includes(track.id) ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-sm">
                <Music className="w-12 h-12 text-white/20 mb-4" />
                <p className="text-white/40 text-lg font-medium">Список пуст</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
