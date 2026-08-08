import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Check,
  ChevronLeft,
  Dumbbell,
  Edit3,
  Home,
  LogOut,
  Play,
  Plus,
  Save,
  Search,
  Trash2,
  TrendingUp,
  User,
  Users,
  X,
  ZoomIn,
} from "lucide-react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import "./exercise-quality.css";
import { displayName } from "./exercise-rename-translate.js";
import {
  currentWorkoutOwnerId,
  hydrateWorkoutState,
  readWorkoutData,
  writeWorkoutData,
} from "./lib/workout-state.js";
import {
  timerDeadline,
  timerSecondsRemaining,
} from "./lib/timer-clock.js";
import {
  addTimerResumeListener,
  cancelTimerNotification,
  hasNativeTimerNotifications,
  prepareTimerNotifications,
  scheduleTimerNotification,
} from "./lib/workout-timer-notifications.js";

const CUSTOM_NAMES = "mayfit_catalog_custom_names_v1";
const BASE =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";
const DB =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";
const catalog = {
  supino: {
    label: "Supino reto",
    pair: [
      "Barbell_Bench_Press_-_Medium_Grip/0.jpg",
      "Barbell_Bench_Press_-_Medium_Grip/1.jpg",
    ],
  },
  pelvica: {
    label: "Elevação pélvica",
    pair: ["Barbell_Hip_Thrust/0.jpg", "Barbell_Hip_Thrust/1.jpg"],
  },
  legpress: {
    label: "Prensa de pernas",
    pair: ["Leg_Press/0.jpg", "Leg_Press/1.jpg"],
  },
  flexora: {
    label: "Cadeira flexora",
    pair: ["Lying_Leg_Curls/0.jpg", "Lying_Leg_Curls/1.jpg"],
  },
  panturrilha: {
    label: "Panturrilha em pé",
    pair: ["Standing_Calf_Raises/0.jpg", "Standing_Calf_Raises/1.jpg"],
  },
  agachamento: {
    label: "Agachamento com barra",
    pair: ["Barbell_Squat/0.jpg", "Barbell_Squat/1.jpg"],
  },
  terra: {
    label: "Levantamento terra",
    pair: ["Barbell_Deadlift/0.jpg", "Barbell_Deadlift/1.jpg"],
  },
  remada: {
    label: "Remada baixa",
    pair: ["Seated_Cable_Rows/0.jpg", "Seated_Cable_Rows/1.jpg"],
  },
  puxada: {
    label: "Puxada frontal",
    pair: ["Wide-Grip_Lat_Pulldown/0.jpg", "Wide-Grip_Lat_Pulldown/1.jpg"],
  },
  desenvolvimento: {
    label: "Desenvolvimento com halteres",
    pair: ["Dumbbell_Shoulder_Press/0.jpg", "Dumbbell_Shoulder_Press/1.jpg"],
  },
  lateral: {
    label: "Elevação lateral",
    pair: ["Side_Lateral_Raise/0.jpg", "Side_Lateral_Raise/1.jpg"],
  },
  biceps: {
    label: "Rosca direta",
    pair: ["Barbell_Curl/0.jpg", "Barbell_Curl/1.jpg"],
  },
  triceps: {
    label: "Tríceps na polia",
    pair: ["Triceps_Pushdown/0.jpg", "Triceps_Pushdown/1.jpg"],
  },
  extensora: {
    label: "Cadeira extensora",
    pair: ["Leg_Extensions/0.jpg", "Leg_Extensions/1.jpg"],
  },
  abdominal: { label: "Abdominal", pair: ["Crunches/0.jpg", "Crunches/1.jpg"] },
};
const itemFor = (type) =>
  catalog[type] || {
    label: type.replaceAll("_", " ").replaceAll("-", " "),
    pair: [`${type}/0.jpg`, `${type}/1.jpg`],
  };
