import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { Camera, Plus, Trash2, Gauge, AlertCircle, Fuel, Settings2, Car, Wrench, History, Edit2, X, Check } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { geminiService } from '../services/geminiService';
import { Vehicle, ServiceLog } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function VehicleCheck() {
  const { t, formatNumber, language } = useLanguage();
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [loadingOCR, setLoadingOCR] = useState(false);
  const [newVehicle, setNewVehicle] = useState<Partial<Vehicle>>({
    type: 'car',
    brand: '',
    transmission: 'automatic',
    fuelType: 'gasoline',
    name: '',
    odometer: 0,
    maintenanceInterval: 5000,
  });

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'vehicles'), where('ownerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setVehicles(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Vehicle)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'vehicles'));
    return () => unsubscribe();
  }, [user]);

  const handleAddVehicle = async () => {
    if (!user || !newVehicle.name || !newVehicle.brand) return;
    const path = 'vehicles';
    try {
      await addDoc(collection(db, path), {
        ...newVehicle,
        ownerId: user.uid,
        lastServiceMileage: newVehicle.odometer,
        lastServiceDate: new Date().toISOString(),
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
    setIsAdding(false);
    setNewVehicle({ type: 'car', brand: '', transmission: 'automatic', fuelType: 'gasoline', name: '', odometer: 0, maintenanceInterval: 5000 });
  };



  const handleOCR = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingOCR(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const mileage = await geminiService.extractOdometer(base64);
      if (mileage !== null) {
        setNewVehicle(prev => ({ ...prev, odometer: mileage }));
      }
      setLoadingOCR(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t('vehicle_check')}</h2>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg active:scale-95"
        >
          {isAdding ? <Settings2 size={20} /> : <Plus size={20} />}
        </button>
      </div>

      <AnimatePresence>
      {isAdding && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="mb-8 overflow-hidden rounded-3xl bg-white dark:bg-neutral-900 p-6 shadow-sm border border-stone-100 dark:border-neutral-800"
        >
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase text-stone-400 dark:text-neutral-500 mb-2 block tracking-wider">Vehicle Name</label>
              <input
                type="text"
                placeholder="e.g. My Civic"
                value={newVehicle.name}
                onChange={e => setNewVehicle(p => ({ ...p, name: e.target.value }))}
                className="w-full rounded-2xl bg-stone-50 dark:bg-neutral-800 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200 border-none text-stone-900 dark:text-neutral-100 placeholder-stone-400 dark:placeholder-neutral-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase text-stone-400 dark:text-neutral-500 mb-2 block tracking-wider">Brand</label>
                <input
                  type="text"
                  placeholder="e.g. Honda"
                  value={newVehicle.brand}
                  onChange={e => setNewVehicle(p => ({ ...p, brand: e.target.value }))}
                  className="w-full rounded-2xl bg-stone-50 dark:bg-neutral-800 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200 border-none text-stone-900 dark:text-neutral-100 placeholder-stone-400 dark:placeholder-neutral-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-stone-400 dark:text-neutral-500 mb-2 block tracking-wider">Type</label>
                <select
                  value={newVehicle.type}
                  onChange={e => setNewVehicle(p => ({ ...p, type: e.target.value as any }))}
                  className="w-full rounded-2xl bg-stone-50 dark:bg-neutral-800 px-4 py-3 border-none outline-none focus:ring-2 focus:ring-blue-200 text-stone-900 dark:text-neutral-100"
                >
                  <option value="car" className="dark:bg-neutral-900">Car</option>
                  <option value="motorcycle" className="dark:bg-neutral-900">Motorcycle</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase text-stone-400 dark:text-neutral-500 mb-2 block tracking-wider">Fuel Type</label>
                <select
                  value={newVehicle.fuelType}
                  onChange={e => setNewVehicle(p => ({ ...p, fuelType: e.target.value as any }))}
                  className="w-full rounded-2xl bg-stone-50 dark:bg-neutral-800 px-4 py-3 border-none outline-none focus:ring-2 focus:ring-blue-200 text-stone-900 dark:text-neutral-100"
                >
                  <option value="gasoline" className="dark:bg-neutral-900">Gasoline</option>
                  <option value="diesel" className="dark:bg-neutral-900">Diesel</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-stone-400 dark:text-neutral-500 mb-2 block tracking-wider">Transmission</label>
                <select
                  value={newVehicle.transmission}
                  onChange={e => setNewVehicle(p => ({ ...p, transmission: e.target.value as any }))}
                  className="w-full rounded-2xl bg-stone-50 dark:bg-neutral-800 px-4 py-3 border-none outline-none focus:ring-2 focus:ring-blue-200 text-stone-900 dark:text-neutral-100"
                >
                  <option value="automatic" className="dark:bg-neutral-900">Automatic</option>
                  <option value="manual" className="dark:bg-neutral-900">Manual</option>
                </select>
              </div>
            </div>
            <div className="relative">
              <label className="text-xs font-semibold uppercase text-stone-400 dark:text-neutral-500 mb-2 block tracking-wider">Odometer Reading</label>
              <input
                type="number"
                placeholder="Current Mileage"
                value={newVehicle.odometer || ''}
                onChange={e => setNewVehicle(p => ({ ...p, odometer: parseInt(e.target.value) || 0 }))}
                className="w-full rounded-2xl bg-stone-50 dark:bg-neutral-800 px-4 py-3 border-none outline-none focus:ring-2 focus:ring-blue-200 text-stone-900 dark:text-neutral-100 placeholder-stone-400 dark:placeholder-neutral-500"
              />
              <label className="absolute right-3 top-9 cursor-pointer text-blue-600 bg-blue-50 dark:bg-blue-900/30 p-1 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                <Camera size={20} />
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleOCR} />
              </label>
            </div>
            {loadingOCR && <p className="text-xs text-blue-600 dark:text-blue-400 animate-pulse font-medium">Extracting mileage with AI...</p>}
            <button
              onClick={handleAddVehicle}
              className="w-full rounded-2xl bg-blue-600 py-3 font-semibold text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
            >
              Add Vehicle
            </button>
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      <div className="space-y-6">
        {vehicles.map(vehicle => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} />
        ))}
        {vehicles.length === 0 && !isAdding && (
          <div className="flex flex-col items-center justify-center p-12 text-center text-stone-400 dark:text-neutral-500 rounded-3xl border-2 border-dashed border-stone-200 dark:border-neutral-800">
            <Car size={48} className="mb-4 opacity-20" />
            <p className="font-medium">No vehicles added yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
}

const VehicleCard: React.FC<{ vehicle: Vehicle }> = ({ vehicle }) => {
  const { t, formatNumber, language } = useLanguage();
  const { user } = useAuth();
  const [logs, setLogs] = useState<ServiceLog[]>([]);
  const [showLogForm, setShowLogForm] = useState(false);
  const [newLog, setNewLog] = useState({ description: '', cost: '', newOdometer: vehicle.odometer.toString() });
  
  const [showUpdateOdo, setShowUpdateOdo] = useState(false);
  const [newOdoValue, setNewOdoValue] = useState(vehicle.odometer.toString());
  const [loadingOCR, setLoadingOCR] = useState(false);

  const nextService = vehicle.lastServiceMileage + vehicle.maintenanceInterval;
  const remaining = nextService - vehicle.odometer;
  const percentage = Math.max(0, Math.min(100, (remaining / vehicle.maintenanceInterval) * 100));

  useEffect(() => {
    if (!vehicle.id || !user) return;
    const path = `users/${user.uid}/vehicles/${vehicle.id}/serviceLogs`;
    const q = query(collection(db, path), orderBy('date', 'desc'));
    const unsub = onSnapshot(q, s => {
      setLogs(s.docs.map(d => ({ id: d.id, ...d.data() } as ServiceLog)));
    }, (error) => handleFirestoreError(error, OperationType.GET, path));
    return () => unsub();
  }, [vehicle.id, user]);

  const handleUpdateOdometer = async () => {
    if (!user || !vehicle.id) return;
    const odo = parseInt(newOdoValue);
    if (isNaN(odo) || odo < 0) return;
    
    try {
      const vRef = doc(db, 'vehicles', vehicle.id);
      await updateDoc(vRef, {
        odometer: odo
      });
      setShowUpdateOdo(false);
    } catch (error) {
      console.error(error);
      alert('Failed to update odometer');
    }
  };

  const handleOdoOCR = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingOCR(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const mileage = await geminiService.extractOdometer(base64);
      if (mileage !== null) {
        setNewOdoValue(mileage.toString());
      }
      setLoadingOCR(false);
    };
    reader.readAsDataURL(file);
  };

  const handleAddLog = async () => {
    if (!newLog.description || !newLog.cost || !user) return;
    
    // 1. Validasi Tipe Data (Casting)
    const finalCost = Number(newLog.cost) || 0;
    const finalOdo = Number(newLog.newOdometer) || vehicle.odometer;
    
    // 2. Struktur Firebase Reference (Sub-collection)
    const logPath = `users/${user.uid}/vehicles/${vehicle.id}/serviceLogs`;

    try {
      // 3. Penambahan Timestamp & Update Induk
      const { serverTimestamp } = await import('firebase/firestore');
      
      await addDoc(collection(db, logPath), {
        date: new Date().toISOString(), // Fallback / Local display format if needed, but we could use serverTimestamp
        timestamp: serverTimestamp(),
        mileage: finalOdo,
        description: newLog.description,
        costRupiah: finalCost
      });
      
      // Update dokumen kendaraan induknya
      const vRef = doc(db, 'vehicles', vehicle.id!);
      await updateDoc(vRef, {
         odometer: finalOdo,
         lastServiceMileage: finalOdo,
         lastServiceDate: new Date().toISOString() // Or serverTimestamp
      });
      
      setShowLogForm(false);
      setNewLog({ description: '', cost: '', newOdometer: finalOdo.toString() });
    } catch (error: any) {
      // 4. Error Handling
      console.error(error);
      alert(error.message || 'Gagal menyimpan log service');
      handleFirestoreError(error, OperationType.WRITE, logPath);
    }
  };

  return (
    <motion.div
      layout
      className="overflow-hidden rounded-3xl bg-white dark:bg-neutral-900 p-5 shadow-sm border border-stone-50 dark:border-neutral-800/50"
    >
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold text-stone-900 dark:text-white">{vehicle.name} <span className="text-sm font-normal text-stone-400 dark:text-neutral-500">({vehicle.brand})</span></h3>
          <p className="flex items-center text-xs text-stone-400 dark:text-neutral-400 font-medium uppercase tracking-wider">
            <Fuel size={12} className="mr-1" />
            {t(vehicle.fuelType)} • {t(vehicle.transmission)}
          </p>
        </div>
        <div className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          vehicle.type === 'car' ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400" : "bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400"
        )}>
          <Car size={20} />
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4">
        <div className="rounded-2xl bg-stone-50 dark:bg-neutral-800/60 p-3 relative">
          <div className="flex justify-between items-center mb-1">
            <p className="text-[10px] font-bold text-stone-400 dark:text-neutral-500 uppercase tracking-widest">{t('mileage')}</p>
            {!showUpdateOdo && (
              <button 
                onClick={() => { setShowUpdateOdo(true); setNewOdoValue(vehicle.odometer.toString()); }}
                className="text-stone-400 dark:text-neutral-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                title="Update Odometer"
              >
                <Edit2 size={12} />
              </button>
            )}
          </div>
          
          {showUpdateOdo ? (
             <div className="flex flex-col space-y-2 mt-1">
               <div className="flex items-center space-x-2">
                 <input 
                   type="number" 
                   value={newOdoValue} 
                   onChange={e => setNewOdoValue(e.target.value)} 
                   className="w-full text-sm font-bold bg-white dark:bg-neutral-700 px-2 py-1 rounded-md outline-none border border-stone-200 dark:border-neutral-600 text-stone-900 dark:text-white"
                 />
                 <label className="cursor-pointer text-stone-400 dark:text-neutral-400 hover:text-blue-500 dark:hover:text-blue-400 p-1 bg-stone-100 dark:bg-neutral-600 rounded-md transition-colors relative">
                   {loadingOCR ? <span className="animate-spin text-xs">...</span> : <Camera size={14} />}
                   <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleOdoOCR} disabled={loadingOCR} />
                 </label>
               </div>
               <div className="flex space-x-2 justify-end">
                 <button onClick={() => setShowUpdateOdo(false)} className="p-1 rounded-md bg-stone-200 dark:bg-neutral-600 text-stone-600 dark:text-neutral-300 hover:bg-stone-300 dark:hover:bg-neutral-500">
                   <X size={14} />
                 </button>
                 <button onClick={handleUpdateOdometer} className="p-1 rounded-md bg-blue-500 text-white hover:bg-blue-600">
                   <Check size={14} />
                 </button>
               </div>
             </div>
          ) : (
            <p className="text-lg font-bold flex items-center text-stone-900 dark:text-white">
              {formatNumber(vehicle.odometer)}
              <span className="ml-1 text-[10px] text-stone-400 dark:text-neutral-500 font-normal">km</span>
            </p>
          )}
        </div>
        <div className="rounded-2xl bg-stone-50 dark:bg-neutral-800/60 p-3">
          <p className="text-[10px] font-bold text-stone-400 dark:text-neutral-500 uppercase tracking-widest">{t('interval')}</p>
          <p className="text-lg font-bold flex items-center text-stone-900 dark:text-white">
            {formatNumber(vehicle.maintenanceInterval)}
            <span className="ml-1 text-[10px] text-stone-400 dark:text-neutral-500 font-normal">km</span>
          </p>
        </div>
      </div>

      <div className="space-y-2 mb-6">
        <div className="flex justify-between text-xs font-semibold">
          <span className="text-stone-500 dark:text-neutral-400">Service Status</span>
          <span className={cn(
            remaining < 500 ? "text-red-500 dark:text-red-400" : "text-emerald-500 dark:text-emerald-400"
          )}>
            {remaining > 0 ? `${formatNumber(remaining)} ${t('km_left')}` : t('service_required')}
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-neutral-800">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            className={cn(
              "h-full transition-all rounded-full",
              percentage < 20 ? "bg-red-500" : "bg-emerald-500"
            )}
          />
        </div>
      </div>

      {remaining < 500 && (
        <div className="mb-6 flex items-center space-x-2 rounded-xl bg-red-50 dark:bg-red-950/30 p-3 text-red-600 dark:text-red-400">
          <AlertCircle size={16} />
          <p className="text-xs font-bold leading-tight uppercase tracking-wide">{t('schedule_main_soon')}</p>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-stone-100 dark:border-neutral-800">
        <div className="flex justify-between items-center mb-4">
           <h4 className="flex items-center text-sm font-bold text-stone-700 dark:text-neutral-300">
             <History size={16} className="mr-2" /> {t('service_history')}
           </h4>
           <button onClick={() => setShowLogForm(!showLogForm)} className="flex items-center text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg dark:bg-blue-950/30 dark:text-blue-400">
             <Plus size={14} className="mr-1"/> {t('add_log')}
           </button>
        </div>

        <AnimatePresence>
          {showLogForm && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-4 rounded-2xl bg-stone-50 dark:bg-neutral-800 p-4 space-y-3">
              <input type="text" placeholder="Service Description (e.g. Oil Change)" value={newLog.description} onChange={e => setNewLog(p => ({ ...p, description: e.target.value }))} className="w-full text-sm rounded-xl px-3 py-2 border-none bg-white dark:bg-neutral-700 text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-neutral-500 outline-none focus:ring-1 focus:ring-blue-200" />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="Cost (Rp)" value={newLog.cost} onChange={e => setNewLog(p => ({ ...p, cost: e.target.value }))} className="w-full text-sm rounded-xl px-3 py-2 border-none bg-white dark:bg-neutral-700 text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-neutral-500 outline-none focus:ring-1 focus:ring-blue-200" />
                <input type="number" placeholder="New Odometer" value={newLog.newOdometer} onChange={e => setNewLog(p => ({ ...p, newOdometer: e.target.value }))} className="w-full text-sm rounded-xl px-3 py-2 border-none bg-white dark:bg-neutral-700 text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-neutral-500 outline-none focus:ring-1 focus:ring-blue-200" />
              </div>
              <button onClick={handleAddLog} className="w-full rounded-xl bg-stone-900 text-white py-2 font-bold text-sm active:scale-95 transition-all dark:bg-neutral-100 dark:text-neutral-950">Save Service Log</button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-3">
          {logs.map((log) => (
             <div key={log.id} className="flex justify-between items-start rounded-2xl bg-stone-50 dark:bg-neutral-800/60 p-3">
               <div>
                 <p className="text-sm font-bold text-stone-800 dark:text-neutral-200">{log.description}</p>
                 <p className="text-[10px] text-stone-500 dark:text-neutral-400 font-medium">{new Date(log.date).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US')} • {formatNumber(log.mileage)}km</p>
               </div>
               <p className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md dark:bg-emerald-950/30 dark:text-emerald-400">
                 {formatRupiah(log.costRupiah)}
               </p>
             </div>
          ))}
          {logs.length === 0 && !showLogForm && (
            <p className="text-xs text-stone-400 dark:text-neutral-500 italic">{t('no_service_history')}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
