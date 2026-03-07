import React from 'react';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import Player from './components/Player';
import MobileNav from './components/MobileNav';
import Recommendations from './components/Recommendations';
import Profile from './components/Profile';
import Auth from './components/Auth';
import Studio from './components/Studio';
import Favorites from './components/Favorites';
import Library from './components/Library';
import ArtistProfile from './components/ArtistProfile';
import Search from './components/Search';
import PlaylistView from './components/PlaylistView';
import SetupProfile from './components/SetupProfile';
import { AppProvider, useAppContext } from './context/AppContext';
import { motion, AnimatePresence } from 'motion/react';

function AppContent() {
  const { currentView, user, selectedArtistId, setSelectedArtistId, setView } = useAppContext();

  if (!user) {
    return <Auth />;
  }

  if (user && !user.username) {
    return <SetupProfile />;
  }

  return (
    <div className="flex h-screen bg-[#121212] text-white font-sans overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden relative z-10">
        <div className="flex-1 relative h-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedArtistId ? `artist-${selectedArtistId}` : currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="h-full w-full"
            >
              {selectedArtistId ? (
                <ArtistProfile 
                  artistId={selectedArtistId} 
                  onBack={() => setSelectedArtistId(null)} 
                />
              ) : (
                <>
                  {currentView === 'home' && <MainContent />}
                  {currentView === 'search' && <Search />}
                  {currentView === 'recommendations' && <Recommendations />}
                  {currentView === 'profile' && <Profile />}
                  {currentView === 'favorites' && <Favorites />}
                  {currentView === 'library' && <Library />}
                  {currentView === 'playlist' && <PlaylistView />}
                  {currentView === 'collection' && <div className="p-8 text-center text-neutral-500">Коллекция пуста</div>}
                  {currentView === 'studio' && <Studio />}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Player & Nav */}
      <Player />
      <MobileNav />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
