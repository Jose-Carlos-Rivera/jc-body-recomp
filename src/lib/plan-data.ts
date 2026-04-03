import { DayPlan, PlannedExercise } from './types';

// Jose Carlos's InBody data from Jan 22, 2025
export const INBODY_BASELINE = {
  date: '2025-01-22',
  age: 24,
  height: 164,
  weight: 66.2,
  skeletalMuscle: 27.8,
  bodyFatMass: 16.9,
  bodyFatPercent: 25.5,
  bmi: 24.6,
  waistHipRatio: 0.91,
  visceralFat: 6,
  inbodyScore: 71,
  basalMetabolicRate: 1500,
};

// Goals
export const GOALS = {
  bodyFatTarget: 15,
  bodyFatCurrent: 25.5,
  fatToLose: 8, // kg
  muscleToGain: 1, // kg
  priorityArea: 'piernas',
};

// Daily macros
export const MACROS_TARGET = {
  calories: 1750,
  protein: 145,
  carbs: 130,
  fat: 58,
  fiber: 30,
  water: 3.5, // liters
};

// Meal plan templates
export const MEAL_TEMPLATES = {
  desayuno: {
    time: '07:00',
    targetCalories: 550,
    targetProtein: 48,
    foods: [
      { name: '4 claras + 2 huevos enteros revueltos', protein: 30, carbs: 2, fat: 12, calories: 236, portion: '6 huevos' },
      { name: 'Avena con agua', protein: 5, carbs: 27, fat: 3, calories: 150, portion: '1/3 taza' },
      { name: 'Fresas o moras', protein: 1, carbs: 12, fat: 0, calories: 50, portion: '1/2 taza' },
      { name: 'Almendras', protein: 4, carbs: 3, fat: 9, calories: 104, portion: '15 piezas' },
      { name: 'Cafe negro sin azucar', protein: 0, carbs: 0, fat: 0, calories: 5, portion: '1 taza' },
    ],
  },
  comida: {
    time: '13:30',
    targetCalories: 650,
    targetProtein: 50,
    foods: [
      { name: 'Pechuga de pollo a la plancha', protein: 46, carbs: 0, fat: 4, calories: 220, portion: '200g' },
      { name: 'Arroz integral', protein: 3, carbs: 36, fat: 1, calories: 170, portion: '3/4 taza' },
      { name: 'Ensalada grande (lechuga, espinaca, pepino, jitomate, brocoli)', protein: 3, carbs: 10, fat: 0, calories: 50, portion: '2 tazas' },
      { name: 'Aguacate', protein: 1, carbs: 4, fat: 11, calories: 120, portion: '1/2 pequeno' },
      { name: 'Aceite de oliva', protein: 0, carbs: 0, fat: 10, calories: 90, portion: '1 cdita' },
    ],
  },
  cena: {
    time: '20:00',
    targetCalories: 550,
    targetProtein: 47,
    foods: [
      { name: 'Pescado o pollo', protein: 40, carbs: 0, fat: 4, calories: 200, portion: '200g' },
      { name: 'Verduras al vapor (brocoli, calabaza, ejote)', protein: 4, carbs: 10, fat: 0, calories: 50, portion: '1 taza' },
      { name: 'Arroz o papa', protein: 2, carbs: 25, fat: 0, calories: 115, portion: '1/2 taza o 1 papa' },
      { name: 'Queso cottage o proteina whey', protein: 20, carbs: 5, fat: 2, calories: 120, portion: '100g o 1 scoop' },
      { name: 'Tortilla integral (opcional)', protein: 3, carbs: 15, fat: 2, calories: 80, portion: '1 pieza' },
    ],
  },
};

