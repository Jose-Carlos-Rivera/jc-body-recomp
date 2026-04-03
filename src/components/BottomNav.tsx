'use client';

import {
  LayoutDashboard,
  UtensilsCrossed,
  Dumbbell,
  User,
  TrendingUp,
} from 'lucide-react';

type Tab = 'dashboard' | 'nutrition' | 'workout' | 'body' | 'progress';

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'nutrition', label: 'Nutrition', icon: UtensilsCrossed },
  { id: 'workout', label: 'Workout', icon: Dumbbell },
  { id: 'body', label: 'Body', icon: User },
  { id: 'progress', label: 'Progress', icon: TrendingUp },
];

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a] border-t border-[#262626] pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
                isActive ? 'text-[#22c55e]' : 'text-neutral-500'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
