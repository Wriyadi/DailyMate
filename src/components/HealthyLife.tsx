import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, orderBy, limit, doc, setDoc, getDoc } from 'firebase/firestore';
import { Heart, Activity, Stethoscope, Ruler, Weight, User, MessageSquare, AlertTriangle, Camera, Plus, Zap, Baby, Calendar } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { geminiService } from '../services/geminiService';
import { HealthLog, Child } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function HealthyLife() {
  const { user, profile, updateProfile } = useAuth();
  const [logs, setLogs] = useState<HealthLog[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [activeTab, setActiveTab] = useState<'tracker' | 'nutrition' | 'assistant' | 'child'>('tracker');
  const [symptoms, setSymptoms] = useState('');
  const [symptomResult, setSymptomResult] = useState('');
  const [mealResult, setMealResult] = useState('');
  const [insightResult, setInsightResult] = useState('');
  const [childSymptoms, setChildSymptoms] = useState('');
  const [childTriageResult, setChildTriageResult] = useState('');
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [caloriesBurned, setCaloriesBurned] = useState(0);
  const [caloriesConsumed, setCaloriesConsumed] = useState(0);
  const [loadingAI, setLoadingAI] = useState(false);
  const [chronicDiseases, setChronicDiseases] = useState<string[]>([]);
  const [showChildForm, setShowChildForm] = useState(false);
  const [newChild, setNewChild] = useState<Partial<Child>>({ name: '', gender: 'male', age: 0, height: 0, weight: 0, allergies: '' });
  const [savingBio, setSavingBio] = useState(false);

  useEffect(() => {
    if (!user) return;
    const qLogs = query(
      collection(db, 'healthLogs'),
      where('userId', '==', user.uid),
      orderBy('date', 'desc'),
      limit(20)
    );
    const unsubLogs = onSnapshot(qLogs, (snapshot) => {
      setLogs(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as HealthLog)));
    });

    const qChildren = query(collection(db, 'children'), where('parentId', '==', user.uid));
    const unsubChildren = onSnapshot(qChildren, (snapshot) => {
      const childrenData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Child));
      setChildren(childrenData);
      if (childrenData.length > 0 && !selectedChildId) setSelectedChildId(childrenData[0].id!);
    });

    const loadBiometrics = async () => {
      try {
        const bioDoc = await getDoc(doc(db, 'users', user.uid, 'biometrics', 'data'));
        if (bioDoc.exists()) {
          const data = bioDoc.data();
          if (data.chronicDiseases) setChronicDiseases(data.chronicDiseases);
        }
      } catch (err) {
        console.error("Failed to load biometrics", err);
      }
    };
    loadBiometrics();

    return () => { unsubLogs(); unsubChildren(); };
  }, [user]);

  const handleSaveBiometrics = async () => {
    if (!user) return;
    setSavingBio(true);
    try {
      const bioPath = `users/${user.uid}/biometrics/data`;
      await setDoc(doc(db, 'users', user.uid, 'biometrics', 'data'), {
        chronicDiseases,
        age: profile?.age || 0,
        height: profile?.height || 0,
        weight: profile?.weight || 0,
        gender: profile?.gender || 'other',
        allergies: profile?.allergies || '',
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      await updateProfile({ chronicDiseases });
      alert("Biometrics saved successfully!");
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'users/biometrics');
    }
    setSavingBio(false);
  };

  const handleAddChild = async () => {
    if (!user || !newChild.name) return;
    const path = 'children';
    try {
      const h = Number(newChild.height) || 0;
      const w = Number(newChild.weight) || 0;
      const computedBmi = calculateBMI(h, w);
      
      await addDoc(collection(db, path), {
        ...newChild,
        parentId: user.uid,
        height: h,
        weight: w,
        age: Number(newChild.age) || 0,
        bmi: computedBmi
      });
      setShowChildForm(false);
      setNewChild({ name: '', gender: 'male', age: 0, height: 0, weight: 0, allergies: '' });
      alert("Child profile added successfully!");
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  };

  const calculateBMI = (h: number, w: number) => {
    if (!h || !w) return 0;
    const heightInMeters = h / 100;
    return parseFloat((w / (heightInMeters * heightInMeters)).toFixed(1));
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: 'Underweight', color: 'text-amber-500' };
    if (bmi < 25) return { label: 'Normal weight', color: 'text-emerald-500' };
    if (bmi < 30) return { label: 'Overweight', color: 'text-orange-500' };
    return { label: 'Obesity', color: 'text-red-500' };
  };

  const handleSymptomCheck = async () => {
    if (!symptoms.trim()) return;
    setLoadingAI(true);
    const result = await geminiService.checkSymptoms(symptoms, {
      age: profile?.age,
      gender: profile?.gender,
      allergies: profile?.allergies
    });
    setSymptomResult(result);
    setLoadingAI(false);
    
    const path = 'healthLogs';
    try {
      await addDoc(collection(db, path), {
        userId: user?.uid,
        type: 'symptom',
        date: new Date().toISOString(),
        note: symptoms,
        metadata: { result }
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  };

  const handleChildTriage = async () => {
    const child = children.find(c => c.id === selectedChildId);
    if (!child) return;

    setLoadingAI(true);
    const result = await geminiService.analyzeChildHealth({
      name: child.name,
      age: child.age,
      gender: child.gender,
      allergies: child.allergies,
      symptoms: childSymptoms
    });
    setChildTriageResult(result);
    setLoadingAI(false);

    const path = 'healthLogs';
    try {
      await addDoc(collection(db, path), {
        userId: user?.uid,
        childId: child.id,
        type: 'pediatric_triage',
        date: new Date().toISOString(),
        note: childSymptoms,
        metadata: { result }
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  };

  const handleMealOCR = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingAI(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const result = await geminiService.analyzeMeal(base64, profile?.gender || 'unknown', calculateBMI(profile?.height || 0, profile?.weight || 0));
      setMealResult(result);
      setLoadingAI(false);
      
      const path = 'healthLogs';
      try {
        await addDoc(collection(db, path), {
          userId: user?.uid,
          type: 'meal',
          date: new Date().toISOString(),
          note: 'Meal Analyzed',
          metadata: { result }
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGetInsights = async () => {
    setLoadingAI(true);
    const result = await geminiService.getHealthInsights(caloriesConsumed, caloriesBurned, calculateBMI(profile?.height || 0, profile?.weight || 0));
    setInsightResult(result);
    setLoadingAI(false);
  };

  const bmi = calculateBMI(profile?.height || 0, profile?.weight || 0);
  const bmiInfo = getBMICategory(bmi);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Healthy Life</h2>
        <p className="text-stone-500">Wellness tracking & insights.</p>
      </div>

      <div className="mb-6 flex rounded-2xl bg-stone-100 p-1">
        <button
          onClick={() => setActiveTab('tracker')}
          className={cn(
            "flex-1 rounded-xl py-2 text-[10px] sm:text-xs font-bold transition-all",
            activeTab === 'tracker' ? "bg-white text-emerald-600 shadow-sm" : "text-stone-500"
          )}
        >
          Trackers
        </button>
        <button
          onClick={() => setActiveTab('child')}
          className={cn(
            "flex-1 rounded-xl py-2 text-[10px] sm:text-xs font-bold transition-all",
            activeTab === 'child' ? "bg-white text-blue-600 shadow-sm" : "text-stone-500"
          )}
        >
          Child Care
        </button>
        <button
          onClick={() => setActiveTab('nutrition')}
          className={cn(
            "flex-1 rounded-xl py-2 text-[10px] sm:text-xs font-bold transition-all",
            activeTab === 'nutrition' ? "bg-white text-emerald-600 shadow-sm" : "text-stone-500"
          )}
        >
          Nutrition
        </button>
        <button
          onClick={() => setActiveTab('assistant')}
          className={cn(
            "flex-1 rounded-xl py-2 text-[10px] sm:text-xs font-bold transition-all",
            activeTab === 'assistant' ? "bg-white text-emerald-600 shadow-sm" : "text-stone-500"
          )}
        >
          Assistant
        </button>
      </div>

      {activeTab === 'tracker' && (
        <div className="space-y-6">
          <section className="rounded-3xl bg-white p-6 shadow-sm border border-stone-100">
            <h3 className="mb-4 flex items-center font-bold text-stone-900 border-b pb-2">
              <User size={18} className="mr-2 text-emerald-500" />
              Biometrics
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center">
                  <User size={10} className="mr-1" /> Age
                </label>
                <input
                  type="number"
                  value={profile?.age || ''}
                  onChange={e => updateProfile({ age: parseInt(e.target.value) || 0 })}
                  className="w-full bg-stone-50 rounded-xl px-3 py-2 font-bold focus:bg-white focus:ring-1 focus:ring-emerald-100 transition-all border-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center">
                   Gender
                </label>
                <select
                  value={profile?.gender || 'other'}
                  onChange={e => updateProfile({ gender: e.target.value as any })}
                  className="w-full bg-stone-50 rounded-xl px-3 py-2 font-bold border-none"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center">
                  <AlertTriangle size={10} className="mr-1" /> Known Allergies
                </label>
                <input
                  type="text"
                  placeholder="e.g. Peanuts, Penicillin..."
                  value={profile?.allergies || ''}
                  onChange={e => updateProfile({ allergies: e.target.value })}
                  className="w-full bg-stone-50 rounded-xl px-3 py-2 font-bold focus:bg-white focus:ring-1 focus:ring-emerald-100 transition-all border-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center">
                  <Heart size={10} className="mr-1" /> Chronic Diseases
                </label>
                <div className="flex flex-col space-y-2 max-h-32 overflow-y-auto">
                  {['Hypertension', 'Diabetes', 'Heart Disease', 'Asthma', 'Kidney Disease'].map(disease => (
                    <label key={disease} className="flex items-center space-x-2 text-sm font-medium text-stone-700">
                      <input
                        type="checkbox"
                        checked={chronicDiseases.includes(disease)}
                        onChange={(e) => {
                          if (e.target.checked) setChronicDiseases([...chronicDiseases, disease]);
                          else setChronicDiseases(chronicDiseases.filter(d => d !== disease));
                        }}
                        className="rounded text-emerald-500 focus:ring-emerald-500"
                      />
                      <span>{disease}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center">
                  <Ruler size={10} className="mr-1" /> Height (cm)
                </label>
                <input
                  type="number"
                  value={profile?.height || ''}
                  onChange={e => updateProfile({ height: parseInt(e.target.value) || 0 })}
                  className="w-full bg-stone-50 rounded-xl px-3 py-2 font-bold focus:bg-white focus:ring-1 focus:ring-emerald-100 transition-all border-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center">
                  <Weight size={10} className="mr-1" /> Weight (kg)
                </label>
                <input
                  type="number"
                  value={profile?.weight || ''}
                  onChange={e => updateProfile({ weight: parseInt(e.target.value) || 0 })}
                  className="w-full bg-stone-50 rounded-xl px-3 py-2 font-bold focus:bg-white focus:ring-1 focus:ring-emerald-100 transition-all border-none"
                />
              </div>
            </div>
            
            <button 
              onClick={handleSaveBiometrics} 
              disabled={savingBio}
              className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-sm hover:bg-emerald-700 active:scale-95 transition-all mb-6"
            >
              {savingBio ? 'Saving...' : 'Save/Update Biometrics'}
            </button>

            {bmi > 0 && (
              <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-100/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Body Mass Index</p>
                    <p className="text-3xl font-black text-emerald-900">{bmi}</p>
                    <p className={cn("text-xs font-bold mt-1", bmiInfo.color)}>{bmiInfo.label}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full border-4 border-emerald-200 border-t-emerald-500"></div>
                </div>
              </div>
            )}
          </section>

          {profile?.gender === 'female' && (
            <section className="rounded-3xl bg-white p-6 shadow-sm border border-stone-100">
              <h3 className="mb-4 flex items-center font-bold text-stone-900 border-b pb-2">
                <Activity size={18} className="mr-2 text-rose-500" />
                Reproductive Health
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1 block">Last Ovulation Date</label>
                  <input
                    type="date"
                    value={profile?.lastOvulationDate?.split('T')[0] || ''}
                    onChange={e => updateProfile({ lastOvulationDate: new Date(e.target.value).toISOString() })}
                    className="w-full bg-rose-50 rounded-xl px-4 py-3 font-bold text-rose-900 outline-none focus:ring-1 focus:ring-rose-200 border-none"
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-rose-50 border border-rose-100">
                  <div className="px-2">
                    <p className="text-sm font-bold text-rose-900">Fertility Prediction</p>
                    <p className="text-[10px] uppercase font-bold text-rose-400 tracking-wide">Ovulation expected soon</p>
                  </div>
                  <Calendar size={20} className="text-rose-500 mr-2" />
                </div>
              </div>
            </section>
          )}

          <section>
            <h3 className="mb-4 text-xs font-bold text-stone-400 uppercase tracking-widest">Recent Logs</h3>
            <div className="space-y-3">
              {logs.map(log => (
                <div key={log.id} className="rounded-2xl bg-white p-4 shadow-sm flex items-start space-x-3 border border-stone-50">
                  <div className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    log.type === 'symptom' ? "bg-amber-50 text-amber-600" : 
                    log.type === 'meal' ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"
                  )}>
                    {log.type === 'symptom' ? <Stethoscope size={18} /> : <Activity size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-stone-800 capitalize leading-tight">{log.type}</p>
                    <p className="truncate text-xs text-stone-400 font-medium">{log.note || 'No notes'}</p>
                    <p className="text-[10px] text-stone-300 mt-1">{new Date(log.date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {activeTab === 'child' && (
        <div className="space-y-6">
          <section className="rounded-3xl bg-white p-6 shadow-sm border border-stone-100">
            <h3 className="mb-4 flex items-center font-bold text-stone-900 border-b pb-2">
              <Baby size={18} className="mr-2 text-blue-500" />
              Pediatric Health Management
            </h3>
            
            <div className="flex space-x-3 overflow-x-auto pb-4 scrollbar-none">
              {children.map(child => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChildId(child.id!)}
                  className={cn(
                    "min-w-[120px] rounded-2xl p-4 text-left transition-all border",
                    selectedChildId === child.id ? "bg-blue-600 text-white border-blue-600 shadow-md" : "bg-stone-50 text-stone-600 border-stone-100"
                  )}
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">{child.gender}</p>
                  <p className="font-bold truncate">{child.name}</p>
                  <p className="text-xs font-medium opacity-80">{child.age} yrs</p>
                </button>
              ))}
              <label 
                onClick={() => setShowChildForm(true)}
                className="min-w-[120px] cursor-pointer rounded-2xl border-2 border-dashed border-stone-200 flex flex-col items-center justify-center p-4 text-stone-400 hover:bg-stone-50 transition-all"
              >
                 <Plus size={24} />
                 <span className="text-[10px] font-bold uppercase mt-1">Add Child</span>
              </label>
            </div>

            <AnimatePresence>
              {showChildForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 rounded-2xl bg-stone-50 p-4 border border-stone-100 space-y-4">
                    <h4 className="font-bold text-sm text-stone-900 border-b pb-2">New Child Profile</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" placeholder="Name" value={newChild.name || ''} onChange={e => setNewChild({...newChild, name: e.target.value})} className="w-full rounded-xl border-none px-3 py-2 text-sm font-bold bg-white focus:ring-1 focus:ring-blue-100" />
                      <input type="number" placeholder="Age" value={newChild.age || ''} onChange={e => setNewChild({...newChild, age: Number(e.target.value)})} className="w-full rounded-xl border-none px-3 py-2 text-sm font-bold bg-white focus:ring-1 focus:ring-blue-100" />
                      <select value={newChild.gender || 'male'} onChange={e => setNewChild({...newChild, gender: e.target.value as any})} className="w-full rounded-xl border-none px-3 py-2 text-sm font-bold bg-white focus:ring-1 focus:ring-blue-100">
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                      <input type="text" placeholder="Known Allergies" value={newChild.allergies || ''} onChange={e => setNewChild({...newChild, allergies: e.target.value})} className="w-full rounded-xl border-none px-3 py-2 text-sm font-bold bg-white focus:ring-1 focus:ring-blue-100" />
                      <input type="number" placeholder="Height (cm)" value={newChild.height || ''} onChange={e => setNewChild({...newChild, height: Number(e.target.value)})} className="w-full rounded-xl border-none px-3 py-2 text-sm font-bold bg-white focus:ring-1 focus:ring-blue-100" />
                      <input type="number" placeholder="Weight (kg)" value={newChild.weight || ''} onChange={e => setNewChild({...newChild, weight: Number(e.target.value)})} className="w-full rounded-xl border-none px-3 py-2 text-sm font-bold bg-white focus:ring-1 focus:ring-blue-100" />
                    </div>
                    <div className="flex space-x-2 pt-2">
                       <button onClick={handleAddChild} className="flex-1 bg-blue-600 text-white py-2 rounded-xl text-sm font-bold shadow-sm active:scale-95">Save</button>
                       <button onClick={() => setShowChildForm(false)} className="flex-1 bg-white text-stone-600 border border-stone-200 py-2 rounded-xl text-sm font-bold active:scale-95">Cancel</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {selectedChildId && (
              <div className="mt-4 space-y-6">
                <div className="rounded-2xl bg-blue-50 p-4 border border-blue-100">
                   <div className="mb-4 flex items-center space-x-2 text-blue-600">
                     <Stethoscope size={18} />
                     <h4 className="font-bold text-sm">Pediatric Symptoms Triage</h4>
                   </div>
                   <textarea
                     value={childSymptoms}
                     onChange={e => setChildSymptoms(e.target.value)}
                     placeholder="e.g. Fever for 1 day, rash on arms..."
                     className="mb-4 h-24 w-full rounded-xl bg-white p-4 text-sm outline-none focus:ring-1 focus:ring-blue-200 border-none resize-none placeholder:text-stone-300"
                   />
                   <button onClick={handleChildTriage} disabled={loadingAI || !childSymptoms.trim()} className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white shadow-md active:scale-95 disabled:opacity-50 transition-all text-sm">
                      {loadingAI ? 'Analyzing...' : 'Analyze Health'}
                   </button>

                   {childTriageResult && (
                     <div className="mt-4 rounded-xl bg-white p-4 text-xs text-blue-900 leading-relaxed whitespace-pre-wrap font-medium">
                       {childTriageResult}
                     </div>
                   )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-stone-50 p-4 border border-stone-100">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 flex items-center">
                      <Heart size={10} className="mr-1 text-red-400" /> Vaccination Status
                    </p>
                    <p className="text-xs font-medium text-stone-600 italic">Consult AI above for schedule estimates.</p>
                  </div>
                  <div className="rounded-2xl bg-stone-50 p-4 border border-stone-100">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 flex items-center">
                      <Zap size={10} className="mr-1 text-amber-400" /> Milk & Nutrients
                    </p>
                    <p className="text-xs font-medium text-stone-600 italic">Personalized based on child allergies.</p>
                  </div>
                </div>
              </div>
            )}

            {!selectedChildId && children.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-stone-400">Add a child profile to get started with pediatric health tracking.</p>
              </div>
            )}
          </section>
        </div>
      )}

      {activeTab === 'nutrition' && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-stone-100 text-center">
             <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-500">
                <Camera size={32} />
             </div>
             <h3 className="text-lg font-bold">Smart Nutrition Tracker</h3>
             <p className="text-sm text-stone-500 mb-6 mt-2">Take a picture of your meal. We'll estimate calories and carbs, then suggest additions to balance your diet.</p>
             
             <label className="relative flex w-full cursor-pointer items-center justify-center space-x-2 rounded-2xl bg-blue-600 py-4 font-bold text-white shadow-lg transition-all active:scale-95">
                {loadingAI && !mealResult ? 'Analyzing Meal...' : <><Camera size={20} /><span>Upload Meal Photo</span></>}
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleMealOCR} disabled={loadingAI} />
             </label>
          </div>

          <AnimatePresence>
            {mealResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl bg-blue-50 p-6 shadow-sm border border-blue-100"
              >
                <div className="mb-4 flex items-center text-blue-700">
                  <MessageSquare size={20} className="mr-2" />
                  <h4 className="font-bold">Nutrition Insights</h4>
                </div>
                <div className="prose prose-sm text-blue-900 leading-relaxed whitespace-pre-wrap font-medium">
                  {mealResult}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {activeTab === 'assistant' && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-neutral-900 p-6 text-white shadow-xl relative overflow-hidden">
             <div className="relative z-10">
               <h3 className="mb-2 flex items-center text-lg font-bold">
                 <Zap size={20} className="mr-2 text-emerald-400" /> Virtual Health Assistant
               </h3>
               <p className="text-sm text-stone-400 mb-6">Compare daily caloric intake with calories burned for personalized insights.</p>
               
               <div className="grid grid-cols-2 gap-4 mb-6">
                 <div className="bg-white/10 rounded-2xl p-4">
                   <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Consumed (kcal)</p>
                   <input type="number" value={caloriesConsumed || ''} onChange={e => setCaloriesConsumed(parseInt(e.target.value)||0)} className="w-full bg-transparent text-xl font-bold text-white outline-none placeholder:text-stone-600" placeholder="0" />
                 </div>
                 <div className="bg-white/10 rounded-2xl p-4">
                   <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Burned (kcal)</p>
                   {/* In a real app this would sync via Google Fit. We allow manual entry for demo. */}
                   <input type="number" value={caloriesBurned || ''} onChange={e => setCaloriesBurned(parseInt(e.target.value)||0)} className="w-full bg-transparent text-xl font-bold text-emerald-400 outline-none placeholder:text-stone-600" placeholder="0" />
                 </div>
               </div>

               <button onClick={handleGetInsights} disabled={loadingAI || (!caloriesConsumed && !caloriesBurned)} className="w-full rounded-2xl bg-white py-4 font-bold text-neutral-900 shadow-lg active:scale-95 disabled:opacity-50 transition-all">
                 {loadingAI && !insightResult ? 'Analyzing...' : 'Get Daily Insights'}
               </button>
             </div>
             <div className="absolute -right-4 -top-4 h-32 w-32 rounded-full bg-emerald-500/20 blur-3xl"></div>
          </div>

          <AnimatePresence>
            {insightResult && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-white p-6 shadow-sm border border-stone-100">
                <div className="mb-4 flex items-center text-emerald-600">
                  <MessageSquare size={20} className="mr-2" />
                  <h4 className="font-bold">Daily Summary</h4>
                </div>
                <div className="prose prose-sm text-stone-600 leading-relaxed whitespace-pre-wrap">
                  {insightResult}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="rounded-3xl bg-white p-6 shadow-sm border border-stone-100">
             <div className="mb-4 flex items-center space-x-2 text-amber-600">
               <AlertTriangle size={20} />
               <p className="text-[10px] font-bold uppercase tracking-widest">AI Symptom Checker</p>
             </div>
             <p className="text-sm text-stone-500 mb-4">Describe your symptoms below for a preliminary analysis.</p>
             <textarea
                value={symptoms}
                onChange={e => setSymptoms(e.target.value)}
                placeholder="e.g. Headache for 2 days, slightly feverish..."
                className="mb-4 h-24 w-full rounded-2xl bg-stone-50 p-4 text-sm outline-none focus:ring-2 focus:ring-emerald-200 border-none resize-none"
             />
             <button onClick={handleSymptomCheck} disabled={loadingAI || !symptoms.trim()} className="flex w-full items-center justify-center space-x-2 rounded-2xl bg-emerald-600 py-3 font-bold text-white shadow-lg disabled:opacity-50 active:scale-95 transition-all">
                {loadingAI && !symptomResult ? 'Analyzing...' : <><Stethoscope size={18} /><span>Check Symptoms</span></>}
             </button>

             {symptomResult && (
               <div className="mt-4 rounded-2xl bg-amber-50 p-4 border border-amber-100 text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">
                 {symptomResult}
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
}
