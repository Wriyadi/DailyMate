import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'id';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  formatNumber: (num: number, maximumFractionDigits?: number) => string;
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
    'tip_0': 'Regular check-ups save 20% on maintenance costs.',
    'tip_1': 'Drinking 8 glasses of water a day keeps you hydrated and energized.',
    'tip_2': 'Spending 15 minutes a day tending to your plants reduces stress.',
    'tip_3': 'Check your tire pressure monthly to improve fuel efficiency.',
    'tip_4': 'A balanced diet with plenty of vegetables boosts your immune system.',
    'tip_5': 'Walking 10,000 steps a day significantly improves heart health.',
    'tip_6': 'Taking regular breaks during long drives prevents driving fatigue.',
    'tip_7': 'Properly socializing your pets early helps prevent behavioral issues.',
    'tip_8': 'Getting 7-8 hours of sleep per night is crucial for mental clarity.',
    'tip_9': 'Cleaning your air filters regularly improves indoor air quality.',
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
    'gasoline': 'Gasoline',
    'manual': 'Manual',
    'mileage': 'Mileage',
    'interval': 'Interval',
    'km_left': 'km left',
    'service_required': 'Service Required!',
    'schedule_main_soon': 'Schedule maintenance soon',
    'service_history': 'Service History',
    'add_log': 'Add Log',
    'no_service_history': 'No service history found.',
    'diesel': 'Diesel',
    'automatic': 'Automatic',
    'car': 'Car',
    'motorcycle': 'Motorcycle',
    'brand': 'Brand',
    'type': 'Type',
    'fuel_type': 'Fuel Type',
    'transmission': 'Transmission',
    'trackers': 'Trackers',
    'child_care': 'Child Care',
    'nutrition': 'Nutrition',
    'assistant': 'Assistant',
    'biometrics': 'Biometrics',
    'age': 'Age',
    'known_allergies': 'Known Allergies',
    'chronic_diseases': 'Chronic Diseases',
    'height_cm': 'Height (cm)',
    'weight_kg': 'Weight (kg)',
    'save_bio': 'Save/Update Biometrics',
    'bmi': 'Body Mass Index',
    'underweight': 'Underweight',
    'normal_weight': 'Normal weight',
    'overweight': 'Overweight',
    'obesity': 'Obesity',
    'recent_logs': 'Recent Logs',
    'wellness_tracking': 'Wellness tracking & insights.',
    'care_for_what_you_love': 'Care for what you love.',
    'pets': 'Pets',
    'garden': 'Garden',
    'cook': 'Cook',
    'home_hobby': 'Home',
    'my_pets': 'My Pets',
    'my_garden': 'My Garden',
    'culinary_assistant': 'Culinary Assistant',
    'visual_diagnostic': 'Visual Diagnostic Tool',
    'plant_disease_diagnostic': 'Plant Disease Diagnostics',
    'ai_culinary_assistant': 'AI Culinary Assistant',
    'cat_scratching': 'My cat keeps scratching its ear... (Upload photo optional)',
    'plant_yellow': 'Why are my Monstera leaves turning yellow? (Upload photo optional)',
    'suggest_healthy_dinner': 'Suggest a healthy dinner for 2 with chicken and spinach...',
    'get_advice': 'Get Advice',
    'analyzing': 'Analyzing...',
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
    'tip_0': 'Pemeriksaan rutin menghemat 20% biaya perawatan.',
    'tip_1': 'Minum 8 gelas air sehari membuat Anda tetap terhidrasi dan berenergi.',
    'tip_2': 'Menghabiskan 15 menit sehari merawat tanaman mengurangi stres.',
    'tip_3': 'Periksa tekanan ban setiap bulan untuk efisiensi bahan bakar.',
    'tip_4': 'Diet seimbang dengan banyak sayuran meningkatkan sistem imun tubuh.',
    'tip_5': 'Berjalan 10.000 langkah sehari secara signifikan meningkatkan kesehatan jantung.',
    'tip_6': 'Istirahat teratur saat mengemudi jarak jauh mencegah kelelahan.',
    'tip_7': 'Sosialisasi hewan peliharaan sejak dini membantu mencegah masalah perilaku.',
    'tip_8': 'Tidur 7-8 jam per malam sangat penting untuk kejernihan mental.',
    'tip_9': 'Membersihkan saringan udara secara teratur meningkatkan kualitas udara ruangan.',
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
    'gasoline': 'Bensin',
    'manual': 'Manual',
    'mileage': 'Jarak Tempuh',
    'interval': 'Interval',
    'km_left': 'km lagi',
    'service_required': 'Perlu Servis!',
    'schedule_main_soon': 'Jadwalkan pemeliharaan segera',
    'service_history': 'Riwayat Servis',
    'add_log': 'Tambah Log',
    'no_service_history': 'Tidak ada riwayat servis ditemukan.',
    'diesel': 'Diesel',
    'automatic': 'Otomatis',
    'car': 'Mobil',
    'motorcycle': 'Motor',
    'brand': 'Merek',
    'type': 'Tipe',
    'fuel_type': 'Tipe Bahan Bakar',
    'transmission': 'Transmisi',
    'trackers': 'Pelacak',
    'child_care': 'Perawatan Anak',
    'nutrition': 'Nutrisi',
    'assistant': 'Asisten',
    'biometrics': 'Biometrik',
    'age': 'Usia',
    'known_allergies': 'Alergi yang Diketahui',
    'chronic_diseases': 'Penyakit Kronis',
    'height_cm': 'Tinggi Badan (cm)',
    'weight_kg': 'Berat Badan (kg)',
    'save_bio': 'Simpan/Perbarui Biometrik',
    'bmi': 'Indeks Massa Tubuh',
    'underweight': 'Kekurangan Berat Badan',
    'normal_weight': 'Berat Normal',
    'overweight': 'Kelebihan Berat Badan',
    'obesity': 'Obesitas',
    'recent_logs': 'Log Terkini',
    'wellness_tracking': 'Pelacakan & wawasan kesehatan.',
    'care_for_what_you_love': 'Peduli pada apa yang Anda cintai.',
    'pets': 'Hewan Peliharaan',
    'garden': 'Taman',
    'cook': 'Masak',
    'home_hobby': 'Rumah',
    'my_pets': 'Hewan Peliharaan Saya',
    'my_garden': 'Taman Saya',
    'culinary_assistant': 'Asisten Kuliner',
    'visual_diagnostic': 'Alat Diagnostik Visual',
    'plant_disease_diagnostic': 'Diagnostik Penyakit Tanaman',
    'ai_culinary_assistant': 'Asisten Kuliner AI',
    'cat_scratching': 'Kucing saya terus menggaruk telinganya... (Unggah foto opsional)',
    'plant_yellow': 'Mengapa daun Monstera saya menguning? (Unggah foto opsional)',
    'suggest_healthy_dinner': 'Sarankan makan malam sehat untuk 2 orang dengan ayam dan bayam...',
    'get_advice': 'Dapatkan Saran',
    'analyzing': 'Sedang menganalisis...',
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

  const formatNumber = (num: number, maximumFractionDigits: number = 0): string => {
    return new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', {
      maximumFractionDigits
    }).format(num);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, formatNumber }}>
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
