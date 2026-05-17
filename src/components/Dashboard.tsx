import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Car, Heart, Utensils, ArrowRight, Bell, Plus } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useLanguage } from '../contexts/LanguageContext';
import { cn } from '../lib/utils';
import { UserProfile, Vehicle } from '../types';

export default function Dashboard({ onNavigate }: { onNavigate: (tab: any) => void }) {
  const [userName, setUserName] = useState('');
  const { t } = useLanguage();
  
  // State Management untuk Data
  const [vehicleData, setVehicleData] = useState<any>(null);
  const [healthData, setHealthData] = useState<any>(null);
  const [hobbyData, setHobbyData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [randomTipIndex, setRandomTipIndex] = useState(0);

  // State Notifikasi
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);

  useEffect(() => {
    setRandomTipIndex(Math.floor(Math.random() * 10));
  }, []);

  useEffect(() => {
    const newNotifs: string[] = [];
    if (vehicleData && vehicleData.nextService <= 1000) {
      newNotifs.push(`${t('service_due')}${vehicleData.name}!`);
    }
    if (healthData && healthData.hasVaccineSoon) {
      newNotifs.push(t('health_check'));
    }
    if (hobbyData && hobbyData.hasTaskToday) {
      newNotifs.push(t('hobby_task'));
    }
    setNotifications(newNotifs);
  }, [vehicleData, healthData, hobbyData, t]);

  useEffect(() => {
    const fetchDashboardData = async (uid: string) => {
      try {
        setIsLoading(true);
        
        // Fetch Vehicle Data
        try {
          const vQuery = query(collection(db, 'vehicles'), where('ownerId', '==', uid));
          const vSnapshot = await getDocs(vQuery);
          if (!vSnapshot.empty) {
            const vehicle = vSnapshot.docs[0].data() as Vehicle;
            const nextService = vehicle.lastServiceMileage + vehicle.maintenanceInterval;
            const diff = nextService - vehicle.odometer;
            const status = diff > 0 ? t('service_in').replace('{km}', diff.toString()) : t('service_overdue').replace('{km}', Math.abs(diff).toString());
            setVehicleData({
              display: `${vehicle.name}: ${t('service')} ${status}`,
              name: vehicle.name,
              nextService: diff
            });
          } else {
            setVehicleData(null);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.LIST, 'vehicles');
        }

        // Fetch Health Data
        try {
          let hasVaccineSoon = false;
          
          const childrenQuery = query(collection(db, 'children'), where('parentId', '==', uid));
          const childrenSnap = await getDocs(childrenQuery);
          if (!childrenSnap.empty) {
            hasVaccineSoon = true;
          }

          const userDocRef = doc(db, 'users', uid);
          const userDoc = await getDoc(userDocRef);
          let displayStr = null;
          if (userDoc.exists()) {
            const profile = userDoc.data() as UserProfile;
            if (profile.height && profile.weight) {
              const heightInMeters = profile.height / 100;
              const bmi = (profile.weight / (heightInMeters * heightInMeters)).toFixed(1);
              displayStr = `${t('current_bmi')}: ${bmi} kg/m²`;
            }
          }
          
          if (displayStr || hasVaccineSoon) {
            setHealthData({ display: displayStr, hasVaccineSoon });
          } else {
            setHealthData(null);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${uid}`);
        }

        // Fetch Hobby Data
        try {
          const petsQuery = query(collection(db, 'pets'), where('ownerId', '==', uid));
          const plantsQuery = query(collection(db, 'plants'), where('ownerId', '==', uid));
          
          const [petsSnap, plantsSnap] = await Promise.all([
            getDocs(petsQuery),
            getDocs(plantsQuery)
          ]);

          if (!petsSnap.empty || !plantsSnap.empty) {
            setHobbyData({
              display: t('managing_pets_plants').replace('{pets}', petsSnap.size.toString()).replace('{plants}', plantsSnap.size.toString()),
              hasTaskToday: true
            });
          } else {
            setHobbyData(null);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.LIST, 'pets/plants');
        }

      } finally {
        setIsLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (user.displayName) {
          setUserName(user.displayName.split(' ')[0]);
        } else {
          setUserName('Mate');
        }
        fetchDashboardData(user.uid);
      } else {
        setUserName('Mate');
        setVehicleData(null);
        setHealthData(null);
        setHobbyData(null);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="p-6">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 dark:text-white leading-tight">{t('greeting')}, {userName}!</h1>
          <p className="text-stone-500 dark:text-neutral-400">{t('glance')}</p>
        </div>
        <div className="relative">
          <button 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative rounded-2xl bg-white dark:bg-neutral-900 p-3 shadow-sm active:scale-95 border border-stone-100 dark:border-neutral-800"
          >
            <Bell size={24} className="text-stone-600 dark:text-neutral-300" />
            {notifications.length > 0 && (
              <span className="absolute right-2 top-2 h-3 w-3 rounded-full border-2 border-white dark:border-neutral-900 bg-red-500"></span>
            )}
          </button>
          
          <AnimatePresence>
            {isNotifOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-64 md:w-80 z-50 rounded-2xl bg-white dark:bg-neutral-900 p-4 shadow-xl border border-stone-100 dark:border-neutral-800 overflow-hidden"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-bold text-stone-900 dark:text-white">{t('notifications')}</h3>
                  <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {notifications.length}
                  </span>
                </div>
                
                {notifications.length === 0 ? (
                  <p className="text-sm font-medium text-stone-400 dark:text-neutral-500 italic py-4 text-center">
                    {t('no_notifications')}
                  </p>
                ) : (
                  <ul className="max-h-60 overflow-y-auto w-full">
                    {notifications.map((msg, idx) => (
                      <li 
                        key={idx} 
                        className="border-b border-stone-100 dark:border-neutral-800 py-3 last:border-0"
                      >
                        <p className="text-sm font-medium text-stone-700 dark:text-neutral-300">{msg}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4">
        <ModuleCard
          icon={<Car className="text-blue-600 dark:text-blue-400" />}
          title={t('vehicle_check')}
          description={vehicleData?.display}
          color="bg-blue-50 dark:bg-blue-500/10"
          onClick={() => onNavigate('vehicle')}
          isLoading={isLoading}
          t={t}
        />
        <ModuleCard
          icon={<Heart className="text-rose-600 dark:text-rose-400" />}
          title={t('healthy_life')}
          description={healthData?.display}
          color="bg-rose-50 dark:bg-rose-500/10"
          onClick={() => onNavigate('health')}
          isLoading={isLoading}
          t={t}
        />
        <ModuleCard
          icon={<Utensils className="text-amber-600 dark:text-amber-400" />}
          title={t('smart_hobby')}
          description={hobbyData?.display}
          color="bg-amber-50 dark:bg-amber-500/10"
          onClick={() => onNavigate('hobby')}
          isLoading={isLoading}
          t={t}
        />
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-xl font-bold text-stone-900 dark:text-white">{t('quick_tips')}</h2>
        <div className="rounded-3xl bg-neutral-900 dark:bg-emerald-900/30 p-6 text-white dark:text-emerald-50 shadow-xl border border-transparent dark:border-emerald-800/50">
          <p className="text-lg font-medium">{t(`tip_${randomTipIndex}`)}</p>
        </div>
      </section>
    </div>
  );
}

function ModuleCard({ icon, title, description, color, onClick, isLoading, t }: any) {
  const isEmpty = description === null || description === '';
  
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-3xl bg-white dark:bg-neutral-900 p-5 text-left shadow-sm transition-all hover:shadow-md border border-stone-100 dark:border-neutral-800"
    >
      <div className="flex items-center space-x-4">
        <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl", color)}>
          {icon}
        </div>
        <div>
          <h3 className="font-bold text-lg text-stone-900 dark:text-white">{title}</h3>
          
          {isLoading ? (
            <div className="mt-1 flex items-center space-x-2">
              <div className="h-4 w-32 animate-pulse rounded-md bg-stone-200 dark:bg-neutral-800"></div>
            </div>
          ) : (
            <p className={cn("text-sm", isEmpty ? "text-stone-400 dark:text-neutral-500 italic" : "text-stone-500 dark:text-neutral-400")}>
              {isEmpty ? t('no_data') : description}
            </p>
          )}

        </div>
      </div>
      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", 
        !isLoading && isEmpty ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" : "text-stone-300 dark:text-neutral-600"
      )}>
        {!isLoading && isEmpty ? <Plus size={18} /> : <ArrowRight size={20} />}
      </div>
    </motion.button>
  );
}
