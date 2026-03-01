import React from 'react';
import { Home, Search, Library, User, Mic2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useAppContext } from '../context/AppContext';

export default function MobileNav() {
  const { currentView, setView, theme } = useAppContext();

  const navItems = [
    { id: 'home', icon: Home, label: 'Главная' },
    { id: 'search', icon: Search, label: 'Поиск' },
    { id: 'library', icon: Library, label: 'Медиатека' },
    { id: 'profile', icon: User, label: 'Профиль' },
  ] as const;

  return (
    <div className={`md:hidden fixed bottom-0 left-0 right-0 h-16 ${theme === 'light' ? 'bg-white/80 border-black/5 text-black' : 'bg-white/5 border-white/10 text-white'} backdrop-blur-2xl border-t flex items-center justify-around z-50 pb-safe transition-colors`}>
      {navItems.map(({ id, icon: Icon, label }) => {
        const isActive = currentView === id;
        return (
          <button 
            key={id}
            onClick={() => {
              if (id === 'search') {
                setView('home');
                setTimeout(() => {
                  const searchInput = document.getElementById('search-input');
                  if (searchInput) searchInput.focus();
                }, 100);
              } else {
                setView(id);
              }
            }}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 ${isActive ? (theme === 'light' ? 'text-black' : 'text-white') : 'text-neutral-400 hover:text-neutral-300'}`}
          >
            <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