const seed = {
  users: [
    {
      id: "admin",
      name: "Samuel",
      email: "admin@mayfit.com",
      password: "123456",
      role: "admin",
    },
    {
      id: "aluno",
      name: "Aluno Teste",
      email: "aluno@mayfit.com",
      password: "123456",
      role: "student",
    },
  ],
  exercises: [
    {
      id: 1,
      type: "supino",
      name: "Supino reto",
      sets: 4,
      reps: 12,
      load: 60,
      previousLoad: 56,
      rest: 59,
      tip: "Pés firmes, escápulas encaixadas e barra descendo até a linha média do peito.",
    },
    {
      id: 2,
      type: "pelvica",
      name: "Elevação pélvica",
      sets: 3,
      reps: 10,
      load: 80,
      previousLoad: 75,
      rest: 60,
      tip: "Queixo levemente recolhido, abdômen firme e extensão completa do quadril.",
    },
    {
      id: 3,
      type: "legpress",
      name: "Prensa de pernas 90°",
      sets: 4,
      reps: 12,
      load: 120,
      previousLoad: 110,
      rest: 90,
      tip: "Joelhos alinhados com os pés e lombar apoiada durante todo o movimento.",
    },
    {
      id: 4,
      type: "flexora",
      name: "Cadeira flexora",
      sets: 4,
      reps: 8,
      load: 45,
      previousLoad: 40,
      rest: 60,
      tip: "Quadril apoiado, movimento controlado e sem tirar o tronco do banco.",
    },
    {
      id: 5,
      type: "panturrilha",
      name: "Panturrilha",
      sets: 4,
      reps: 15,
      load: 50,
      previousLoad: 45,
      rest: 45,
      tip: "Amplitude completa, subindo na ponta dos pés e descendo devagar.",
    },
  ],
  sessions: [],
};
const cloneSeed = () => JSON.parse(JSON.stringify(seed));
const canonicalExercises = (list) => {
  const source = Array.isArray(list) ? list : [];
  const seenTypes = new Set();
  const seenIds = new Set();
  let nextId = Math.max(0, ...source.map((item) => Number(item?.id) || 0));
  return source.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const type = String(item.type || "").trim();
    if (!type) return [];
    const typeKey = type.toLowerCase();
    if (seenTypes.has(typeKey)) return [];
    seenTypes.add(typeKey);
    let id = Number(item.id);
    if (!Number.isFinite(id) || id <= 0 || seenIds.has(id)) id = ++nextId;
    seenIds.add(id);
    return [{ ...item, id, type, name: displayName(type, item.name || type) }];
  });
};
const normalizeData = (raw) => {
  const fallback = cloneSeed();
  fallback.exercises = [];
  fallback.sessions = [];
  const source = raw && typeof raw === "object" ? raw : fallback;
  return {
    ...source,
    users: Array.isArray(source.users) ? source.users : fallback.users,
    exercises: canonicalExercises(source.exercises),
    sessions: Array.isArray(source.sessions) ? source.sessions : [],
    workoutName: String(source.workoutName || "Treino A").trim() || "Treino A",
  };
};
const load = () => {
  try {
    return normalizeData(readWorkoutData());
  } catch {
    return normalizeData(null);
  }
};
const save = (d) =>
  writeWorkoutData(normalizeData(d), { notify: false, sync: true });
