import React, { useState } from 'react';
import { Home } from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  OAuthProvider, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function AuthScreen() {
  const [isLoginModel, setIsLoginModel] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResetSent(false);
    setIsLoading(true);

    try {
      if (isLoginModel) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Email atau password salah.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Email sudah terdaftar.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password terlalu lemah. Minimal 6 karakter.');
      } else {
        setError(err.message || 'Terjadi kesalahan. Silakan coba lagi.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Masukkan email Anda untuk reset password.');
      return;
    }
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim email reset password.');
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message || 'Gagal login dengan Google.');
    }
  };

  const handleAppleLogin = async () => {
    setError(null);
    try {
      const provider = new OAuthProvider('apple.com');
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message || 'Gagal login dengan Apple.');
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-stone-50 p-6 dark:bg-neutral-950">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            <Home size={40} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-900 dark:text-white leading-tight">
            DailyMate
          </h1>
          <p className="mt-2 text-stone-500 dark:text-neutral-400">
            Your all-in-one lifestyle assistant for a smoother routine.
          </p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm border border-stone-100 dark:border-neutral-800 dark:bg-neutral-900">
          <AnimatePresence mode="wait">
            <motion.div
              key={isLoginModel ? 'login' : 'register'}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="mb-6 text-xl font-bold text-stone-900 dark:text-white">
                {isLoginModel ? 'Masuk ke Akun Anda' : 'Buat Akun Baru'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-stone-700 dark:text-neutral-300">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl border-none bg-stone-50 px-4 py-3 text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 dark:bg-neutral-800 dark:text-white dark:focus:bg-neutral-900 dark:focus:ring-emerald-400 transition-all font-medium"
                    placeholder="nama@email.com"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-stone-700 dark:text-neutral-300">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border-none bg-stone-50 px-4 py-3 text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 dark:bg-neutral-800 dark:text-white dark:focus:bg-neutral-900 dark:focus:ring-emerald-400 transition-all font-medium"
                    placeholder="••••••••"
                  />
                  {isLoginModel && (
                    <div className="mt-2 text-right">
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                      >
                        Lupa password?
                      </button>
                    </div>
                  )}
                </div>

                {error && (
                  <p className="text-sm font-medium text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-900/30">
                    {error}
                  </p>
                )}
                
                {resetSent && (
                  <p className="text-sm font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                    Email reset password telah dikirim!
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-2 w-full rounded-2xl bg-emerald-600 py-4 font-bold text-white shadow-md shadow-emerald-600/20 transition-all hover:bg-emerald-700 active:scale-95 disabled:opacity-70 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                >
                  {isLoading ? 'Memproses...' : (isLoginModel ? 'Sign In' : 'Daftar')}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsLoginModel(!isLoginModel);
                    setError(null);
                    setResetSent(false);
                  }}
                  className="text-sm font-medium text-stone-500 hover:text-stone-700 dark:text-neutral-400 dark:hover:text-neutral-300"
                >
                  {isLoginModel ? 'Belum punya akun? Daftar di sini' : 'Sudah punya akun? Masuk'}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="my-6 flex items-center">
            <div className="flex-grow border-t border-stone-200 dark:border-neutral-800"></div>
            <span className="mx-4 text-xs font-bold text-stone-400 dark:text-neutral-500 uppercase tracking-widest">ATAU</span>
            <div className="flex-grow border-t border-stone-200 dark:border-neutral-800"></div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleGoogleLogin}
              className="flex w-full items-center justify-center space-x-3 rounded-2xl border border-stone-200 bg-white py-3.5 text-sm font-bold text-stone-700 transition-all hover:bg-stone-50 active:scale-95 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span>Continue with Google</span>
            </button>
            <button
              onClick={handleAppleLogin}
              className="flex w-full items-center justify-center space-x-3 rounded-2xl border border-stone-200 bg-stone-900 py-3.5 text-sm font-bold text-white transition-all hover:bg-stone-800 active:scale-95 dark:border-neutral-800 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-100"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16.365 21.411c-1.517 0-2.316-.763-3.957-.763-1.611 0-2.454.743-3.882.743-1.637 0-4.606-2.128-5.836-5.875-.705-2.146-.867-4.14-.383-5.592.515-1.537 1.838-2.618 3.522-2.618 1.487 0 2.454.673 3.582.684.973-.01 2.21-.763 3.754-.763 1.096 0 2.656.327 3.582 1.346-.145.109-2.072 1.199-2.002 3.522.062 2.109 1.776 2.842 1.867 2.871-.052.129-.753 2.508-2.227 4.093-.783.832-1.272 1.326-2.529 1.352h-.002zm-2.064-16.71c.783-.98 1.185-2.08 1.054-3.411-1.201.129-2.494.881-3.237 1.812-.555.673-.997 1.576-.897 2.595 1.165.178 2.268-.535 3.08-1.025v.029z" />
              </svg>
              <span>Continue with Apple</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
