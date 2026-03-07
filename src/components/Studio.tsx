import React, { useState, useRef, useMemo } from 'react';
import { 
  Upload, Music, CheckCircle2, AlertCircle, Loader2, Image as ImageIcon, X, 
  FileText, Calendar, LayoutDashboard, ListMusic, TrendingUp, Play, Clock, 
  BarChart3, ChevronRight, Disc, Users, DollarSign, Settings, Search, Filter
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, AreaChart, Area
} from 'recharts';
import { isFutureRelease } from '../utils/date';
import { api } from '../services/api';

interface TrackUploadData {
  file: File;
  title: string;
  coverFile: File | null;
  lyrics: string;
}

export default function Studio() {
  const { user, allTracks, refreshTracks, refreshPlaylists, refreshUser } = useAppContext();
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'analytics' | 'upload'>('overview');
  
  // Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [title, setTitle] = useState('');
  const [isExplicit, setIsExplicit] = useState(false);
  const [releaseType, setReleaseType] = useState<'single' | 'album'>('single');
  const [releaseDate, setReleaseDate] = useState('');
  const [tracksData, setTracksData] = useState<TrackUploadData[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Analytics Data
  const userTracks = useMemo(() => allTracks.filter(t => t.uploaderId === user?.id), [allTracks, user]);
  const totalPlays = useMemo(() => userTracks.reduce((sum, t) => sum + (t.plays || 0), 0), [userTracks]);
  const totalTracks = userTracks.length;
  
  // Mock data for "Plays over time" (since we don't have historical data in DB)
  // In a real app, this would come from an analytics endpoint
  const analyticsData = useMemo(() => {
    const data = [];
    const days = 7;
    for (let i = 0; i < days; i++) {
      data.push({
        name: new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
        plays: Math.floor(Math.random() * (totalPlays / 2)) + 10
      });
    }
    return data;
  }, [totalPlays]);

  const topTracksData = useMemo(() => {
    return [...userTracks]
      .sort((a, b) => (b.plays || 0) - (a.plays || 0))
      .slice(0, 5)
      .map(t => ({
        name: t.title.length > 15 ? t.title.substring(0, 15) + '...' : t.title,
        plays: t.plays || 0,
        fullTitle: t.title
      }));
  }, [userTracks]);

  // Upload Handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    let files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    // If single release, only take the first file
    if (releaseType === 'single') {
      files = [files[0]];
    }
    
    const newTracks = files.map((file: File) => ({
      file,
      title: file.name.replace(/\.[^/.]+$/, ""),
      coverFile: null,
      lyrics: ''
    }));
    
    setTracksData(prev => {
      if (releaseType === 'single') return newTracks;
      const combined = [...prev, ...newTracks];
      return combined.slice(0, 15);
    });
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const updateTrackData = (index: number, field: keyof TrackUploadData, value: any) => {
    setTracksData(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleTrackCoverSelect = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      updateTrackData(index, 'coverFile', e.target.files[0]);
    }
  };

  const removeTrack = (index: number) => {
    setTracksData(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || tracksData.length === 0) return;

    setIsUploading(true);
    setUploadStatus('idle');
    setUploadProgress(10);

    try {
      // Upload main cover
      let mainCoverUrl = '';
      if (coverFile) {
        mainCoverUrl = await api.uploadFile(coverFile);
      } else {
        // Default cover
        mainCoverUrl = `https://picsum.photos/seed/${title}/500/500`;
      }

      setUploadProgress(30);

      const uploadedTrackIds: string[] = [];

      // Process each track
      for (let i = 0; i < tracksData.length; i++) {
        const trackData = tracksData[i];
        
        // Upload audio file
        const audioUrl = await api.uploadFile(trackData.file);
        
        // Upload track cover if exists, else use main cover
        let trackCoverUrl = mainCoverUrl;
        if (trackData.coverFile) {
          trackCoverUrl = await api.uploadFile(trackData.coverFile);
        }

        const newTrack = await api.createTrack({
          title: trackData.title || title,
          artist: user.username,
          cover: trackCoverUrl,
          url: audioUrl,
          uploaderId: user.id,
          isExplicit: isExplicit,
          lyrics: trackData.lyrics,
          releaseDate: releaseDate || undefined,
          status: 'approved'
        });
        
        uploadedTrackIds.push(newTrack.id);

        setUploadProgress(30 + ((i + 1) / tracksData.length) * 60);
      }

      // If album, create playlist
      if (releaseType === 'album' && uploadedTrackIds.length > 0) {
        await api.createPlaylist({
          title: title,
          authorId: user.id,
          cover: mainCoverUrl,
          isPublic: true,
          tracks: uploadedTrackIds,
          type: 'album',
          releaseDate: releaseDate || undefined
        });
      }

      setUploadProgress(100);
      setUploadStatus('success');
      refreshTracks();
      refreshPlaylists();
      refreshUser();
      
      setTimeout(() => {
        setTitle('');
        setTracksData([]);
        setCoverFile(null);
        setReleaseDate('');
        setUploadStatus('idle');
        setUploadProgress(0);
        setActiveTab('content');
      }, 2000);

    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus('error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex h-full bg-[#09090b] text-white font-sans overflow-hidden">
      {/* Studio Sidebar */}
      <div className="w-64 border-r border-white/5 bg-[#09090b] flex flex-col hidden md:flex">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Студия</h1>
              <p className="text-xs text-neutral-500 font-medium">Панель автора</p>
            </div>
          </div>

          <nav className="space-y-1">
            <SidebarItem 
              icon={<LayoutDashboard size={18} />} 
              label="Обзор" 
              active={activeTab === 'overview'} 
              onClick={() => setActiveTab('overview')} 
            />
            <SidebarItem 
              icon={<ListMusic size={18} />} 
              label="Контент" 
              active={activeTab === 'content'} 
              onClick={() => setActiveTab('content')} 
            />
            <SidebarItem 
              icon={<TrendingUp size={18} />} 
              label="Аналитика" 
              active={activeTab === 'analytics'} 
              onClick={() => setActiveTab('analytics')} 
            />
          </nav>
        </div>

        <div className="mt-auto p-6">
          <button 
            onClick={() => setActiveTab('upload')}
            className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-white/5"
          >
            <Upload size={18} />
            Новый релиз
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-[#09090b] relative">
        {/* Mobile Header */}
        <div className="md:hidden p-4 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#09090b]/80 backdrop-blur-xl z-50">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-cyan-500" />
            <span className="font-bold">Студия</span>
          </div>
          <button onClick={() => setActiveTab('upload')} className="bg-white text-black px-4 py-2 rounded-lg text-sm font-bold">
            Загрузить
          </button>
        </div>

        <div className="p-6 md:p-10 max-w-7xl mx-auto pb-64">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  <header>
                    <h2 className="text-3xl font-bold tracking-tight mb-1">Дашборд</h2>
                    <p className="text-neutral-400">С возвращением, {user?.username}. Вот статистика вашей музыки.</p>
                  </header>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard 
                      title="Всего прослушиваний" 
                      value={totalPlays.toLocaleString()} 
                      icon={<Play className="text-cyan-500" />} 
                      trend="+12.5%" 
                    />
                    <StatCard 
                      title="Всего треков" 
                      value={totalTracks.toString()} 
                      icon={<Music className="text-sky-500" />} 
                      trend="+2" 
                    />
                    <StatCard 
                      title="Слушатели" 
                      value={(totalPlays * 0.7).toFixed(0)} 
                      icon={<Users className="text-emerald-500" />} 
                      trend="+5.2%" 
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Chart */}
                    <div className="lg:col-span-2 bg-[#121212] border border-white/5 rounded-2xl p-6 shadow-xl">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-lg">Эффективность</h3>
                        <div className="flex gap-2">
                          <select className="bg-black border border-white/10 rounded-lg text-xs px-3 py-1.5 text-neutral-400 focus:outline-none">
                            <option>Последние 7 дней</option>
                            <option>Последние 30 дней</option>
                          </select>
                        </div>
                      </div>
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={analyticsData}>
                            <defs>
                              <linearGradient id="colorPlays" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="name" stroke="#525252" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                            <YAxis stroke="#525252" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => value >= 1000 ? `${value/1000}k` : value} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                              itemStyle={{ color: '#fff' }}
                            />
                            <Area type="monotone" dataKey="plays" stroke="#22d3ee" strokeWidth={2} fillOpacity={1} fill="url(#colorPlays)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Top Tracks */}
                    <div className="bg-[#121212] border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col">
                      <h3 className="font-bold text-lg mb-6">Топ треков</h3>
                      <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                        {topTracksData.map((track, i) => (
                          <div key={i} className="flex items-center gap-3 group">
                            <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-xs font-bold text-neutral-500 group-hover:bg-cyan-500 group-hover:text-white transition-colors">
                              {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{track.fullTitle}</p>
                              <div className="w-full bg-white/5 h-1.5 rounded-full mt-1.5 overflow-hidden">
                                <div 
                                  className="h-full bg-cyan-500 rounded-full" 
                                  style={{ width: `${(track.plays / (topTracksData[0]?.plays || 1)) * 100}%` }}
                                />
                              </div>
                            </div>
                            <span className="text-xs font-mono text-neutral-400">{track.plays.toLocaleString()}</span>
                          </div>
                        ))}
                        {topTracksData.length === 0 && (
                          <div className="text-center text-neutral-500 py-10">Нет данных</div>
                        )}
                      </div>
                      <button 
                        onClick={() => setActiveTab('content')}
                        className="mt-6 w-full py-2 text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors border-t border-white/5 pt-4"
                      >
                        Смотреть весь контент
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'content' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-3xl font-bold tracking-tight mb-1">Контент</h2>
                      <p className="text-neutral-400">Управление вашими треками и релизами.</p>
                    </div>
                    <div className="flex gap-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                        <input 
                          type="text" 
                          placeholder="Фильтр треков..." 
                          className="bg-[#121212] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-cyan-500 w-64"
                        />
                      </div>
                      <button className="p-2 bg-[#121212] border border-white/10 rounded-lg hover:bg-white/5">
                        <Filter className="w-4 h-4 text-neutral-400" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#121212] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-xs font-bold uppercase tracking-wider text-neutral-500 bg-white/[0.02]">
                          <th className="p-4 pl-6">Трек</th>
                          <th className="p-4">Статус</th>
                          <th className="p-4">Дата</th>
                          <th className="p-4 text-right pr-6">Прослушивания</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userTracks.map(track => (
                          <tr key={track.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                            <td className="p-4 pl-6">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-neutral-900 border border-white/5 overflow-hidden flex-shrink-0">
                                  {track.cover ? <img src={track.cover} alt="" className="w-full h-full object-cover" /> : <Music className="w-5 h-5 m-2.5 text-neutral-600" />}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-white truncate">{track.title}</p>
                                  <p className="text-xs text-neutral-500 truncate">{track.artist}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              {isFutureRelease(track.releaseDate) ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                  <Clock className="w-3 h-3" /> Запланировано
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                  <CheckCircle2 className="w-3 h-3" /> Опубликовано
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-sm text-neutral-400">
                              {track.releaseDate ? new Date(track.releaseDate).toLocaleDateString() : new Date(track.uploadedAt).toLocaleDateString()}
                            </td>
                            <td className="p-4 pr-6 text-right font-mono text-sm text-neutral-300">
                              {(track.plays || 0).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                        {userTracks.length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-12 text-center text-neutral-500">
                              Треки не найдены. <button onClick={() => setActiveTab('upload')} className="text-cyan-400 hover:underline">Загрузить первый трек</button>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'analytics' && (
                <div className="space-y-8">
                  <header>
                    <h2 className="text-3xl font-bold tracking-tight mb-1">Аналитика</h2>
                    <p className="text-neutral-400">Подробная статистика ваших треков.</p>
                  </header>

                  {/* Main Chart */}
                  <div className="bg-[#121212] border border-white/5 rounded-2xl p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-bold text-lg">Прослушивания</h3>
                      <div className="flex gap-2">
                        <select className="bg-black border border-white/10 rounded-lg text-xs px-3 py-1.5 text-neutral-400 focus:outline-none">
                          <option>Последние 7 дней</option>
                          <option>Последние 30 дней</option>
                        </select>
                      </div>
                    </div>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analyticsData}>
                          <defs>
                            <linearGradient id="colorPlays" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                          <XAxis dataKey="name" stroke="#525252" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                          <YAxis stroke="#525252" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => value >= 1000 ? `${value/1000}k` : value} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                            itemStyle={{ color: '#fff' }}
                          />
                          <Area type="monotone" dataKey="plays" stroke="#22d3ee" strokeWidth={2} fillOpacity={1} fill="url(#colorPlays)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Track Stats List */}
                  <div className="bg-[#121212] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                    <div className="p-6 border-b border-white/5">
                      <h3 className="font-bold text-lg">Статистика по трекам</h3>
                    </div>
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-xs font-bold uppercase tracking-wider text-neutral-500 bg-white/[0.02]">
                          <th className="p-4 pl-6">Трек</th>
                          <th className="p-4 text-right pr-6">Прослушивания</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userTracks.map((track, i) => (
                          <tr key={track.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                            <td className="p-4 pl-6">
                              <div className="flex items-center gap-4">
                                <span className="text-neutral-500 font-mono text-xs w-6">{i + 1}</span>
                                <div className="min-w-0">
                                  <p className="font-medium text-white truncate">{track.title}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 pr-6 text-right font-mono text-sm text-neutral-300">
                              {(track.plays || 0).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'upload' && (
                <div className="max-w-3xl mx-auto">
                  <div className="mb-8">
                    <button onClick={() => setActiveTab('overview')} className="text-neutral-500 hover:text-white mb-4 flex items-center gap-1 text-sm">
                      <ChevronRight className="w-4 h-4 rotate-180" /> Назад в дашборд
                    </button>
                    <h2 className="text-3xl font-bold tracking-tight mb-2">Новый релиз</h2>
                    <p className="text-neutral-400">Дистрибуция вашей музыки по всему миру.</p>
                  </div>

                  <form onSubmit={handleUpload} className="space-y-8">
                    {/* Step 1: Release Info */}
                    <div className="bg-[#121212] border border-white/5 rounded-2xl p-6 md:p-8 shadow-xl">
                      <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-500 flex items-center justify-center text-xs font-bold border border-cyan-500/20">1</span>
                        Детали релиза
                      </h3>
                      
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <button 
                            type="button" 
                            onClick={() => { setReleaseType('single'); setTracksData([]); }}
                            className={`p-4 rounded-xl border text-left transition-all ${releaseType === 'single' ? 'bg-cyan-500/10 border-cyan-500 text-white' : 'bg-black border-white/10 text-neutral-400 hover:border-white/20'}`}
                          >
                            <Disc className={`w-6 h-6 mb-3 ${releaseType === 'single' ? 'text-cyan-500' : 'text-neutral-500'}`} />
                            <div className="font-bold text-sm">Сингл</div>
                            <div className="text-xs opacity-60 mt-1">1 трек</div>
                          </button>
                          <button 
                            type="button" 
                            onClick={() => { setReleaseType('album'); setTracksData([]); }}
                            className={`p-4 rounded-xl border text-left transition-all ${releaseType === 'album' ? 'bg-cyan-500/10 border-cyan-500 text-white' : 'bg-black border-white/10 text-neutral-400 hover:border-white/20'}`}
                          >
                            <ListMusic className={`w-6 h-6 mb-3 ${releaseType === 'album' ? 'text-cyan-500' : 'text-neutral-500'}`} />
                            <div className="font-bold text-sm">Альбом / EP</div>
                            <div className="text-xs opacity-60 mt-1">2+ трека</div>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Название</label>
                            <input 
                              type="text" 
                              value={title} 
                              onChange={e => setTitle(e.target.value)} 
                              className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                              placeholder={releaseType === 'single' ? "Название трека" : "Название альбома"}
                              required 
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Дата релиза</label>
                            <input 
                              type="date" 
                              value={releaseDate} 
                              onChange={e => setReleaseDate(e.target.value)} 
                              className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors [color-scheme:dark]" 
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Обложка</label>
                          <div className="flex items-center gap-6">
                            <div className="w-32 h-32 rounded-xl bg-black border border-white/10 overflow-hidden flex-shrink-0 relative group">
                              {coverFile ? (
                                <img src={URL.createObjectURL(coverFile)} alt="Cover" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageIcon className="w-8 h-8 text-neutral-600" />
                                </div>
                              )}
                              <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <Upload className="w-6 h-6 text-white" />
                                <input type="file" accept="image/*" onChange={e => setCoverFile(e.target.files?.[0] || null)} className="hidden" />
                              </label>
                            </div>
                            <div className="text-sm text-neutral-500">
                              <p className="mb-2">Рекомендуется: 3000x3000px, JPG или PNG.</p>
                              <button 
                                type="button" 
                                onClick={() => document.querySelector<HTMLInputElement>('input[type="file"][accept="image/*"]')?.click()}
                                className="text-cyan-400 hover:text-cyan-300 font-medium"
                              >
                                Загрузить изображение
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Step 2: Audio */}
                    <div className="bg-[#121212] border border-white/5 rounded-2xl p-6 md:p-8 shadow-xl">
                      <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-500 flex items-center justify-center text-xs font-bold border border-cyan-500/20">2</span>
                        Аудио и метаданные
                      </h3>

                      <div className="space-y-6">
                        <div 
                          onClick={() => { 
                            if (releaseType === 'single' && tracksData.length >= 1) return;
                            if (tracksData.length < 15) fileInputRef.current?.click();
                          }}
                          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${(releaseType === 'single' && tracksData.length >= 1) || tracksData.length >= 15 ? 'opacity-50 cursor-not-allowed border-white/5' : 'cursor-pointer border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/5'}`}
                        >
                          <input type="file" ref={fileInputRef} accept="audio/*" multiple={releaseType === 'album'} onChange={handleFileSelect} className="hidden" />
                          <Upload className="w-8 h-8 text-neutral-500 mx-auto mb-4" />
                          <h4 className="font-bold text-white mb-1">
                            {tracksData.length > 0 ? (releaseType === 'single' ? 'Трек загружен' : 'Добавить еще треки') : 'Загрузить аудиофайлы'}
                          </h4>
                          <p className="text-sm text-neutral-500">WAV, FLAC, MP3 (Макс. {releaseType === 'single' ? '1 трек' : '15 треков'})</p>
                        </div>

                        {tracksData.length > 0 && (
                          <div className="space-y-4">
                            {tracksData.map((track, idx) => (
                              <div key={idx} className="bg-black/50 rounded-xl p-4 border border-white/5">
                                <div className="flex items-start gap-4">
                                  <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-xs font-mono text-neutral-500 mt-2">
                                    {idx + 1}
                                  </div>
                                  <div className="flex-1 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <input 
                                        type="text" 
                                        value={track.title} 
                                        onChange={(e) => updateTrackData(idx, 'title', e.target.value)} 
                                        className="bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                                        placeholder="Название трека"
                                      />
                                      <div className="flex items-center gap-2 text-sm text-neutral-500 bg-black border border-white/10 rounded-lg px-3 py-2">
                                        <FileText className="w-4 h-4" />
                                        <span className="truncate">{track.file.name}</span>
                                      </div>
                                    </div>
                                    <textarea 
                                      value={track.lyrics} 
                                      onChange={(e) => updateTrackData(idx, 'lyrics', e.target.value)} 
                                      placeholder="Текст песни (опционально)" 
                                      className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 min-h-[60px] resize-y"
                                    />
                                  </div>
                                  <button 
                                    type="button" 
                                    onClick={() => removeTrack(idx)} 
                                    className="p-2 text-neutral-500 hover:text-red-500 transition-colors"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-3 pt-2">
                          <input 
                            type="checkbox" 
                            id="explicit" 
                            checked={isExplicit} 
                            onChange={e => setIsExplicit(e.target.checked)} 
                            className="w-4 h-4 rounded border-white/10 bg-black accent-cyan-500" 
                          />
                          <label htmlFor="explicit" className="text-sm font-medium text-neutral-300">
                            Содержит ненормативную лексику
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <button 
                        type="submit" 
                        disabled={isUploading || tracksData.length === 0 || !title} 
                        className="bg-white text-black px-8 py-3 rounded-xl font-bold hover:bg-neutral-200 transition-all disabled:opacity-50 disabled:hover:bg-white flex items-center gap-2 shadow-lg shadow-white/10"
                      >
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        {isUploading ? 'Публикация...' : 'Опубликовать релиз'}
                      </button>
                    </div>

                    <AnimatePresence>
                      {uploadStatus !== 'idle' && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          exit={{ opacity: 0, y: -10 }}
                          className={`p-4 rounded-xl flex items-center gap-3 ${uploadStatus === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border border-red-500/20 text-red-500'}`}
                        >
                          {uploadStatus === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                          <span className="font-medium">{uploadStatus === 'success' ? 'Релиз успешно опубликован!' : 'Ошибка загрузки. Попробуйте снова.'}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </form>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${active ? 'bg-white/10 text-white' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
    >
      <span className={active ? 'text-cyan-400' : 'text-neutral-500'}>{icon}</span>
      {label}
    </button>
  );
}

function StatCard({ title, value, icon, trend }: { title: string, value: string, icon: React.ReactNode, trend: string }) {
  return (
    <div className="bg-[#121212] border border-white/5 rounded-2xl p-6 shadow-xl hover:border-white/10 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-white/5 rounded-lg border border-white/5">{icon}</div>
        <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">{trend}</span>
      </div>
      <p className="text-neutral-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
      <h3 className="text-2xl font-black tracking-tight">{value}</h3>
    </div>
  );
}
