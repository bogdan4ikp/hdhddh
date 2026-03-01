import React, { useState, useEffect } from 'react';
import { Upload, Music, CheckCircle2, Clock, AlertCircle, Plus, Trash2, ShieldCheck, Zap, Play, ListMusic } from 'lucide-react';
import { useAppContext, Track, Playlist } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { saveTrackToDB, deleteTrackFromDB } from '../utils/audioDb';

export default function Studio() {
  const { user, refreshTracks, refreshUser, allTracks, playlists, refreshPlaylists } = useAppContext();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [trackFiles, setTrackFiles] = useState<File[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [isExplicit, setIsExplicit] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [releaseType, setReleaseType] = useState<'single' | 'album'>('single');

  const userTracks = allTracks.filter(t => t.uploaderId === user?.id);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || trackFiles.length === 0 || !title) return;

    setIsUploading(true);
    setUploadProgress(10);

    const coverDataUrl = await new Promise<string | null>((resolve) => {
      if (!coverFile) return resolve(null);
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(coverFile);
    });

    setUploadProgress(30);

    try {
      const uploadedTrackIds: string[] = [];

      for (let i = 0; i < trackFiles.length; i++) {
        const file = trackFiles[i];
        const trackId = 'track-' + Date.now() + '-' + i;
        
        const newTrack: Track = {
          id: trackId,
          title: releaseType === 'album' ? file.name.replace(/\.[^/.]+$/, "") : title,
          artist: artist || user.username,
          cover: coverDataUrl || '',
          url: '', 
          uploaderId: user.id,
          plays: 0,
          isExplicit: isExplicit,
          status: 'approved',
          uploadedAt: new Date().toISOString(),
          fileBlob: file
        };

        await saveTrackToDB(newTrack);
        uploadedTrackIds.push(trackId);
        setUploadProgress(30 + Math.floor((i + 1) / trackFiles.length * 50));
      }

      // If it's an album/playlist, create a playlist wrapper
      if (releaseType === 'album' && uploadedTrackIds.length > 0) {
        const newPlaylist: Playlist = {
          id: 'playlist-' + Date.now(),
          title: title,
          authorId: user.id,
          cover: coverDataUrl,
          isPublic: true,
          tracks: uploadedTrackIds,
          createdAt: new Date().toISOString(),
          type: 'album'
        };
        const updatedPlaylists = [...playlists, newPlaylist];
        localStorage.setItem('playlists', JSON.stringify(updatedPlaylists));
        refreshPlaylists();
      }

      setUploadProgress(100);
      setStatusMessage({ type: 'success', text: releaseType === 'album' ? 'Альбом успешно загружен!' : 'Трек успешно загружен!' });
      setTitle('');
      setArtist('');
      setTrackFiles([]);
      setCoverFile(null);
      setIsExplicit(false);
      refreshTracks(); 
      refreshUser();
      
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setStatusMessage(null);
      }, 3000);

    } catch (e) {
      console.error("Failed to save track", e);
      setStatusMessage({ type: 'error', text: 'Ошибка сохранения' });
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    if (!confirm('Удалить этот трек?')) return;

    try {
        await deleteTrackFromDB(id);
        refreshTracks();
        refreshUser();
    } catch (e) {
        console.error("Failed to delete track", e);
    }
  };

  return (
    <div className="min-h-full pb-32 overflow-x-hidden">
      {/* Studio Header Background */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-600/20 via-purple-900/40 to-[#121212]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-30">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-pink-500/20 via-transparent to-transparent blur-3xl animate-pulse"></div>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/10 backdrop-blur-xl p-4 rounded-3xl border border-white/20 mb-6 shadow-2xl"
          >
            <Zap className="w-10 h-10 text-pink-500 fill-pink-500" />
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tighter mb-2">Студия Vibe</h1>
          <p className="text-white/60 text-lg font-medium">Ваш центр управления творчеством</p>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] to-transparent"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-10 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Stats & Upload */}
          <div className="lg:col-span-4 space-y-8">
            {/* Stats Card */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-3xl bg-pink-500 flex items-center justify-center shadow-lg shadow-pink-500/20">
                  <Music className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="text-4xl font-black text-white">{userTracks.length}</div>
                  <div className="text-neutral-400 text-xs font-bold uppercase tracking-widest">Треков в сети</div>
                </div>
              </div>
            </div>

            {/* Upload Form */}
            <div className="bg-[#1A1A1A] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                <Upload className="w-6 h-6 text-pink-500" />
                Новая публикация
              </h2>

              <form onSubmit={handleUpload} className="space-y-6">
                <div className="flex gap-4 p-1 bg-white/5 rounded-2xl border border-white/10 mb-6">
                  <button
                    type="button"
                    onClick={() => setReleaseType('single')}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${releaseType === 'single' ? 'bg-pink-500 text-white shadow-lg' : 'text-neutral-400 hover:text-white'}`}
                  >
                    Сингл
                  </button>
                  <button
                    type="button"
                    onClick={() => setReleaseType('album')}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${releaseType === 'album' ? 'bg-pink-500 text-white shadow-lg' : 'text-neutral-400 hover:text-white'}`}
                  >
                    <ListMusic className="w-4 h-4" />
                    Альбом / Плейлист
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-black text-neutral-500 mb-2 uppercase tracking-[0.2em]">
                    {releaseType === 'album' ? 'Название альбома' : 'Название'}
                  </label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all placeholder:text-neutral-600"
                    placeholder={releaseType === 'album' ? 'Мой новый альбом' : 'Название трека'}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-neutral-500 mb-2 uppercase tracking-[0.2em]">Артист</label>
                  <input 
                    type="text" 
                    value={artist}
                    onChange={e => setArtist(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all placeholder:text-neutral-600"
                    placeholder={user?.username || "Имя"}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <label className={`flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-3xl cursor-pointer transition-all ${trackFiles.length > 0 ? 'border-pink-500 bg-pink-500/5' : 'border-white/10 hover:border-white/20 bg-white/5'}`}>
                    <Music className={`w-6 h-6 mb-2 ${trackFiles.length > 0 ? 'text-pink-500' : 'text-neutral-500'}`} />
                    <span className="text-[10px] font-black uppercase tracking-tighter text-center px-2 truncate w-full">
                      {trackFiles.length > 0 ? `Выбрано: ${trackFiles.length}` : 'Аудио'}
                    </span>
                    <input type="file" accept="audio/*" multiple={releaseType === 'album'} onChange={e => setTrackFiles(Array.from(e.target.files || []).slice(0, 30))} className="hidden" />
                  </label>

                  <label className={`flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-3xl cursor-pointer transition-all overflow-hidden ${coverFile ? 'border-pink-500 bg-pink-500/5' : 'border-white/10 hover:border-white/20 bg-white/5'}`}>
                    {coverFile ? (
                      <img src={URL.createObjectURL(coverFile)} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Plus className="w-6 h-6 mb-2 text-neutral-500" />
                        <span className="text-[10px] font-black uppercase">Обложка</span>
                      </>
                    )}
                    <input type="file" accept="image/*" onChange={e => setCoverFile(e.target.files?.[0] || null)} className="hidden" />
                  </label>
                </div>

                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                  <input 
                    type="checkbox" 
                    id="explicit"
                    checked={isExplicit}
                    onChange={e => setIsExplicit(e.target.checked)}
                    className="w-5 h-5 rounded-lg border-white/20 bg-black text-pink-500 focus:ring-pink-500"
                  />
                  <label htmlFor="explicit" className="text-sm font-bold text-white cursor-pointer select-none">
                    Explicit (18+)
                  </label>
                </div>

                <button 
                  type="submit"
                  disabled={isUploading || trackFiles.length === 0 || !title}
                  className={`w-full py-5 rounded-3xl font-black text-lg transition-all shadow-xl ${
                    isUploading || trackFiles.length === 0 || !title 
                      ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed' 
                      : 'bg-pink-600 text-white hover:bg-pink-500 hover:scale-[1.02] active:scale-95 shadow-pink-600/20'
                  }`}
                >
                  {isUploading ? `Загрузка ${uploadProgress}%` : 'Опубликовать'}
                </button>

                <AnimatePresence>
                  {statusMessage && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-3 ${
                        statusMessage.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                      }`}
                    >
                      {statusMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                      {statusMessage.text}
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </div>
          </div>

          {/* Right Column: Track List */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-white tracking-tight">Ваши треки</h2>
              <div className="flex items-center gap-2 text-neutral-500 text-sm font-bold">
                <ShieldCheck className="w-4 h-4" />
                Безопасная загрузка
              </div>
            </div>

            <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
              {userTracks.length > 0 ? userTracks.map((track) => (
                <div 
                  key={track.id}
                  className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-[2.5rem] p-5 md:p-6 flex items-center gap-4 md:gap-6 group transition-all backdrop-blur-md"
                >
                  <div className="w-20 h-20 md:w-24 md:h-24 bg-neutral-800 rounded-3xl overflow-hidden flex-shrink-0 shadow-2xl relative">
                    {track.cover ? (
                      <img src={track.cover} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-neutral-700">
                        <Music className="w-8 md:w-10 h-8 md:h-10 text-neutral-500" />
                      </div>
                    )}
                    {track.isExplicit && (
                      <div className="absolute top-2 right-2 bg-black/80 text-white text-[8px] md:text-[10px] font-black px-1.5 py-0.5 rounded-md border border-white/10">E</div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-1 md:mb-2">
                      <h3 className="text-lg md:text-2xl font-bold text-white truncate max-w-[150px] md:max-w-md">{track.title}</h3>
                      {track.status === 'pending' && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 text-[8px] md:text-[10px] font-black uppercase tracking-widest border border-yellow-500/20">
                          <Clock className="w-2.5 h-2.5" />
                          Проверка
                        </span>
                      )}
                      {track.status === 'approved' && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[8px] md:text-[10px] font-black uppercase tracking-widest border border-green-500/20">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          В эфире
                        </span>
                      )}
                    </div>
                    <p className="text-neutral-400 font-bold text-sm md:text-lg mb-2 md:mb-4">{track.artist}</p>
                    <div className="flex items-center gap-4 md:gap-6 text-[10px] md:text-xs text-neutral-500 font-black uppercase tracking-[0.15em]">
                      <span className="flex items-center gap-1">
                        <Play className="w-2.5 md:w-3 h-2.5 md:h-3 fill-current" />
                        {track.plays || 0}
                      </span>
                      <span>•</span>
                      <span>{new Date(track.uploadedAt!).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleDelete(track.id)}
                    className="p-3 md:p-5 text-neutral-600 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-5 md:w-7 h-5 md:h-7" />
                  </button>
                </div>
              )) : (
                <div className="text-center py-24 md:py-32 bg-white/5 border-2 border-dashed border-white/10 rounded-[3.5rem] backdrop-blur-sm">
                  <div className="w-20 h-20 md:w-24 md:h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Music className="w-8 md:w-10 h-8 md:h-10 text-neutral-700" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Здесь пока пусто</h3>
                  <p className="text-neutral-500 font-medium">Загрузите свой первый трек в Студии Vibe</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
