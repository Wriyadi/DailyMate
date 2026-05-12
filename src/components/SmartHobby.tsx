import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';
import { PawPrint, Leaf, Utensils, Search, Plus, MessageCircle, Calendar, Droplets, Camera, BookOpen, Save, Home, ShoppingCart } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../lib/firebase';
import { geminiService } from '../services/geminiService';
import { Pet, Plant, Child } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

type HobbyTab = 'pets' | 'gardening' | 'cooking' | 'household';

export default function SmartHobby() {
  const { t } = useLanguage();
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<HobbyTab>('pets');
  const [pets, setPets] = useState<Pet[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [queryInput, setQueryInput] = useState('');
  const [hobbyImage, setHobbyImage] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState('');
  const [restockResult, setRestockResult] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [savedRecipes, setSavedRecipes] = useState<{id?: string, title: string, desc: string}[]>([]);
  const [showHobbyModal, setShowHobbyModal] = useState(false);
  const [hobbyForm, setHobbyForm] = useState<any>({});

  useEffect(() => {
    if (!user) return;
    const petsQ = query(collection(db, 'pets'), where('ownerId', '==', user.uid));
    const plantsQ = query(collection(db, 'plants'), where('ownerId', '==', user.uid));
    const childrenQ = query(collection(db, 'children'), where('parentId', '==', user.uid));
    const recipesQ = query(collection(db, 'recipes'), where('ownerId', '==', user.uid));

    const unsubPets = onSnapshot(petsQ, (s) => setPets(s.docs.map(d => ({ id: d.id, ...d.data() } as Pet))));
    const unsubPlants = onSnapshot(plantsQ, (s) => setPlants(s.docs.map(d => ({ id: d.id, ...d.data() } as Plant))));
    const unsubChildren = onSnapshot(childrenQ, (s) => setChildren(s.docs.map(d => ({ id: d.id, ...d.data() } as Child))));
    const unsubRecipes = onSnapshot(recipesQ, (s) => setSavedRecipes(s.docs.map(d => ({ id: d.id, title: d.data().title, desc: d.data().desc }))));

    return () => { unsubPets(); unsubPlants(); unsubChildren(); unsubRecipes(); };
  }, [user]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setHobbyImage((reader.result as string).split(',')[1]);
    };
    reader.readAsDataURL(file);
  };

  const handleAIConsult = async () => {
    if (!queryInput.trim() && !hobbyImage) return;
    setLoadingAI(true);
    let result = '';
    if (activeTab === 'pets') result = await geminiService.troubleshootHobby('pet', queryInput, hobbyImage);
    else if (activeTab === 'gardening') result = await geminiService.troubleshootHobby('plant', queryInput, hobbyImage);
    else if (activeTab === 'cooking') result = await geminiService.recommendRecipe(queryInput);
    
    setAiResult(result);
    setLoadingAI(false);
    setHobbyImage(null);
  };

  const handleGetRestockInsights = async () => {
    setLoadingAI(true);
    const result = await geminiService.getHouseholdRestockingInsights({
      children: children.length,
      pets: pets.map(p => p.species),
      plants: plants.map(p => p.species)
    });
    setRestockResult(result);
    setLoadingAI(false);
  };

  const saveCurrentRecipe = async () => {
    if (aiResult && activeTab === 'cooking') {
      try {
        await addDoc(collection(db, 'recipes'), {
          ownerId: user?.uid,
          title: "AI Generated Recipe",
          desc: aiResult.slice(0, 50) + "..."
        });
        alert("Recipe saved to your Cookbook!");
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSaveHobby = async () => {
    if (!user) return;
    let path = '';
    let dataToSave: any = { ownerId: user.uid };

    if (activeTab === 'pets') {
      path = 'pets';
      dataToSave = { ...dataToSave, name: hobbyForm.name, species: hobbyForm.species, birthDate: hobbyForm.birthDate || '' };
    } else if (activeTab === 'gardening') {
      path = 'plants';
      dataToSave = { ...dataToSave, name: hobbyForm.name, species: hobbyForm.species, wateringSchedule: Number(hobbyForm.watering) || 1, lastWatered: new Date().toISOString() };
    } else if (activeTab === 'cooking') {
      path = 'recipes';
      dataToSave = { ...dataToSave, title: hobbyForm.title, desc: hobbyForm.desc };
    } else if (activeTab === 'household') {
      path = 'household_tasks';
      dataToSave = { ...dataToSave, taskName: hobbyForm.taskName, frequency: hobbyForm.frequency };
    }

    try {
      await addDoc(collection(db, path), dataToSave);
      setShowHobbyModal(false);
      setHobbyForm({});
      alert("Added successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to add.");
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 focus:outline-none">
        <h2 className="text-2xl font-bold">{t('smart_hobby')}</h2>
        <div className="flex items-center space-x-2">
           <p className="text-stone-500">{t('care_for_what_you_love')}</p>
           <div className="h-1.5 w-1.5 rounded-full bg-emerald-400"></div>
        </div>
      </div>

      <div className="mb-8 flex space-x-2 overflow-x-auto pb-2 scrollbar-none">
        <HobbyTabBtn icon={<PawPrint size={16} />} active={activeTab === 'pets'} label={t('pets')} onClick={() => setActiveTab('pets')} color="amber" />
        <HobbyTabBtn icon={<Leaf size={16} />} active={activeTab === 'gardening'} label={t('garden')} onClick={() => setActiveTab('gardening')} color="emerald" />
        <HobbyTabBtn icon={<Utensils size={16} />} active={activeTab === 'cooking'} label={t('cook')} onClick={() => setActiveTab('cooking')} color="rose" />
        <HobbyTabBtn icon={<Home size={16} />} active={activeTab === 'household'} label={t('home_hobby')} onClick={() => setActiveTab('household')} color="blue" />
      </div>

      <div className="space-y-6 pb-20">
        {activeTab === 'household' ? (
          <section className="space-y-6">
            <div className="rounded-3xl bg-blue-600 p-6 text-white shadow-xl relative overflow-hidden">
               <div className="relative z-10">
                 <h3 className="mb-2 flex items-center text-lg font-bold">
                   <ShoppingCart size={20} className="mr-2" /> Household Restocking
                 </h3>
                 <p className="text-sm text-blue-100 mb-6">Smart suggestions based on your family components ({children.length} kids, {pets.length} pets, {plants.length} plants).</p>
                 
                 <button onClick={handleGetRestockInsights} disabled={loadingAI} className="w-full rounded-2xl bg-white py-4 font-bold text-blue-600 shadow-lg active:scale-95 disabled:opacity-50 transition-all">
                   {loadingAI ? 'Calculating Supplies...' : 'Get Restock Suggestions'}
                 </button>
               </div>
               <div className="absolute -right-4 -top-4 h-32 w-32 rounded-full bg-white/20 blur-3xl"></div>
            </div>
            
            <div className="flex justify-end mt-4">
              <button onClick={() => setShowHobbyModal(true)} className="flex items-center space-x-2 rounded-xl bg-blue-100 text-blue-600 px-4 py-2 font-bold shadow-sm active:scale-95 transition-all">
                <Plus size={16} /> <span>Add New Task</span>
              </button>
            </div>

            <AnimatePresence>
              {restockResult && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-white p-6 shadow-sm border border-stone-100">
                   <div className="mb-4 flex items-center text-blue-600">
                     <MessageCircle size={20} className="mr-2" />
                     <h4 className="font-bold">Supplies Checklist</h4>
                   </div>
                   <div className="prose prose-sm text-stone-600 leading-relaxed whitespace-pre-wrap">
                     {restockResult}
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        ) : (
          <>
            {/* Module-specific overview */}
            <section className="rounded-3xl bg-white p-6 shadow-sm border border-stone-100">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-bold text-stone-900 border-b pb-1">
                  {activeTab === 'pets' ? t('my_pets') : activeTab === 'gardening' ? 'My Garden' : 'Culinary Assistant'}
                </h3>
                <button onClick={() => setShowHobbyModal(true)} className="h-8 w-8 rounded-lg bg-stone-100 text-stone-600 flex items-center justify-center active:scale-90 transition-all hover:bg-stone-200">
                  <Plus size={16} />
                </button>
              </div>
              
              <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-none">
                {activeTab === 'pets' && pets.map(pet => (
                  <div key={pet.id} className="min-w-[120px] rounded-2xl bg-amber-50 p-3 text-center border border-amber-100">
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-white text-amber-500">
                      <PawPrint size={24} />
                    </div>
                    <p className="text-sm font-bold">{pet.name}</p>
                    <p className="text-[10px] uppercase font-bold text-amber-400">{pet.species}</p>
                  </div>
                ))}
                {activeTab === 'gardening' && plants.map(plant => (
                  <div key={plant.id} className="min-w-[120px] rounded-2xl bg-emerald-50 p-3 text-center border border-emerald-100">
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-white text-emerald-500">
                      <Leaf size={24} />
                    </div>
                    <p className="text-sm font-bold">{plant.name}</p>
                    <p className="text-[10px] uppercase font-bold text-emerald-400">{plant.species}</p>
                  </div>
                ))}
                {activeTab === 'cooking' && (
                  <div className="flex w-full flex-col space-y-2 pb-2">
                    <p className="text-sm font-bold text-stone-900 border-b pb-1 flex items-center"><BookOpen size={16} className="mr-2"/> My Cookbook</p>
                    <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-none">
                      {savedRecipes.map((recipe, idx) => (
                        <div key={idx} className="min-w-[140px] rounded-2xl bg-rose-50 p-3 shadow-sm border border-rose-100">
                          <p className="font-bold text-sm text-stone-900 truncate">{recipe.title}</p>
                          <p className="text-xs text-stone-500 truncate">{recipe.desc}</p>
                        </div>
                      ))}
                      <div onClick={() => setShowHobbyModal(true)} className="min-w-[100px] flex items-center justify-center rounded-2xl border-2 border-dashed border-stone-200 text-stone-400 cursor-pointer hover:bg-stone-50 transition-all active:scale-95">
                        <Plus size={24} />
                      </div>
                    </div>
                  </div>
                )}
               </div>
            </section>

            <AnimatePresence>
              {showHobbyModal && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 rounded-3xl bg-white p-6 shadow-sm border border-stone-100 space-y-4">
                    <h4 className="font-bold text-lg text-stone-900 border-b pb-2">
                       Add New {activeTab === 'pets' ? 'Pet' : activeTab === 'gardening' ? 'Plant' : activeTab === 'cooking' ? 'Recipe' : 'Task'}
                    </h4>
                    
                    {activeTab === 'pets' && (
                      <div className="space-y-3">
                        <input type="text" placeholder="Pet Name" value={hobbyForm.name || ''} onChange={e => setHobbyForm({...hobbyForm, name: e.target.value})} className="w-full rounded-xl bg-stone-50 border-none px-4 py-3 font-bold focus:ring-2 focus:ring-amber-200" />
                        <input type="text" placeholder="Species (e.g. Dog, Cat)" value={hobbyForm.species || ''} onChange={e => setHobbyForm({...hobbyForm, species: e.target.value})} className="w-full rounded-xl bg-stone-50 border-none px-4 py-3 font-bold focus:ring-2 focus:ring-amber-200" />
                        <input type="date" value={hobbyForm.birthDate || ''} onChange={e => setHobbyForm({...hobbyForm, birthDate: e.target.value})} className="w-full rounded-xl bg-stone-50 border-none px-4 py-3 font-bold focus:ring-2 focus:ring-amber-200 text-stone-500" />
                      </div>
                    )}
                    {activeTab === 'gardening' && (
                      <div className="space-y-3">
                        <input type="text" placeholder="Plant Name" value={hobbyForm.name || ''} onChange={e => setHobbyForm({...hobbyForm, name: e.target.value})} className="w-full rounded-xl bg-stone-50 border-none px-4 py-3 font-bold focus:ring-2 focus:ring-emerald-200" />
                        <input type="text" placeholder="Species (e.g. Monstera)" value={hobbyForm.species || ''} onChange={e => setHobbyForm({...hobbyForm, species: e.target.value})} className="w-full rounded-xl bg-stone-50 border-none px-4 py-3 font-bold focus:ring-2 focus:ring-emerald-200" />
                        <input type="number" placeholder="Watering Schedule (days)" value={hobbyForm.watering || ''} onChange={e => setHobbyForm({...hobbyForm, watering: e.target.value})} className="w-full rounded-xl bg-stone-50 border-none px-4 py-3 font-bold focus:ring-2 focus:ring-emerald-200" />
                      </div>
                    )}
                    {activeTab === 'cooking' && (
                      <div className="space-y-3">
                        <input type="text" placeholder="Recipe Title" value={hobbyForm.title || ''} onChange={e => setHobbyForm({...hobbyForm, title: e.target.value})} className="w-full rounded-xl bg-stone-50 border-none px-4 py-3 font-bold focus:ring-2 focus:ring-rose-200" />
                        <textarea placeholder="Short Description..." value={hobbyForm.desc || ''} onChange={e => setHobbyForm({...hobbyForm, desc: e.target.value})} className="w-full rounded-xl bg-stone-50 border-none px-4 py-3 font-bold focus:ring-2 focus:ring-rose-200 resize-none h-24" />
                      </div>
                    )}
                    {activeTab === 'household' && (
                      <div className="space-y-3">
                        <input type="text" placeholder="Task Name (e.g. Change Filters)" value={hobbyForm.taskName || ''} onChange={e => setHobbyForm({...hobbyForm, taskName: e.target.value})} className="w-full rounded-xl bg-stone-50 border-none px-4 py-3 font-bold focus:ring-2 focus:ring-blue-200" />
                        <input type="text" placeholder="Frequency (e.g. Weekly, Monthly)" value={hobbyForm.frequency || ''} onChange={e => setHobbyForm({...hobbyForm, frequency: e.target.value})} className="w-full rounded-xl bg-stone-50 border-none px-4 py-3 font-bold focus:ring-2 focus:ring-blue-200" />
                      </div>
                    )}

                    <div className="flex space-x-3 pt-2">
                       <button onClick={handleSaveHobby} className={`flex-1 text-white py-3 rounded-xl font-bold shadow-sm active:scale-95 transition-all
                         ${activeTab === 'pets' ? 'bg-amber-500' : activeTab === 'gardening' ? 'bg-emerald-500' : activeTab === 'cooking' ? 'bg-rose-500' : 'bg-blue-600'}`}>
                         Save
                       </button>
                       <button onClick={() => setShowHobbyModal(false)} className="flex-1 bg-white text-stone-600 border border-stone-200 py-3 rounded-xl font-bold active:scale-95 transition-all">Cancel</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* AI Consultation */}
            <section className="rounded-3xl bg-neutral-900 p-6 text-white shadow-xl overflow-hidden relative">
              <div className="relative z-10">
                <h3 className="mb-4 flex items-center text-lg font-bold">
                  <MessageCircle size={20} className="mr-2 text-emerald-400" />
                  {activeTab === 'pets' ? t('visual_diagnostic') : activeTab === 'gardening' ? 'Plant Disease Diagnostics' : 'AI Culinary Assistant'}
                </h3>
                <div className="relative mb-4">
                  <textarea
                    value={queryInput}
                    onChange={e => setQueryInput(e.target.value)}
                    placeholder={
                      activeTab === 'pets' ? t('cat_scratching') :
                      activeTab === 'gardening' ? "Why are my Monstera leaves turning yellow? (Upload photo optional)" :
                      "Suggest a healthy dinner for 2 with chicken and spinach..."
                    }
                    className="h-28 w-full rounded-2xl bg-white/10 p-4 pb-10 text-sm outline-none focus:bg-white/20 transition-all border-none resize-none placeholder:text-white/40"
                  />
                  {(activeTab === 'pets' || activeTab === 'gardening') && (
                    <label className="absolute bottom-3 right-3 cursor-pointer p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-all text-white">
                       <Camera size={18} />
                       <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
                    </label>
                  )}
                </div>
                
                {hobbyImage && <p className="mb-4 text-xs font-bold text-emerald-400 flex items-center"><Camera size={14} className="mr-1"/> Image attached</p>}

                <button
                  onClick={handleAIConsult}
                  disabled={loadingAI || (!queryInput.trim() && !hobbyImage)}
                  className="w-full rounded-2xl bg-white py-4 font-bold text-neutral-900 shadow-lg disabled:opacity-50 active:scale-95 transition-all"
                >
                  {loadingAI ? 'Analyzing...' : t('get_advice')}
                </button>
              </div>
              {/* Subtle background decoration */}
              <div className="absolute -right-4 -top-4 h-32 w-32 rounded-full bg-emerald-500/20 blur-3xl"></div>
            </section>

            <AnimatePresence>
              {aiResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-3xl bg-white p-6 shadow-sm border border-stone-100"
                >
                  {activeTab === 'cooking' && (
                    <div className="mb-4 flex justify-end">
                      <button onClick={saveCurrentRecipe} className="flex items-center text-xs font-bold py-2 px-3 bg-rose-50 text-rose-600 rounded-xl active:scale-95">
                        <Save size={14} className="mr-1"/> Save to Cookbook
                      </button>
                    </div>
                  )}
                  <div className="prose prose-sm text-stone-600 leading-relaxed whitespace-pre-wrap">
                    {aiResult}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}

function HobbyTabBtn({ icon, active, label, onClick, color }: any) {
  const colors = {
    amber: active ? "bg-amber-500 text-white shadow-amber-200" : "bg-white text-stone-400",
    emerald: active ? "bg-emerald-500 text-white shadow-emerald-200" : "bg-white text-stone-400",
    rose: active ? "bg-rose-500 text-white shadow-rose-200" : "bg-white text-stone-400",
    blue: active ? "bg-blue-600 text-white shadow-blue-200" : "bg-white text-stone-400",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex grow items-center justify-center space-x-2 rounded-2xl py-3 text-sm font-bold shadow-sm transition-all active:scale-95",
        colors[color as keyof typeof colors]
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
