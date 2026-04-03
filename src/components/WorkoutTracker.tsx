'use client';

import { useState, useEffect, useCallback } from 'react';
import { DailyLog, WorkoutLog, ExerciseLog, SetLog, CardioLog } from '@/lib/types';
import { WEEKLY_PLAN, getDayKey } from '@/lib/plan-data';
import { saveDailyLog, saveExerciseToHistory } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';
import {
  Dumbbell,
  Timer,
  Check,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  Trophy,
  Bike,
  PersonStanding,
} from 'lucide-react';

interface WorkoutTrackerProps {
  dailyLog: DailyLog;
  onUpdate: (log: DailyLog) => void;
}

function parseTargetSets(setsStr: string): number {
  return parseInt(setsStr, 10) || 3;
}

function parseRestSeconds(restStr: string): number {
  const match = restStr.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 60;
}

function initializeWorkoutFromPlan(date: Date): WorkoutLog {
  const dayKey = getDayKey(date);
  const plan = WEEKLY_PLAN[dayKey];

  const exercises: ExerciseLog[] = plan.exercises.map((ex) => ({
    id: uuidv4(),
    name: ex.name,
    category: 'weights' as const,
    sets: Array.from({ length: parseTargetSets(ex.sets) }, (_, i) => ({
      setNumber: i + 1,
      weight: 0,
      reps: 0,
      completed: false,
    })),
    targetSets: ex.sets,
    targetReps: ex.reps,
    restSeconds: parseRestSeconds(ex.rest),
    completed: false,
  }));

  const absExercises: ExerciseLog[] = plan.absExercises.map((ex) => ({
    id: uuidv4(),
    name: ex.name,
    category: 'abs' as const,
    sets: Array.from({ length: parseTargetSets(ex.sets) }, (_, i) => ({
      setNumber: i + 1,
      weight: 0,
      reps: 0,
      completed: false,
    })),
    targetSets: ex.sets,
    targetReps: ex.reps,
    restSeconds: parseRestSeconds(ex.rest),
    completed: false,
  }));

  const allExercises = [...exercises, ...absExercises];

  const cardio: CardioLog | null = plan.cardio
    ? {
        type: plan.cardio.type.toLowerCase().includes('bici')
          ? 'bici'
          : plan.cardio.type.toLowerCase().includes('correr')
          ? 'correr'
          : 'caminata',
        duration: parseInt(plan.cardio.duration.match(/\d+/)?.[0] || '30', 10),
        intensity: plan.cardio.intensity.toLowerCase().includes('alto')
          ? 'alto'
          : plan.cardio.intensity.toLowerCase().includes('mod-alto')
          ? 'mod-alto'
          : plan.cardio.intensity.toLowerCase().includes('moderado') ||
            plan.cardio.intensity.toLowerCase().includes('mod')
          ? 'moderado'
          : 'baja',
        completed: false,
      }
    : null;

  return {
    id: uuidv4(),
    dayType: `${plan.dayName} - ${plan.training}`,
    exercises: allExercises,
    cardio,
    duration: 0,
    completed: false,
    notes: '',
  };
}

