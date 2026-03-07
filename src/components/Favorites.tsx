import React from 'react';
import { Play, Heart, Music } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { motion } from 'motion/react';

export default function Favorites() {
  const { playTrack, currentTrack, isPlaying, togglePlay, allTracks, likedTracks, toggleLike } = useAppContext();

  const favoriteTracks = allTracks.filter(t => likedTracks.includes(t.id));

  const handlePlayAll = () => {
    if (favoriteTracks.length > 0) {
      playTrack(favoriteTracks[0]);
    }
  };

  return (
    <div className="h-full overflow-y-auto pb-32">
      <div className="px-2 md:px-6 py-8">
        {/* Header Section */}
        <section className="mb-10">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">Любимое</h1>
          <p className="text-neutral-400 max-w-2xl">
            Ваши любимые треки.
          </p>
        </section>

        {/* Tracklist Section */}
        <section>
          {favoriteTracks.length > 0 ? (
            <>
              <div className="mb-6 flex items-center gap-4">
                <button 
                  onClick={handlePlayAll}
                  className="w-14 h-14 bg-pink-500 text-white rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-pink-900/20"
                >
                  <Play className="w-6 h-6 fill-current ml-1" />
                </button>
                <span className="text-neutral-400 text-sm font-medium uppercase tracking-wider">
                  Слушать всё ({favoriteTracks.length})
                </span>
              </div>

              <div className="space-y-2">
                {favoriteTracks.map((track, i) => {
                  const isActive = currentTrack?.id === track.id;
                  
                  return (
                    <div 
                      key={track.id} 
                      onClick={() => isActive ? togglePlay() : playTrack(track)}
                      className={`group flex items-center gap-4 p-3 rounded-xl transition-all cursor-pointer border border-transparent ${
                        isActive ? 'bg-white/10 border-white/5' : 'hover:bg-white/5 hover:border-white/5'
                      }`}
                    >
                      <div className="w-8 text-center text-neutral-500 font-mono text-sm">
                        {isActive && isPlaying ? (
                          <div className="flex items-end justify-center gap-0.5 h-4">
                            <div className="w-1 bg-pink-500 h-full animate-[bounce_1s_infinite]"></div>
                            <div className="w-1 bg-pink-500 h-2/3 animate-[bounce_1s_infinite_0.2s]"></div>
                            <div className="w-1 bg-pink-500 h-1/2 animate-[bounce_1s_infinite_0.4s]"></div>
                          </div>
                        ) : (
                          <span className="group-hover:hidden">{i + 1}</span>
                        )}
                        <Play className={`w-4 h-4 mx-auto hidden ${isActive ? '' : 'group-hover:block'} text-white fill-current`} />
                      </div>

                      <div className="w-12 h-12 md:w-14 md:h-14 bg-neutral-800 rounded-lg flex-shrink-0 overflow-hidden relative shadow-md">
                        {track.cover ? (
                          <img src={track.cover} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-neutral-700">
                            <Music className="w-6 h-6 text-neutral-500" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className={`font-medium truncate ${isActive ? 'text-pink-400' : 'text-white'}`}>
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
                          <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
                        </motion.button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-20 border-2 border-dashed border-neutral-800 rounded-3xl bg-white/5">
              <Heart className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Здесь пока пусто</h3>
              <p className="text-neutral-400 mb-6">Добавляйте треки в избранное, чтобы они появились здесь.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
