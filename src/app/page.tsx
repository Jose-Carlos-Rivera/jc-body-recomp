'use client';

import { useState, useEffect, useCallback } from 'react';
import { DailyLog, TabType } from '@/lib/types';
import { getDailyLog, getToday, saveDailyLog } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';

const LoginScreen = dynamic(() => import('@/components/LoginScreen'), { ssr: false });
const Dashboard = dynamic(() => import('@/components/Dashboard'), { ssr: false });
const NutritionTracker = dynamic(() => import('@/components/NutritionTracker'), { ssr: false });
const WorkoutTracker = dynamic(() => import('@/components/WorkoutTracker'), { ssr: false });
const BodyTracker = dynamic(() => import('@/components/BodyTracker'), { ssr: false });
const ProgressCharts = dynamic(() => import('@/components/ProgressCharts'), { ssr: false });
const BottomNav = dynamic(() => import('@/components/BottomNav'), { ssr: false });

interface AppUser {
  id: string;
  name: string;
  username: string;
}

export default function Home() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);
  const [mounted, setMounted] = useState(false);

  // Check existing session on mount
  useEffect(() => {
    setMounted(true);

    if (!supabase) {
      setAuthChecked(true);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const meta = session.user.user_metadata;
        setUser({
          id: session.user.id,
          name: meta?.name || 'Usuario',
          username: meta?.username || '',
        });
      }
      setAuthChecked(true);
    });

    // Listen for auth changes (logout etc)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null);
        setDailyLog(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load daily log when user is set
  useEffect(() => {
    if (!user) return;

    const today = getToday();
    setDailyLog(getDailyLog(today));

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(() => {
        import('@/lib/notifications').then(({ subscribeToPush }) => {
          subscribeToPush().catch(() => {});
        });
      }).catch(() => {});
    }

    // Pull data from Supabase
    import('@/lib/db').then(({ pullAllData }) => {
      pullAllData().then(() => {
        setDailyLog(getDailyLog(today));
      }).catch(() => {});
    });

    // Handle tab param from notifications
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab && ['dashboard', 'nutrition', 'workout', 'body', 'progress'].includes(tab)) {
      setActiveTab(tab as TabType);
    }
  }, [user]);

  const handleLogin = useCallback((loggedInUser: AppUser) => {
    setUser(loggedInUser);
  }, []);

  const handleLogout = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setDailyLog(null);
    // Clear localStorage for clean switch
    if (typeof window !== 'undefined') {
      localStorage.removeItem('jc_daily_logs');
      localStorage.removeItem('jc_body_measurements');
      localStorage.removeItem('jc_exercise_history');
    }
  }, []);

  const handleUpdate = useCallback((updatedLog: DailyLog) => {
    setDailyLog(updatedLog);
    saveDailyLog(updatedLog);
  }, []);

  // Loading state
  if (!mounted || !authChecked) {
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

  // Login screen
  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // Main app (waiting for daily log)
  if (!dailyLog) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 5.5rem)' }}>
      <div className="max-w-lg mx-auto px-4">
        {activeTab === 'dashboard' && (
          <Dashboard dailyLog={dailyLog} onNavigate={setActiveTab} userName={user.name} onLogout={handleLogout} />
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
