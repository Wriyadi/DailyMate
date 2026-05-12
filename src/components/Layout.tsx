import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Car, Heart, Settings, Utensils, Home, LogOut, Sun, Moon, Globe, Edit2, Key, Trash2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';
import { cn } from '../lib/utils';
import { sendPasswordResetEmail, deleteUser, updatePassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import VehicleCheck from './VehicleCheck';
import HealthyLife from './HealthyLife';
import SmartHobby from './SmartHobby';
import Dashboard from './Dashboard';
import AuthScreen from './AuthScreen';

type Tab = 'home' | 'vehicle' | 'health' | 'hobby' | 'settings';

export default function MobileLayout() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const { user, profile, updateProfile, login, loading, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editProfileData, setEditProfileData] = useState<any>({});
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [alertDialog, setAlertDialog] = useState<{message: string, onClose?: () => void} | null>(null);

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

  const handleEditProfile = () => {
    setEditProfileData(profile || { name: user.displayName, photoURL: user.photoURL });
    setShowEditProfile(true);
  };

  const handleSaveProfile = async () => {
    await updateProfile(editProfileData);
    setShowEditProfile(false);
  };

  const handleChangePassword = async () => {
    setShowPasswordDialog(true);
  };

  const submitPasswordChange = async () => {
    if (newPasswordInput.trim() !== '') {
      try {
        await updatePassword(user, newPasswordInput);
        setAlertDialog({ message: "Password updated successfully!" });
        setShowPasswordDialog(false);
        setNewPasswordInput('');
      } catch (e: any) {
        console.error(e);
        if (e.code === 'auth/requires-recent-login') {
          setAlertDialog({ 
            message: "For security reasons, you must log in again to change your password. Please log back in.",
            onClose: () => logout()
          });
        } else {
          setAlertDialog({ message: "Failed to update password: " + e.message });
        }
      }
    }
  };

  const sendEmailReset = async () => {
    if (user.email) {
      try {
        await sendPasswordResetEmail(auth, user.email);
        setAlertDialog({ message: t('pass_reset_sent') });
        setShowPasswordDialog(false);
      } catch (e) {
        console.error(e);
        setAlertDialog({ message: "Failed to send password reset email." });
      }
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeleteAccount = async () => {
    try {
      await deleteUser(user);
    } catch (e: any) {
      console.error(e);
      setShowDeleteConfirm(false);
      if (e.code === 'auth/requires-recent-login') {
        setAlertDialog({ 
          message: "For security reasons, you must log in again to delete your account. Please log back in.",
          onClose: () => logout()
        });
      } else {
        setAlertDialog({ message: "Failed to delete account: " + e.message });
      }
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setEditProfileData({ ...editProfileData, photoURL: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
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
            <h2 className="mb-6 text-2xl font-bold text-stone-900 dark:text-white">{t('settings')}</h2>
            
            <div className="rounded-3xl bg-white dark:bg-neutral-900 p-5 shadow-sm mb-6 border border-stone-100 dark:border-neutral-800">
              <div className="flex items-center justify-between border-b border-stone-100 dark:border-neutral-800 pb-4">
                <div className="flex items-center space-x-4">
                  <div className="h-14 w-14 overflow-hidden rounded-full bg-stone-200 dark:bg-neutral-800">
                    {(profile?.photoURL || user.photoURL) && <img src={profile?.photoURL || user.photoURL || ''} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div>
                    <p className="font-bold text-lg text-stone-900 dark:text-white">{profile?.name || user.displayName}</p>
                    <p className="text-sm text-stone-500 dark:text-neutral-400">{user.email}</p>
                  </div>
                </div>
                <button onClick={handleEditProfile} className="p-2 text-stone-400 hover:text-stone-700 dark:hover:text-neutral-300 transition-colors">
                  <Edit2 size={20} />
                </button>
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-3 text-stone-700 dark:text-neutral-300">
                  {isDarkMode ? <Moon size={20} className="text-indigo-400"/> : <Sun size={20} className="text-amber-500"/>}
                  <span className="font-semibold">{t('dark_mode')}</span>
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

              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center space-x-3 text-stone-700 dark:text-neutral-300">
                  <Globe size={20} className="text-blue-500" />
                  <span className="font-semibold">{t('language')}</span>
                </div>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as 'en' | 'id')}
                  className="rounded-lg bg-stone-100 dark:bg-neutral-800 px-3 py-1.5 text-sm font-medium text-stone-700 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="en">English</option>
                  <option value="id">Bahasa Indonesia</option>
                </select>
              </div>

              <div className="mt-6 space-y-3 pt-6 border-t border-stone-100 dark:border-neutral-800">
                <button onClick={handleChangePassword} className="flex w-full items-center justify-center space-x-2 rounded-2xl bg-stone-100 dark:bg-neutral-800 px-4 py-4 font-bold text-stone-700 dark:text-neutral-300 active:scale-95 transition-all">
                  <Key size={18} />
                  <span>{t('change_password')}</span>
                </button>
                <button onClick={handleDeleteAccount} className="flex w-full items-center justify-center space-x-2 rounded-2xl bg-red-50 dark:bg-red-900/30 px-4 py-4 font-bold text-red-600 dark:text-red-400 active:scale-95 transition-all">
                  <Trash2 size={18} />
                  <span>{t('delete_account')}</span>
                </button>
              </div>
            </div>

            <button
              onClick={logout}
              className="mt-3 flex w-full items-center justify-center space-x-2 text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30 p-4 rounded-2xl bg-white dark:bg-neutral-900 shadow-sm border border-stone-100 dark:border-neutral-800 font-bold"
            >
              <LogOut size={20} />
              <span>{t('sign_out')}</span>
            </button>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="flex h-screen flex-col bg-stone-50 dark:bg-neutral-950 font-sans text-stone-900 dark:text-neutral-100">
      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="min-h-full pb-48 px-1"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {showEditProfile && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowEditProfile(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md rounded-3xl bg-white dark:bg-neutral-900 p-6 shadow-xl max-h-[80vh] overflow-y-auto">
              <h3 className="mb-4 text-xl font-bold">{t('edit_profile')}</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-stone-500 uppercase">{t('name')}</label>
                  <input type="text" value={editProfileData.name || ''} onChange={e => setEditProfileData({...editProfileData, name: e.target.value})} className="mt-1 w-full rounded-xl bg-stone-50 dark:bg-neutral-800 border-none px-4 py-3 font-bold focus:ring-2 focus:ring-blue-200" />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-500 uppercase">{t('photo')}</label>
                  <div className="mt-2 flex items-center space-x-4">
                    {editProfileData.photoURL && (
                      <div className="h-14 w-14 overflow-hidden rounded-full bg-stone-200 dark:bg-neutral-800 shrink-0">
                        <img src={editProfileData.photoURL} alt="Profile" className="h-full w-full object-cover" />
                      </div>
                    )}
                    <label className="cursor-pointer flex items-center justify-center rounded-xl bg-stone-100 dark:bg-neutral-800 px-4 py-3 font-bold text-stone-700 dark:text-neutral-300 w-full text-center">
                      <span>Upload Photo</span>
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-500 uppercase">{t('whatsapp')}</label>
                  <input type="text" value={editProfileData.whatsapp || ''} onChange={e => setEditProfileData({...editProfileData, whatsapp: e.target.value})} className="mt-1 w-full rounded-xl bg-stone-50 dark:bg-neutral-800 border-none px-4 py-3 font-bold focus:ring-2 focus:ring-blue-200" />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-500 uppercase">{t('gender')}</label>
                  <select value={editProfileData.gender || ''} onChange={e => setEditProfileData({...editProfileData, gender: e.target.value})} className="mt-1 w-full rounded-xl bg-stone-50 dark:bg-neutral-800 border-none px-4 py-3 font-bold focus:ring-2 focus:ring-blue-200">
                    <option value="">--</option>
                    <option value="male">{t('male')}</option>
                    <option value="female">{t('female')}</option>
                    <option value="other">{t('other')}</option>
                  </select>
                </div>
                
                <div className="flex space-x-3 pt-4 border-t border-stone-100 dark:border-neutral-800">
                  <button onClick={handleSaveProfile} className="flex-1 rounded-xl bg-blue-600 py-3 font-bold text-white active:scale-95 transition-all">{t('save')}</button>
                  <button onClick={() => setShowEditProfile(false)} className="flex-1 rounded-xl bg-stone-100 dark:bg-neutral-800 py-3 font-bold text-stone-700 dark:text-neutral-300 active:scale-95 transition-all">{t('cancel')}</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-neutral-900 p-6 shadow-xl text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="mb-2 text-xl font-bold">Delete Account</h3>
              <p className="text-stone-500 dark:text-neutral-400 mb-6 font-medium">Are you sure you want to delete your account? This action is permanent and cannot be undone.</p>
              <div className="flex space-x-3">
                <button onClick={confirmDeleteAccount} className="flex-1 rounded-xl bg-red-600 py-3 font-bold text-white active:scale-95 transition-all">Yes, Delete</button>
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 rounded-xl bg-stone-100 dark:bg-neutral-800 py-3 font-bold text-stone-700 dark:text-neutral-300 active:scale-95 transition-all">Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Password Change Dialog */}
      <AnimatePresence>
        {showPasswordDialog && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowPasswordDialog(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-neutral-900 p-6 shadow-xl">
              <h3 className="mb-2 text-xl font-bold">Change Password</h3>
              <p className="text-sm text-stone-500 mb-4">Enter your new password below, or send a password reset link to your email.</p>
              
              <input 
                type="password" 
                placeholder="New Password" 
                value={newPasswordInput} 
                onChange={(e) => setNewPasswordInput(e.target.value)} 
                className="mb-4 w-full rounded-xl bg-stone-50 dark:bg-neutral-800 border-none px-4 py-3 font-bold focus:ring-2 focus:ring-blue-200 text-stone-800 dark:text-white" 
              />
              
              <div className="flex space-x-2 flex-col gap-3">
                <button onClick={submitPasswordChange} disabled={!newPasswordInput.trim()} className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white active:scale-95 transition-all disabled:opacity-50">Update Password</button>
                <div className="flex items-center space-x-2 my-2 w-full">
                  <div className="h-px flex-1 bg-stone-200 dark:bg-neutral-800"></div>
                  <span className="text-xs font-bold text-stone-400">OR</span>
                  <div className="h-px flex-1 bg-stone-200 dark:bg-neutral-800"></div>
                </div>
                <button onClick={sendEmailReset} className="w-full rounded-xl bg-stone-100 dark:bg-neutral-800 py-3 font-bold text-stone-700 dark:text-neutral-300 active:scale-95 transition-all">Send Reset Email</button>
                <button onClick={() => setShowPasswordDialog(false)} className="w-full text-stone-500 font-bold py-2 active:scale-95 transition-all">Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Alert Dialog */}
      <AnimatePresence>
        {alertDialog && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => {
              if (alertDialog.onClose) alertDialog.onClose();
              setAlertDialog(null);
            }} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-neutral-900 p-6 shadow-xl text-center">
              <h3 className="mb-4 text-lg font-bold text-stone-900 dark:text-white">{alertDialog.message}</h3>
              <button onClick={() => {
                if (alertDialog.onClose) alertDialog.onClose();
                setAlertDialog(null);
              }} className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white active:scale-95 transition-all">OK</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-stone-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 px-4 py-3 backdrop-blur-lg">
        <div className="mx-auto flex max-w-md items-center justify-around">
          <NavButton icon={<Home />} label={t('home')} active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
          <NavButton icon={<Car />} label={t('vehicle')} active={activeTab === 'vehicle'} onClick={() => setActiveTab('vehicle')} />
          <NavButton icon={<Heart />} label={t('health')} active={activeTab === 'health'} onClick={() => setActiveTab('health')} />
          <NavButton icon={<Utensils />} label={t('hobby')} active={activeTab === 'hobby'} onClick={() => setActiveTab('hobby')} />
          <NavButton icon={<Settings />} label={t('misc')} active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
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
