import React, { useState } from 'react';
import { Music, ArrowRight, Loader2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { motion } from 'motion/react';

export default function SetupProfile() {
  const { login } = useAppContext();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    setError('');

    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) throw new Error('User not found');
      const currentUser = JSON.parse(userStr);

      const res = await fetch('/api/users/setup-username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: currentUser.id, username })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка');

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      login(data.user);
    } catch (err: any) {
      setError(err.message);
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
        className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative z-10 shadow-2xl"
      >
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Music className="w-8 h-8 text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-black text-white text-center mb-2 tracking-tight">
          Придумайте никнейм
        </h1>
        <p className="text-neutral-400 text-center mb-8 font-medium">
          Почти готово! Выберите уникальное имя для вашего профиля.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-neutral-300 mb-1.5 uppercase tracking-wider">Ваш никнейм</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-medium"
              placeholder="e.g. cool_dj_99"
              required
              minLength={3}
              maxLength={20}
              pattern="^[a-zA-Z0-9_]+$"
              title="Только латинские буквы, цифры и подчеркивания"
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center font-medium bg-red-500/10 py-2 rounded-lg border border-red-500/20">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-neutral-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-6 shadow-lg shadow-white/10"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>Продолжить</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
