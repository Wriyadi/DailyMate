import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Car, Heart, Utensils, ArrowRight, Bell, Plus } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { cn } from '../lib/utils';
import { UserProfile, Vehicle } from '../types';

export default function Dashboard({ onNavigate }: { onNavigate: (tab: any) => void }) {
  const [userName, setUserName] = useState('');
  
  // State Management untuk Data
  const [vehicleData, setVehicleData] = useState<string | null>(null);
  const [healthData, setHealthData] = useState<string | null>(null);
  const [hobbyData, setHobbyData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
            const status = diff > 0 ? `in ${diff} km` : `${Math.abs(diff)} km overdue`;
            setVehicleData(`${vehicle.name}: Service ${status}`);
          } else {
            setVehicleData(null);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.LIST, 'vehicles');
        }

        // Fetch Health Data
        try {
          const userDocRef = doc(db, 'users', uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const profile = userDoc.data() as UserProfile;
            if (profile.height && profile.weight) {
              const heightInMeters = profile.height / 100;
              const bmi = (profile.weight / (heightInMeters * heightInMeters)).toFixed(1);
              setHealthData(`Current BMI: ${bmi} kg/m²`);
            } else {
              setHealthData(null);
            }
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
            setHobbyData(`Managing ${petsSnap.size} pets & ${plantsSnap.size} plants`);
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
          <h1 className="text-3xl font-bold text-stone-900 dark:text-white leading-tight">Hello, {userName}!</h1>
          <p className="text-stone-500 dark:text-neutral-400">Your day at a glance.</p>
        </div>
        <button className="relative rounded-2xl bg-white dark:bg-neutral-900 p-3 shadow-sm active:scale-95 border border-stone-100 dark:border-neutral-800">
          <Bell size={24} className="text-stone-600 dark:text-neutral-300" />
          <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-neutral-900 bg-red-500"></span>
        </button>
      </header>

      <div className="grid grid-cols-1 gap-4">
        <ModuleCard
          icon={<Car className="text-blue-600 dark:text-blue-400" />}
          title="Vehicle Check"
          description={vehicleData}
          color="bg-blue-50 dark:bg-blue-500/10"
          onClick={() => onNavigate('vehicle')}
          isLoading={isLoading}
        />
        <ModuleCard
          icon={<Heart className="text-rose-600 dark:text-rose-400" />}
          title="Healthy Life"
          description={healthData}
          color="bg-rose-50 dark:bg-rose-500/10"
          onClick={() => onNavigate('health')}
          isLoading={isLoading}
        />
        <ModuleCard
          icon={<Utensils className="text-amber-600 dark:text-amber-400" />}
          title="Smart Hobby"
          description={hobbyData}
          color="bg-amber-50 dark:bg-amber-500/10"
          onClick={() => onNavigate('hobby')}
          isLoading={isLoading}
        />
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-xl font-bold text-stone-900 dark:text-white">Quick Tips</h2>
        <div className="rounded-3xl bg-neutral-900 dark:bg-emerald-900/30 p-6 text-white dark:text-emerald-50 shadow-xl border border-transparent dark:border-emerald-800/50">
          <p className="mb-3 text-lg font-medium">Regular check-ups save 20% on maintenance costs.</p>
          <button className="flex items-center space-x-2 text-sm text-emerald-400 dark:text-emerald-300 font-semibold uppercase tracking-wider">
            <span>Learn More</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </section>
    </div>
  );
}

function ModuleCard({ icon, title, description, color, onClick, isLoading }: any) {
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
              {isEmpty ? 'Belum ada data. Klik untuk menambahkan' : description}
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