// Supplements
export const SUPPLEMENTS = [
  { name: 'Creatina monohidrato', dose: '5g', when: 'Con cualquier comida' },
  { name: 'Proteina Whey', dose: '1-2 scoops', when: 'Post-entreno o como snack' },
  { name: 'Omega 3', dose: '2 capsulas', when: 'Con alimentos' },
  { name: 'Vitamina D3', dose: '1 capsula', when: 'Con alimentos' },
  { name: 'Magnesio', dose: '1 capsula', when: 'Antes de dormir' },
  { name: 'Cafeina', dose: 'Cafe negro', when: '30 min antes de entrenar' },
];

// Weekly plan
export const WEEKLY_PLAN: Record<string, DayPlan> = {
  lunes: {
    dayName: 'Lunes',
    training: 'Pierna (Cuadriceps) + Abdomen',
    duration: '90-100 min',
    exercises: [
      { name: 'Sentadilla con barra', sets: '4', reps: '8-10', rest: '90s' },
      { name: 'Prensa de pierna', sets: '4', reps: '10-12', rest: '90s' },
      { name: 'Extension de cuadriceps', sets: '3', reps: '12-15', rest: '60s' },
      { name: 'Zancadas caminando', sets: '3', reps: '12 c/pierna', rest: '60s' },
      { name: 'Elevacion de pantorrilla', sets: '4', reps: '15-20', rest: '45s' },
    ],
    absExercises: [
      { name: 'Crunch en polea alta', sets: '3', reps: '15-20', rest: '30s' },
      { name: 'Elevacion de piernas colgado', sets: '3', reps: '12-15', rest: '30s' },
      { name: 'Plancha frontal', sets: '3', reps: '45-60s', rest: '30s' },
    ],
    cardio: { type: 'Bici estacionaria o ruta', duration: '35 min', intensity: 'Moderado' },
  },
  martes: {
    dayName: 'Martes',
    training: 'Pecho + Triceps',
    duration: '80-90 min',
    exercises: [
      { name: 'Press de banca plano', sets: '4', reps: '8-10', rest: '90s' },
      { name: 'Press inclinado mancuernas', sets: '3', reps: '10-12', rest: '60s' },
      { name: 'Aperturas en maquina', sets: '3', reps: '12-15', rest: '60s' },
      { name: 'Fondos en paralelas', sets: '3', reps: '8-12', rest: '60s' },
      { name: 'Extension de triceps polea', sets: '3', reps: '12-15', rest: '45s' },
      { name: 'Press frances', sets: '3', reps: '10-12', rest: '45s' },
    ],
    absExercises: [],
    cardio: { type: 'Correr', duration: '30 min', intensity: 'Moderado' },
  },
  miercoles: {
    dayName: 'Miercoles',
    training: 'Espalda + Biceps + Abdomen',
    duration: '90-100 min',
    exercises: [
      { name: 'Dominadas (o jalon al pecho)', sets: '4', reps: '8-10', rest: '90s' },
      { name: 'Remo con barra', sets: '4', reps: '8-10', rest: '90s' },
      { name: 'Remo mancuerna un brazo', sets: '3', reps: '10-12', rest: '60s' },
      { name: 'Pullover polea', sets: '3', reps: '12-15', rest: '60s' },
      { name: 'Curl biceps barra', sets: '3', reps: '10-12', rest: '60s' },
      { name: 'Curl martillo', sets: '3', reps: '12-15', rest: '45s' },
    ],
    absExercises: [
      { name: 'Russian twist con peso', sets: '3', reps: '20 total', rest: '30s' },
      { name: 'Bicycle crunch', sets: '3', reps: '20 total', rest: '30s' },
      { name: 'Ab wheel o plancha dinamica', sets: '3', reps: '10-12', rest: '30s' },
    ],
    cardio: { type: 'Bici', duration: '35 min', intensity: 'Moderado' },
  },
  jueves: {
    dayName: 'Jueves',
    training: 'Pierna (Gluteo/Isquiotibiales)',
    duration: '80-90 min',
    exercises: [
      { name: 'Peso muerto rumano', sets: '4', reps: '8-10', rest: '90s' },
      { name: 'Hip thrust', sets: '4', reps: '10-12', rest: '90s' },
      { name: 'Curl femoral acostado', sets: '3', reps: '12-15', rest: '60s' },
      { name: 'Sentadilla bulgara', sets: '3', reps: '10 c/pierna', rest: '60s' },
      { name: 'Abduccion de cadera', sets: '3', reps: '15', rest: '45s' },
      { name: 'Elevacion de pantorrilla', sets: '4', reps: '15-20', rest: '45s' },
    ],
    absExercises: [],
    cardio: { type: 'Correr', duration: '30 min', intensity: 'Moderado' },
  },
  viernes: {
    dayName: 'Viernes',
    training: 'Hombro + Abdomen',
    duration: '90-100 min',
    exercises: [
      { name: 'Press militar barra/mancuernas', sets: '4', reps: '8-10', rest: '90s' },
      { name: 'Elevaciones laterales', sets: '4', reps: '12-15', rest: '45s' },
      { name: 'Elevaciones frontales', sets: '3', reps: '12-15', rest: '45s' },
      { name: 'Face pulls', sets: '3', reps: '15', rest: '45s' },
      { name: 'Encogimientos (trapecios)', sets: '3', reps: '12-15', rest: '45s' },
    ],
    absExercises: [
      { name: 'Dragon flag / elev. piernas banco', sets: '3', reps: '10-12', rest: '30s' },
      { name: 'Crunch en polea alta', sets: '3', reps: '15-20', rest: '30s' },
      { name: 'Plancha lateral', sets: '3', reps: '30s c/lado', rest: '30s' },
    ],
    cardio: { type: 'Bici', duration: '35 min', intensity: 'Moderado' },
  },
  sabado: {
    dayName: 'Sabado',
    training: 'Cardio + Abdomen',
    duration: '60-75 min',
    exercises: [],
    absExercises: [
      { name: 'Crunch', sets: '3', reps: '20', rest: 'Sin pausa' },
      { name: 'Mountain climbers', sets: '3', reps: '20', rest: 'Sin pausa' },
      { name: 'Plancha', sets: '3', reps: '45s', rest: 'Sin pausa' },
      { name: 'Leg raise acostado', sets: '3', reps: '15', rest: '60s entre rondas' },
    ],
    cardio: { type: 'Bici o correr', duration: '50-60 min', intensity: 'Mod-alto + intervalos' },
  },
  domingo: {
    dayName: 'Domingo',
    training: 'Descanso Activo',
    duration: '30 min',
    exercises: [],
    absExercises: [],
    cardio: { type: 'Caminata + estiramientos y foam roller', duration: '30 min + 15-20 min', intensity: 'Baja' },
  },
};

export const FOOD_RULES = [
  'Proteina en CADA comida (minimo 30g)',
  'Hidratacion: 3-4 litros de agua diarios',
  'ELIMINAR: refrescos, jugos, alcohol, pan dulce, comida frita, ultraprocesados',
  'REDUCIR: tortillas de harina, harinas blancas, azucares anadidos',
  'Verduras verdes en abundancia',
  'Carbohidratos concentrados pre y post entreno',
  'Grasas buenas con medida: aguacate, aceite de oliva, almendras',
];

export const EXPECTATIONS = [
  { period: 'Mes 1-2', description: 'Te ves mas apretado, bajan medidas. El peso puede no cambiar mucho.' },
  { period: 'Mes 3-4', description: 'Definicion visible en brazos y abdomen. Peso baja 3-4 kg.' },
  { period: 'Mes 5-6', description: 'Llegas a ~18-20% grasa. Piernas mas fuertes.' },
  { period: 'Mes 8-12', description: 'Meta de 15% grasa alcanzable con consistencia.' },
];

export function getDayKey(date: Date): string {
  const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  return days[date.getDay()];
}

export function getTodayPlan(): DayPlan {
  return WEEKLY_PLAN[getDayKey(new Date())];
}