const rememberExerciseName = (type, name) => {
  const cleanName = String(name || "").trim();
  if (!type || !cleanName) return;
  try {
    const custom = JSON.parse(localStorage.getItem(CUSTOM_NAMES) || "{}");
    custom[String(type)] = cleanName;
    localStorage.setItem(CUSTOM_NAMES, JSON.stringify(custom));
  } catch {}
};
let timerAudioContext = null;
const unlockTimerAudio = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    timerAudioContext = timerAudioContext || new AudioContext();
    if (timerAudioContext.state === "suspended") timerAudioContext.resume();
  } catch {}
};
const playTimerAlert = () => {
  try {
    unlockTimerAudio();
    const ctx = timerAudioContext;
    if (!ctx) return;
    [0, 0.28, 0.56, 0.84, 1.12, 1.4].forEach((offset, index) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(
        index % 2 ? 760 : 980,
        ctx.currentTime + offset,
      );
      gain.gain.setValueAtTime(0.42, ctx.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + offset + 0.22,
      );
      oscillator.start(ctx.currentTime + offset);
      oscillator.stop(ctx.currentTime + offset + 0.24);
    });
  } catch {}
};
function Login({ data, onLogin }) {
  const [email, setEmail] = useState("aluno@mayfit.com");
  const [password, setPassword] = useState("123456");
  const [msg, setMsg] = useState("");
  const submit = (e) => {
    e.preventDefault();
    const u = data.users.find(
      (x) => x.email === email && x.password === password,
    );
    if (!u) return setMsg("E-mail ou senha incorretos.");
    onLogin(u);
  };
  return (
    <div className="login-page">
      <div className="login-logo">
        <span>MaY</span>FiT<small>SEU CORPO. SEU FOCO. SEUS RESULTADOS.</small>
      </div>
      <form className="login-card" onSubmit={submit}>
        <h1>Entrar</h1>
        <label>
          E-mail
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Senha
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {msg && <div className="notice">{msg}</div>}
        <button className="primary">Entrar</button>
        <button
          type="button"
          className="demo-switch"
          onClick={() =>
            setEmail(
              email.includes("admin") ? "aluno@mayfit.com" : "admin@mayfit.com",
            )
          }
        >
          Alternar conta de teste
        </button>
      </form>
    </div>
  );
}
function ExercisePhoto({ exercise, compact = false }) {
  const [zoom, setZoom] = useState(false);
  const item = itemFor(exercise.type);
  const fallback = BASE + catalog.supino.pair[0];
  const fix = (e) => {
    if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
  };
  return (
    <>
      <button
        type="button"
        className={compact ? "exercise-photo compact" : "exercise-photo"}
        onClick={() => setZoom(true)}
      >
        <div className="pose-pair">
          <figure>
            <b>INÍCIO</b>
            <img src={BASE + item.pair[0]} onError={fix} />
          </figure>
          <figure>
            <b>FINAL</b>
            <img src={BASE + item.pair[1]} onError={fix} />
          </figure>
        </div>
        <span>EXECUÇÃO CORRETA</span>
        <em>
          <ZoomIn /> ampliar
        </em>
      </button>
      {zoom && (
        <div className="exercise-modal" onClick={() => setZoom(false)}>
          <div
            className="exercise-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close" onClick={() => setZoom(false)}>
              <X />
            </button>
            <h2>{exercise.name}</h2>
            <div className="modal-pose-pair">
              <figure>
                <b>INÍCIO</b>
                <img src={BASE + item.pair[0]} onError={fix} />
              </figure>
              <figure>
                <b>FINAL</b>
                <img src={BASE + item.pair[1]} onError={fix} />
              </figure>
            </div>
            <p>{exercise.tip}</p>
          </div>
        </div>
      )}
    </>
  );
}
const format = (s) =>
  `${String(Math.floor(Math.max(0, s) / 60)).padStart(2, "0")}:${String(Math.max(0, s) % 60).padStart(2, "0")}`;
