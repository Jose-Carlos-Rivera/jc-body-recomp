'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Scale,
  Ruler,
  Camera,
  TrendingDown,
  TrendingUp,
  Calendar,
  Target,
  Plus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { DailyLog, BodyMeasurement } from '@/lib/types';
import { INBODY_BASELINE, GOALS, EXPECTATIONS } from '@/lib/plan-data';
import { saveDailyLog, getAllMeasurements, saveMeasurement, formatDate } from '@/lib/storage';

interface BodyTrackerProps {
  dailyLog: DailyLog;
  onUpdate: (log: DailyLog) => void;
}

export default function BodyTracker({ dailyLog, onUpdate }: BodyTrackerProps) {
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [weightInput, setWeightInput] = useState(dailyLog.weight?.toString() ?? '');
  const [saving, setSaving] = useState(false);
  const [photoSaving, setPhotoSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<BodyMeasurement>({
    date: dailyLog.date,
    weight: dailyLog.weight ?? 0,
    bodyFat: null,
    waist: null,
    chest: null,
    leftArm: null,
    rightArm: null,
    leftThigh: null,
    rightThigh: null,
    notes: '',
  });

  useEffect(() => {
    setMeasurements(getAllMeasurements());
  }, []);

  useEffect(() => {
    setWeightInput(dailyLog.weight?.toString() ?? '');
  }, [dailyLog.weight]);

  const lastMeasurement = measurements.length > 0 ? measurements[measurements.length - 1] : null;

  const weightDiff =
    dailyLog.weight && lastMeasurement
      ? +(dailyLog.weight - lastMeasurement.weight).toFixed(1)
      : null;

  // ---- Quick weight save ----
  const handleQuickWeight = useCallback(() => {
    const val = parseFloat(weightInput);
    if (isNaN(val) || val <= 0) return;
    const updated = { ...dailyLog, weight: val };
    onUpdate(updated);
    saveDailyLog(updated);
  }, [weightInput, dailyLog, onUpdate]);

  // ---- Measurement form ----
  const handleFormChange = (field: keyof BodyMeasurement, value: string) => {
    if (field === 'notes' || field === 'date') {
      setForm(prev => ({ ...prev, [field]: value }));
    } else {
      setForm(prev => ({ ...prev, [field]: value === '' ? null : parseFloat(value) }));
    }
  };

  const handleSaveMeasurement = () => {
    if (!form.weight || form.weight <= 0) return;
    setSaving(true);
    saveMeasurement(form);
    setMeasurements(getAllMeasurements());

    const updated = { ...dailyLog, weight: form.weight };
    onUpdate(updated);
    saveDailyLog(updated);
    setShowForm(false);
    setTimeout(() => setSaving(false), 400);
  };

  // ---- Photo upload ----
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setPhotoSaving(true);

    const promises = Array.from(files).map(
      (file) =>
        new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        })
    );

    Promise.all(promises).then((base64Images) => {
      const updated = {
        ...dailyLog,
        photos: [...(dailyLog.photos || []), ...base64Images],
      };
      onUpdate(updated);
      saveDailyLog(updated);
      setPhotoSaving(false);
    });

    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    const updated = {
      ...dailyLog,
      photos: dailyLog.photos.filter((_, i) => i !== index),
    };
    onUpdate(updated);
    saveDailyLog(updated);
  };

  // ---- Helpers ----
  const getComparisonColor = (current: number | null | undefined, previous: number | null | undefined, lowerIsBetter = true) => {
    if (current == null || previous == null) return 'text-zinc-400';
    const diff = current - previous;
    if (diff === 0) return 'text-zinc-400';
    if (lowerIsBetter) return diff < 0 ? 'text-green-400' : 'text-red-400';
    return diff > 0 ? 'text-green-400' : 'text-red-400';
  };

  const formatValue = (v: number | null, unit: string) =>
    v !== null ? `${v}${unit}` : '--';

  return (
    <div className="space-y-4 pt-4 pb-4">
      {/* ──────────── InBody Baseline ──────────── */}
      <section className="rounded-2xl bg-[#141414] border border-[#262626] p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
            <Scale className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">InBody Baseline</h2>
            <p className="text-[11px] text-zinc-500">22 Enero 2025</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Peso', value: `${INBODY_BASELINE.weight} kg` },
            { label: 'Grasa Corporal', value: `${INBODY_BASELINE.bodyFatPercent}%` },
            { label: 'Musculo Esq.', value: `${INBODY_BASELINE.skeletalMuscle} kg` },
            { label: 'BMI', value: `${INBODY_BASELINE.bmi}` },
            { label: 'Cintura-Cadera', value: `${INBODY_BASELINE.waistHipRatio}` },
            { label: 'Grasa Visceral', value: `Nivel ${INBODY_BASELINE.visceralFat}` },
          ].map((item) => (
            <div key={item.label} className="bg-[#0a0a0a] rounded-xl px-3 py-2.5 text-center">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{item.label}</p>
              <p className="text-sm font-bold text-white mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 bg-[#0a0a0a] rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-xs text-zinc-400">InBody Score</span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-[#262626] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-700"
                style={{ width: `${INBODY_BASELINE.inbodyScore}%` }}
              />
            </div>
            <span className="text-sm font-bold text-white">{INBODY_BASELINE.inbodyScore}/100</span>
          </div>
        </div>
      </section>

      {/* ──────────── Today's Weight ──────────── */}
      <section className="rounded-2xl bg-[#141414] border border-[#262626] p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
            <TrendingDown className="w-4 h-4 text-green-400" />
          </div>
          <h2 className="text-sm font-semibold text-white">Peso de Hoy</h2>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="number"
            step="0.1"
            min="30"
            max="200"
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            placeholder="Ej: 65.5"
            className="flex-1 bg-[#0a0a0a] border border-[#262626] rounded-xl px-4 py-3 text-white text-lg font-bold placeholder:text-zinc-600 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-all"
          />
          <span className="text-sm text-zinc-500">kg</span>
          <button
            onClick={handleQuickWeight}
            className="bg-green-500 hover:bg-green-600 text-black font-semibold px-5 py-3 rounded-xl transition-all active:scale-95"
          >
            Guardar
          </button>
        </div>

        {dailyLog.weight && weightDiff !== null && weightDiff !== 0 && (
          <div className="mt-3 flex items-center gap-2">
            {weightDiff < 0 ? (
              <TrendingDown className="w-4 h-4 text-green-400" />
            ) : (
              <TrendingUp className="w-4 h-4 text-red-400" />
            )}
            <span className={`text-sm font-medium ${weightDiff < 0 ? 'text-green-400' : 'text-red-400'}`}>
              {weightDiff > 0 ? '+' : ''}
              {weightDiff} kg vs ultimo registro
            </span>
          </div>
        )}

        {dailyLog.weight && (
          <div className="mt-2 text-xs text-zinc-500">
            Meta: {GOALS.bodyFatTarget}% grasa corporal | Actual estimado: {GOALS.bodyFatCurrent}%
          </div>
        )}
      </section>

      {/* ──────────── Measurements Form ──────────── */}
      <section className="rounded-2xl bg-[#141414] border border-[#262626] overflow-hidden">
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full flex items-center justify-between p-5 active:bg-[#1a1a1a] transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Ruler className="w-4 h-4 text-green-400" />
            </div>
            <h2 className="text-sm font-semibold text-white">Medidas Corporales</h2>
          </div>
          {showForm ? (
            <ChevronUp className="w-5 h-5 text-zinc-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-zinc-400" />
          )}
        </button>

        {showForm && (
          <div className="px-5 pb-5 space-y-3 animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Peso (kg)', field: 'weight' as const, value: form.weight },
                { label: 'Grasa corporal %', field: 'bodyFat' as const, value: form.bodyFat },
                { label: 'Cintura (cm)', field: 'waist' as const, value: form.waist },
                { label: 'Pecho (cm)', field: 'chest' as const, value: form.chest },
                { label: 'Brazo izq. (cm)', field: 'leftArm' as const, value: form.leftArm },
                { label: 'Brazo der. (cm)', field: 'rightArm' as const, value: form.rightArm },
                { label: 'Muslo izq. (cm)', field: 'leftThigh' as const, value: form.leftThigh },
                { label: 'Muslo der. (cm)', field: 'rightThigh' as const, value: form.rightThigh },
              ].map(({ label, field, value }) => (
                <div key={field}>
                  <label className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1 block">
                    {label}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={value ?? ''}
                    onChange={(e) => handleFormChange(field, e.target.value)}
                    placeholder="--"
                    className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-green-500/50 transition-all"
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1 block">
                Notas
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => handleFormChange('notes', e.target.value)}
                rows={2}
                placeholder="Observaciones..."
                className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-green-500/50 resize-none transition-all"
              />
            </div>

            <button
              onClick={handleSaveMeasurement}
              disabled={saving}
              className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-black font-semibold py-3 rounded-xl transition-all active:scale-[0.98]"
            >
              {saving ? 'Guardando...' : 'Guardar Medidas'}
            </button>
          </div>
        )}
      </section>

      {/* ──────────── Progress Photos ──────────── */}
      <section className="rounded-2xl bg-[#141414] border border-[#262626] p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Camera className="w-4 h-4 text-green-400" />
            </div>
            <h2 className="text-sm font-semibold text-white">Fotos de Progreso</h2>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={photoSaving}
            className="flex items-center gap-1.5 bg-[#262626] hover:bg-[#333] text-white text-xs font-medium px-3 py-2 rounded-lg transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            {photoSaving ? 'Subiendo...' : 'Agregar'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </div>

        {dailyLog.photos && dailyLog.photos.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {dailyLog.photos.map((photo, idx) => (
              <div
                key={idx}
                className="relative group aspect-square rounded-xl overflow-hidden border border-[#262626]"
              >
                <img
                  src={photo}
                  alt={`Progreso ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removePhoto(idx)}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs text-white"
                >
                  x
                </button>
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1">
                  <p className="text-[9px] text-zinc-300">{dailyLog.date}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Camera className="w-8 h-8 text-zinc-600 mb-2" />
            <p className="text-xs text-zinc-500">No hay fotos para hoy</p>
            <p className="text-[10px] text-zinc-600 mt-1">Toma una foto para registrar tu progreso</p>
          </div>
        )}
      </section>

      {/* ──────────── Measurements History ──────────── */}
      <section className="rounded-2xl bg-[#141414] border border-[#262626] overflow-hidden">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between p-5 active:bg-[#1a1a1a] transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Historial de Medidas</h2>
              <p className="text-[11px] text-zinc-500">{measurements.length} registros</p>
            </div>
          </div>
          {showHistory ? (
            <ChevronUp className="w-5 h-5 text-zinc-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-zinc-400" />
          )}
        </button>

        {showHistory && (
          <div className="px-5 pb-5 space-y-2 max-h-80 overflow-y-auto animate-in slide-in-from-top-2 duration-200">
            {measurements.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-4">
                Aun no hay medidas registradas
              </p>
            ) : (
              [...measurements].reverse().map((m, idx) => {
                const prevMeasurement = measurements.length > 1
                  ? [...measurements].reverse()[idx + 1] ?? null
                  : null;
                return (
                  <div
                    key={m.date}
                    className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-zinc-300">{m.date}</span>
                      <span className="text-sm font-bold text-white">{m.weight} kg</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {[
                        { label: 'Grasa', val: m.bodyFat, prev: prevMeasurement?.bodyFat, unit: '%', lower: true },
                        { label: 'Cintura', val: m.waist, prev: prevMeasurement?.waist, unit: 'cm', lower: true },
                        { label: 'Pecho', val: m.chest, prev: prevMeasurement?.chest, unit: 'cm', lower: false },
                        { label: 'Brazo I', val: m.leftArm, prev: prevMeasurement?.leftArm, unit: 'cm', lower: false },
                        { label: 'Brazo D', val: m.rightArm, prev: prevMeasurement?.rightArm, unit: 'cm', lower: false },
                        { label: 'Muslo I', val: m.leftThigh, prev: prevMeasurement?.leftThigh, unit: 'cm', lower: false },
                        { label: 'Muslo D', val: m.rightThigh, prev: prevMeasurement?.rightThigh, unit: 'cm', lower: false },
                      ].map((item) => (
                        <div key={item.label}>
                          <p className="text-[9px] text-zinc-600 uppercase">{item.label}</p>
                          <p className={`text-[11px] font-semibold ${getComparisonColor(item.val, item.prev, item.lower)}`}>
                            {formatValue(item.val, item.unit)}
                          </p>
                        </div>
                      ))}
                    </div>
                    {m.notes && (
                      <p className="text-[10px] text-zinc-500 mt-2 italic">{m.notes}</p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </section>

      {/* ──────────── Expectations Timeline ──────────── */}
      <section className="rounded-2xl bg-[#141414] border border-[#262626] p-5">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
            <Target className="w-4 h-4 text-green-400" />
          </div>
          <h2 className="text-sm font-semibold text-white">Expectativas de Progreso</h2>
        </div>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-green-500/60 via-green-500/30 to-green-500/10" />

          <div className="space-y-5">
            {EXPECTATIONS.map((exp, idx) => (
              <div key={exp.period} className="flex items-start gap-4 relative">
                {/* Dot */}
                <div className="relative z-10 mt-0.5">
                  <div
                    className={`w-[31px] h-[31px] rounded-full flex items-center justify-center ${
                      idx === 0
                        ? 'bg-green-500 shadow-lg shadow-green-500/30'
                        : 'bg-[#262626] border border-[#333]'
                    }`}
                  >
                    <span className={`text-[10px] font-bold ${idx === 0 ? 'text-black' : 'text-zinc-400'}`}>
                      {idx + 1}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 pb-1">
                  <p className={`text-xs font-semibold ${idx === 0 ? 'text-green-400' : 'text-zinc-300'}`}>
                    {exp.period}
                  </p>
                  <p className="text-[12px] text-zinc-400 mt-0.5 leading-relaxed">
                    {exp.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Goal bar */}
        <div className="mt-5 bg-[#0a0a0a] rounded-xl p-3">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-zinc-500">Progreso hacia la meta</span>
            <span className="text-green-400 font-semibold">
              {GOALS.bodyFatCurrent}% → {GOALS.bodyFatTarget}%
            </span>
          </div>
          <div className="w-full h-2.5 bg-[#262626] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${Math.max(5, ((GOALS.bodyFatCurrent - GOALS.bodyFatCurrent) / (GOALS.bodyFatCurrent - GOALS.bodyFatTarget)) * 100)}%`,
              }}
            />
          </div>
          <p className="text-[10px] text-zinc-600 mt-1.5 text-center">
            {GOALS.fatToLose} kg de grasa por perder | {GOALS.muscleToGain} kg de musculo por ganar
          </p>
        </div>
      </section>
    </div>
  );
}
