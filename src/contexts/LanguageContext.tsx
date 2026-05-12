import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'id';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    'home': 'Home',
    'vehicle': 'Vehicle',
    'health': 'Health',
    'hobby': 'Hobby',
    'settings': 'Settings',
    'misc': 'Misc',
    'greeting': 'Hello',
    'glance': 'Your day at a glance.',
    'no_data': 'No data yet. Click to add',
    'quick_tips': 'Quick Tips',
    'learn_more': 'Learn More',
    'sign_out': 'Sign Out',
    'dark_mode': 'Dark Mode',
    'language': 'Language',
    'vehicle_check': 'Vehicle Check',
    'healthy_life': 'Healthy Life',
    'smart_hobby': 'Smart Hobby',
    'notifications': 'Notifications',
    'no_notifications': 'No new notification',
    'service_due': 'Time for service: ',
    'health_check': 'Vaccine/check-up schedule is near!',
    'hobby_task': 'Remember to care for your hobby today!',
    'loading': 'Loading...',
    'edit_profile': 'Edit Profile',
    'save': 'Save',
    'cancel': 'Cancel',
    'change_password': 'Change Password',
    'delete_account': 'Delete Account',
    'name': 'Name',
    'gender': 'Gender',
    'whatsapp': 'WhatsApp No.',
    'photo': 'Photo',
    'male': 'Male',
    'female': 'Female',
    'other': 'Other',
    'pass_reset_sent': 'Password reset email sent!',
  },
  id: {
    'home': 'Beranda',
    'vehicle': 'Kendaraan',
    'health': 'Kesehatan',
    'hobby': 'Hobi',
    'settings': 'Pengaturan',
    'misc': 'Lainnya',
    'greeting': 'Halo',
    'glance': 'Sekilas hari Anda.',
    'no_data': 'Belum ada data. Klik untuk menambahkan',
    'quick_tips': 'Tips Singkat',
    'learn_more': 'Pelajari Lebih Lanjut',
    'sign_out': 'Keluar',
    'dark_mode': 'Mode Gelap',
    'language': 'Bahasa',
    'vehicle_check': 'Cek Kendaraan',
    'healthy_life': 'Hidup Sehat',
    'smart_hobby': 'Hobi Pintar',
    'notifications': 'Notifikasi',
    'no_notifications': 'Tidak ada notifikasi baru',
    'service_due': 'Waktunya service untuk kendaraan ',
    'health_check': 'Jadwal vaksin/check-up kesehatan Anda sudah dekat!',
    'hobby_task': 'Ingatlah untuk mengelola hobi Anda hari ini!',
    'loading': 'Memuat data...',
    'edit_profile': 'Edit Profil',
    'save': 'Simpan',
    'cancel': 'Batal',
    'change_password': 'Ganti Kata Sandi',
    'delete_account': 'Hapus Akun',
    'name': 'Nama',
    'gender': 'Jenis Kelamin',
    'whatsapp': 'No. WhatsApp',
    'photo': 'Foto',
    'male': 'Laki-laki',
    'female': 'Perempuan',
    'other': 'Lainnya',
    'pass_reset_sent': 'Email atur ulang kata sandi telah dikirim!',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('language') as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
