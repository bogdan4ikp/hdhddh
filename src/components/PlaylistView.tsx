import React from 'react';
import { Play, Heart, Music, ArrowLeft, Trash2, Clock } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { motion } from 'motion/react';
import { isFutureRelease } from '../utils/date';
import { api } from '../services/api';

export default function PlaylistView() {
  const { 
    user, 
    allTracks, 
    playlists, 
    selectedPlaylistId, 
    setView, 
    playTrack, 
    currentTrack, 
    isPlaying, 
    togglePlay, 
    likedTracks, 
    toggleLike,
    refreshPlaylists
  } = useAppContext();

  const playlist = playlists.find(p => p.id === selectedPlaylistId);

  if (!playlist) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen pb-32">
        <p className="text-neutral-400 mb-4">Плейлист не найден</p>
        <button onClick={() => setView('library')} className="text-cyan-500 hover:underline">Вернуться в медиатеку</button>
      </div>
    );
  }

  const playlistTracks = playlist.tracks
    .map(id => allTracks.find(t => t.id === id))
    .filter((t): t is NonNullable<typeof t> => t !== undefined);

  const handlePlayAll = () => {
    if (playlistTracks.length > 0) {
      playTrack(playlistTracks[0]);
    }
  };

  const handleDeletePlaylist = async () => {
    if (!confirm('Удалить этот ' + (playlist.type === 'album' ? 'альбом' : 'плейлист') + '?')) return;
    
    try {
      await api.deletePlaylist(playlist.id);
      refreshPlaylists();
      setView('library');
    } catch (e) {
      console.error('Failed to delete playlist', e);
    }
  };

  return (
    <div className="h-full overflow-y-auto pb-32">
      {/* Header */}
      <div className="relative h-80 w-full overflow-hidden flex items-end p-6 md:p-10">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#121212] z-10"></div>
        {playlist.cover ? (
          <img src={playlist.cover} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40 blur-sm" />
        ) : (
          <div className="absolute inset-0 bg-neutral-900"></div>
        )}
        
        <button 
          onClick={() => setView('library')}
          className="absolute top-6 left-6 z-20 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>

        <div className="relative z-20 flex items-end gap-6 w-full">
          <div className="w-32 h-32 md:w-48 md:h-48 rounded-2xl overflow-hidden shadow-2xl flex-shrink-0 bg-neutral-800 border border-white/10">
            {playlist.cover ? (
              <img src={playlist.cover} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-neutral-800">
                <Music className="w-12 h-12 text-neutral-500" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 pb-2">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-xs font-bold uppercase tracking-widest text-cyan-500">
                {playlist.type === 'album' ? 'Альбом' : 'Плейлист'}
              </p>
              {isFutureRelease(playlist.releaseDate) && (
                <span className="text-[10px] font-bold text-white uppercase tracking-wider bg-cyan-500/80 px-2 py-0.5 rounded-full border border-cyan-500/20 shadow-lg flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Скоро
                </span>
              )}
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-4 truncate tracking-tighter">
              {playlist.title}
            </h1>
            <p className="text-neutral-300 text-sm font-medium">
              {playlistTracks.length} треков
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-8 relative z-20">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={handlePlayAll}
              disabled={playlistTracks.length === 0 || isFutureRelease(playlist.releaseDate)}
              className="w-14 h-14 bg-cyan-500 text-white rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-cyan-900/20 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
            >
              <Play className="w-6 h-6 fill-current ml-1" />
            </button>
          </div>
          
          {user?.id === playlist.authorId && (
            <button 
              onClick={handleDeletePlaylist}
              className="p-3 text-neutral-500 hover:text-red-500 hover:bg-white/5 rounded-full transition-colors"
              title="Удалить"
            >
              <Trash2 className="w-6 h-6" />
            </button>
          )}
        </div>

        <div className="space-y-2">
          {playlistTracks.length > 0 ? playlistTracks.map((track, i) => {
            const isActive = currentTrack?.id === track.id;
            
            return (
              <div 
                key={track.id} 
                onClick={() => {
                  if (isFutureRelease(track.releaseDate)) return;
                  isActive ? togglePlay() : playTrack(track)
                }}
                className={`group flex items-center gap-4 p-3 rounded-xl transition-all cursor-pointer border border-transparent ${
                  isActive ? 'bg-white/10 border-white/5' : 'hover:bg-white/5 hover:border-white/5'
                } ${isFutureRelease(track.releaseDate) ? 'opacity-50 cursor-not-allowed hover:bg-transparent hover:border-transparent' : ''}`}
              >
                <div className="w-8 text-center text-neutral-500 font-mono text-sm">
                  {isFutureRelease(track.releaseDate) ? (
                    <Clock className="w-4 h-4 mx-auto text-neutral-500" />
                  ) : isActive && isPlaying ? (
                    <div className="flex items-end justify-center gap-0.5 h-4">
                      <div className="w-1 bg-cyan-500 h-full animate-[bounce_1s_infinite]"></div>
                      <div className="w-1 bg-cyan-500 h-2/3 animate-[bounce_1s_infinite_0.2s]"></div>
                      <div className="w-1 bg-cyan-500 h-1/2 animate-[bounce_1s_infinite_0.4s]"></div>
                    </div>
                  ) : (
                    <span className="group-hover:hidden">{i + 1}</span>
                  )}
                  {!isFutureRelease(track.releaseDate) && (
                    <Play className={`w-4 h-4 mx-auto hidden ${isActive ? '' : 'group-hover:block'} text-white fill-current`} />
                  )}
                </div>

                <div className="w-12 h-12 bg-neutral-800 rounded-lg flex-shrink-0 overflow-hidden relative shadow-md">
                  {track.cover ? (
                    <img src={track.cover} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-neutral-700">
                      <Music className="w-6 h-6 text-neutral-500" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className={`font-medium truncate ${isActive ? 'text-cyan-400' : 'text-white'}`}>
                    {track.title}
                  </h3>
                  <p className="text-neutral-400 text-sm truncate">{track.artist}</p>
                </div>

                <div className="flex items-center gap-4">
                  <motion.button 
                    whileTap={{ scale: 0.8 }}
                    onClick={(e) => { e.stopPropagation(); toggleLike(track.id); }}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <Heart className={`w-5 h-5 ${likedTracks.includes(track.id) ? 'text-cyan-500 fill-cyan-500' : 'text-neutral-400'}`} />
                  </motion.button>
                  {user?.id === playlist.authorId && (
                    <button 
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!confirm('Удалить трек из ' + (playlist.type === 'album' ? 'альбома' : 'плейлиста') + '?')) return;
                        
                        const updatedTracks = playlist.tracks.filter(id => id !== track.id);
                        try {
                          const res = await fetch(`/api/playlists/${playlist.id}/tracks`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ tracks: updatedTracks })
                          });
                          if (res.ok) {
                            refreshPlaylists();
                          }
                        } catch (err) {
                          console.error('Failed to remove track from playlist', err);
                        }
                      }}
                      className="p-2 text-neutral-500 hover:text-red-500 hover:bg-white/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                      title="Удалить из плейлиста"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          }) : (
            <div className="text-center py-12 text-neutral-500">
              В этом {playlist.type === 'album' ? 'альбоме' : 'плейлисте'} пока нет треков
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
