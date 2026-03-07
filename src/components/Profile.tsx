import React, { useRef, useState } from 'react';
import { Settings, LogOut, Camera, Upload, Plus, Music, Trash2, Mic2, Clock } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { isFutureRelease } from '../utils/date';

export default function Profile() {
  const { user, logout, allTracks, setView, refreshUser, refreshTracks, refreshPlaylists, theme, setTheme, accentColor, setAccentColor, playTrack, currentTrack, isPlaying, togglePlay } = useAppContext();
  const [isEditing, setIsEditing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const accentColors = [
    { id: 'cyan', color: 'bg-cyan-500' },
    { id: 'sky', color: 'bg-sky-500' },
    { id: 'blue', color: 'bg-blue-500' },
    { id: 'indigo', color: 'bg-indigo-500' },
    { id: 'purple', color: 'bg-purple-500' },
    { id: 'pink', color: 'bg-pink-500' },
  ];

  const userTracks = allTracks.filter(t => t.uploaderId === user.id);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append(type, file);

    try {
      const res = await fetch(`/api/users/${user.id}/profile`, {
        method: 'POST',
        body: formData
      });
      
      if (res.ok) {
        refreshUser();
      }
    } catch (error) {
      console.error('Failed to upload image', error);
    }
  };

  const handleDeleteTrack = async (trackId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот трек? Это действие нельзя отменить.')) return;
    
    try {
      const res = await fetch(`/api/tracks/${trackId}`, { method: 'DELETE' });
      if (res.ok) {
        refreshTracks();
        refreshUser();
      }
    } catch (e) {
      console.error("Failed to delete track", e);
    }
  };

  return (
    <div className="h-full overflow-y-auto pb-32">
      {/* Cover Image */}
      <div className="relative h-64 md:h-80 w-full bg-neutral-800 group">
        {user.cover ? (
          <img src={user.cover} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-sky-900 to-[#121212]"></div>
        )}
        
        <button 
          onClick={() => coverInputRef.current?.click()}
          className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-md transition-all opacity-0 group-hover:opacity-100"
        >
          <Camera className="w-5 h-5" />
        </button>
        <input 
          type="file" 
          ref={coverInputRef} 
          onChange={(e) => handleImageUpload(e, 'cover')} 
          className="hidden" 
          accept="image/*"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent"></div>
      </div>

      <div className="px-6 md:px-8 -mt-20 relative z-10">
        <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
          {/* Avatar */}
          <div className="relative group">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-[#121212] overflow-hidden bg-neutral-800 shadow-2xl">
              {user.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-cyan-600 text-4xl font-bold text-white">
                  {user.username[0].toUpperCase()}
                </div>
              )}
            </div>
            <button 
              onClick={() => avatarInputRef.current?.click()}
              className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <Camera className="w-8 h-8 text-white" />
            </button>
            <input 
              type="file" 
              ref={avatarInputRef} 
              onChange={(e) => handleImageUpload(e, 'avatar')} 
              className="hidden" 
              accept="image/*"
            />
          </div>

          {/* Info */}
          <div className="flex-1 mb-2">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">{user.username}</h1>
            <div className="flex items-center gap-4 text-neutral-400 text-sm">
              <span>{user.trackCount} треков</span>
              <span>•</span>
              <span>ID: {user.id.slice(0, 8)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={`p-3 border ${theme === 'light' ? 'border-black/10 text-black hover:bg-black/5' : 'border-white/20 text-white hover:bg-white/10'} rounded-full transition-colors`}
              title="Настройки"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setView('studio')}
              className={`flex-1 md:flex-none ${theme === 'light' ? 'bg-black text-white hover:bg-neutral-800' : 'bg-white text-black hover:bg-neutral-200'} px-6 py-3 rounded-full font-bold transition-colors flex items-center justify-center gap-2`}
            >
              <Mic2 className="w-4 h-4" />
              Студия
            </button>
            <button 
              onClick={logout}
              className={`p-3 border ${theme === 'light' ? 'border-black/10 text-black hover:bg-black/5' : 'border-white/20 text-white hover:bg-white/10'} rounded-full transition-colors`}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className={`mt-8 p-6 rounded-2xl border ${theme === 'light' ? 'bg-black/5 border-black/5' : 'bg-white/5 border-white/5'} backdrop-blur-xl`}>
            <h2 className={`text-xl font-bold mb-6 ${theme === 'light' ? 'text-black' : 'text-white'}`}>Настройки оформления</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Theme Toggle */}
              <div>
                <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-4">Тема приложения</h3>
                <div className="flex p-1 bg-black/20 rounded-xl w-fit">
                  <button 
                    onClick={() => setTheme('dark')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${theme === 'dark' ? 'bg-white text-black shadow-lg' : 'text-neutral-400 hover:text-white'}`}
                  >
                    Темная
                  </button>
                  <button 
                    onClick={() => setTheme('light')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${theme === 'light' ? 'bg-white text-black shadow-lg' : 'text-neutral-400 hover:text-white'}`}
                  >
                    Светлая
                  </button>
                </div>
              </div>

              {/* Accent Color Picker */}
              <div>
                <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-4">Акцентный цвет</h3>
                <div className="flex flex-wrap gap-3">
                  {accentColors.map((color) => (
                    <button 
                      key={color.id}
                      onClick={() => setAccentColor(color.id)}
                      className={`w-10 h-10 rounded-full ${color.color} transition-all ${accentColor === color.id ? 'ring-4 ring-white/30 scale-110 shadow-lg' : 'hover:scale-105 opacity-70 hover:opacity-100'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tracks Section */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-xl font-bold ${theme === 'light' ? 'text-black' : 'text-white'}`}>Мои треки</h2>
            <button 
              onClick={() => setView('studio')}
              className="text-cyan-400 hover:text-cyan-300 text-sm font-medium flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Управлять в Студии
            </button>
          </div>

          {userTracks.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              {userTracks.map((track, i) => {
                const isActive = currentTrack?.id === track.id;
                return (
                <div 
                  key={track.id}
                  onClick={() => {
                    if (isFutureRelease(track.releaseDate)) return;
                    isActive ? togglePlay() : playTrack(track)
                  }}
                  className={`flex items-center gap-4 p-3 rounded-xl hover:bg-black/5 transition-colors group cursor-pointer ${isActive ? 'bg-black/5' : ''} ${isFutureRelease(track.releaseDate) ? 'opacity-50 cursor-not-allowed hover:bg-transparent' : ''}`}
                >
                  <span className={`w-6 text-center font-mono text-sm ${isActive ? 'text-cyan-500' : 'text-neutral-500'}`}>
                    {isFutureRelease(track.releaseDate) ? <Clock className="w-4 h-4 mx-auto" /> : i + 1}
                  </span>
                  <div className="w-12 h-12 bg-neutral-800 rounded-lg overflow-hidden relative">
                    {track.cover ? (
                      <img src={track.cover} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-neutral-700 flex items-center justify-center">
                        <Music className="w-5 h-5 text-neutral-500" />
                      </div>
                    )}
                    {isActive && isPlaying && !isFutureRelease(track.releaseDate) && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-medium truncate ${isActive ? 'text-cyan-500' : 'text-white'}`}>{track.title}</h3>
                      {isFutureRelease(track.releaseDate) && (
                        <span className="text-[10px] font-bold text-pink-500 uppercase tracking-wider bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20">
                          Скоро
                        </span>
                      )}
                    </div>
                    <p className="text-neutral-400 text-sm truncate">{track.artist}</p>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTrack(track.id);
                    }}
                    className="p-2 text-neutral-500 hover:text-red-500 hover:bg-black/5 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                    title="Удалить трек"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              )})}
            </div>
          ) : (
            <div className={`text-center py-12 border-2 border-dashed ${theme === 'light' ? 'border-black/10' : 'border-neutral-800'} rounded-2xl`}>
              <p className="text-neutral-500 mb-4">У вас пока нет загруженных треков</p>
              <button 
                onClick={() => setView('studio')}
                className={`${theme === 'light' ? 'text-black' : 'text-white'} font-medium hover:underline`}
              >
                Загрузить в Студии
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
