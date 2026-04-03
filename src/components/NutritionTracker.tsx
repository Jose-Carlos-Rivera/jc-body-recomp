'use client';

import { useState, useMemo } from 'react';
import { DailyLog, MealLog, FoodItem } from '@/lib/types';
import { MACROS_TARGET, SUPPLEMENTS, MEAL_TEMPLATES, FOOD_RULES } from '@/lib/plan-data';
import { saveDailyLog } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';
import {
  UtensilsCrossed,
  Droplets,
  Plus,
  Check,
  ChevronDown,
  ChevronUp,
  Pill,
  X,
} from 'lucide-react';

interface NutritionTrackerProps {
  dailyLog: DailyLog;
  onUpdate: (log: DailyLog) => void;
}

const MEAL_LABELS: Record<string, string> = {
  desayuno: 'Desayuno',
  comida: 'Comida',
  cena: 'Cena',
};

const MEAL_ICONS: Record<string, string> = {
  desayuno: '🌅',
  comida: '☀️',
  cena: '🌙',
};

// ---------------------------------------------------------------------------
// Add Food Modal
// ---------------------------------------------------------------------------
function AddFoodModal({
  onAdd,
  onClose,
}: {
  onAdd: (food: FoodItem) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [calories, setCalories] = useState('');
  const [portion, setPortion] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) return;
    onAdd({
      id: uuidv4(),
      name: name.trim(),
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
      calories: Number(calories) || 0,
      portion: portion.trim() || '1 porcion',
    });
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up">
        <div
          className="mx-auto max-w-lg rounded-t-2xl border border-[#262626] bg-[#141414] px-5 pb-8 pt-4"
          style={{ boxShadow: '0 -8px 40px rgba(0,0,0,.5)' }}
        >
          {/* Handle bar */}
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#333]" />

          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              Agregar alimento
            </h3>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-[#888] transition-colors hover:bg-[#1e1e1e] hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              placeholder="Nombre del alimento"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-[#262626] bg-[#0a0a0a] px-4 py-3 text-sm text-white placeholder-[#555] outline-none transition-colors focus:border-[#22c55e]/50"
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                placeholder="Proteina (g)"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                className="rounded-xl border border-[#262626] bg-[#0a0a0a] px-4 py-3 text-sm text-white placeholder-[#555] outline-none transition-colors focus:border-[#22c55e]/50"
              />
              <input
                type="number"
                placeholder="Carbohidratos (g)"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                className="rounded-xl border border-[#262626] bg-[#0a0a0a] px-4 py-3 text-sm text-white placeholder-[#555] outline-none transition-colors focus:border-[#22c55e]/50"
              />
              <input
                type="number"
                placeholder="Grasa (g)"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                className="rounded-xl border border-[#262626] bg-[#0a0a0a] px-4 py-3 text-sm text-white placeholder-[#555] outline-none transition-colors focus:border-[#22c55e]/50"
              />
              <input
                type="number"
                placeholder="Calorias"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                className="rounded-xl border border-[#262626] bg-[#0a0a0a] px-4 py-3 text-sm text-white placeholder-[#555] outline-none transition-colors focus:border-[#22c55e]/50"
              />
            </div>

            <input
              type="text"
              placeholder="Porcion (ej: 200g, 1 taza)"
              value={portion}
              onChange={(e) => setPortion(e.target.value)}
              className="w-full rounded-xl border border-[#262626] bg-[#0a0a0a] px-4 py-3 text-sm text-white placeholder-[#555] outline-none transition-colors focus:border-[#22c55e]/50"
            />

            <button
              onClick={handleSubmit}
              disabled={!name.trim()}
              className="mt-2 w-full rounded-xl bg-[#22c55e] py-3.5 text-sm font-semibold text-black transition-all hover:bg-[#1db954] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Agregar alimento
            </button>
          </div>
        </div>
      </div>

      {/* Slide-up animation */}
      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </>
  );
}

