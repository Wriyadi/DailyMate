import { motion } from 'motion/react';
import { Car, Heart, Utensils, ArrowRight, Bell } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';

export default function Dashboard({ onNavigate }: { onNavigate: (tab: any) => void }) {
  const { profile } = useAuth();

  return (
    <div className="p-6">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 leading-tight">Hello, {profile?.name.split(' ')[0]}!</h1>
          <p className="text-stone-500">Your day at a glance.</p>
        </div>
        <button className="relative rounded-2xl bg-white p-3 shadow-sm active:scale-95">
          <Bell size={24} className="text-stone-600" />
          <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500"></span>
        </button>
      </header>

      <div className="grid grid-cols-1 gap-4">
        <ModuleCard
          icon={<Car className="text-blue-600" />}
          title="Vehicle Check"
          description="Next service: Oil change in 1,200km"
          color="bg-blue-50"
          onClick={() => onNavigate('vehicle')}
        />
        <ModuleCard
          icon={<Heart className="text-rose-600" />}
          title="Healthy Life"
          description="Current BMI: 22.4 (Healthy)"
          color="bg-rose-50"
          onClick={() => onNavigate('health')}
        />
        <ModuleCard
          icon={<Utensils className="text-amber-600" />}
          title="Smart Hobby"
          description="Water the Monstera today"
          color="bg-amber-50"
          onClick={() => onNavigate('hobby')}
        />
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-xl font-bold">Quick Tips</h2>
        <div className="rounded-3xl bg-neutral-900 p-6 text-white shadow-xl">
          <p className="mb-3 text-lg font-medium">Regular check-ups save 20% on maintenance costs.</p>
          <button className="flex items-center space-x-2 text-sm text-emerald-400 font-semibold uppercase tracking-wider">
            <span>Learn More</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </section>
    </div>
  );
}

function ModuleCard({ icon, title, description, color, onClick }: any) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-3xl bg-white p-5 text-left shadow-sm transition-all hover:shadow-md"
    >
      <div className="flex items-center space-x-4">
        <div className={cn("flex h-14 w-14 items-center justify-center rounded-2xl", color)}>
          {icon}
        </div>
        <div>
          <h3 className="font-bold text-lg">{title}</h3>
          <p className="text-sm text-stone-500">{description}</p>
        </div>
      </div>
      <ArrowRight size={20} className="text-stone-300" />
    </motion.button>
  );
}
