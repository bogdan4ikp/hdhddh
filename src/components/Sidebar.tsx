import React from 'react';
import { Home, Compass, User, Mic2, PlusSquare, Heart, Music2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function Sidebar() {
  const { currentView, setView, user, theme } = useAppContext();

  const navItems = [
    { id: 'home', icon: Home, label: 'Главная' },
    { id: 'recommendations', icon: Compass, label: 'Рекомендации' },
    { id: 'profile', icon: User, label: 'Профиль' },
  ];

  return (
    <aside className={`hidden md:flex w-64 ${theme === 'light' ? 'bg-white border-black/5' : 'bg-[#121212] border-white/5'} h-full flex-col border-r z-20 transition-colors`}>
      <div className="p-6 flex items-center gap-3 cursor-pointer" onClick={() => setView('home')}>
        <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-900/20">
          <Music2 className="w-5 h-5 text-white" />
        </div>
        <h1 className={`font-display text-xl font-bold tracking-tight ${theme === 'light' ? 'text-black' : 'text-white'}`}>
          MusicApp
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-6 overflow-y-auto pb-24">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  isActive 
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' 
                    : `${theme === 'light' ? 'text-neutral-500 hover:text-black hover:bg-black/5' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-neutral-500 group-hover:text-white'}`} />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className={`pt-6 border-t ${theme === 'light' ? 'border-black/5' : 'border-white/5'}`}>
          <h3 className="px-4 text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Моя медиатека</h3>
          <div className="space-y-1">
            <button 
              onClick={() => setView('library')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors group ${
                currentView === 'library' ? (theme === 'light' ? 'bg-black/5 text-black' : 'bg-white/5 text-white') : `${theme === 'light' ? 'text-neutral-500 hover:text-black hover:bg-black/5' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`
              }`}
            >
              <div className="w-6 h-6 rounded bg-gradient-to-br from-neutral-600 to-neutral-800 flex items-center justify-center shadow-md opacity-70 group-hover:opacity-100 transition-opacity">
                <Music2 className="w-3 h-3 text-white" />
              </div>
              Медиатека
            </button>
            <button 
              onClick={() => setView('favorites')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors group ${
                currentView === 'favorites' ? (theme === 'light' ? 'bg-black/5 text-black' : 'bg-white/5 text-white') : `${theme === 'light' ? 'text-neutral-500 hover:text-black hover:bg-black/5' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`
              }`}
            >
              <div className="w-6 h-6 rounded bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-md opacity-70 group-hover:opacity-100 transition-opacity">
                <Heart className="w-3 h-3 text-white fill-white" />
              </div>
              Любимое
            </button>
          </div>
        </div>
        
        {user && (
          <div className="mt-auto pt-6 px-4">
            <div 
              onClick={() => setView('profile')}
              className={`flex items-center gap-3 p-3 rounded-xl ${theme === 'light' ? 'bg-black/5 hover:bg-black/10 border-black/5' : 'bg-white/5 hover:bg-white/10 border-white/5'} border cursor-pointer transition-colors`}
            >
              <div className="w-10 h-10 rounded-full bg-neutral-700 overflow-hidden border border-white/10">
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-purple-600 text-white font-bold">
                    {user.username[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium truncate ${theme === 'light' ? 'text-black' : 'text-white'}`}>{user.username}</div>
                <div className="text-xs text-neutral-500 truncate">{user.trackCount} треков</div>
              </div>
            </div>
          </div>
        )}
      </nav>
    </aside>
  );
}
