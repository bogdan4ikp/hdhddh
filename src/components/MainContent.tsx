import React from 'react';
import { Search, Settings2, User, Play, Pause, Heart, Music, Disc3, Clock, ChevronRight, TrendingUp } from 'lucide-react';
import { useAppContext, Track } from '../context/AppContext';
import { isFutureRelease } from '../utils/date';

export default function MainContent() {
  const { user, setView, theme, allTracks, currentTrack, isPlaying, togglePlay, playTrack, likedTracks, toggleLike, playlists, setSelectedPlaylistId } = useAppContext();
  
  // Filter only user uploaded tracks for "My Tracks"
  const myTracks = allTracks.filter(t => t.uploaderId === user?.id);
  
  // Get public albums
  const publicAlbums = playlists.filter(p => p.type === 'album' && p.isPublic);

  // Top charts
  const topTracks = [...allTracks].sort((a, b) => (b.plays || 0) - (a.plays || 0)).slice(0, 10);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Доброе утро';
    if (hour < 18) return 'Добрый день';
    return 'Добрый вечер';
  };

  return (
    <div className={`relative h-full flex flex-col ${theme === 'light' ? 'bg-[#f2f2f7]' : 'bg-[#000000]'}`}>
      {/* Optimized Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/30 via-blue-900/20 to-black/0" />
        <div className={`absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[100px] opacity-30 ${theme === 'light' ? 'bg-cyan-400' : 'bg-cyan-600'}`} />
        <div className={`absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[100px] opacity-30 ${theme === 'light' ? 'bg-blue-400' : 'bg-blue-600'}`} />
      </div>

      {/* Scrollable Content */}
      <div className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden pb-32 safe-top">
        
        {/* Header */}
        <div className="px-6 pt-8 pb-6 flex items-center justify-between sticky top-0 z-20 backdrop-blur-xl bg-inherit/80">
          <div>
            <h1 className={`text-2xl font-bold tracking-tight ${theme === 'light' ? 'text-black' : 'text-white'}`}>
              {greeting()}
            </h1>
            <p className={`text-sm font-medium ${theme === 'light' ? 'text-neutral-500' : 'text-neutral-400'}`}>
              {user?.username || 'Гость'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setView('search')}
              className={`p-2.5 rounded-full ${theme === 'light' ? 'bg-white text-black shadow-sm' : 'bg-white/10 text-white'} hover:scale-105 transition-transform`}
            >
              <Search className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setView('profile')}
              className="w-10 h-10 rounded-full overflow-hidden border-2 border-transparent hover:border-cyan-400 transition-colors"
            >
              {user?.avatar ? (
                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className={`w-full h-full flex items-center justify-center ${theme === 'light' ? 'bg-neutral-200' : 'bg-neutral-800'}`}>
                  <User className="w-5 h-5 text-neutral-500" />
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="px-6 mb-8">
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-4 rounded-2xl ${theme === 'light' ? 'bg-white shadow-sm' : 'bg-white/5 border border-white/5'}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-full bg-cyan-500/20 text-cyan-400">
                  <Music className="w-5 h-5" />
                </div>
                <span className={`text-sm font-medium ${theme === 'light' ? 'text-neutral-500' : 'text-neutral-400'}`}>Треков</span>
              </div>
              <p className={`text-2xl font-bold ${theme === 'light' ? 'text-black' : 'text-white'}`}>
                {user?.tracksPlayed || 0}
              </p>
            </div>
            <div className={`p-4 rounded-2xl ${theme === 'light' ? 'bg-white shadow-sm' : 'bg-white/5 border border-white/5'}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-full bg-blue-500/20 text-blue-400">
                  <Clock className="w-5 h-5" />
                </div>
                <span className={`text-sm font-medium ${theme === 'light' ? 'text-neutral-500' : 'text-neutral-400'}`}>Минут</span>
              </div>
              <p className={`text-2xl font-bold ${theme === 'light' ? 'text-black' : 'text-white'}`}>
                {user?.minutesListened || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Horizontal Scroll: New Albums */}
        {publicAlbums.length > 0 && (
          <div className="mb-8">
            <div className="px-6 mb-4 flex items-center justify-between">
              <h2 className={`text-xl font-bold ${theme === 'light' ? 'text-black' : 'text-white'}`}>Новые альбомы</h2>
              <button className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Все</button>
            </div>
            
            <div className="flex overflow-x-auto px-6 gap-4 pb-4 snap-x scrollbar-hide">
              {publicAlbums.map(album => (
                <div 
                  key={album.id} 
                  className="flex-shrink-0 w-40 snap-start group cursor-pointer"
                  onClick={() => {
                    setSelectedPlaylistId(album.id);
                    setView('playlist');
                  }}
                >
                  <div className="aspect-square rounded-2xl overflow-hidden mb-3 relative shadow-lg bg-neutral-800">
                    {album.cover ? (
                      <img src={album.cover} alt={album.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-neutral-800">
                        <Disc3 className="w-10 h-10 text-neutral-600" />
                      </div>
                    )}
                    {isFutureRelease(album.releaseDate) && (
                      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-white" />
                        <span className="text-[10px] font-bold text-white uppercase">Скоро</span>
                      </div>
                    )}
                  </div>
                  <h3 className={`font-bold text-sm truncate ${theme === 'light' ? 'text-black' : 'text-white'}`}>{album.title}</h3>
                  <p className="text-xs text-neutral-500 truncate">{album.tracks.length} треков</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Horizontal Scroll: My Tracks (Quick Access) */}
        {myTracks.length > 0 && (
          <div className="mb-8">
            <div className="px-6 mb-4 flex items-center justify-between">
              <h2 className={`text-xl font-bold ${theme === 'light' ? 'text-black' : 'text-white'}`}>Мои треки</h2>
            </div>
            <div className="flex overflow-x-auto px-6 gap-3 pb-4 snap-x scrollbar-hide">
              {myTracks.slice(0, 6).map(track => (
                <div 
                  key={track.id}
                  onClick={() => {
                    if (isFutureRelease(track.releaseDate)) return;
                    currentTrack?.id === track.id && isPlaying ? togglePlay() : playTrack(track)
                  }}
                  className={`flex-shrink-0 w-64 p-3 rounded-2xl flex items-center gap-3 snap-start cursor-pointer transition-colors ${theme === 'light' ? 'bg-white shadow-sm' : 'bg-white/5 border border-white/5'}`}
                >
                  <div className="w-12 h-12 rounded-xl bg-neutral-800 overflow-hidden relative flex-shrink-0">
                    {track.cover ? (
                      <img src={track.cover} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-5 h-5 text-neutral-500" />
                      </div>
                    )}
                    {currentTrack?.id === track.id && isPlaying && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="flex items-end gap-0.5 h-3">
                          <div className="w-1 bg-cyan-400 h-full animate-bounce" />
                          <div className="w-1 bg-cyan-400 h-2/3 animate-bounce delay-75" />
                          <div className="w-1 bg-cyan-400 h-1/2 animate-bounce delay-150" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className={`font-bold text-sm truncate ${theme === 'light' ? 'text-black' : 'text-white'}`}>{track.title}</h3>
                    <p className="text-xs text-neutral-500 truncate">{track.artist}</p>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleLike(track.id); }}
                    className={`p-2 rounded-full ${likedTracks.includes(track.id) ? 'text-cyan-500' : 'text-neutral-400'}`}
                  >
                    <Heart className={`w-4 h-4 ${likedTracks.includes(track.id) ? 'fill-current' : ''}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vertical List: Top Chart */}
        <div className="px-6">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <h2 className={`text-xl font-bold ${theme === 'light' ? 'text-black' : 'text-white'}`}>Топ чарт</h2>
          </div>
          
          <div className="space-y-1">
            {topTracks.length > 0 ? topTracks.map((track, index) => (
              <div 
                key={track.id}
                onClick={() => {
                  if (isFutureRelease(track.releaseDate)) return;
                  currentTrack?.id === track.id && isPlaying ? togglePlay() : playTrack(track)
                }}
                className={`group flex items-center gap-4 p-3 rounded-2xl transition-all cursor-pointer ${theme === 'light' ? 'hover:bg-white active:scale-[0.99]' : 'hover:bg-white/5 active:scale-[0.99]'}`}
              >
                <div className={`w-6 text-center font-bold text-sm ${index < 3 ? 'text-cyan-400' : 'text-neutral-500'}`}>
                  {index + 1}
                </div>
                
                <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-neutral-800 flex-shrink-0 shadow-sm">
                  {track.cover ? (
                    <img src={track.cover} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-neutral-700">
                      <Music className="w-5 h-5 text-neutral-500" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className={`font-bold text-base truncate ${currentTrack?.id === track.id ? 'text-cyan-400' : (theme === 'light' ? 'text-black' : 'text-white')}`}>
                    {track.title}
                  </h3>
                  <p className="text-sm text-neutral-500 truncate font-medium">{track.artist}</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-xs font-medium text-neutral-500 flex items-center gap-1">
                    <Play className="w-3 h-3 fill-current" />
                    {track.plays || 0}
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleLike(track.id); }}
                    className={`p-2 rounded-full ${likedTracks.includes(track.id) ? 'text-cyan-500' : 'text-neutral-400'}`}
                  >
                    <Heart className={`w-5 h-5 ${likedTracks.includes(track.id) ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>
            )) : (
              <div className="py-10 text-center text-neutral-500">
                <Music className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Чарт пока пуст</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
