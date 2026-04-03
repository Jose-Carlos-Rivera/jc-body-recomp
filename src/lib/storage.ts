import { DailyLog, BodyMeasurement, ExerciseLog, SetLog } from './types';
import { SUPPLEMENTS, MEAL_TEMPLATES } from './plan-data';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEYS = {
  DAILY_LOGS: 'jc_daily_logs',
  BODY_MEASUREMENTS: 'jc_body_measurements',
  EXERCISE_HISTORY: 'jc_exercise_history',
};

function getItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

// Format date as YYYY-MM-DD
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function getToday(): string {
  return formatDate(new Date());
}

// Daily Logs
export function getAllDailyLogs(): Record<string, DailyLog> {
  return getItem(STORAGE_KEYS.DAILY_LOGS, {});
}

export function getDailyLog(date: string): DailyLog {
  const logs = getAllDailyLogs();
  if (logs[date]) return logs[date];

  // Create default log for the day
  const defaultLog: DailyLog = {
    date,
    meals: [
      {
        id: uuidv4(),
        type: 'desayuno',
        time: MEAL_TEMPLATES.desayuno.time,
        foods: MEAL_TEMPLATES.desayuno.foods.map(f => ({ ...f, id: uuidv4() })),
        completed: false,
      },
      {
        id: uuidv4(),
        type: 'comida',
        time: MEAL_TEMPLATES.comida.time,
        foods: MEAL_TEMPLATES.comida.foods.map(f => ({ ...f, id: uuidv4() })),
        completed: false,
      },
      {
        id: uuidv4(),
        type: 'cena',
        time: MEAL_TEMPLATES.cena.time,
        foods: MEAL_TEMPLATES.cena.foods.map(f => ({ ...f, id: uuidv4() })),
        completed: false,
      },
    ],
    water: 0,
    supplements: SUPPLEMENTS.map(s => ({ name: s.name, taken: false, time: null })),
    workout: null,
    weight: null,
    notes: '',
    sleepHours: null,
    photos: [],
  };

  return defaultLog;
}

export function saveDailyLog(log: DailyLog): void {
  const logs = getAllDailyLogs();
  logs[log.date] = log;
  setItem(STORAGE_KEYS.DAILY_LOGS, logs);
}

// Body Measurements
export function getAllMeasurements(): BodyMeasurement[] {
  return getItem(STORAGE_KEYS.BODY_MEASUREMENTS, []);
}

export function saveMeasurement(measurement: BodyMeasurement): void {
  const measurements = getAllMeasurements();
  const idx = measurements.findIndex(m => m.date === measurement.date);
  if (idx >= 0) {
    measurements[idx] = measurement;
  } else {
    measurements.push(measurement);
  }
  measurements.sort((a, b) => a.date.localeCompare(b.date));
  setItem(STORAGE_KEYS.BODY_MEASUREMENTS, measurements);
}

// Exercise History (track weights over time)
export interface ExerciseHistoryEntry {
  date: string;
  exerciseName: string;
  bestWeight: number;
  bestReps: number;
  sets: SetLog[];
}

export function getExerciseHistory(): ExerciseHistoryEntry[] {
  return getItem(STORAGE_KEYS.EXERCISE_HISTORY, []);
}

export function saveExerciseToHistory(date: string, exercise: ExerciseLog): void {
  const history = getExerciseHistory();
  const completedSets = exercise.sets.filter(s => s.completed);
  if (completedSets.length === 0) return;

  const bestSet = completedSets.reduce((best, s) => s.weight > best.weight ? s : best, completedSets[0]);

  const entry: ExerciseHistoryEntry = {
    date,
    exerciseName: exercise.name,
    bestWeight: bestSet.weight,
    bestReps: bestSet.reps,
    sets: completedSets,
  };

  // Remove existing entry for same date and exercise
  const filtered = history.filter(h => !(h.date === date && h.exerciseName === exercise.name));
  filtered.push(entry);
  filtered.sort((a, b) => a.date.localeCompare(b.date));
  setItem(STORAGE_KEYS.EXERCISE_HISTORY, filtered);
}

// Streak calculation
export function getStreak(): { current: number; best: number } {
  const logs = getAllDailyLogs();
  const dates = Object.keys(logs).sort().reverse();

  let current = 0;
  let best = 0;
  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = formatDate(d);
    const log = logs[key];

    if (log && (log.meals.some(m => m.completed) || log.workout?.completed)) {
      streak++;
      if (i === 0 || streak > 0) current = Math.max(current, streak);
    } else if (i > 0) {
      best = Math.max(best, streak);
      streak = 0;
    }
  }
  best = Math.max(best, streak);

  return { current, best };
}

// Weekly stats
export function getWeeklyStats() {
  const logs = getAllDailyLogs();
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());

  let workoutsCompleted = 0;
  let mealsTracked = 0;
  let avgCalories = 0;
  let avgProtein = 0;
  let daysTracked = 0;

  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const key = formatDate(d);
    const log = logs[key];

    if (log) {
      if (log.workout?.completed) workoutsCompleted++;
      const dayMealsCompleted = log.meals.filter(m => m.completed).length;
      mealsTracked += dayMealsCompleted;

      if (dayMealsCompleted > 0) {
        daysTracked++;
        const dayCalories = log.meals.filter(m => m.completed).flatMap(m => m.foods).reduce((sum, f) => sum + f.calories, 0);
        const dayProtein = log.meals.filter(m => m.completed).flatMap(m => m.foods).reduce((sum, f) => sum + f.protein, 0);
        avgCalories += dayCalories;
        avgProtein += dayProtein;
      }
    }
  }

  return {
    workoutsCompleted,
    mealsTracked,
    avgCalories: daysTracked > 0 ? Math.round(avgCalories / daysTracked) : 0,
    avgProtein: daysTracked > 0 ? Math.round(avgProtein / daysTracked) : 0,
    daysTracked,
  };
}