export default function WorkoutTracker({ dailyLog, onUpdate }: WorkoutTrackerProps) {
  const [workout, setWorkout] = useState<WorkoutLog | null>(dailyLog.workout);
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(new Set());
  const [cardioNotes, setCardioNotes] = useState('');

  const today = new Date();
  const dayKey = getDayKey(today);
  const plan = WEEKLY_PLAN[dayKey];

  // Initialize workout from plan if not present
  useEffect(() => {
    if (!dailyLog.workout) {
      const newWorkout = initializeWorkoutFromPlan(today);
      setWorkout(newWorkout);
      const updated = { ...dailyLog, workout: newWorkout };
      onUpdate(updated);
      saveDailyLog(updated);
    } else {
      setWorkout(dailyLog.workout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer
  useEffect(() => {
    if (!workoutStarted || !startTime) return;
    const interval = setInterval(() => {
      setElapsedMinutes(Math.floor((Date.now() - startTime) / 60000));
    }, 1000);
    return () => clearInterval(interval);
  }, [workoutStarted, startTime]);

  const persistWorkout = useCallback(
    (updatedWorkout: WorkoutLog) => {
      setWorkout(updatedWorkout);
      const updated = { ...dailyLog, workout: updatedWorkout };
      onUpdate(updated);
      saveDailyLog(updated);
    },
    [dailyLog, onUpdate]
  );

  const toggleExerciseExpand = (exerciseId: string) => {
    setExpandedExercises((prev) => {
      const next = new Set(prev);
      if (next.has(exerciseId)) {
        next.delete(exerciseId);
      } else {
        next.add(exerciseId);
      }
      return next;
    });
  };

  const handleStartWorkout = () => {
    setWorkoutStarted(true);
    setStartTime(Date.now());
  };

  const handlePauseWorkout = () => {
    setWorkoutStarted(false);
  };

  const updateSet = (exerciseId: string, setIndex: number, field: keyof SetLog, value: number | boolean) => {
    if (!workout) return;

    const updatedExercises = workout.exercises.map((ex) => {
      if (ex.id !== exerciseId) return ex;

      const updatedSets = ex.sets.map((s, i) => {
        if (i !== setIndex) return s;
        return { ...s, [field]: value };
      });

      const allSetsCompleted = updatedSets.every((s) => s.completed);
      const updatedExercise = { ...ex, sets: updatedSets, completed: allSetsCompleted };

      // Save to history when all sets completed
      if (allSetsCompleted && !ex.completed) {
        saveExerciseToHistory(dailyLog.date, updatedExercise);
      }

      return updatedExercise;
    });

    const allDone =
      updatedExercises.every((ex) => ex.completed) &&
      (!workout.cardio || workout.cardio.completed);

    const updatedWorkout: WorkoutLog = {
      ...workout,
      exercises: updatedExercises,
      duration: elapsedMinutes || workout.duration,
      completed: allDone,
    };

    persistWorkout(updatedWorkout);
  };

  const toggleSetCompleted = (exerciseId: string, setIndex: number) => {
    if (!workout) return;
    const exercise = workout.exercises.find((e) => e.id === exerciseId);
    if (!exercise) return;
    const currentSet = exercise.sets[setIndex];
    updateSet(exerciseId, setIndex, 'completed', !currentSet.completed);
  };

  const toggleCardioCompleted = () => {
    if (!workout || !workout.cardio) return;
    const updatedCardio: CardioLog = { ...workout.cardio, completed: !workout.cardio.completed };
    const allExercisesDone = workout.exercises.every((ex) => ex.completed);
    const updatedWorkout: WorkoutLog = {
      ...workout,
      cardio: updatedCardio,
      duration: elapsedMinutes || workout.duration,
      completed: allExercisesDone && updatedCardio.completed,
    };
    persistWorkout(updatedWorkout);
  };

  const updateWorkoutNotes = (notes: string) => {
    if (!workout) return;
    persistWorkout({ ...workout, notes });
  };

  // Calculations
  const totalSets = workout?.exercises.reduce((sum, ex) => sum + ex.sets.length, 0) || 0;
  const completedSets = workout?.exercises.reduce(
    (sum, ex) => sum + ex.sets.filter((s) => s.completed).length,
    0
  ) || 0;
  const totalVolume = workout?.exercises.reduce(
    (sum, ex) =>
      sum + ex.sets.filter((s) => s.completed).reduce((v, s) => v + s.weight * s.reps, 0),
    0
  ) || 0;

  const weightExercises = workout?.exercises.filter((e) => e.category === 'weights') || [];
  const absExercises = workout?.exercises.filter((e) => e.category === 'abs') || [];

  const intensityLabel = (i: string) => {
    switch (i) {
      case 'baja': return 'Baja';
      case 'moderado': return 'Moderado';
      case 'mod-alto': return 'Mod-Alto';
      case 'alto': return 'Alto';
      default: return i;
    }
  };

  const renderExerciseCard = (exercise: ExerciseLog) => {
    const isExpanded = expandedExercises.has(exercise.id);
    const completedCount = exercise.sets.filter((s) => s.completed).length;
    const totalCount = exercise.sets.length;

    return (
      <div
        key={exercise.id}
        className={`rounded-xl border transition-all duration-200 ${
          exercise.completed
            ? 'border-[#22c55e]/30 bg-[#22c55e]/5'
            : 'border-[#262626] bg-[#141414]'
        }`}
      >
        {/* Exercise Header */}
        <button
          onClick={() => toggleExerciseExpand(exercise.id)}
          className="flex w-full items-center justify-between p-4"
        >
          <div className="flex items-center gap-3">
            {exercise.completed ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#22c55e]/20">
                <Check className="h-4 w-4 text-[#22c55e]" />
              </div>
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#262626]">
                <Dumbbell className="h-4 w-4 text-[#a3a3a3]" />
              </div>
            )}
            <div className="text-left">
              <p
                className={`text-sm font-semibold ${
                  exercise.completed ? 'text-[#22c55e]' : 'text-white'
                }`}
              >
                {exercise.name}
              </p>
              <p className="text-xs text-[#737373]">
                {exercise.targetSets} x {exercise.targetReps} &middot;{' '}
                <Timer className="mb-0.5 inline h-3 w-3" /> {exercise.restSeconds}s descanso
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-[#737373]">
              {completedCount}/{totalCount}
            </span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-[#737373]" />
            ) : (
              <ChevronDown className="h-4 w-4 text-[#737373]" />
            )}
          </div>
        </button>

        {/* Sets Table */}
        {isExpanded && (
          <div className="border-t border-[#262626] px-4 pb-4 pt-3">
            {/* Header row */}
            <div className="mb-2 grid grid-cols-[40px_1fr_1fr_48px] gap-2 px-1">
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#525252]">
                Set
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#525252]">
                Peso (kg)
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#525252]">
                Reps
              </span>
              <span className="text-center text-[10px] font-medium uppercase tracking-wider text-[#525252]">
                Hecho
              </span>
            </div>

            {exercise.sets.map((set, idx) => (
              <div
                key={idx}
                className={`mb-1.5 grid grid-cols-[40px_1fr_1fr_48px] items-center gap-2 rounded-lg px-1 py-1.5 ${
                  set.completed ? 'bg-[#22c55e]/5' : ''
                }`}
              >
                <span
                  className={`text-center text-sm font-bold ${
                    set.completed ? 'text-[#22c55e]' : 'text-[#525252]'
                  }`}
                >
                  {set.setNumber}
                </span>

                <input
                  type="number"
                  inputMode="decimal"
                  value={set.weight || ''}
                  onChange={(e) =>
                    updateSet(exercise.id, idx, 'weight', parseFloat(e.target.value) || 0)
                  }
                  placeholder="0"
                  className="h-9 w-full rounded-lg border border-[#262626] bg-[#0a0a0a] px-3 text-center text-sm text-white outline-none transition-colors focus:border-[#22c55e]/50 focus:ring-1 focus:ring-[#22c55e]/20"
                />

                <input
                  type="number"
                  inputMode="numeric"
                  value={set.reps || ''}
                  onChange={(e) =>
                    updateSet(exercise.id, idx, 'reps', parseInt(e.target.value, 10) || 0)
                  }
                  placeholder="0"
                  className="h-9 w-full rounded-lg border border-[#262626] bg-[#0a0a0a] px-3 text-center text-sm text-white outline-none transition-colors focus:border-[#22c55e]/50 focus:ring-1 focus:ring-[#22c55e]/20"
                />

                <div className="flex justify-center">
                  <button
                    onClick={() => toggleSetCompleted(exercise.id, idx)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-all ${
                      set.completed
                        ? 'border-[#22c55e] bg-[#22c55e] text-black'
                        : 'border-[#262626] bg-[#0a0a0a] text-[#525252] hover:border-[#22c55e]/50'
                    }`}
                  >
                    <Check className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* Rest timer display */}
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#0a0a0a] px-3 py-2">
              <Timer className="h-3.5 w-3.5 text-[#525252]" />
              <span className="text-xs text-[#525252]">
                Descanso recomendado: {exercise.restSeconds}s entre series
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 pt-4 pb-4">
      {/* ─── Header ─── */}
      <div className="rounded-2xl border border-[#262626] bg-[#141414] p-5">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">{plan.dayName}</h2>
            <p className="text-sm text-[#22c55e]">{plan.training}</p>
            <div className="mt-1 flex items-center gap-2 text-xs text-[#737373]">
              <Timer className="h-3 w-3" />
              <span>{plan.duration}</span>
            </div>
          </div>

          {workout?.completed && (
            <div className="flex items-center gap-1.5 rounded-full bg-[#22c55e]/10 px-3 py-1">
              <Trophy className="h-3.5 w-3.5 text-[#22c55e]" />
              <span className="text-xs font-semibold text-[#22c55e]">Completado</span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="mb-1 flex justify-between text-xs text-[#737373]">
            <span>Progreso</span>
            <span>
              {completedSets}/{totalSets} series
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#262626]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#22c55e] to-[#16a34a] transition-all duration-500"
              style={{ width: `${totalSets > 0 ? (completedSets / totalSets) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Start/Pause button */}
        <div className="flex items-center gap-3">
          {!workoutStarted ? (
            <button
              onClick={handleStartWorkout}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#22c55e] py-3 font-semibold text-black transition-all active:scale-[0.98]"
            >
              <Play className="h-4 w-4" />
              {startTime ? 'Reanudar Entreno' : 'Iniciar Entreno'}
            </button>
          ) : (
            <button
              onClick={handlePauseWorkout}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#22c55e]/30 bg-[#22c55e]/10 py-3 font-semibold text-[#22c55e] transition-all active:scale-[0.98]"
            >
              <Pause className="h-4 w-4" />
              Entreno en Progreso
            </button>
          )}

          {startTime && (
            <div className="rounded-xl border border-[#262626] bg-[#0a0a0a] px-4 py-3 text-center">
              <p className="text-lg font-bold tabular-nums text-white">{elapsedMinutes}</p>
              <p className="text-[10px] text-[#525252]">min</p>
            </div>
          )}
        </div>
      </div>

      {/* ─── Weight Exercises ─── */}
      {weightExercises.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2 px-1">
            <Dumbbell className="h-4 w-4 text-[#22c55e]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#a3a3a3]">
              Ejercicios con Peso
            </h3>
          </div>
          <div className="space-y-3">{weightExercises.map(renderExerciseCard)}</div>
        </div>
      )}

      {/* ─── Abs Exercises ─── */}
      {absExercises.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2 px-1">
            <PersonStanding className="h-4 w-4 text-[#22c55e]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#a3a3a3]">
              Abdomen
            </h3>
          </div>
          <div className="space-y-3">{absExercises.map(renderExerciseCard)}</div>
        </div>
      )}

      {/* ─── Cardio Section ─── */}
      {workout?.cardio && (
        <div>
          <div className="mb-3 flex items-center gap-2 px-1">
            <Bike className="h-4 w-4 text-[#22c55e]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#a3a3a3]">Cardio</h3>
          </div>

          <div
            className={`rounded-xl border p-4 transition-all ${
              workout.cardio.completed
                ? 'border-[#22c55e]/30 bg-[#22c55e]/5'
                : 'border-[#262626] bg-[#141414]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">
                  {plan.cardio?.type || 'Cardio'}
                </p>
                <div className="mt-1 flex items-center gap-3 text-xs text-[#737373]">
                  <span className="flex items-center gap-1">
                    <Timer className="h-3 w-3" />
                    {plan.cardio?.duration || `${workout.cardio.duration} min`}
                  </span>
                  <span className="rounded-full bg-[#262626] px-2 py-0.5 text-[10px] font-medium text-[#a3a3a3]">
                    {plan.cardio?.intensity || intensityLabel(workout.cardio.intensity)}
                  </span>
                </div>
              </div>

              <button
                onClick={toggleCardioCompleted}
                className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all ${
                  workout.cardio.completed
                    ? 'border-[#22c55e] bg-[#22c55e] text-black'
                    : 'border-[#262626] bg-[#0a0a0a] text-[#525252] hover:border-[#22c55e]/50'
                }`}
              >
                <Check className="h-5 w-5" />
              </button>
            </div>

            {/* Cardio notes */}
            <div className="mt-3">
              <input
                type="text"
                value={cardioNotes}
                onChange={(e) => setCardioNotes(e.target.value)}
                placeholder="Notas del cardio (opcional)..."
                className="w-full rounded-lg border border-[#262626] bg-[#0a0a0a] px-3 py-2 text-xs text-white placeholder-[#525252] outline-none transition-colors focus:border-[#22c55e]/50"
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── Workout Summary ─── */}
      {workout?.completed && (
        <div className="rounded-2xl border border-[#22c55e]/20 bg-gradient-to-br from-[#22c55e]/10 to-[#141414] p-5">
          <div className="mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-[#22c55e]" />
            <h3 className="text-base font-bold text-white">Resumen del Entreno</h3>
          </div>

          <div className="mb-4 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-[#0a0a0a]/60 p-3 text-center">
              <p className="text-xl font-bold text-[#22c55e]">{completedSets}</p>
              <p className="text-[10px] text-[#737373]">Series</p>
            </div>
            <div className="rounded-xl bg-[#0a0a0a]/60 p-3 text-center">
              <p className="text-xl font-bold text-[#22c55e]">
                {totalVolume > 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume}
              </p>
              <p className="text-[10px] text-[#737373]">Volumen (kg)</p>
            </div>
            <div className="rounded-xl bg-[#0a0a0a]/60 p-3 text-center">
              <p className="text-xl font-bold text-[#22c55e]">
                {elapsedMinutes || workout.duration}
              </p>
              <p className="text-[10px] text-[#737373]">Minutos</p>
            </div>
          </div>

          <textarea
            value={workout.notes}
            onChange={(e) => updateWorkoutNotes(e.target.value)}
            placeholder="Notas sobre tu entreno..."
            rows={3}
            className="w-full resize-none rounded-xl border border-[#262626] bg-[#0a0a0a] px-4 py-3 text-sm text-white placeholder-[#525252] outline-none transition-colors focus:border-[#22c55e]/50"
          />
        </div>
      )}

      {/* ─── Notes (when not completed) ─── */}
      {workout && !workout.completed && (
        <div className="rounded-xl border border-[#262626] bg-[#141414] p-4">
          <p className="mb-2 text-xs font-medium text-[#737373]">Notas</p>
          <textarea
            value={workout.notes}
            onChange={(e) => updateWorkoutNotes(e.target.value)}
            placeholder="Anota como te sientes, ajustes de peso, etc..."
            rows={2}
            className="w-full resize-none rounded-lg border border-[#262626] bg-[#0a0a0a] px-3 py-2 text-sm text-white placeholder-[#525252] outline-none transition-colors focus:border-[#22c55e]/50"
          />
        </div>
      )}
    </div>
  );
}
