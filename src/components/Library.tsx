import React, { useState } from 'react';
import { Play, Plus, Trash2, Heart } from 'lucide-react';
import { useAppContext, Playlist } from '../context/AppContext';

export default function Library() {
  const { user, playlists, allTracks, playTrack, refreshPlaylists, setView, likedTracks, setSelectedPlaylistId } = useAppContext();
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const userPlaylists = playlists.filter(p => p.authorId === user?.id);
  const favoriteTracks = allTracks.filter(t => likedTracks.includes(t.id));

  const handleCreatePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTitle) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const newPlaylist: Playlist = {
        id: 'playlist-' + Date.now(),
        title: newTitle,
        authorId: user.id,
        cover: reader.result as string || null,
        isPublic: false, // Always private
        tracks: selectedTracks,
        createdAt: new Date().toISOString(),
        type: 'playlist'
      };

      const updatedPlaylists = [...playlists, newPlaylist];
      localStorage.setItem('playlists', JSON.stringify(updatedPlaylists));
      
      setIsCreating(false);
      setNewTitle('');
      setSelectedTracks([]);
      setCoverFile(null);
      refreshPlaylists();
    };

    if (coverFile) {
      reader.readAsDataURL(coverFile);
    } else {
      reader.onloadend({ target: reader } as unknown as ProgressEvent<FileReader>);
    }
  };

  const handleDeletePlaylist = (id: string) => {
    if (!confirm('Удалить плейлист?')) return;
    
    const updatedPlaylists = playlists.filter(p => p.id !== id);
    localStorage.setItem('playlists', JSON.stringify(updatedPlaylists));
    refreshPlaylists();
  };

  const toggleTrackSelection = (trackId: string) => {
    setSelectedTracks(prev => 
      prev.includes(trackId) ? prev.filter(id => id !== trackId) : [...prev, trackId]
    );
  };

  return (
    <div className="p-6 pb-32">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Медиатека</h1>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="text-neutral-400 hover:text-white font-medium flex items-center gap-1 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Плейлист
        </button>
      </div>

      {isCreating && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Новый плейлист</h2>
          <form onSubmit={handleCreatePlaylist} className="space-y-4">
            <div className="flex gap-4">
              <label className={`flex-shrink-0 w-32 h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all overflow-hidden flex flex-col items-center justify-center ${coverFile ? 'border-pink-500 bg-pink-500/5' : 'border-white/10 hover:border-white/20 bg-black/50'}`}>
                {coverFile ? (
                  <img src={URL.createObjectURL(coverFile)} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Plus className="w-6 h-6 mb-2 text-neutral-500" />
                    <span className="text-[10px] font-black uppercase text-neutral-500">Обложка</span>
                  </>
                )}
                <input type="file" accept="image/*" onChange={e => setCoverFile(e.target.files?.[0] || null)} className="hidden" />
              </label>
              
              <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Название</label>
                  <input 
                    type="text" 
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30"
                    placeholder="Мой крутой плейлист"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Выберите треки из любимых</label>
              <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                {favoriteTracks.length > 0 ? favoriteTracks.map(track => (
                  <div 
                    key={track.id}
                    onClick={() => toggleTrackSelection(track.id)}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors border ${
                      selectedTracks.includes(track.id) ? 'bg-white/20 border-white/30' : 'bg-black/30 border-transparent hover:bg-white/10'
                    }`}
                  >
                    <div className="w-10 h-10 bg-neutral-800 rounded overflow-hidden">
                      {track.cover && <img src={track.cover} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate text-white">{track.title}</div>
                      <div className="text-xs text-neutral-400 truncate">{track.artist}</div>
                    </div>
                  </div>
                )) : (
                  <div className="text-neutral-500 text-sm py-4">У вас пока нет любимых треков</div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button 
                type="submit"
                className="bg-white text-black px-6 py-2 rounded-full font-medium hover:scale-105 transition-transform"
              >
                Сохранить
              </button>
              <button 
                type="button"
                onClick={() => setIsCreating(false)}
                className="bg-white/10 text-white px-6 py-2 rounded-full font-medium hover:bg-white/20 transition-colors"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Favorites Card */}
        <div 
          onClick={() => setView('favorites')}
          className="bg-gradient-to-br from-indigo-600 to-purple-800 rounded-[2.5rem] p-6 cursor-pointer hover:scale-[1.02] transition-transform group relative aspect-square flex flex-col justify-end overflow-hidden shadow-2xl"
        >
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 backdrop-blur-2xl rounded-full flex items-center justify-center rotate-12 group-hover:scale-110 transition-transform">
            <Heart className="w-12 h-12 text-white/20 fill-white/10" />
          </div>
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-4">
              <Heart className="w-6 h-6 text-white fill-white" />
            </div>
            <h3 className="text-2xl font-black text-white mb-1 tracking-tight">Любимое</h3>
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Ваша коллекция</p>
          </div>
        </div>

        {/* User Playlists */}
        {userPlaylists.map(playlist => (
          <div 
            key={playlist.id} 
            className="bg-[#1A1A1A] rounded-2xl p-4 group relative hover:bg-[#252525] transition-colors cursor-pointer"
            onClick={() => {
              setSelectedPlaylistId(playlist.id);
              setView('playlist');
            }}
          >
            <div className="aspect-square bg-neutral-800 rounded-xl mb-4 overflow-hidden relative shadow-lg">
              {playlist.cover ? (
                <img src={playlist.cover} alt={playlist.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-700 to-neutral-900">
                  <Play className="w-12 h-12 text-neutral-500" />
                </div>
              )}
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (playlist.tracks.length > 0) {
                    const firstTrack = allTracks.find(t => t.id === playlist.tracks[0]);
                    if (firstTrack) playTrack(firstTrack);
                  }
                }}
                className="absolute bottom-2 right-2 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-black opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all shadow-xl hover:scale-105 hover:bg-green-400"
              >
                <Play className="w-6 h-6 fill-black ml-1" />
              </button>
            </div>
            
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-bold text-white truncate">{playlist.title}</h3>
                <p className="text-sm text-neutral-400 truncate">
                  {playlist.tracks.length} треков • {playlist.type === 'album' ? 'Альбом' : 'Плейлист'}
                </p>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeletePlaylist(playlist.id);
                }}
                className="p-2 text-neutral-500 hover:text-red-500 hover:bg-white/5 rounded-full transition-colors"
                title="Удалить плейлист"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
