import React, { useEffect, useState } from 'react';
import { Music, ArrowLeft, Heart, Play } from 'lucide-react';
import { useAppContext, User, Track } from '../context/AppContext';
import { motion } from 'motion/react';

export default function ArtistProfile({ artistId, onBack }: { artistId: string, onBack: () => void }) {
  const { allTracks, likedTracks, toggleLike, playTrack } = useAppContext();
  const [artist, setArtist] = useState<User | null>(null);
  const [artistTracks, setArtistTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtistData = async () => {
      setLoading(true);
      try {
        const [userRes, tracksRes] = await Promise.all([
          fetch(`/api/users/${artistId}`),
          fetch(`/api/users/${artistId}/tracks`)
        ]);

        if (userRes.ok) {
          const userData = await userRes.json();
          setArtist(userData);
        }
        if (tracksRes.ok) {
          const tracksData = await tracksRes.json();
          setArtistTracks(tracksData);
        }
      } catch (err) {
        console.error('Failed to fetch artist data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchArtistData();
  }, [artistId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-neutral-500">
        <p>Артист не найден</p>
        <button onClick={onBack} className="mt-4 text-pink-500 hover:underline">Вернуться назад</button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="pb-32"
    >
      {/* Cover Image */}
      <div className="relative h-64 md:h-80 w-full bg-neutral-800">
        {artist.cover ? (
          <img src={artist.cover} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-pink-900/50 to-[#121212]"></div>
        )}
        
        <button 
          onClick={onBack}
          className="absolute top-4 left-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-md transition-all z-20"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        
        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent"></div>
      </div>

      <div className="px-6 md:px-8 -mt-20 relative z-10">
        <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
          {/* Avatar */}
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-[#121212] overflow-hidden bg-neutral-800 shadow-2xl flex-shrink-0">
            {artist.avatar ? (
              <img src={artist.avatar} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-pink-600 text-4xl font-bold text-white">
                {artist.username ? artist.username[0].toUpperCase() : '?'}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 mb-2">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-1 tracking-tight">{artist.username}</h1>
            <div className="flex items-center gap-4 text-neutral-400 text-sm font-medium">
              <span>{artist.trackCount} треков</span>
              <span>•</span>
              <span className="text-pink-500/80">Верифицированный артист</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0">
            <button 
              onClick={() => artistTracks.length > 0 && playTrack(artistTracks[0])}
              className="flex-1 md:flex-none bg-pink-600 text-white px-8 py-3 rounded-full font-bold hover:bg-pink-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-pink-600/20"
            >
              <Play className="w-5 h-5 fill-current" />
              Слушать
            </button>
          </div>
        </div>

        {/* Tracks Section */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-white mb-6">Популярные треки</h2>

          {artistTracks.length > 0 ? (
            <div className="grid grid-cols-1 gap-1">
              {artistTracks.map((track, i) => (
                <div 
                  key={track.id}
                  onClick={() => playTrack(track)}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all group cursor-pointer"
                >
                  <span className="text-neutral-500 w-6 text-center font-mono text-sm">{i + 1}</span>
                  <div className="w-12 h-12 bg-neutral-800 rounded-lg overflow-hidden relative">
                    {track.cover ? (
                      <img src={track.cover} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-neutral-700 flex items-center justify-center">
                        <Music className="w-5 h-5 text-neutral-500" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-5 h-5 text-white fill-current" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate">{track.title}</h3>
                    <p className="text-neutral-400 text-sm truncate">{track.artist}</p>
                  </div>
                  <motion.button 
                    whileTap={{ scale: 0.8 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLike(track.id);
                    }}
                    className="p-2 text-neutral-500 hover:text-pink-500 transition-colors"
                  >
                    <Heart className={`w-5 h-5 transition-colors ${likedTracks.includes(track.id) ? 'text-pink-500 fill-pink-500' : ''}`} />
                  </motion.button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-neutral-500">
              У артиста пока нет загруженных треков
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
