import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { User, Lock, ArrowRight, Music2, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Auth() {
  const { login } = useAppContext();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  useEffect(() => {
    // Simulate username check locally
    if (username.length < 3) {
      setIsAvailable(null);
      return;
    }

    const timer = setTimeout(() => {
      setCheckingUsername(true);
      // In a real local-only app, we might check against a list of users in localStorage
      // For now, we'll just say it's available if it's not empty
      setIsAvailable(true);
      setCheckingUsername(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [username, isLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setError('');
    setLoading(true);

    // Simulate network delay
    setTimeout(() => {
      const mockUser = {
        id: 'user-' + Date.now(),
        username: username,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
        cover: null,
        trackCount: 0,
        likes: []
      };
      
      login(mockUser);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden p-4">
      {/* Animated Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pink-600/20 blur-[120px] rounded-full animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full animate-pulse delay-700"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white/5 backdrop-blur-2xl rounded-[2.5rem] p-8 md:p-10 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col items-center mb-10">
            <motion.div 
              whileHover={{ rotate: 10 }}
              className="w-20 h-20 bg-gradient-to-tr from-pink-500 to-purple-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-pink-500/20"
            >
              <Music2 className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              {isLogin ? 'С возвращением' : 'Регистрация'}
            </h1>
            <p className="text-neutral-400 mt-3 text-center text-sm font-medium">
              {isLogin ? 'Войдите в свой аккаунт' : 'Создайте новый аккаунт'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-[0.1em] ml-1">Никнейм</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-pink-500 transition-colors" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white/5 text-white rounded-2xl py-4 pl-12 pr-12 focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all border border-white/5 focus:border-pink-500/50 placeholder:text-neutral-600"
                  placeholder="Ваш никнейм"
                  required
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {checkingUsername ? (
                    <div className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : isAvailable !== null && (
                    isAvailable ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )
                  )}
                </div>
              </div>
              {isAvailable === false && (
                <p className="text-[10px] text-red-500 ml-1 font-medium">
                  {isLogin ? 'Пользователь не найден' : 'Никнейм уже занят'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-[0.1em] ml-1">Пароль</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-pink-500 transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 text-white rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all border border-white/5 focus:border-pink-500/50 placeholder:text-neutral-600"
                  placeholder="Ваш пароль"
                  required
                />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-xs text-center bg-red-500/10 py-3 rounded-xl border border-red-500/20"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading || checkingUsername}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-bold py-4 rounded-2xl transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 shadow-xl shadow-pink-500/20 mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>{isLogin ? 'Войти' : 'Создать аккаунт'}</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setUsername('');
                setPassword('');
                setError('');
                setIsAvailable(null);
              }}
              className="text-neutral-400 hover:text-pink-500 text-sm font-medium transition-colors"
            >
              {isLogin ? 'Нет аккаунта? Создать бесплатно' : 'Уже есть аккаунт? Войти'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
