export interface DailyLog {
  date: string; // YYYY-MM-DD
  meals: MealLog[];
  water: number; // liters
  supplements: SupplementLog[];
  workout: WorkoutLog | null;
  weight: number | null;
  notes: string;
  sleepHours: number | null;
  photos: string[]; // base64 strings
}

export interface MealLog {
  id: string;
  type: 'desayuno' | 'comida' | 'cena' | 'snack';
  time: string;
  foods: FoodItem[];
  completed: boolean;
}

export interface FoodItem {
  id: string;
  name: string;
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
  portion: string;
}

export interface SupplementLog {
  name: string;
  taken: boolean;
  time: string | null;
}

export interface WorkoutLog {
  id: string;
  dayType: string;
  exercises: ExerciseLog[];
  cardio: CardioLog | null;
  duration: number; // minutes
  completed: boolean;
  notes: string;
}

export interface ExerciseLog {
  id: string;
  name: string;
  category: 'weights' | 'abs' | 'cardio';
  sets: SetLog[];
  targetSets: string;
  targetReps: string;
  restSeconds: number;
  completed: boolean;
}

export interface SetLog {
  setNumber: number;
  weight: number;
  reps: number;
  completed: boolean;
}

export interface CardioLog {
  type: 'bici' | 'correr' | 'caminata';
  duration: number; // minutes
  intensity: 'baja' | 'moderado' | 'mod-alto' | 'alto';
  completed: boolean;
}

export interface BodyMeasurement {
  date: string;
  weight: number;
  bodyFat: number | null;
  waist: number | null;
  chest: number | null;
  leftArm: number | null;
  rightArm: number | null;
  leftThigh: number | null;
  rightThigh: number | null;
  notes: string;
}

export interface WeeklyPlan {
  [key: string]: DayPlan;
}

export interface DayPlan {
  dayName: string;
  training: string;
  duration: string;
  exercises: PlannedExercise[];
  absExercises: PlannedExercise[];
  cardio: { type: string; duration: string; intensity: string } | null;
}

export interface PlannedExercise {
  name: string;
  sets: string;
  reps: string;
  rest: string;
}

export type TabType = 'dashboard' | 'nutrition' | 'workout' | 'body' | 'progress';
