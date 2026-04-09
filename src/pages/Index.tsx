import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";

// ── Types ────────────────────────────────────────────────────────────────────

interface Exercise {
  id: number;
  name: string;
  sets: number;
  reps: string;
  rest: number;
  category: string;
  emoji: string;
}

// ── Data ─────────────────────────────────────────────────────────────────────

const DEFAULT_PLAN: Exercise[] = [
  { id: 1, name: "Разминка", sets: 1, reps: "5 мин", rest: 60, category: "Кардио", emoji: "🔥" },
  { id: 2, name: "Отжимания", sets: 4, reps: "12–15", rest: 60, category: "Грудь", emoji: "💪" },
  { id: 3, name: "Приседания", sets: 4, reps: "15–20", rest: 90, category: "Ноги", emoji: "🦵" },
  { id: 4, name: "Планка", sets: 3, reps: "45 сек", rest: 60, category: "Кор", emoji: "⚡" },
  { id: 5, name: "Выпады", sets: 3, reps: "10 каждая", rest: 60, category: "Ноги", emoji: "🦵" },
  { id: 6, name: "Берпи", sets: 3, reps: "8–10", rest: 90, category: "Кардио", emoji: "🔥" },
  { id: 7, name: "Скручивания", sets: 3, reps: "20", rest: 45, category: "Кор", emoji: "⚡" },
  { id: 8, name: "Заминка", sets: 1, reps: "5 мин", rest: 0, category: "Растяжка", emoji: "🧘" },
];

const CATEGORY_COLORS: Record<string, string> = {
  Кардио: "text-orange-400 bg-orange-400/10",
  Грудь: "text-blue-400 bg-blue-400/10",
  Ноги: "text-green-400 bg-green-400/10",
  Кор: "text-yellow-400 bg-yellow-400/10",
  Растяжка: "text-purple-400 bg-purple-400/10",
};

// ── Timer Ring ────────────────────────────────────────────────────────────────

function TimerRing({ progress, color }: { progress: number; color: string }) {
  const r = 90;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - progress);

  return (
    <svg width="220" height="220" viewBox="0 0 220 220" className="rotate-[-90deg]">
      <circle cx="110" cy="110" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
      <circle
        cx="110"
        cy="110"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.9s linear, stroke 0.4s ease" }}
        filter="url(#glow)"
      />
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
}

// ── Timer Modal ───────────────────────────────────────────────────────────────

interface TimerModalProps {
  exercise: Exercise | null;
  mode: "work" | "rest";
  onClose: () => void;
}

