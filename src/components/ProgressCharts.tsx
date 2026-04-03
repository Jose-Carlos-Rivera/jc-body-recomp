'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from 'recharts';
import {
  TrendingUp,
  Trophy,
  Flame,
  Target,
  Dumbbell,
  Calendar,
  BarChart3,
} from 'lucide-react';
import {
  getAllDailyLogs,
  getAllMeasurements,
  getExerciseHistory,
  getWeeklyStats,
  getStreak,
} from '@/lib/storage';
import { MACROS_TARGET, GOALS, INBODY_BASELINE } from '@/lib/plan-data';

// --- Dark theme tokens ---
const COLORS = {
  bg: '#0a0a0a',
  card: '#141414',
  border: '#262626',
  accent: '#22c55e',
  blue: '#3b82f6',
  yellow: '#f59e0b',
  red: '#ef4444',
  muted: '#737373',
  text: '#fafafa',
  textSecondary: '#a3a3a3',
  tooltipBg: '#1a1a1a',
};

const KEY_EXERCISES = [
  'Sentadilla con barra',
  'Press de banca plano',
  'Peso muerto rumano',
  'Dominadas (o jalon al pecho)',
];

// --- Custom tooltip ---
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: COLORS.tooltipBg,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 12,
      }}
    >
      <p style={{ color: COLORS.textSecondary, marginBottom: 4 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || COLORS.accent, fontWeight: 600 }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
        </p>
      ))}
    </div>
  );
}

// --- Empty state ---
function EmptyState({ icon: Icon, message }: { icon: any; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon size={40} strokeWidth={1.5} color={COLORS.muted} />
      <p className="mt-3 text-sm" style={{ color: COLORS.muted }}>
        {message}
      </p>
    </div>
  );
}

// --- Section wrapper ---
function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: any;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-4 sm:p-5"
      style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Icon size={18} color={COLORS.accent} />
        <h3 className="text-sm font-semibold" style={{ color: COLORS.text }}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

// --- Stat card ---
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: any;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-1"
      style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon size={16} color={COLORS.accent} />
        <span className="text-xs" style={{ color: COLORS.muted }}>
          {label}
        </span>
      </div>
      <span className="text-2xl font-bold" style={{ color: COLORS.text }}>
        {value}
      </span>
      {sub && (
        <span className="text-xs" style={{ color: COLORS.textSecondary }}>
          {sub}
        </span>
      )}
    </div>
  );
}

// --- Format date for display ---
function fmtDate(d: string) {
  const parts = d.split('-');
  return `${parts[2]}/${parts[1]}`;
}

// ==================== MAIN COMPONENT ====================

