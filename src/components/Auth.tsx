import React, { useState, useEffect } from 'react';
import { Music, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { motion } from 'motion/react';
import { api } from '../services/api';

export default function Auth() {
  const { login } = useAppContext();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_SUCCESS') {
        localStorage.setItem('token', event.data.token);
        localStorage.setItem('user', JSON.stringify(event.data.user));
        login(event.data.user);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [login]);

  const handleGoogleLogin = async () => {
    try {
      const response = await fetch(`/api/auth/google/url?origin=${encodeURIComponent(window.location.origin)}`);
      const { url } = await response.json();
      window.open(url, 'oauth_popup', 'width=600,height=700');
    } catch (error) {
      console.error('Google login error:', error);
      setError('Ошибка при входе через Google');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    
    if (!isLogin && password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      let userData;
      if (isLogin) {
        userData = await api.login(username, password);
      } else {
        userData = await api.register(username, password);
      }
      login(userData);
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
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
          {isLogin ? 'С возвращением' : 'Создать аккаунт'}
        </h1>
        <p className="text-neutral-400 text-center mb-8 font-medium">
          {isLogin ? 'Войдите, чтобы продолжить слушать' : 'Присоединяйтесь к нашему сообществу'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-neutral-300 mb-1.5 uppercase tracking-wider">Имя пользователя</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-medium"
              placeholder="Введите имя"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-neutral-300 mb-1.5 uppercase tracking-wider">Пароль</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 pr-12 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-medium"
                placeholder="••••••••"
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
              <label className="block text-sm font-bold text-neutral-300 mb-1.5 uppercase tracking-wider">Подтвердите пароль</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 pr-12 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-medium"
                  placeholder="••••••••"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm font-medium text-center bg-red-400/10 py-2 rounded-lg">
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-bold rounded-xl px-4 py-4 mt-6 flex items-center justify-center gap-2 hover:bg-neutral-200 transition-colors disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                {isLogin ? 'Войти' : 'Зарегистрироваться'}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#121212] text-neutral-500">Или</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full mt-6 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl px-4 py-3.5 flex items-center justify-center gap-3 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Продолжить с Google
          </button>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); setConfirmPassword(''); }}
            className="text-neutral-400 hover:text-white text-sm font-medium transition-colors"
          >
            {isLogin ? 'Нет аккаунта? Зарегистрируйтесь' : 'Уже есть аккаунт? Войдите'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