// ---------------------------------------------------------------------------
// Progress Bar helper
// ---------------------------------------------------------------------------
function MacroBar({
  label,
  current,
  target,
  color,
  unit,
}: {
  label: string;
  current: number;
  target: number;
  color: string;
  unit: string;
}) {
  const pct = Math.min((current / target) * 100, 100);
  const over = current > target;

  return (
    <div className="min-w-0">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-[10px] font-medium uppercase tracking-wider text-[#888] shrink-0">
          {label}
        </span>
        <span
          className={`text-[11px] font-semibold tabular-nums whitespace-nowrap ${
            over ? 'text-red-400' : 'text-white'
          }`}
        >
          {current}/{target}{unit}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#1e1e1e]">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${pct}%`,
            background: over
              ? '#ef4444'
              : `linear-gradient(90deg, ${color}, ${color}dd)`,
          }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Water Progress Circle
// ---------------------------------------------------------------------------
function WaterCircle({ current, target }: { current: number; target: number }) {
  const pct = Math.min(current / target, 1);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);

  return (
    <div className="relative flex items-center justify-center">
      <svg width={140} height={140} className="-rotate-90">
        <circle
          cx={70}
          cy={70}
          r={radius}
          fill="none"
          stroke="#1e1e1e"
          strokeWidth={10}
        />
        <circle
          cx={70}
          cy={70}
          r={radius}
          fill="none"
          stroke="#22c55e"
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <Droplets size={20} className="mb-1 text-[#22c55e]" />
        <span className="text-xl font-bold tabular-nums text-white">
          {current.toFixed(2)}
        </span>
        <span className="text-[11px] text-[#888]">/ {target}L</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function NutritionTracker({ dailyLog, onUpdate }: NutritionTrackerProps) {
  const [addFoodMealId, setAddFoodMealId] = useState<string | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);

  // --- Helpers to mutate & persist -----------------------------------------
  const update = (patch: Partial<DailyLog>) => {
    const next = { ...dailyLog, ...patch };
    saveDailyLog(next);
    onUpdate(next);
  };

  const updateMeal = (mealId: string, patchFn: (m: MealLog) => MealLog) => {
    const meals = dailyLog.meals.map((m) =>
      m.id === mealId ? patchFn({ ...m }) : m,
    );
    update({ meals });
  };

  // --- Computed totals -----------------------------------------------------
  const totals = useMemo(() => {
    const all = dailyLog.meals.flatMap((m) => m.foods);
    return {
      calories: all.reduce((s, f) => s + f.calories, 0),
      protein: all.reduce((s, f) => s + f.protein, 0),
      carbs: all.reduce((s, f) => s + f.carbs, 0),
      fat: all.reduce((s, f) => s + f.fat, 0),
    };
  }, [dailyLog.meals]);

  // --- Water handlers ------------------------------------------------------
  const addWater = (amount: number) => {
    update({ water: Math.round((dailyLog.water + amount) * 100) / 100 });
  };

  // --- Supplement handlers -------------------------------------------------
  const toggleSupplement = (idx: number) => {
    const supplements = dailyLog.supplements.map((s, i) =>
      i === idx
        ? { ...s, taken: !s.taken, time: !s.taken ? new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : null }
        : s,
    );
    update({ supplements });
  };

  // --- Food item toggle ----------------------------------------------------
  const toggleFood = (mealId: string, foodId: string) => {
    updateMeal(mealId, (m) => ({
      ...m,
      foods: m.foods.map((f) =>
        f.id === foodId ? { ...f } : f,
      ),
    }));
  };

  // --- Meal toggle ---------------------------------------------------------
  const toggleMealCompleted = (mealId: string) => {
    updateMeal(mealId, (m) => ({ ...m, completed: !m.completed }));
  };

  // --- Add food to meal ----------------------------------------------------
  const addFoodToMeal = (food: FoodItem) => {
    if (!addFoodMealId) return;
    updateMeal(addFoodMealId, (m) => ({
      ...m,
      foods: [...m.foods, food],
    }));
    setAddFoodMealId(null);
  };

  // --- Remove food from meal -----------------------------------------------
  const removeFood = (mealId: string, foodId: string) => {
    updateMeal(mealId, (m) => ({
      ...m,
      foods: m.foods.filter((f) => f.id !== foodId),
    }));
  };

  // --- Supplement info from plan-data --------------------------------------
  const supplementInfo = SUPPLEMENTS.reduce<Record<string, { dose: string; when: string }>>(
    (acc, s) => {
      acc[s.name] = { dose: s.dose, when: s.when };
      return acc;
    },
    {},
  );

  // =======================================================================
  return (
    <div className="space-y-5 pt-4 pb-4">
      {/* ================================================================
          1. Daily Macros Summary
          ================================================================ */}
      <section className="rounded-2xl border border-[#262626] bg-[#141414] p-4">
        <div className="mb-3 flex items-center gap-2">
          <UtensilsCrossed size={18} className="text-[#22c55e]" />
          <h2 className="text-sm font-semibold text-white">Macros del dia</h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <MacroBar
            label="Calorias"
            current={totals.calories}
            target={MACROS_TARGET.calories}
            color="#22c55e"
            unit=""
          />
          <MacroBar
            label="Proteina"
            current={totals.protein}
            target={MACROS_TARGET.protein}
            color="#3b82f6"
            unit="g"
          />
          <MacroBar
            label="Carbos"
            current={totals.carbs}
            target={MACROS_TARGET.carbs}
            color="#f59e0b"
            unit="g"
          />
          <MacroBar
            label="Grasa"
            current={totals.fat}
            target={MACROS_TARGET.fat}
            color="#ec4899"
            unit="g"
          />
        </div>
      </section>

      {/* ================================================================
          2. Water Tracker
          ================================================================ */}
      <section className="rounded-2xl border border-[#262626] bg-[#141414] p-4">
        <div className="mb-3 flex items-center gap-2">
          <Droplets size={18} className="text-[#22c55e]" />
          <h2 className="text-sm font-semibold text-white">Agua</h2>
          {dailyLog.water >= MACROS_TARGET.water && (
            <span className="ml-auto rounded-full bg-[#22c55e]/10 px-2.5 py-0.5 text-[11px] font-medium text-[#22c55e]">
              Meta alcanzada
            </span>
          )}
        </div>

        <div className="flex items-center gap-6">
          <WaterCircle current={dailyLog.water} target={MACROS_TARGET.water} />

          <div className="flex flex-1 flex-col gap-2">
            {[0.25, 0.5, 1].map((amt) => (
              <button
                key={amt}
                onClick={() => addWater(amt)}
                className="flex items-center justify-center gap-2 rounded-xl border border-[#262626] bg-[#0a0a0a] py-2.5 text-sm font-medium text-white transition-all hover:border-[#22c55e]/40 hover:bg-[#22c55e]/5 active:scale-[0.97]"
              >
                <Plus size={14} className="text-[#22c55e]" />
                +{amt}L
              </button>
            ))}
            {dailyLog.water > 0 && (
              <button
                onClick={() => update({ water: Math.max(0, Math.round((dailyLog.water - 0.25) * 100) / 100) })}
                className="rounded-xl border border-[#262626] bg-[#0a0a0a] py-2 text-xs text-[#888] transition-colors hover:border-red-500/30 hover:text-red-400"
              >
                -0.25L
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ================================================================
          3. Meals Section
          ================================================================ */}
      {dailyLog.meals
        .filter((m) => m.type !== 'snack')
        .map((meal) => {
          const mealTotals = {
            calories: meal.foods.reduce((s, f) => s + f.calories, 0),
            protein: meal.foods.reduce((s, f) => s + f.protein, 0),
          };

          return (
            <section
              key={meal.id}
              className={`rounded-2xl border bg-[#141414] p-4 transition-colors ${
                meal.completed
                  ? 'border-[#22c55e]/30'
                  : 'border-[#262626]'
              }`}
            >
              {/* Header */}
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">
                    {MEAL_ICONS[meal.type] || '🍽️'}
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      {MEAL_LABELS[meal.type] || meal.type}
                    </h3>
                    <span className="text-[11px] text-[#666]">{meal.time}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs font-medium tabular-nums text-white">
                      {mealTotals.calories} kcal
                    </span>
                    <span className="ml-2 text-[11px] tabular-nums text-[#3b82f6]">
                      {mealTotals.protein}g prot
                    </span>
                  </div>

                  {/* Toggle meal completed */}
                  <button
                    onClick={() => toggleMealCompleted(meal.id)}
                    className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-all ${
                      meal.completed
                        ? 'border-[#22c55e] bg-[#22c55e] text-black'
                        : 'border-[#333] bg-transparent text-[#555] hover:border-[#22c55e]/50'
                    }`}
                  >
                    <Check size={14} />
                  </button>
                </div>
              </div>

              {/* Food items */}
              <div className="space-y-1.5">
                {meal.foods.map((food) => (
                  <div
                    key={food.id}
                    className="group flex items-center gap-3 rounded-xl bg-[#0a0a0a] px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-[#ccc]">
                        {food.name}
                      </p>
                      <p className="text-[11px] text-[#555]">
                        {food.portion} &middot; {food.protein}p / {food.carbs}c / {food.fat}g &middot; {food.calories} kcal
                      </p>
                    </div>
                    <button
                      onClick={() => removeFood(meal.id, food.id)}
                      className="shrink-0 rounded-md p-1 text-[#333] opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add food button */}
              <button
                onClick={() => setAddFoodMealId(meal.id)}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#262626] py-2.5 text-xs font-medium text-[#888] transition-colors hover:border-[#22c55e]/40 hover:text-[#22c55e]"
              >
                <Plus size={14} />
                Agregar alimento
              </button>
            </section>
          );
        })}

      {/* ================================================================
          4. Supplements Checklist
          ================================================================ */}
      <section className="rounded-2xl border border-[#262626] bg-[#141414] p-4">
        <div className="mb-3 flex items-center gap-2">
          <Pill size={18} className="text-[#22c55e]" />
          <h2 className="text-sm font-semibold text-white">Suplementos</h2>
          <span className="ml-auto text-[11px] tabular-nums text-[#888]">
            {dailyLog.supplements.filter((s) => s.taken).length}/
            {dailyLog.supplements.length}
          </span>
        </div>

        <div className="space-y-2">
          {dailyLog.supplements.map((sup, idx) => {
            const info = supplementInfo[sup.name];
            return (
              <button
                key={sup.name}
                onClick={() => toggleSupplement(idx)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all ${
                  sup.taken
                    ? 'bg-[#22c55e]/5'
                    : 'bg-[#0a0a0a] hover:bg-[#111]'
                }`}
              >
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-all ${
                    sup.taken
                      ? 'border-[#22c55e] bg-[#22c55e] text-black'
                      : 'border-[#333] text-transparent'
                  }`}
                >
                  <Check size={13} />
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-medium transition-colors ${
                      sup.taken ? 'text-[#22c55e]' : 'text-[#ccc]'
                    }`}
                  >
                    {sup.name}
                  </p>
                  {info && (
                    <p className="text-[11px] text-[#555]">
                      {info.dose} &middot; {info.when}
                    </p>
                  )}
                </div>

                {sup.taken && sup.time && (
                  <span className="shrink-0 text-[11px] tabular-nums text-[#555]">
                    {sup.time}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* ================================================================
          5. Food Rules (collapsible)
          ================================================================ */}
      <section className="rounded-2xl border border-[#262626] bg-[#141414]">
        <button
          onClick={() => setRulesOpen(!rulesOpen)}
          className="flex w-full items-center justify-between px-4 py-3.5 text-left"
        >
          <div className="flex items-center gap-2">
            <UtensilsCrossed size={16} className="text-[#22c55e]" />
            <span className="text-sm font-semibold text-white">
              Reglas de alimentacion
            </span>
          </div>
          {rulesOpen ? (
            <ChevronUp size={16} className="text-[#888]" />
          ) : (
            <ChevronDown size={16} className="text-[#888]" />
          )}
        </button>

        {rulesOpen && (
          <div className="border-t border-[#262626] px-4 pb-4 pt-3">
            <ol className="space-y-2">
              {FOOD_RULES.map((rule, i) => (
                <li
                  key={i}
                  className="flex gap-2.5 text-sm leading-relaxed text-[#aaa]"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#22c55e]/10 text-[10px] font-bold text-[#22c55e]">
                    {i + 1}
                  </span>
                  {rule}
                </li>
              ))}
            </ol>
          </div>
        )}
      </section>

      {/* ================================================================
          Add Food Modal
          ================================================================ */}
      {addFoodMealId && (
        <AddFoodModal
          onAdd={addFoodToMeal}
          onClose={() => setAddFoodMealId(null)}
        />
      )}
    </div>
  );
}
