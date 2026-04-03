import { supabase } from '@/lib/supabase';
import { DailyLog, BodyMeasurement } from '@/lib/types';
import {
  ExerciseHistoryEntry,
  getAllDailyLogs,
  saveDailyLog,
  getAllMeasurements,
  saveMeasurement,
  getExerciseHistory,
} from '@/lib/storage';

// ---------------------------------------------------------------------------
// Sync daily log to Supabase
// ---------------------------------------------------------------------------
export async function syncDailyLog(log: DailyLog): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from('daily_logs').upsert(
      {
        date: log.date,
        data: log,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'date' }
    );
  } catch (err) {
    console.error('[db] syncDailyLog failed', err);
  }
}

// ---------------------------------------------------------------------------
// Sync body measurement to Supabase
// ---------------------------------------------------------------------------
export async function syncBodyMeasurement(measurement: BodyMeasurement): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from('body_measurements').upsert(
      {
        date: measurement.date,
        data: measurement,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'date' }
    );
  } catch (err) {
    console.error('[db] syncBodyMeasurement failed', err);
  }
}

// ---------------------------------------------------------------------------
// Sync exercise history entry to Supabase
// ---------------------------------------------------------------------------
export async function syncExerciseHistory(entry: ExerciseHistoryEntry): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from('exercise_history').upsert(
      {
        date: entry.date,
        exercise_name: entry.exerciseName,
        data: entry,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'date,exercise_name' }
    );
  } catch (err) {
    console.error('[db] syncExerciseHistory failed', err);
  }
}

// ---------------------------------------------------------------------------
// Save push subscription to Supabase
// ---------------------------------------------------------------------------
export async function savePushSubscription(subscription: PushSubscriptionJSON): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from('push_subscriptions').upsert(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        created_at: new Date().toISOString(),
      },
      { onConflict: 'endpoint' }
    );
  } catch (err) {
    console.error('[db] savePushSubscription failed', err);
  }
}

// ---------------------------------------------------------------------------
// Pull all data from Supabase and merge with localStorage
// ---------------------------------------------------------------------------
export async function pullAllData(): Promise<void> {
  if (!supabase) return;

  try {
    // --- Daily logs ---
    const { data: remoteLogs } = await supabase
      .from('daily_logs')
      .select('date, data, updated_at');

    if (remoteLogs && remoteLogs.length > 0) {
      const localLogs = getAllDailyLogs();

      for (const row of remoteLogs) {
        const remoteDate = row.date as string;
        const remoteLog = row.data as DailyLog;
        const remoteUpdated = new Date(row.updated_at as string).getTime();

        const localLog = localLogs[remoteDate];
        // Supabase wins if no local version or remote is newer
        if (!localLog || remoteUpdated > Date.now() - 60_000) {
          saveDailyLog(remoteLog);
        }
      }
    }

    // --- Body measurements ---
    const { data: remoteMeasurements } = await supabase
      .from('body_measurements')
      .select('date, data, updated_at');

    if (remoteMeasurements && remoteMeasurements.length > 0) {
      const localMeasurements = getAllMeasurements();
      const localByDate = new Map(localMeasurements.map((m) => [m.date, m]));

      for (const row of remoteMeasurements) {
        const remoteMeasurement = row.data as BodyMeasurement;
        if (!localByDate.has(row.date as string)) {
          saveMeasurement(remoteMeasurement);
        }
      }
    }

    // --- Exercise history ---
    const { data: remoteHistory } = await supabase
      .from('exercise_history')
      .select('date, exercise_name, data, updated_at');

    if (remoteHistory && remoteHistory.length > 0) {
      const localHistory = getExerciseHistory();
      const localKeys = new Set(localHistory.map((h) => `${h.date}|${h.exerciseName}`));

      for (const row of remoteHistory) {
        const key = `${row.date}|${row.exercise_name}`;
        if (!localKeys.has(key)) {
          const entry = row.data as ExerciseHistoryEntry;
          // Save directly to localStorage via the storage module
          const history = getExerciseHistory();
          history.push(entry);
          history.sort((a, b) => a.date.localeCompare(b.date));
          if (typeof window !== 'undefined') {
            localStorage.setItem('jc_exercise_history', JSON.stringify(history));
          }
        }
      }
    }
  } catch (err) {
    console.error('[db] pullAllData failed', err);
  }
}
