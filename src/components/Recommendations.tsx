import React from 'react';
import Header from './Header';
import { Play, Pause } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function Recommendations() {
  const { playTrack, currentTrack, isPlaying, togglePlay, allTracks } = useAppContext();

  // Just show some tracks as recommendations
  const recommendedTracks = allTracks.slice(0, 20);

  return (
    <div className="flex flex-col min-h-full pb-32">
      <Header />
      
      <div className="px-4 md:px-8 py-6">
        <h2 className="text-3xl font-bold text-white mb-8 tracking-tight">Рекомендации для вас</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {recommendedTracks.map(track => {
            const isActive = currentTrack?.id === track.id;

            return (
              <div 
                key={track.id} 
                onClick={() => isActive ? togglePlay() : playTrack(track)}
                className="group cursor-pointer bg-white/5 hover:bg-white/10 p-4 rounded-2xl transition-all border border-white/5 hover:border-white/10"
              >
                <div className="aspect-square rounded-xl overflow-hidden relative mb-4 shadow-2xl">
                  <img src={track.cover} alt={track.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className={`absolute inset-0 bg-black/40 transition-opacity flex items-center justify-center ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <div className="w-12 h-12 bg-pink-500 text-white rounded-full flex items-center justify-center shadow-xl scale-90 group-hover:scale-100 transition-transform">
                      {isActive && isPlaying ? (
                        <Pause className="w-6 h-6 fill-current" />
                      ) : (
                        <Play className="w-6 h-6 fill-current ml-1" />
                      )}
                    </div>
                  </div>
                </div>
                <h3 className={`font-bold truncate ${isActive ? 'text-pink-400' : 'text-white'}`}>{track.title}</h3>
                <p className="text-sm text-neutral-400 truncate mt-1">{track.artist}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
