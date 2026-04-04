'use client';

import { useMemo } from 'react';
import {
  Flame,
  Droplets,
  Trophy,
  Target,
  Dumbbell,
  Pill,
  ChevronRight,
} from 'lucide-react';
import { getTodayPlan, MACROS_TARGET, GOALS, INBODY_BASELINE } from '@/lib/plan-data';
import { getDailyLog, getToday, getStreak, getWeeklyStats } from '@/lib/storage';
import type { DailyLog, TabType } from '@/lib/types';

interface DashboardProps {
  dailyLog: DailyLog;
  onNavigate: (tab: TabType) => void;
  userName?: string;
  onLogout?: () => void;
}

// --- Circular progress SVG ---
function CircleProgress({
  value,
  max,
  size = 80,
  strokeWidth = 7,
  color,
  label,
  unit,
}: {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  label: string;
  unit: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(value / max, 1);
  const offset = circumference * (1 - pct);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#262626"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="text-xs text-neutral-400 font-medium">{label}</span>
      <span className="text-sm font-semibold text-white">
        {Math.round(value)}
        <span className="text-neutral-500 font-normal text-xs"> / {max}{unit}</span>
      </span>
    </div>
  );
}

// --- Stat card ---
function StatCard({
  icon: Icon,
  iconColor,
  title,
  value,
  sub,
  onClick,
}: {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  value: string;
  sub: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-[#141414] border border-[#262626] rounded-2xl p-4 flex flex-col gap-2 text-left
                 transition-all duration-200 hover:border-[#333] active:scale-[0.97]"
    >
      <div className="flex items-center justify-between">
        <Icon size={20} className={iconColor} />
        {onClick && <ChevronRight size={14} className="text-neutral-600" />}
      </div>
      <p className="text-[11px] uppercase tracking-wider text-neutral-500 font-medium">{title}</p>
      <p className="text-2xl font-bold text-white leading-none">{value}</p>
      <p className="text-xs text-neutral-500">{sub}</p>
    </button>
  );
}

// --- Body fat progress bar ---
function BodyFatBar({ current, target, start }: { current: number; target: number; start: number }) {
  const totalRange = start - target;
  const progress = Math.max(0, Math.min(1, (start - current) / totalRange));

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <div>
          <p className="text-xs text-neutral-500 uppercase tracking-wider font-medium">Grasa corporal</p>
          <p className="text-xl font-bold text-white">{current}%</p>
        </div>
        <p className="text-xs text-neutral-500">Meta: {target}%</p>
      </div>
      <div className="h-2.5 bg-[#262626] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-700 ease-out"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-neutral-600">
        <span>{start}%</span>
        <span>{Math.round(progress * 100)}% completado</span>
        <span>{target}%</span>
      </div>
    </div>
  );
}

export default function Dashboard({ dailyLog, onNavigate, userName = 'Jose Carlos', onLogout }: DashboardProps) {
  const todayPlan = useMemo(() => getTodayPlan(), []);
  const streak = useMemo(() => getStreak(), []);

  // Calculate macros from completed meals
  const macros = useMemo(() => {
    const completedFoods = dailyLog.meals
      .filter((m) => m.completed)
      .flatMap((m) => m.foods);

    return {
      calories: completedFoods.reduce((s, f) => s + f.calories, 0),
      protein: completedFoods.reduce((s, f) => s + f.protein, 0),
      carbs: completedFoods.reduce((s, f) => s + f.carbs, 0),
      fat: completedFoods.reduce((s, f) => s + f.fat, 0),
    };
  }, [dailyLog.meals]);

  // Supplement progress
  const supplementsDone = dailyLog.supplements.filter((s) => s.taken).length;
  const supplementsTotal = dailyLog.supplements.length;

  // Today's date in Spanish
  const dateStr = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, []);

  // Exercises preview for today's card
  const exercisePreview = useMemo(() => {
    const all = [...todayPlan.exercises, ...todayPlan.absExercises];
    return all.slice(0, 4);
  }, [todayPlan]);

  return (
    <div className="bg-[#0a0a0a] text-white pb-4">
      {/* Header */}
      <div className="pt-4 pb-4 flex items-start justify-between">
        <div>
          <p className="text-neutral-500 text-sm capitalize">{dateStr}</p>
          <h1 className="text-2xl font-bold mt-1">
            Hola, {userName.split(' ')[0]}
          </h1>
        </div>
        {onLogout && (
          <button
            onClick={onLogout}
            className="mt-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-3 py-1 rounded-lg border border-[#262626]"
          >
            Salir
          </button>
        )}
      </div>

      {/* Quick Stats Grid */}
      <div className="px-0 grid grid-cols-2 gap-3">
        <StatCard
          icon={Trophy}
          iconColor="text-amber-400"
          title="Racha"
          value={`${streak.current}`}
          sub={streak.current === 1 ? 'dia seguido' : 'dias seguidos'}
        />
        <StatCard
          icon={Flame}
          iconColor="text-orange-400"
          title="Calorias"
          value={`${macros.calories}`}
          sub={`de ${MACROS_TARGET.calories} kcal`}
          onClick={() => onNavigate('nutrition')}
        />
        <StatCard
          icon={Target}
          iconColor="text-green-400"
          title="Proteina"
          value={`${macros.protein}g`}
          sub={`de ${MACROS_TARGET.protein}g`}
          onClick={() => onNavigate('nutrition')}
        />
        <StatCard
          icon={Droplets}
          iconColor="text-blue-400"
          title="Agua"
          value={`${dailyLog.water}L`}
          sub={`de ${MACROS_TARGET.water}L`}
        />
      </div>

      {/* Today's Workout */}
      <div className="px-0 mt-5">
        <button
          onClick={() => onNavigate('workout')}
          className="w-full bg-[#141414] border border-[#262626] rounded-2xl p-5 text-left
                     transition-all duration-200 hover:border-[#333] active:scale-[0.98]"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Dumbbell size={18} className="text-green-400" />
              </div>
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wider font-medium">
                  Entrenamiento de hoy
                </p>
                <p className="text-base font-semibold text-white mt-0.5">
                  {todayPlan.training}
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-neutral-600" />
          </div>

          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs text-neutral-500 bg-[#1a1a1a] rounded-lg px-2.5 py-1">
              {todayPlan.duration}
            </span>
            {todayPlan.cardio && (
              <span className="text-xs text-neutral-500 bg-[#1a1a1a] rounded-lg px-2.5 py-1">
                {todayPlan.cardio.type} &middot; {todayPlan.cardio.duration}
              </span>
            )}
          </div>

          {exercisePreview.length > 0 && (
            <div className="space-y-1.5">
              {exercisePreview.map((ex, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-neutral-400">{ex.name}</span>
                  <span className="text-neutral-600 text-xs">
                    {ex.sets} x {ex.reps}
                  </span>
                </div>
              ))}
              {todayPlan.exercises.length + todayPlan.absExercises.length > 4 && (
                <p className="text-xs text-neutral-600 pt-1">
                  +{todayPlan.exercises.length + todayPlan.absExercises.length - 4} ejercicios mas
                </p>
              )}
            </div>
          )}

          {dailyLog.workout?.completed && (
            <div className="mt-3 flex items-center gap-1.5 text-green-400 text-xs font-medium">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              Completado
            </div>
          )}
        </button>
      </div>

      {/* Macros Progress Rings */}
      <div className="px-0 mt-5">
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm font-semibold text-white">Macros de hoy</p>
            <button
              onClick={() => onNavigate('nutrition')}
              className="text-xs text-green-400 font-medium flex items-center gap-1 hover:text-green-300 transition-colors"
            >
              Ver detalle <ChevronRight size={12} />
            </button>
          </div>
          <div className="flex justify-around">
            <CircleProgress
              value={macros.protein}
              max={MACROS_TARGET.protein}
              color="#22c55e"
              label="Proteina"
              unit="g"
            />
            <CircleProgress
              value={macros.carbs}
              max={MACROS_TARGET.carbs}
              color="#3b82f6"
              label="Carbos"
              unit="g"
            />
            <CircleProgress
              value={macros.fat}
              max={MACROS_TARGET.fat}
              color="#f59e0b"
              label="Grasa"
              unit="g"
            />
          </div>
          {/* Calories bar under rings */}
          <div className="mt-5 pt-4 border-t border-[#1e1e1e]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-neutral-500">Calorias totales</span>
              <span className="text-sm font-semibold text-white">
                {macros.calories}{' '}
                <span className="text-neutral-500 font-normal text-xs">
                  / {MACROS_TARGET.calories} kcal
                </span>
              </span>
            </div>
            <div className="h-2 bg-[#262626] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${Math.min((macros.calories / MACROS_TARGET.calories) * 100, 100)}%`,
                  background:
                    macros.calories > MACROS_TARGET.calories
                      ? '#ef4444'
                      : 'linear-gradient(90deg, #22c55e, #4ade80)',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Body Fat Goal */}
      <div className="px-0 mt-5">
        <button
          onClick={() => onNavigate('body')}
          className="w-full bg-[#141414] border border-[#262626] rounded-2xl p-5 text-left
                     transition-all duration-200 hover:border-[#333] active:scale-[0.98]"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Target size={18} className="text-green-400" />
              </div>
              <p className="text-sm font-semibold text-white">Meta de recomposicion</p>
            </div>
            <ChevronRight size={14} className="text-neutral-600" />
          </div>
          <BodyFatBar
            current={GOALS.bodyFatCurrent}
            target={GOALS.bodyFatTarget}
            start={INBODY_BASELINE.bodyFatPercent}
          />
          <div className="flex gap-4 mt-4 pt-3 border-t border-[#1e1e1e]">
            <div>
              <p className="text-[10px] text-neutral-600 uppercase tracking-wider">Perder grasa</p>
              <p className="text-sm font-semibold text-white">{GOALS.fatToLose} kg</p>
            </div>
            <div>
              <p className="text-[10px] text-neutral-600 uppercase tracking-wider">Ganar musculo</p>
              <p className="text-sm font-semibold text-white">{GOALS.muscleToGain} kg</p>
            </div>
            <div>
              <p className="text-[10px] text-neutral-600 uppercase tracking-wider">Prioridad</p>
              <p className="text-sm font-semibold text-white capitalize">{GOALS.priorityArea}</p>
            </div>
          </div>
        </button>
      </div>

      {/* Supplements Checklist */}
      <div className="px-0 mt-5">
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Pill size={18} className="text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Suplementos</p>
                <p className="text-xs text-neutral-500">
                  {supplementsDone} de {supplementsTotal} tomados
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {dailyLog.supplements.map((s, i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
                    s.taken ? 'bg-green-400' : 'bg-[#262626]'
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="space-y-2.5">
            {dailyLog.supplements.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                      s.taken
                        ? 'bg-green-500 border-green-500'
                        : 'border-[#333] bg-transparent'
                    }`}
                  >
                    {s.taken && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path
                          d="M1 4L3.5 6.5L9 1"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <span
                    className={`text-sm transition-colors duration-200 ${
                      s.taken ? 'text-neutral-500 line-through' : 'text-neutral-300'
                    }`}
                  >
                    {s.name}
                  </span>
                </div>
                {s.taken && s.time && (
                  <span className="text-[10px] text-neutral-600">{s.time}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom spacer for tab bar */}
      <div className="h-6" />
    </div>
  );
}