const parseTime = (value) => {
  const clean = value.trim();
  if (clean.includes(":")) {
    const [m, s] = clean.split(":").map(Number);
    return Math.max(0, (m || 0) * 60 + (s || 0));
  }
  return Math.max(0, Number(clean) || 0);
};
function Workout({ data, setData, onBack }) {
  const [entries, setEntries] = useState(() =>
    Object.fromEntries(data.exercises.map((e) => [e.id, { ...e }])),
  );
  const [remainingSets, setRemainingSets] = useState(() =>
    Object.fromEntries(data.exercises.map((e) => [e.id, Number(e.sets) || 1])),
  );
  const [activeId, setActiveId] = useState(null);
  const [phase, setPhase] = useState("exercise");
  const [seconds, setSeconds] = useState(data.exercises[0]?.rest || 60);
  const [running, setRunning] = useState(false);
  const [started, setStarted] = useState(false);
  const [deadline, setDeadline] = useState(null);
  const [done, setDone] = useState({});
  const [timeText, setTimeText] = useState(
    format(data.exercises[0]?.rest || 60),
  );
  const zeroHandled = useRef(false);
  const deadlineRef = useRef(0);
  const nativeAlertScheduledRef = useRef(false);
  const notificationWarningShownRef = useRef(false);
  const transitionTimeoutRef = useRef(null);
  const pauseValue = () =>
    Math.max(0, Number(localStorage.getItem("mayfit_pause_seconds")) || 60);
  const clearPendingTransition = () => {
    if (!transitionTimeoutRef.current) return;
    clearTimeout(transitionTimeoutRef.current);
    transitionTimeoutRef.current = null;
  };
  const requestTimerAlerts = async () => {
    const ready = await prepareTimerNotifications({ request: true });
    if (
      !ready &&
      hasNativeTimerNotifications() &&
      !notificationWarningShownRef.current
    ) {
      notificationWarningShownRef.current = true;
      alert(
        "Para o sino tocar com a tela apagada, permita as notificações e os alarmes do MaYFiT nas configurações do Android.",
      );
    }
    return ready;
  };
  const startCountdown = (
    value,
    nextPhase = phase,
    nextActiveId = activeId,
  ) => {
    clearPendingTransition();
    const duration = Math.max(0, Number(value) || 0);
    const nextDeadline = timerDeadline(duration);
    deadlineRef.current = duration > 0 ? nextDeadline : 0;
    nativeAlertScheduledRef.current = false;
    setDeadline(duration > 0 ? nextDeadline : null);
    setActiveId(nextActiveId);
    setPhase(nextPhase);
    setSeconds(duration);
    setStarted(true);
    setRunning(duration > 0);
    if (duration <= 0) {
      void cancelTimerNotification({ delivered: true });
      return;
    }
    const exerciseName = entries[nextActiveId]?.name || "";
    void scheduleTimerNotification({
      deadline: nextDeadline,
      phase: nextPhase,
      exerciseName,
    }).then((scheduled) => {
      if (deadlineRef.current === nextDeadline) {
        nativeAlertScheduledRef.current = scheduled;
      } else if (scheduled) {
        void cancelTimerNotification();
      }
    });
  };
  const pauseCountdown = () => {
    clearPendingTransition();
    const remaining = deadlineRef.current
      ? timerSecondsRemaining(deadlineRef.current)
      : seconds;
    deadlineRef.current = 0;
    nativeAlertScheduledRef.current = false;
    setDeadline(null);
    setSeconds(remaining);
    setRunning(false);
    void cancelTimerNotification();
  };
  const resetCountdown = (value) => {
    clearPendingTransition();
    deadlineRef.current = 0;
    nativeAlertScheduledRef.current = false;
    setDeadline(null);
    setSeconds(Math.max(0, Number(value) || 0));
    setRunning(false);
    setStarted(false);
    void cancelTimerNotification({ delivered: true });
  };
  useEffect(() => setTimeText(format(seconds)), [seconds]);
  useEffect(() => {
    if (!running || !deadline) return;
    const syncClock = () => setSeconds(timerSecondsRemaining(deadline));
    syncClock();
    const id = setInterval(syncClock, 250);
    return () => clearInterval(id);
  }, [running, deadline]);
  useEffect(() => {
    let disposed = false;
    let listener = null;
    addTimerResumeListener(() => {
      if (deadlineRef.current) {
        setSeconds(timerSecondsRemaining(deadlineRef.current));
      }
    })
      .then((handle) => {
        if (disposed) void handle.remove();
        else listener = handle;
      })
      .catch(() => {});
    return () => {
      disposed = true;
      if (listener) void listener.remove();
    };
  }, []);
  useEffect(
    () => () => {
      clearPendingTransition();
      deadlineRef.current = 0;
      nativeAlertScheduledRef.current = false;
      void cancelTimerNotification({ delivered: true });
    },
    [],
  );
  useEffect(() => {
    if (seconds > 0) {
      zeroHandled.current = false;
      return;
    }
    if (!started || !activeId || zeroHandled.current) return;
    zeroHandled.current = true;
    const nativeAlertScheduled = nativeAlertScheduledRef.current;
    deadlineRef.current = 0;
    nativeAlertScheduledRef.current = false;
    setDeadline(null);
    setRunning(false);
    if (!nativeAlertScheduled) {
      playTimerAlert();
      if (navigator.vibrate) navigator.vibrate([500, 180, 500, 180, 700]);
    }
    const exercise = entries[activeId];
    if (phase === "pause") {
      setPhase("exercise");
      transitionTimeoutRef.current = setTimeout(() => {
        transitionTimeoutRef.current = null;
        startCountdown(
          Number(exercise?.rest) || 0,
          "exercise",
          activeId,
        );
      }, 900);
      return;
    }
    const current = (remainingSets[activeId] ?? Number(exercise?.sets)) || 1;
    const left = Math.max(0, current - 1);
    if (left > 0) {
      setRemainingSets((old) => ({ ...old, [activeId]: left }));
      setPhase("pause");
      transitionTimeoutRef.current = setTimeout(() => {
        transitionTimeoutRef.current = null;
        startCountdown(pauseValue(), "pause", activeId);
      }, 900);
    } else {
      setDone((old) => ({ ...old, [activeId]: true }));
      setRemainingSets((old) => ({
        ...old,
        [activeId]: Number(exercise?.sets) || 1,
      }));
      setActiveId(null);
      setPhase("exercise");
      setStarted(false);
    }
  }, [seconds, started, activeId, phase, entries, remainingSets]);
  const change = (id, field, value) => {
    setEntries((old) => ({ ...old, [id]: { ...old[id], [field]: value } }));
    if (field === "sets" && !done[id])
      setRemainingSets((old) => ({
        ...old,
        [id]: Math.max(1, Number(value) || 1),
      }));
  };
  const useTime = (e) => {
    resetCountdown(Number(entries[e.id].rest) || 0);
    setActiveId(e.id);
    setPhase("exercise");
    setRemainingSets((old) => ({
      ...old,
      [e.id]: Number(entries[e.id].sets) || 1,
    }));
  };
  const conclude = async (e) => {
    if (done[e.id]) {
      setDone((old) => ({ ...old, [e.id]: false }));
      setRemainingSets((old) => ({
        ...old,
        [e.id]: Number(entries[e.id].sets) || 1,
      }));
      return;
    }
    unlockTimerAudio();
    await requestTimerAlerts();
    setRemainingSets((old) => ({
      ...old,
      [e.id]: old[e.id] || Number(entries[e.id].sets) || 1,
    }));
    startCountdown(Number(entries[e.id].rest) || 0, "exercise", e.id);
  };
  const toggleTimer = async () => {
    if (seconds <= 0 || !activeId) return;
    unlockTimerAudio();
    if (running) {
      pauseCountdown();
      return;
    }
    await requestTimerAlerts();
    startCountdown(seconds, phase, activeId);
  };
  const timerLabel = running ? "PAUSAR" : started ? "CONTINUAR" : "START";
  const leaveWorkout = () => {
    clearPendingTransition();
    deadlineRef.current = 0;
    nativeAlertScheduledRef.current = false;
    setRunning(false);
    void cancelTimerNotification({ delivered: true });
    onBack();
  };
  const finish = () => {
    clearPendingTransition();
    deadlineRef.current = 0;
    nativeAlertScheduledRef.current = false;
    setRunning(false);
    void cancelTimerNotification({ delivered: true });
    const updated = data.exercises.map((e) => ({
      ...e,
      ...entries[e.id],
      load: Number(entries[e.id].load) || 0,
      previousLoad: Number(entries[e.id].previousLoad) || 0,
      sets: Number(entries[e.id].sets) || 1,
      reps: Number(entries[e.id].reps) || 1,
      rest: Number(entries[e.id].rest) || 0,
    }));
    setData({
      ...data,
      exercises: updated,
      sessions: [
        ...data.sessions,
        { id: crypto.randomUUID(), date: new Date().toISOString() },
      ],
    });
    alert("Treino salvo com sucesso!");
    onBack();
  };
  return (
    <section className="workout-screen">
      <div className="workout-top">
        <button className="icon back-button" onClick={leaveWorkout}>
          <ChevronLeft />
        </button>
        <div className="time-strip">
          <span>{phase === "pause" ? "PAUSA" : "TEMPO"}</span>
          <input
            value={timeText}
            onChange={(e) => setTimeText(e.target.value)}
            onBlur={() => {
              const value = parseTime(timeText);
              resetCountdown(value);
              setPhase("exercise");
              setTimeText(format(value));
            }}
          />
          <button
            className={`timer-control ${running ? "running" : ""}`}
            onClick={toggleTimer}
          >
            {timerLabel}
          </button>
        </div>
      </div>
      <div className="workout-name-strip">{data.workoutName || "Treino A"}</div>
      <div className="sheet">
        <div className="sheet-head">
          <span>EXERCÍCIO</span>
          <span>CARGA</span>
          <span>SÉRIES</span>
          <span>PROGRESSÃO</span>
        </div>
        {data.exercises.map((e) => {
          const v = entries[e.id];
          const progress =
            (Number(v.load) || 0) - (Number(v.previousLoad) || 0);
          const shownSets = done[e.id]
            ? Number(v.sets) || 1
            : (remainingSets[e.id] ?? Number(v.sets)) || 1;
          return (
            <article
              className={done[e.id] ? "sheet-row done" : "sheet-row"}
              key={e.id}
            >
              <div className="exercise-col">
                <strong>{e.name}</strong>
                <ExercisePhoto exercise={e} />
                <small>{e.tip}</small>
              </div>
              <div className="cell load-cell">
                <label>
                  Atual
                  <input
                    type="number"
                    value={v.load}
                    onChange={(x) => change(e.id, "load", x.target.value)}
                  />
                </label>
                <label>
                  Anterior
                  <input
                    type="number"
                    value={v.previousLoad}
                    onChange={(x) =>
                      change(e.id, "previousLoad", x.target.value)
                    }
                  />
                </label>
                <span>kg</span>
              </div>
              <div className="cell series-cell">
                <div className="series-pair">
                  <label>
                    Séries
                    <input
                      type="number"
                      min="1"
                      value={shownSets}
                      onChange={(x) => change(e.id, "sets", x.target.value)}
                      disabled={activeId === e.id && started}
                    />
                  </label>
                  <b>×</b>
                  <label>
                    Reps
                    <input
                      type="number"
                      min="1"
                      value={v.reps}
                      onChange={(x) => change(e.id, "reps", x.target.value)}
                      disabled={activeId === e.id && started}
                    />
                  </label>
                </div>
                <label className="rest-label">
                  Tempo (s)
                  <input
                    type="number"
                    min="0"
                    value={v.rest}
                    onChange={(x) => change(e.id, "rest", x.target.value)}
                  />
                </label>
                <button className="time-button" onClick={() => useTime(e)}>
                  Usar tempo
                </button>
              </div>
              <div className="cell progress-cell">
                <strong className={progress >= 0 ? "positive" : "negative"}>
                  {progress >= 0 ? "+" : ""}
                  {progress} kg
                </strong>
                <button className="complete-button" onClick={() => conclude(e)}>
                  {done[e.id] ? (
                    <>
                      <Check />
                      Concluído
                    </>
                  ) : activeId === e.id && started ? (
                    "Em andamento"
                  ) : (
                    "Iniciar"
                  )}
                </button>
              </div>
            </article>
          );
        })}
      </div>
      <button className="primary finish" onClick={finish}>
        <Save />
        Finalizar e salvar treino
      </button>
    </section>
  );
}
function Admin({ data, setData }) {
  const [editing, setEditing] = useState(null);
  const [allExercises, setAllExercises] = useState(() =>
    Object.entries(catalog).map(([id, item]) => ({
      id,
      name: displayName(id, item.label),
    })),
  );
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [query, setQuery] = useState("");
  useEffect(() => {
    fetch(DB)
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => {
        if (Array.isArray(list))
          setAllExercises(
            list
              .map((x) => ({ id: x.id, name: displayName(x.id, x.name) }))
              .filter((x) => x.id && x.name)
              .sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
          );
      })
      .catch(() => {});
  }, []);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? allExercises.filter((x) => x.name.toLowerCase().includes(q))
      : allExercises;
  }, [allExercises, query]);
  const update = (id, field, value) => {
    const exercise = data.exercises.find((item) => item.id === id);
    if (field === "name") rememberExerciseName(exercise?.type, value);
    setData({
      ...data,
      exercises: data.exercises.map((e) =>
        e.id === id
          ? {
              ...e,
              [field]: [
                "sets",
                "reps",
                "load",
                "previousLoad",
                "rest",
              ].includes(field)
                ? Number(value)
                : value,
            }
          : e,
      ),
    });
  };
  const changeType = (id, value) => {
    const chosen = allExercises.find((x) => x.id === value);
    setData({
      ...data,
      exercises: data.exercises.map((e) =>
        e.id === id
          ? {
              ...e,
              type: value,
              name: displayName(value, chosen?.name || e.name),
            }
          : e,
      ),
    });
  };
  const toggle = (id) =>
    setSelected((old) => {
      const next = new Set(old);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const addSelected = () => {
    const used = new Set(data.exercises.map((e) => e.type));
    const chosen = allExercises.filter(
      (item) => selected.has(item.id) && !used.has(item.id),
    );
    if (!chosen.length) return alert("Selecione pelo menos um exercício novo.");
    let nextId = Math.max(0, ...data.exercises.map((e) => e.id));
    const added = chosen.map((item) => ({
      id: ++nextId,
      type: item.id,
      name: displayName(item.id, item.name),
      sets: 3,
      reps: 12,
      load: 0,
      previousLoad: 0,
      rest: 60,
      tip: "Descreva a execução correta.",
    }));
    setData({ ...data, exercises: [...data.exercises, ...added] });
    setSelectorOpen(false);
    setEditing(added[0]?.id ?? null);
  };
  const remove = (id) => {
    const exercise = data.exercises.find((e) => e.id === id);
    if (
      window.confirm(`Apagar ${exercise?.name || "este exercício"} do treino?`)
    ) {
      setData({
        ...data,
        exercises: data.exercises.filter((e) => e.id !== id),
      });
      if (editing === id) setEditing(null);
    }
  };
  return (
    <section>
      <div className="section-title">
        <h1>Gerenciar treino</h1>
        <button
          className="small"
          onClick={() => {
            setSelected(new Set());
            setQuery("");
            setSelectorOpen(true);
          }}
        >
          <Plus />
          Adicionar exercícios
        </button>
      </div>
      <p className="muted">
        Escolha um ou vários exercícios para atribuir ao aluno.
      </p>
      <div className="admin-list">
        {data.exercises.map((e) => (
          <article className="admin-card" key={e.id}>
            <div className="admin-head">
              <ExercisePhoto exercise={e} compact />
              <div>
                <strong>{e.name}</strong>
                <span>
                  {e.sets} × {e.reps} • {e.load} kg • {e.rest}s
                </span>
              </div>
              <div className="admin-actions">
                <button
                  className="icon"
                  onClick={() => setEditing(editing === e.id ? null : e.id)}
                >
                  {editing === e.id ? <X /> : <Edit3 />}
                </button>
                <button
                  className="icon delete-exercise"
                  onClick={() => remove(e.id)}
                >
                  <Trash2 />
                </button>
              </div>
            </div>
            {editing === e.id && (
              <div className="edit-grid">
                <label>
                  Nome
                  <input
                    value={e.name}
                    onChange={(x) => update(e.id, "name", x.target.value)}
                  />
                </label>
                <label>
                  Figura
                  <select
                    value={e.type}
                    onChange={(x) => changeType(e.id, x.target.value)}
                  >
                    {allExercises.map((item) => (
                      <option value={item.id} key={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Carga atual
                  <input
                    type="number"
                    value={e.load}
                    onChange={(x) => update(e.id, "load", x.target.value)}
                  />
                </label>
                <label>
                  Carga anterior
                  <input
                    type="number"
                    value={e.previousLoad}
                    onChange={(x) =>
                      update(e.id, "previousLoad", x.target.value)
                    }
                  />
                </label>
                <label>
                  Séries
                  <input
                    type="number"
                    value={e.sets}
                    onChange={(x) => update(e.id, "sets", x.target.value)}
                  />
                </label>
                <label>
                  Repetições
                  <input
                    type="number"
                    value={e.reps}
                    onChange={(x) => update(e.id, "reps", x.target.value)}
                  />
                </label>
                <label>
                  Tempo escolhido (s)
                  <input
                    type="number"
                    value={e.rest}
                    onChange={(x) => update(e.id, "rest", x.target.value)}
                  />
                </label>
                <label className="full">
                  Orientação
                  <textarea
                    value={e.tip}
                    onChange={(x) => update(e.id, "tip", x.target.value)}
                  />
                </label>
              </div>
            )}
          </article>
        ))}
      </div>
      {selectorOpen && (
        <div className="exercise-picker-overlay">
          <div className="exercise-picker">
            <div className="picker-head">
              <div>
                <h2>Todos os exercícios</h2>
                <p>{selected.size} selecionado(s)</p>
              </div>
              <button className="icon" onClick={() => setSelectorOpen(false)}>
                <X />
              </button>
            </div>
            <label className="picker-search">
              <Search />
              <input
                placeholder="Buscar exercício"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <div className="picker-tools">
              <button
                className="small"
                onClick={() =>
                  setSelected(
                    new Set(
                      filtered
                        .filter(
                          (item) =>
                            !data.exercises.some((e) => e.type === item.id),
                        )
                        .map((item) => item.id),
                    ),
                  )
                }
              >
                <Check />
                Selecionar todos
              </button>
              <button className="small" onClick={() => setSelected(new Set())}>
                Limpar seleção
              </button>
            </div>
            <div className="picker-list">
              {filtered.map((item) => {
                const already = data.exercises.some((e) => e.type === item.id);
                return (
                  <label
                    className={`picker-item ${already ? "already" : ""}`}
                    key={item.id}
                  >
                    <input
                      type="checkbox"
                      value={item.id}
                      disabled={already}
                      checked={selected.has(item.id)}
                      onChange={() => toggle(item.id)}
                    />
                    <span>
                      <strong>{item.name}</strong>
                      <small>
                        {already
                          ? "Já atribuído ao aluno"
                          : "Disponível para atribuir"}
                      </small>
                    </span>
                  </label>
                );
              })}
            </div>
            <div className="picker-footer">
              <button className="small" onClick={() => setSelectorOpen(false)}>
                Cancelar
              </button>
              <button className="primary" onClick={addSelected}>
                <Plus />
                Atribuir {selected.size || ""}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
function App() {
  const [data, setData] = useState(load);
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("mayfit_user"));
    } catch {
      return null;
    }
  });
  const [tab, setTab] = useState("inicio");
  const [workout, setWorkout] = useState(false);
  const [storeReady, setStoreReady] = useState(false);
  useEffect(() => {
    let active = true;
    setStoreReady(false);
    setData(load());
    hydrateWorkoutState(currentWorkoutOwnerId()).then((cloudData) => {
      if (!active) return;
      if (cloudData) setData(normalizeData(cloudData));
      setStoreReady(true);
    });
    return () => {
      active = false;
    };
  }, [user?.id]);
  useEffect(() => {
    if (storeReady) save(data);
  }, [data, storeReady]);
  useEffect(() => {
    const synchronize = () => setData(load());
    window.addEventListener("mayfit-store-updated", synchronize);
    window.addEventListener("storage", synchronize);
    return () => {
      window.removeEventListener("mayfit-store-updated", synchronize);
      window.removeEventListener("storage", synchronize);
    };
  }, []);
  const login = (u) => {
    setUser(u);
    sessionStorage.setItem("mayfit_user", JSON.stringify(u));
  };
  const logout = () => {
    setUser(null);
    sessionStorage.removeItem("mayfit_user");
  };
  if (!user) return <Login data={data} onLogin={login} />;
  if (workout)
    return (
      <div className="app">
        <Workout
          data={data}
          setData={setData}
          onBack={() => setWorkout(false)}
        />
      </div>
    );
  const admin = user.role === "admin";
  return (
    <div className="app">
      <header>
        <div className="logo">
          <span>MaY</span>FiT
          <small>{admin ? "Gerenciamento" : "Área do aluno"}</small>
        </div>
        <button type="button" className="icon">
          <Bell />
        </button>
      </header>
      <main>
        {admin ? (
          <Admin data={data} setData={setData} />
        ) : (
          <>
            {tab === "inicio" && (
              <>
                <section className="hero">
                  <span>TREINO DO DIA</span>
                  <h1 className="mayfit-workout-name">
                    <input
                      data-workout-name-input="true"
                      aria-label="Nome do treino"
                      value={data.workoutName}
                      placeholder="Nome do treino"
                      onChange={(event) =>
                        setData({ ...data, workoutName: event.target.value })
                      }
                      onBlur={(event) => {
                        if (!event.target.value.trim())
                          setData({ ...data, workoutName: "Treino A" });
                      }}
                    />
                  </h1>
                  <p>{data.exercises.length} exercícios • tudo editável</p>
                  <button className="primary" onClick={() => setWorkout(true)}>
                    <Play />
                    Iniciar treino
                  </button>
                </section>
                <div className="summary">
                  <article>
                    <Dumbbell />
                    <strong>{data.exercises.length}</strong>
                    <span>Exercícios</span>
                  </article>
                  <article>
                    <TrendingUp />
                    <strong>{data.sessions.length}</strong>
                    <span>Treinos salvos</span>
                  </article>
                </div>
              </>
            )}
            {tab === "treinos" && (
              <>
                <div className="section-title">
                  <h1>Meu treino</h1>
                  <button className="small" onClick={() => setWorkout(true)}>
                    <Play />
                    Abrir
                  </button>
                </div>
                <div className="preview-list">
                  {data.exercises.map((e) => (
                    <article key={e.id}>
                      <ExercisePhoto exercise={e} compact />
                      <div>
                        <strong>{e.name}</strong>
                        <span>
                          {e.sets} × {e.reps} • {e.load} kg • {e.rest}s
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}
            {tab === "perfil" && (
              <section className="profile">
                <div className="avatar">{user.name[0]}</div>
                <h1>{user.name}</h1>
                <p>{user.email}</p>
                <button className="danger" onClick={logout}>
                  <LogOut />
                  Sair
                </button>
              </section>
            )}
          </>
        )}
      </main>
      <nav>
        {admin ? (
          <>
            <button className="active">
              <Users />
              <span>Gerenciar</span>
            </button>
            <button
              onClick={() => {
                const aluno = data.users.find((u) => u.id === "aluno");
                setUser(aluno);
                sessionStorage.setItem("mayfit_user", JSON.stringify(aluno));
              }}
            >
              <User />
              <span>Ver aluno</span>
            </button>
            <button onClick={logout}>
              <LogOut />
              <span>Sair</span>
            </button>
          </>
        ) : (
          <>
            <button
              className={tab === "inicio" ? "active" : ""}
              onClick={() => setTab("inicio")}
            >
              <Home />
              <span>Início</span>
            </button>
            <button
              className={tab === "treinos" ? "active" : ""}
              onClick={() => setTab("treinos")}
            >
              <Dumbbell />
              <span>Treinos</span>
            </button>
            <button
              className={tab === "perfil" ? "active" : ""}
              onClick={() => setTab("perfil")}
            >
              <User />
              <span>Perfil</span>
            </button>
          </>
        )}
      </nav>
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