function TimerModal({ exercise, mode, onClose }: TimerModalProps) {
  const workDuration = 45;
  const restDuration = exercise?.rest ?? 60;

  const [seconds, setSeconds] = useState(mode === "work" ? workDuration : restDuration);
  const [running, setRunning] = useState(true);
  const [currentMode, setCurrentMode] = useState<"work" | "rest">(mode);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentDuration = currentMode === "work" ? workDuration : restDuration;
  const progress = seconds / currentDuration;
  const ringColor = currentMode === "work" ? "#ff6b1a" : "#4ade80";
  const modeLabel = currentMode === "work" ? "РАБОТА" : "ОТДЫХ";

  const tick = useCallback(() => {
    setSeconds((s) => {
      if (s <= 1) { setRunning(false); return 0; }
      return s - 1;
    });
  }, []);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, tick]);

  const switchMode = () => {
    const next: "work" | "rest" = currentMode === "work" ? "rest" : "work";
    setCurrentMode(next);
    setSeconds(next === "work" ? workDuration : restDuration);
    setRunning(true);
  };

  const reset = () => {
    setSeconds(currentDuration);
    setRunning(false);
  };

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  if (!exercise) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-sm mx-4 rounded-3xl p-8 border border-white/10 animate-scale-in"
        style={{ background: "hsl(220,20%,10%)" }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
        >
          <Icon name="X" size={22} />
        </button>

        <div className="text-center mb-6">
          <span className="text-3xl">{exercise.emoji}</span>
          <h2 className="font-display text-2xl text-white mt-1 tracking-wide">{exercise.name}</h2>
          <span
            className={`inline-block mt-2 px-3 py-0.5 rounded-full text-xs font-medium tracking-widest uppercase ${
              currentMode === "work" ? "bg-orange-500/20 text-orange-400" : "bg-green-500/20 text-green-400"
            }`}
          >
            {modeLabel}
          </span>
        </div>

        <div className="relative flex items-center justify-center mb-6">
          <TimerRing progress={progress} color={ringColor} />
          <div className="absolute flex flex-col items-center">
            <span
              className={`font-display text-6xl font-bold tracking-tight ${
                seconds === 0
                  ? "text-white/40"
                  : currentMode === "work"
                  ? "text-orange-400"
                  : "text-green-400"
              } ${running && seconds > 0 ? "timer-tick" : ""}`}
            >
              {fmt(seconds)}
            </span>
            <span className="text-white/40 text-xs mt-1 tracking-widest">СЕКУНД</span>
          </div>
        </div>

        {seconds === 0 && (
          <div className="text-center text-white font-display text-xl mb-4 animate-fade-in">
            {currentMode === "work" ? "⚡ Отличная работа!" : "🔥 Поехали дальше!"}
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all text-sm font-medium"
          >
            <Icon name="RotateCcw" size={16} /> Сброс
          </button>

          <button
            onClick={() => setRunning((r) => !r)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-display text-base tracking-wide text-white transition-all"
            style={{ background: "hsl(25,100%,55%)", boxShadow: "0 0 20px hsl(25 100% 55% / 0.4)" }}
          >
            <Icon name={running ? "Pause" : "Play"} size={18} />
            {running ? "Пауза" : "Старт"}
          </button>

          {restDuration > 0 && (
            <button
              onClick={switchMode}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all text-sm font-medium"
            >
              <Icon name="ArrowLeftRight" size={16} />
              {currentMode === "work" ? "Отдых" : "Работа"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Exercise Card ─────────────────────────────────────────────────────────────

interface ExerciseCardProps {
  exercise: Exercise;
  index: number;
  completed: boolean;
  onToggle: () => void;
  onTimer: () => void;
}

function ExerciseCard({ exercise, index, completed, onToggle, onTimer }: ExerciseCardProps) {
  const catColor = CATEGORY_COLORS[exercise.category] ?? "text-gray-400 bg-gray-400/10";

  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 ${
        completed
          ? "bg-white/3 border-white/5 opacity-50"
          : "border-white/8 hover:border-orange-500/30"
      }`}
      style={{ background: completed ? "rgba(255,255,255,0.02)" : "hsl(220,18%,12%)" }}
    >
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-display text-sm font-bold ${
          completed ? "bg-white/10 text-white/30" : "bg-orange-500/15 text-orange-400"
        }`}
      >
        {completed ? <Icon name="Check" size={14} /> : index + 1}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-lg">{exercise.emoji}</span>
          <span
            className={`font-display text-base tracking-wide ${
              completed ? "text-white/30 line-through" : "text-white"
            }`}
          >
            {exercise.name}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-white/40">
          <span>{exercise.sets} подх. × {exercise.reps}</span>
          {exercise.rest > 0 && (
            <span className="flex items-center gap-1">
              <Icon name="Clock" size={11} /> {exercise.rest}с отдых
            </span>
          )}
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${catColor}`}>
            {exercise.category}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {!completed && (
          <button
            onClick={onTimer}
            className="w-8 h-8 rounded-xl bg-orange-500/10 hover:bg-orange-500/25 text-orange-400 flex items-center justify-center transition-all"
            title="Запустить таймер"
          >
            <Icon name="Timer" size={15} />
          </button>
        )}
        <button
          onClick={onToggle}
          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
            completed
              ? "bg-green-500/20 text-green-400 hover:bg-red-500/20 hover:text-red-400"
              : "bg-white/5 hover:bg-green-500/20 text-white/30 hover:text-green-400"
          }`}
          title={completed ? "Отметить невыполненным" : "Отметить выполненным"}
        >
          <Icon name="Check" size={15} />
        </button>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Index() {
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [timerExercise, setTimerExercise] = useState<Exercise | null>(null);
  const [timerMode, setTimerMode] = useState<"work" | "rest">("work");
  const [workoutStarted, setWorkoutStarted] = useState(false);

  const toggleCompleted = (id: number) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openTimer = (ex: Exercise, mode: "work" | "rest") => {
    setTimerExercise(ex);
    setTimerMode(mode);
  };

  const done = completed.size;
  const total = DEFAULT_PLAN.length;
  const progressPct = (done / total) * 100;

  return (
    <div className="min-h-screen" style={{ background: "hsl(220,20%,8%)" }}>
      {/* Ambient glow */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(ellipse, hsl(25,100%,55%) 0%, transparent 70%)" }}
      />

      <div className="max-w-lg mx-auto px-4 py-8 relative z-10">

        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between mb-1">
            <div>
              <p className="text-white/40 text-xs tracking-[0.2em] uppercase font-body mb-1">Сегодня</p>
              <h1 className="font-display text-4xl text-white tracking-wide leading-none">
                ПЛАН ТРЕНИРОВКИ
              </h1>
            </div>
            <div className="text-right">
              <div
                className="font-display text-3xl"
                style={{ color: "hsl(25,100%,55%)", textShadow: "0 0 20px hsl(25 100% 55% / 0.8)" }}
              >
                {done}/{total}
              </div>
              <div className="text-white/40 text-xs tracking-widest">ГОТОВО</div>
            </div>
          </div>

          <div className="mt-4 h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progressPct}%`,
                background: "linear-gradient(90deg, hsl(25,100%,55%), hsl(48,100%,50%))",
                boxShadow: "0 0 10px hsl(25 100% 55% / 0.6)",
              }}
            />
          </div>

          {done === total && total > 0 && (
            <div
              className="mt-3 text-center font-display text-xl animate-scale-in"
              style={{ color: "hsl(48,100%,50%)", textShadow: "0 0 20px hsl(48 100% 50% / 0.8)" }}
            >
              🏆 ТРЕНИРОВКА ЗАВЕРШЕНА!
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Всего", value: total, icon: "Dumbbell" },
            { label: "Осталось", value: total - done, icon: "Flame" },
            { label: "Готово", value: done, icon: "CheckCircle2" },
          ].map((s, i) => (
            <div
              key={i}
              className="border border-white/8 rounded-2xl p-3 text-center animate-fade-in"
              style={{ background: "hsl(220,18%,12%)", animationDelay: `${i * 80}ms` }}
            >
              <Icon name={s.icon as "Dumbbell"} size={18} className="mx-auto mb-1 text-orange-400" />
              <div className="font-display text-2xl text-white">{s.value}</div>
              <div className="text-white/40 text-[10px] tracking-widest uppercase">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Start / Status */}
        {!workoutStarted ? (
          <button
            onClick={() => setWorkoutStarted(true)}
            className="w-full mb-6 py-4 rounded-2xl font-display text-xl text-white tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] animate-fade-in"
            style={{
              background: "linear-gradient(135deg, hsl(25,100%,50%), hsl(10,100%,45%))",
              boxShadow: "0 0 30px hsl(25 100% 55% / 0.35)",
            }}
          >
            ⚡ НАЧАТЬ ТРЕНИРОВКУ
          </button>
        ) : (
          <div className="mb-4 flex items-center gap-3 animate-fade-in">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-500/15 border border-green-500/20">
              <span
                className="w-2 h-2 rounded-full bg-green-400 inline-block"
                style={{ boxShadow: "0 0 6px #4ade80" }}
              />
              <span className="text-green-400 text-xs font-medium tracking-widest uppercase">В процессе</span>
            </div>
            <button
              onClick={() => { setWorkoutStarted(false); setCompleted(new Set()); }}
              className="text-white/30 hover:text-white/60 text-xs transition-colors"
            >
              Сбросить
            </button>
          </div>
        )}

        {/* List */}
        <div className="space-y-2">
          {DEFAULT_PLAN.map((ex, i) => (
            <div key={ex.id} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
              <ExerciseCard
                exercise={ex}
                index={i}
                completed={completed.has(ex.id)}
                onToggle={() => toggleCompleted(ex.id)}
                onTimer={() => openTimer(ex, "work")}
              />
            </div>
          ))}
        </div>

        {/* Quick timers */}
        {workoutStarted && (
          <div className="mt-8 animate-fade-in">
            <p className="text-white/30 text-xs tracking-[0.2em] uppercase mb-3">Быстрый таймер</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => openTimer(DEFAULT_PLAN[1], "work")}
                className="flex items-center gap-3 p-4 rounded-2xl border border-orange-500/20 hover:border-orange-500/40 transition-all text-left"
                style={{ background: "hsl(25,100%,55%,0.08)" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "hsl(25,100%,55%)" }}
                >
                  <Icon name="Zap" size={20} className="text-white" />
                </div>
                <div>
                  <div className="font-display text-sm text-white tracking-wide">РАБОТА</div>
                  <div className="text-white/40 text-xs">45 секунд</div>
                </div>
              </button>

              <button
                onClick={() => openTimer(DEFAULT_PLAN[1], "rest")}
                className="flex items-center gap-3 p-4 rounded-2xl border border-green-500/20 hover:border-green-500/40 transition-all text-left"
                style={{ background: "rgba(74,222,128,0.08)" }}
              >
                <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center flex-shrink-0">
                  <Icon name="Coffee" size={20} className="text-white" />
                </div>
                <div>
                  <div className="font-display text-sm text-white tracking-wide">ОТДЫХ</div>
                  <div className="text-white/40 text-xs">60 секунд</div>
                </div>
              </button>
            </div>
          </div>
        )}

        <div className="h-12" />
      </div>

      {timerExercise && (
        <TimerModal
          exercise={timerExercise}
          mode={timerMode}
          onClose={() => setTimerExercise(null)}
        />
      )}
    </div>
  );
}
