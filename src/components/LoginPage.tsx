import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Mail, Lock, User, Sparkles, ArrowRight, ShieldAlert } from 'lucide-react';
import { signInWithEmail, signUpWithEmail, signInWithGoogle } from '../utils/firebase';
import { playTick, playSnap, playSuccessChime } from '../utils/audio';

interface LoginPageProps {
  onSuccess: (user: any) => void;
  onContinueOffline: () => void;
}

export default function LoginPage({ onSuccess, onContinueOffline }: LoginPageProps) {
  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    playTick();

    try {
      let user;
      if (activeTab === 'signin') {
        user = await signInWithEmail(email, password);
      } else {
        if (!name.trim()) {
          throw new Error('Please specify your profile name');
        }
        user = await signUpWithEmail(email, password, name.trim());
      }
      playSuccessChime();
      onSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
      playSnap();
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    playTick();

    try {
      const user = await signInWithGoogle();
      if (user) {
        playSuccessChime();
        onSuccess(user);
      }
    } catch (err: any) {
      setError(err.message || 'Google Auth aborted.');
      playSnap();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex justify-center items-start overflow-y-auto p-4 md:p-10 bg-[#f4f4f7] dark:bg-[#09090b] text-text-primary">
      {/* Decorative ambient glowing backdrops matching current design */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative my-auto w-full max-w-md bg-white/40 dark:bg-[#121217]/50 border border-glass-border/70 rounded-[40px] p-8 md:p-10 shadow-2xl backdrop-blur-3xl select-none"
      >
        <div className="absolute top-0 left-0 right-0 h-1 md:h-1.5 bg-brand-accent opacity-80 rounded-t-[40px]" />

        {/* Brand Header Display */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-[22px] bg-brand-accent flex items-center justify-center shadow-[0_4px_20px_var(--accent-color-glow)] mb-4">
            <Zap className="w-7 h-7 text-white fill-white/10" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-text-primary font-display flex items-center gap-1.5 justify-center">
            Claro <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-400 mt-2">Sync</span>
          </h1>
          <p className="text-xs text-text-secondary mt-1 font-sans">
            Securely back up your habits, rituals, and scheduled pages across devices
          </p>
        </div>

        {/* Tab switch controller */}
        <div className="grid grid-cols-2 p-1.5 bg-glass-pill/20 dark:bg-black/20 border border-glass-border rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => { playTick(); setActiveTab('signin'); setError(null); }}
            className={`py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'signin'
                ? 'bg-text-primary text-brand-bg shadow-md'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { playTick(); setActiveTab('register'); setError(null); }}
            className={`py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'register'
                ? 'bg-text-primary text-brand-bg shadow-md'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Register
          </button>
        </div>

        {/* Display Alert Banner if error exists */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold p-3.5 rounded-2xl mb-5 flex items-start gap-2 overflow-hidden"
            >
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main form section */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {activeTab === 'register' && (
            <div className="space-y-1.5">
              <label className="text-[9px] font-mono font-bold tracking-widest text-text-tertiary uppercase block pl-1">Display Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-quaternary pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Atharv Parmar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-glass-pill hover:bg-glass-pill-hover text-xs font-semibold text-text-primary border border-glass-border/60 rounded-xl p-3.5 pl-11 focus:outline-none focus:border-text-secondary placeholder-text-tertiary transition-all"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[9px] font-mono font-bold tracking-widest text-text-tertiary uppercase block pl-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-quaternary pointer-events-none" />
              <input
                type="email"
                required
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-glass-pill hover:bg-glass-pill-hover text-xs font-semibold text-text-primary border border-glass-border/60 rounded-xl p-3.5 pl-11 focus:outline-none focus:border-text-secondary placeholder-text-tertiary transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-mono font-bold tracking-widest text-text-tertiary uppercase block pl-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-quaternary pointer-events-none" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-glass-pill hover:bg-glass-pill-hover text-xs font-semibold text-text-primary border border-glass-border/60 rounded-xl p-3.5 pl-11 focus:outline-none focus:border-text-secondary placeholder-text-tertiary transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-text-primary text-brand-bg font-extrabold rounded-2xl text-xs hover:opacity-90 cursor-pointer shadow-lg tracking-wide flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-brand-bg border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{activeTab === 'signin' ? 'Sign In & Synch' : 'Register Profile'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider separator */}
        <div className="flex items-center gap-3 my-5 select-none">
          <div className="h-[1px] flex-1 bg-glass-border/50"></div>
          <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-text-tertiary whitespace-nowrap">
            Or
          </span>
          <div className="h-[1px] flex-1 bg-glass-border/50"></div>
        </div>

        {/* Alternate login channels */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full h-11 bg-glass-pill hover:bg-glass-pill-hover border border-glass-border/80 rounded-xl flex items-center justify-center gap-2.5 text-xs font-bold text-text-secondary hover:text-text-primary cursor-pointer transition-all disabled:opacity-50"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.87-2.6-2.9-4.53-6.19-4.53z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continue with Google</span>
          </button>

          <button
            type="button"
            onClick={() => { playTick(); onContinueOffline(); }}
            className="w-full text-center py-2.5 text-xs font-semibold text-text-tertiary hover:text-text-secondary cursor-pointer transition-colors"
          >
            Continue offline (No backups)
          </button>
        </div>

      </motion.div>
    </div>
  );
}
