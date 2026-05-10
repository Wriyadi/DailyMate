import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Car, Heart, Settings, Utensils, Home, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';
import VehicleCheck from './VehicleCheck';
import HealthyLife from './HealthyLife';
import SmartHobby from './SmartHobby';
import Dashboard from './Dashboard';

type Tab = 'home' | 'vehicle' | 'health' | 'hobby' | 'settings';

export default function MobileLayout() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const { user, login, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-stone-50">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 1 }}
          className="h-12 w-12 rounded-full bg-emerald-500"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-stone-50 p-6 text-center">
        <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600">
          <Home size={48} />
        </div>
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-stone-900 leading-tight">DailyMate</h1>
        <p className="mb-8 text-stone-500">Your all-in-one lifestyle assistant for a smoother routine.</p>
        <button
          onClick={login}
          className="w-full max-w-xs rounded-2xl bg-emerald-600 py-4 font-semibold text-white shadow-lg transition-transform active:scale-95"
        >
          Get Started
        </button>
      </div>
    );
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
            <h2 className="mb-6 text-2xl font-bold">Settings</h2>
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-center space-x-3 border-b pb-3">
                <div className="h-10 w-10 overflow-hidden rounded-full bg-stone-200">
                  <img src={user.photoURL || ''} alt="" />
                </div>
                <div>
                  <p className="font-semibold">{user.displayName}</p>
                  <p className="text-sm text-stone-500">{user.email}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="mt-3 flex w-full items-center space-x-2 text-red-500 transition-colors hover:bg-red-50 p-2 rounded-xl"
              >
                <LogOut size={18} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="flex h-screen flex-col bg-stone-50 font-sans text-stone-900">
      <main className="flex-1 overflow-y-auto pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-stone-100 bg-white/80 px-4 py-3 backdrop-blur-lg">
        <div className="mx-auto flex max-w-md items-center justify-around">
          <NavButton icon={<Home />} label="Home" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
          <NavButton icon={<Car />} label="Vehicle" active={activeTab === 'vehicle'} onClick={() => setActiveTab('vehicle')} />
          <NavButton icon={<Heart />} label="Health" active={activeTab === 'health'} onClick={() => setActiveTab('health')} />
          <NavButton icon={<Utensils />} label="Hobby" active={activeTab === 'hobby'} onClick={() => setActiveTab('hobby')} />
          <NavButton icon={<Settings />} label="Edit" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
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
        active ? "text-emerald-600" : "text-stone-400 hover:text-stone-600"
      )}
    >
      <div className={cn(
        "relative flex h-10 w-10 items-center justify-center rounded-xl transition-all",
        active ? "bg-emerald-50" : ""
      )}>
        {icon}
      </div>
      <span className="text-[10px] font-medium uppercase tracking-widest">{label}</span>
    </button>
  );
}
