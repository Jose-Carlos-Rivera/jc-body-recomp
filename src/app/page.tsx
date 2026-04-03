'use client';

import { useState, useEffect, useCallback } from 'react';
import { DailyLog, TabType } from '@/lib/types';
import { getDailyLog, getToday, saveDailyLog } from '@/lib/storage';
import dynamic from 'next/dynamic';

const Dashboard = dynamic(() => import('@/components/Dashboard'), { ssr: false });
const NutritionTracker = dynamic(() => import('@/components/NutritionTracker'), { ssr: false });
const WorkoutTracker = dynamic(() => import('@/components/WorkoutTracker'), { ssr: false });
const BodyTracker = dynamic(() => import('@/components/BodyTracker'), { ssr: false });
const ProgressCharts = dynamic(() => import('@/components/ProgressCharts'), { ssr: false });
const BottomNav = dynamic(() => import('@/components/BottomNav'), { ssr: false });

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const today = getToday();
    setDailyLog(getDailyLog(today));

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  const handleUpdate = useCallback((updatedLog: DailyLog) => {
    setDailyLog(updatedLog);
    saveDailyLog(updatedLog);
  }, []);

  if (!mounted || !dailyLog) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center">
            <span className="text-2xl font-bold text-white">JC</span>
          </div>
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 5.5rem)' }}>
      <div className="max-w-lg mx-auto px-4">
        {activeTab === 'dashboard' && (
          <Dashboard dailyLog={dailyLog} onNavigate={setActiveTab} />
        )}
        {activeTab === 'nutrition' && (
          <NutritionTracker dailyLog={dailyLog} onUpdate={handleUpdate} />
        )}
        {activeTab === 'workout' && (
          <WorkoutTracker dailyLog={dailyLog} onUpdate={handleUpdate} />
        )}
        {activeTab === 'body' && (
          <BodyTracker dailyLog={dailyLog} onUpdate={handleUpdate} />
        )}
        {activeTab === 'progress' && (
          <ProgressCharts />
        )}
      </div>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </main>
  );
}
