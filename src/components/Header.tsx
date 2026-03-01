import React from 'react';
import { Search, Bell, User } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function Header() {
  const { setView, searchQuery, setSearchQuery, theme } = useAppContext();
  
  return (
    <header className={`h-16 flex items-center justify-between px-4 md:px-8 z-20 sticky top-0 ${theme === 'light' ? 'bg-white/90 border-black/5' : 'bg-[#121212]/90 border-white/5'} backdrop-blur-md border-b transition-colors`}>
      <div className="relative w-full max-w-md mr-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
        <input 
          type="text" 
          placeholder="Поиск треков, артистов..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setView('search')}
          className={`w-full ${theme === 'light' ? 'bg-black/5 text-black placeholder-neutral-500' : 'bg-[#2a2a2a] text-white placeholder-neutral-400'} border-none rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 ${theme === 'light' ? 'focus:ring-black/10' : 'focus:ring-white/20'} transition-all`}
        />
      </div>
      <div className="flex items-center gap-3 md:gap-4">
        <button className="hidden md:flex w-10 h-10 rounded-full bg-[#2a2a2a] items-center justify-center text-neutral-400 hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
        </button>
        <button 
          onClick={() => setView('profile')}
          className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white flex items-center justify-center text-black hover:scale-105 transition-transform"
        >
          <User className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      </div>
    </header>
  );
}