export default function ProgressCharts() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  // Pull all data
  const logs = useMemo(() => (loaded ? getAllDailyLogs() : {}), [loaded]);
  const measurements = useMemo(() => (loaded ? getAllMeasurements() : []), [loaded]);
  const exerciseHistory = useMemo(() => (loaded ? getExerciseHistory() : []), [loaded]);
  const weeklyStats = useMemo(() => (loaded ? getWeeklyStats() : null), [loaded]);
  const streak = useMemo(() => (loaded ? getStreak() : { current: 0, best: 0 }), [loaded]);

  // --- Derived data ---

  // Weight over time
  const weightData = useMemo(() => {
    const entries = Object.values(logs)
      .filter((l) => l.weight !== null && l.weight > 0)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((l) => ({ date: fmtDate(l.date), peso: l.weight as number }));
    return entries;
  }, [logs]);

  // Body fat from measurements
  const bodyFatData = useMemo(() => {
    return measurements
      .filter((m) => m.bodyFat !== null && m.bodyFat > 0)
      .map((m) => ({ date: fmtDate(m.date), grasa: m.bodyFat as number }));
  }, [measurements]);

  // Calories for past 14 days
  const caloriesData = useMemo(() => {
    const result: { date: string; calorias: number; color: string }[] = [];
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const log = logs[key];
      if (log) {
        const cal = log.meals
          .filter((m) => m.completed)
          .flatMap((m) => m.foods)
          .reduce((s, f) => s + f.calories, 0);
        if (cal > 0) {
          const diff = Math.abs(cal - MACROS_TARGET.calories) / MACROS_TARGET.calories;
          const color = diff <= 0.1 ? COLORS.accent : diff <= 0.2 ? COLORS.yellow : COLORS.red;
          result.push({ date: fmtDate(key), calorias: cal, color });
        }
      }
    }
    return result;
  }, [logs]);

  // Protein for past 14 days
  const proteinData = useMemo(() => {
    const result: { date: string; proteina: number; color: string }[] = [];
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const log = logs[key];
      if (log) {
        const prot = log.meals
          .filter((m) => m.completed)
          .flatMap((m) => m.foods)
          .reduce((s, f) => s + f.protein, 0);
        if (prot > 0) {
          const diff = Math.abs(prot - MACROS_TARGET.protein) / MACROS_TARGET.protein;
          const color = diff <= 0.1 ? COLORS.accent : diff <= 0.2 ? COLORS.yellow : COLORS.red;
          result.push({ date: fmtDate(key), proteina: prot, color });
        }
      }
    }
    return result;
  }, [logs]);

  // Exercise progress per key exercise
  const exerciseProgressData = useMemo(() => {
    const map: Record<string, { date: string; peso: number }[]> = {};
    for (const ex of KEY_EXERCISES) {
      map[ex] = exerciseHistory
        .filter((h) => h.exerciseName === ex)
        .map((h) => ({ date: fmtDate(h.date), peso: h.bestWeight }));
    }
    return map;
  }, [exerciseHistory]);

  // Workout completion grid (past 28 days)
  const workoutGrid = useMemo(() => {
    const grid: { date: string; day: string; completed: boolean }[] = [];
    const dayNames = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
    const today = new Date();
    for (let i = 27; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const log = logs[key];
      grid.push({
        date: fmtDate(key),
        day: dayNames[d.getDay()],
        completed: !!log?.workout?.completed,
      });
    }
    return grid;
  }, [logs]);

  // Measurements comparison (first vs latest)
  const measurementComparison = useMemo(() => {
    if (measurements.length < 2) return null;
    const first = measurements[0];
    const latest = measurements[measurements.length - 1];
    return { first, latest };
  }, [measurements]);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: COLORS.border, borderTopColor: COLORS.accent }}
        />
      </div>
    );
  }

  const hasAnyData = Object.keys(logs).length > 0;

  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <BarChart3 size={24} color={COLORS.accent} />
        <h2 className="text-lg font-bold" style={{ color: COLORS.text }}>
          Progreso y Analiticas
        </h2>
      </div>

      {/* 1. Overview Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Flame}
          label="Racha actual"
          value={`${streak.current} dias`}
          sub={`Mejor: ${streak.best} dias`}
        />
        <StatCard
          icon={Dumbbell}
          label="Entrenos esta semana"
          value={`${weeklyStats?.workoutsCompleted ?? 0} / 6`}
        />
        <StatCard
          icon={Target}
          label="Calorias promedio"
          value={weeklyStats?.avgCalories ?? 0}
          sub={`Meta: ${MACROS_TARGET.calories} kcal`}
        />
        <StatCard
          icon={Trophy}
          label="Proteina promedio"
          value={`${weeklyStats?.avgProtein ?? 0}g`}
          sub={`Meta: ${MACROS_TARGET.protein}g`}
        />
      </div>

      {/* 2. Weight Chart */}
      <Section title="Peso Corporal" icon={TrendingUp}>
        {weightData.length > 1 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={weightData}>
              <CartesianGrid stroke={COLORS.border} strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fill: COLORS.muted, fontSize: 11 }}
                axisLine={{ stroke: COLORS.border }}
                tickLine={false}
              />
              <YAxis
                domain={['dataMin - 1', 'dataMax + 1']}
                tick={{ fill: COLORS.muted, fontSize: 11 }}
                axisLine={{ stroke: COLORS.border }}
                tickLine={false}
                width={40}
              />
              <Tooltip content={<ChartTooltip />} />
              {/* Goal weight line (lose ~8kg fat, gain 1kg muscle = ~59.2kg) */}
              <Line
                type="monotone"
                dataKey={() =>
                  INBODY_BASELINE.weight - GOALS.fatToLose + GOALS.muscleToGain
                }
                stroke={COLORS.muted}
                strokeDasharray="6 4"
                strokeWidth={1}
                dot={false}
                name="Meta"
              />
              <Line
                type="monotone"
                dataKey="peso"
                stroke={COLORS.accent}
                strokeWidth={2}
                dot={{ fill: COLORS.accent, r: 3 }}
                activeDot={{ r: 5, fill: COLORS.accent }}
                name="Peso (kg)"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState
            icon={TrendingUp}
            message="Empieza a registrar tu peso diario para ver la grafica"
          />
        )}
      </Section>

      {/* 3. Body Fat Progress */}
      <Section title="Grasa Corporal" icon={Target}>
        {bodyFatData.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-3 text-xs" style={{ color: COLORS.textSecondary }}>
              <span>Inicio: {INBODY_BASELINE.bodyFatPercent}%</span>
              <span>Meta: {GOALS.bodyFatTarget}%</span>
            </div>
            {/* Progress bar */}
            <div className="relative w-full h-2 rounded-full mb-4" style={{ background: COLORS.border }}>
              {(() => {
                const current = bodyFatData[bodyFatData.length - 1].grasa;
                const range = INBODY_BASELINE.bodyFatPercent - GOALS.bodyFatTarget;
                const progress = ((INBODY_BASELINE.bodyFatPercent - current) / range) * 100;
                return (
                  <div
                    className="absolute h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, Math.max(0, progress))}%`,
                      background: `linear-gradient(90deg, ${COLORS.accent}, ${COLORS.blue})`,
                    }}
                  />
                );
              })()}
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={bodyFatData}>
                <defs>
                  <linearGradient id="bfGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.accent} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={COLORS.accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={COLORS.border} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: COLORS.muted, fontSize: 11 }}
                  axisLine={{ stroke: COLORS.border }}
                  tickLine={false}
                />
                <YAxis
                  domain={[GOALS.bodyFatTarget - 2, 'dataMax + 1']}
                  tick={{ fill: COLORS.muted, fontSize: 11 }}
                  axisLine={{ stroke: COLORS.border }}
                  tickLine={false}
                  width={40}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="grasa"
                  stroke={COLORS.accent}
                  strokeWidth={2}
                  fill="url(#bfGradient)"
                  name="% Grasa"
                />
              </AreaChart>
            </ResponsiveContainer>
          </>
        ) : (
          <EmptyState
            icon={Target}
            message="Registra tus mediciones corporales para ver el progreso de grasa"
          />
        )}
      </Section>

      {/* 4. Macros Adherence - Calories */}
      <Section title="Calorias Diarias (14 dias)" icon={BarChart3}>
        {caloriesData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={caloriesData}>
              <CartesianGrid stroke={COLORS.border} strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fill: COLORS.muted, fontSize: 10 }}
                axisLine={{ stroke: COLORS.border }}
                tickLine={false}
                interval={1}
              />
              <YAxis
                tick={{ fill: COLORS.muted, fontSize: 11 }}
                axisLine={{ stroke: COLORS.border }}
                tickLine={false}
                width={45}
              />
              <Tooltip content={<ChartTooltip />} />
              {/* Target reference line */}
              <CartesianGrid
                horizontal={false}
                vertical={false}
                stroke="none"
              />
              <Bar
                dataKey="calorias"
                name="Calorias"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              >
                {caloriesData.map((entry, index) => (
                  <rect key={index} fill={entry.color} />
                ))}
              </Bar>
              {/* Dashed target line using a reference-style approach */}
              <Line
                type="monotone"
                dataKey={() => MACROS_TARGET.calories}
                stroke={COLORS.muted}
                strokeDasharray="6 3"
                strokeWidth={1}
                dot={false}
                name={`Meta (${MACROS_TARGET.calories})`}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState
            icon={BarChart3}
            message="Empieza a registrar tus comidas para ver la adherencia"
          />
        )}
        {caloriesData.length > 0 && (
          <div className="flex items-center gap-4 mt-3 text-xs" style={{ color: COLORS.muted }}>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: COLORS.accent }} />
              Dentro del 10%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: COLORS.yellow }} />
              Desviado
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: COLORS.red }} />
              Muy lejos
            </span>
          </div>
        )}
      </Section>

      {/* 5. Protein Intake */}
      <Section title="Proteina Diaria (14 dias)" icon={Target}>
        {proteinData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={proteinData}>
              <CartesianGrid stroke={COLORS.border} strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fill: COLORS.muted, fontSize: 10 }}
                axisLine={{ stroke: COLORS.border }}
                tickLine={false}
                interval={1}
              />
              <YAxis
                tick={{ fill: COLORS.muted, fontSize: 11 }}
                axisLine={{ stroke: COLORS.border }}
                tickLine={false}
                width={40}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar
                dataKey="proteina"
                name="Proteina (g)"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              >
                {proteinData.map((entry, index) => (
                  <rect key={index} fill={entry.color} />
                ))}
              </Bar>
              <Line
                type="monotone"
                dataKey={() => MACROS_TARGET.protein}
                stroke={COLORS.muted}
                strokeDasharray="6 3"
                strokeWidth={1}
                dot={false}
                name={`Meta (${MACROS_TARGET.protein}g)`}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState
            icon={Target}
            message="Empieza a registrar tus comidas para ver tu consumo de proteina"
          />
        )}
      </Section>

      {/* 6. Exercise Progress */}
      <Section title="Progreso de Ejercicios" icon={Dumbbell}>
        {exerciseHistory.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {KEY_EXERCISES.map((ex) => {
              const data = exerciseProgressData[ex];
              const shortName = ex
                .replace(' con barra', '')
                .replace(' (o jalon al pecho)', '')
                .replace(' plano', '');
              if (!data || data.length === 0) return null;
              return (
                <div key={ex}>
                  <p
                    className="text-xs font-medium mb-2 truncate"
                    style={{ color: COLORS.textSecondary }}
                  >
                    {shortName}
                  </p>
                  <ResponsiveContainer width="100%" height={140}>
                    <LineChart data={data}>
                      <CartesianGrid stroke={COLORS.border} strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: COLORS.muted, fontSize: 9 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: COLORS.muted, fontSize: 9 }}
                        axisLine={false}
                        tickLine={false}
                        width={35}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="peso"
                        stroke={COLORS.blue}
                        strokeWidth={2}
                        dot={{ fill: COLORS.blue, r: 3 }}
                        name="Peso (kg)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={Dumbbell}
            message="Completa tus entrenos para ver la sobrecarga progresiva"
          />
        )}
      </Section>

      {/* 7. Workout Completion Grid */}
      <Section title="Calendario de Entrenos (28 dias)" icon={Calendar}>
        {hasAnyData ? (
          <>
            <div className="grid grid-cols-7 gap-1.5">
              {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((d) => (
                <div
                  key={d}
                  className="text-center text-[10px] font-medium pb-1"
                  style={{ color: COLORS.muted }}
                >
                  {d}
                </div>
              ))}
              {/* Pad initial offset so grid aligns to weekday columns */}
              {(() => {
                const firstDay = (() => {
                  const today = new Date();
                  const d = new Date(today);
                  d.setDate(d.getDate() - 27);
                  return d.getDay();
                })();
                return Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`pad-${i}`} />
                ));
              })()}
              {workoutGrid.map((cell, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-md flex items-center justify-center text-[10px] font-medium transition-colors"
                  style={{
                    background: cell.completed ? COLORS.accent : COLORS.border,
                    color: cell.completed ? '#000' : COLORS.muted,
                    opacity: cell.completed ? 1 : 0.5,
                  }}
                  title={cell.date}
                >
                  {cell.date.split('/')[0]}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 mt-3 text-xs" style={{ color: COLORS.muted }}>
              <span className="flex items-center gap-1">
                <span
                  className="w-2.5 h-2.5 rounded-sm inline-block"
                  style={{ background: COLORS.accent }}
                />
                Completado
              </span>
              <span className="flex items-center gap-1">
                <span
                  className="w-2.5 h-2.5 rounded-sm inline-block opacity-50"
                  style={{ background: COLORS.border }}
                />
                Sin entreno
              </span>
            </div>
          </>
        ) : (
          <EmptyState
            icon={Calendar}
            message="Empieza a registrar para ver tus graficas"
          />
        )}
      </Section>

      {/* 8. Measurements Comparison */}
      <Section title="Comparacion de Medidas" icon={TrendingUp}>
        {measurementComparison ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ color: COLORS.textSecondary }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  <th className="text-left py-2 font-medium" style={{ color: COLORS.muted }}>
                    Medida
                  </th>
                  <th className="text-right py-2 font-medium" style={{ color: COLORS.muted }}>
                    {fmtDate(measurementComparison.first.date)}
                  </th>
                  <th className="text-right py-2 font-medium" style={{ color: COLORS.muted }}>
                    {fmtDate(measurementComparison.latest.date)}
                  </th>
                  <th className="text-right py-2 font-medium" style={{ color: COLORS.muted }}>
                    Cambio
                  </th>
                </tr>
              </thead>
              <tbody>
                {([
                  { label: 'Peso (kg)', key: 'weight' as const, lower: true },
                  { label: '% Grasa', key: 'bodyFat' as const, lower: true },
                  { label: 'Cintura (cm)', key: 'waist' as const, lower: true },
                  { label: 'Pecho (cm)', key: 'chest' as const, lower: false },
                  { label: 'Brazo Izq (cm)', key: 'leftArm' as const, lower: false },
                  { label: 'Brazo Der (cm)', key: 'rightArm' as const, lower: false },
                  { label: 'Muslo Izq (cm)', key: 'leftThigh' as const, lower: false },
                  { label: 'Muslo Der (cm)', key: 'rightThigh' as const, lower: false },
                ] as const).map(({ label, key, lower }) => {
                  const first = measurementComparison.first[key];
                  const latest = measurementComparison.latest[key];
                  if (first == null || latest == null) return null;
                  const diff = latest - first;
                  const improved = lower ? diff < 0 : diff > 0;
                  return (
                    <tr
                      key={key}
                      style={{ borderBottom: `1px solid ${COLORS.border}` }}
                    >
                      <td className="py-2.5" style={{ color: COLORS.text }}>
                        {label}
                      </td>
                      <td className="text-right py-2.5">{first.toFixed(1)}</td>
                      <td className="text-right py-2.5 font-medium" style={{ color: COLORS.text }}>
                        {latest.toFixed(1)}
                      </td>
                      <td
                        className="text-right py-2.5 font-semibold"
                        style={{ color: improved ? COLORS.accent : COLORS.red }}
                      >
                        {diff > 0 ? '+' : ''}
                        {diff.toFixed(1)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={TrendingUp}
            message={
              measurements.length === 1
                ? 'Necesitas al menos 2 mediciones para comparar'
                : 'Registra tus medidas corporales para ver la comparacion'
            }
          />
        )}
      </Section>
    </div>
  );
}
