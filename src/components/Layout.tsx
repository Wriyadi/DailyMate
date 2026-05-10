import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Car, Heart, Settings, Utensils, Home, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';
import VehicleCheck from './VehicleCheck';
import HealthyLife from './HealthyLife';
import SmartHobby from './SmartHobby';
import Dashboard from './Dashboard';
import AuthScreen from './AuthScreen';

type Tab = 'home' | 'vehicle' | 'health' | 'hobby' | 'settings';

export default function MobileLayout() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const { user, login, loading, logout } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-stone-50 dark:bg-neutral-950">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 1 }}
          className="h-12 w-12 rounded-full bg-emerald-500"
        />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <Dashboard onNavigate={setActiveTab} />;
      case 'vehicle': return <VehicleCheck />;
      case 'health': return <HealthyLife />;
      case 'hobby': return <SmartHobby />;
      case 'settings':
        return (
          <div className="p-6">
            <h2 className="mb-6 text-2xl font-bold text-stone-900 dark:text-white">Settings</h2>
            
            <div className="rounded-3xl bg-white dark:bg-neutral-900 p-5 shadow-sm mb-6 border border-stone-100 dark:border-neutral-800">
              <div className="flex items-center space-x-4 border-b border-stone-100 dark:border-neutral-800 pb-4">
                <div className="h-14 w-14 overflow-hidden rounded-full bg-stone-200 dark:bg-neutral-800">
                  <img src={user.photoURL || ''} alt="" className="h-full w-full object-cover" />
                </div>
                <div>
                  <p className="font-bold text-lg text-stone-900 dark:text-white">{user.displayName}</p>
                  <p className="text-sm text-stone-500 dark:text-neutral-400">{user.email}</p>
                </div>
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-3 text-stone-700 dark:text-neutral-300">
                  {isDarkMode ? <Moon size={20} className="text-indigo-400"/> : <Sun size={20} className="text-amber-500"/>}
                  <span className="font-semibold">Dark Mode</span>
                </div>
                <button
                  onClick={toggleDarkMode}
                  className={cn(
                    "relative inline-flex h-8 w-14 items-center rounded-full transition-colors",
                    isDarkMode ? "bg-emerald-500" : "bg-stone-300"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-6 w-6 transform rounded-full bg-white transition-transform",
                      isDarkMode ? "translate-x-7" : "translate-x-1"
                    )}
                  />
                </button>
              </div>
            </div>

            <button
              onClick={logout}
              className="mt-3 flex w-full items-center justify-center space-x-2 text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30 p-4 rounded-2xl bg-white dark:bg-neutral-900 shadow-sm border border-stone-100 dark:border-neutral-800 font-bold"
            >
              <LogOut size={20} />
              <span>Sign Out</span>
            </button>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="flex h-screen flex-col bg-stone-50 dark:bg-neutral-950 font-sans text-stone-900 dark:text-neutral-100">
      <main className="flex-1 overflow-y-auto pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="h-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-stone-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 px-4 py-3 backdrop-blur-lg">
        <div className="mx-auto flex max-w-md items-center justify-around">
          <NavButton icon={<Home />} label="Home" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
          <NavButton icon={<Car />} label="Vehicle" active={activeTab === 'vehicle'} onClick={() => setActiveTab('vehicle')} />
          <NavButton icon={<Heart />} label="Health" active={activeTab === 'health'} onClick={() => setActiveTab('health')} />
          <NavButton icon={<Utensils />} label="Hobby" active={activeTab === 'hobby'} onClick={() => setActiveTab('hobby')} />
          <NavButton icon={<Settings />} label="Misc" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </div>
      </nav>
    </div>
  );
}

function NavButton({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center space-y-1 transition-colors",
        active ? "text-emerald-600 dark:text-emerald-400" : "text-stone-400 dark:text-neutral-500 hover:text-stone-600 dark:hover:text-neutral-300"
      )}
    >
      <div className={cn(
        "relative flex h-10 w-10 items-center justify-center rounded-xl transition-all",
        active ? "bg-emerald-50 dark:bg-emerald-900/30" : ""
      )}>
        {icon}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}
