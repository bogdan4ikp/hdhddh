import React, { useState, useRef } from 'react';
import { Music, ArrowRight, Loader2, Camera, Upload } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { motion } from 'motion/react';

export default function SetupProfile() {
  const { user, login, refreshUser } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !avatarFile) return;

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);

      const res = await fetch(`/api/users/${user.id}/profile`, {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        await refreshUser();
        // The App component will automatically switch view based on user state
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyan-600/20 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#121212] border border-white/10 rounded-3xl p-8 relative z-10 shadow-2xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">
            Оживите свой профиль
          </h1>
          <p className="text-neutral-400 font-medium">
            Загрузите аватар, чтобы фанаты узнавали вас.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex justify-center">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative w-40 h-40 rounded-full bg-neutral-900 border-2 border-dashed border-neutral-700 flex items-center justify-center cursor-pointer hover:border-cyan-500 hover:bg-neutral-800 transition-all group overflow-hidden"
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-4">
                  <Camera className="w-8 h-8 text-neutral-500 mx-auto mb-2 group-hover:text-cyan-500 transition-colors" />
                  <span className="text-xs text-neutral-500 font-bold uppercase tracking-wider group-hover:text-white transition-colors">Загрузить фото</span>
                </div>
              )}
              
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Upload className="w-8 h-8 text-white" />
              </div>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              accept="image/*" 
              className="hidden" 
            />
          </div>

          <button
            type="submit"
            disabled={loading || !avatarFile}
            className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-neutral-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-white/10"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>Готово</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
          
          <button 
            type="button"
            onClick={() => {
              // Skip logic - maybe set a default avatar?
              // For now just refresh to bypass if they really want to
              refreshUser(); 
            }}
            className="w-full text-neutral-500 text-sm font-medium hover:text-white transition-colors"
          >
            Пропустить этот шаг
          </button>
        </form>
      </motion.div>
    </div>
  );
}
