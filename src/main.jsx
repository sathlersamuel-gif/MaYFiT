import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Activity, Users, Dumbbell, TrendingUp, UserCircle, Play, Timer, CheckCircle2, Bell, Search, ChevronRight, LogOut, Eye, EyeOff, LoaderCircle, ShieldCheck, X, RotateCcw, Pause, Save, Award, CalendarDays } from 'lucide-react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import './styles.css';

const demoStudents = [
  { name: 'João Henrique', phone: '(69) 99999-1201', status: 'Ativo', progress: '-3,5 kg' },
  { name: 'Maria Eduarda', phone: '(69) 99871-5520', status: 'Ativo', progress: '+20 kg no Leg Press' },
  { name: 'Carlos Alberto', phone: '(69) 98411-7700', status: 'Pendente', progress: 'Aguardando aprovação' }
];

const exercises = [
  { id: 'supino', name: 'Supino reto', sets: 4, reps: 12, load: 60, rest: 90, group: 'Peito', tip: 'Mantenha os pés firmes, escápulas encaixadas e desça a barra com controle.' },
  { id: 'triceps', name: 'Tríceps na polia', sets: 4, reps: 12, load: 35, rest: 60, group: 'Tríceps', tip: 'Fixe os cotovelos ao lado do corpo e estenda completamente sem inclinar o tronco.' },
  { id: 'inclinado', name: 'Supino inclinado', sets: 3, reps: 10, load: 45, rest: 90, group: 'Peito superior', tip: 'Use banco entre 30° e 45° e mantenha o movimento simétrico.' },
  { id: 'crucifixo', name: 'Crucifixo com halteres', sets: 3, reps: 12, load: 14, rest: 60, group: 'Peito', tip: 'Cotovelos levemente flexionados e amplitude confortável para os ombros.' },
  { id: 'mergulho', name: 'Mergulho no banco', sets: 3, reps: 12, load: 0, rest: 60, group: 'Tríceps', tip: 'Mantenha o quadril próximo ao banco e evite descer além do conforto dos ombros.' },
  { id: 'flexao', name: 'Flexão de braços', sets: 3, reps: 15, load: 0, rest: 60, group: 'Peito e core', tip: 'Corpo alinhado da cabeça aos calcanhares e abdômen contraído.' }
];

function ExerciseModel({ type, compact = false }) {
  return <div className={`model-stage ${compact ? 'compact' : ''}`} aria-label="Demonstração animada do exercício">
    <div className="model-floor" />
    <div className={`human-model move-${type}`}>
      <span className="head"/><span className="torso"/><span className="arm left"/><span className="arm right"/><span className="forearm left"/><span className="forearm right"/><span className="leg left"/><span className="leg right"/><span className="shin left"/><span className="shin right"/>
      <span className="weight left"/><span className="weight right"/>
    </div>
    <div className="model-label">ANIMAÇÃO 3D</div>
  </div>;
}

function AuthScreen({ onDemo }) {
  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' });
  const change = (key) => (event) => setForm((old) => ({ ...old, [key]: event.target.value }));
  async function submit(event) {
    event.preventDefault(); setMessage('');
    if (!isSupabaseConfigured) { setMessage('Use “Visualizar demonstração”. O acesso real será liberado após configurar o banco de dados.'); return; }
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password }); if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email: form.email, password: form.password, options: { data: { full_name: form.name, phone: form.phone } } }); if (error) throw error;
        setMessage('Cadastro enviado. Aguarde a aprovação do administrador.');
      }
    } catch (error) { setMessage(error.message || 'Não foi possível concluir.'); } finally { setLoading(false); }
  }
  return <div className="auth-page"><div className="auth-brand"><span>MaY</span>FiT<small>SEU CORPO. SEU FOCO. SEUS RESULTADOS.</small></div><section className="auth-card"><span className="eyebrow">BEM-VINDO AO MAYFIT</span><h1>{mode === 'login' ? 'Entre na sua conta' : 'Crie sua conta'}</h1><p>{mode === 'login' ? 'Acesse seus treinos e acompanhe sua evolução.' : 'Cadastre-se para receber seu plano personalizado.'}</p><form onSubmit={submit}>{mode === 'signup' && <><label>Nome completo<input value={form.name} onChange={change('name')} required placeholder="Seu nome" /></label><label>WhatsApp<input value={form.phone} onChange={change('phone')} required placeholder="(69) 99999-9999" /></label></>}<label>E-mail<input value={form.email} onChange={change('email')} type="email" required placeholder="seu@email.com" /></label><label>Senha<div className="password-field"><input value={form.password} onChange={change('password')} type={showPassword ? 'text' : 'password'} required minLength="6" placeholder="Mínimo 6 caracteres" /><button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff/> : <Eye/>}</button></div></label>{message && <div className="form-message">{message}</div>}<button className="primary" disabled={loading}>{loading ? <LoaderCircle className="spin"/> : mode === 'login' ? 'Entrar' : 'Criar conta'}</button></form><button className="switch-auth" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage(''); }}>{mode === 'login' ? 'Não possui conta? Cadastre-se' : 'Já possui conta? Entrar'}</button><button className="demo-button" onClick={onDemo}>Visualizar demonstração completa</button></section><div className="security-note"><ShieldCheck/> Dados protegidos e acesso individual</div></div>;
}

function RestTimer({ seconds, onClose }) {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(true);
  useEffect(() => { if (!running || remaining <= 0) return; const id = setInterval(() => setRemaining(v => v - 1), 1000); return () => clearInterval(id); }, [running, remaining]);
  const min = String(Math.floor(remaining / 60)).padStart(2, '0'); const sec = String(remaining % 60).padStart(2, '0');
  return <div className="modal-backdrop"><section className="timer-modal"><button className="close-modal" onClick={onClose}><X/></button><Timer size={44}/><span>DESCANSO</span><strong>{min}:{sec}</strong><div className="timer-actions"><button onClick={() => setRunning(!running)}>{running ? <Pause/> : <Play/>}{running ? 'Pausar' : 'Continuar'}</button><button onClick={() => { setRemaining(seconds); setRunning(true); }}><RotateCcw/>Reiniciar</button></div>{remaining === 0 && <p className="timer-done">Descanso concluído. Próxima série!</p>}</section></div>;
}

function ExerciseDetail({ exercise, doneSets, onToggleSet, onRest, onBack }) {
  return <section><button className="back-link" onClick={onBack}>‹ Voltar ao treino</button><ExerciseModel type={exercise.id}/><div className="detail-head"><div><span className="eyebrow">{exercise.group}</span><h1>{exercise.name}</h1></div><span className="pill">{exercise.sets} × {exercise.reps}</span></div><article className="instruction"><strong>Execução correta</strong><p>{exercise.tip}</p></article><div className="set-list">{Array.from({ length: exercise.sets }).map((_, i) => { const key = `${exercise.id}-${i}`; const done = doneSets.includes(key); return <button key={key} className={`set-row ${done ? 'done' : ''}`} onClick={() => onToggleSet(key)}><span>{done ? <CheckCircle2/> : i + 1}</span><div><strong>Série {i + 1}</strong><small>{exercise.reps} repetições • {exercise.load ? `${exercise.load} kg` : 'Peso corporal'}</small></div><b>{done ? 'Concluída' : 'Marcar'}</b></button>; })}</div><button className="primary" onClick={() => onRest(exercise.rest)}><Timer/> Iniciar descanso de {exercise.rest}s</button></section>;
}

function App() {
  const [session, setSession] = useState(null); const [demo, setDemo] = useState(false); const [tab, setTab] = useState('inicio'); const [profile, setProfile] = useState(null); const [students, setStudents] = useState(demoStudents); const [loading, setLoading] = useState(isSupabaseConfigured); const [selected, setSelected] = useState(null); const [timer, setTimer] = useState(null);
  const [doneSets, setDoneSets] = useState(() => { try { return JSON.parse(localStorage.getItem('mayfit_done_sets') || '[]'); } catch { return []; } });
  const [weight, setWeight] = useState(() => localStorage.getItem('mayfit_weight') || '92.4');
  const admin = profile?.role === 'admin';
  useEffect(() => localStorage.setItem('mayfit_done_sets', JSON.stringify(doneSets)), [doneSets]);
  useEffect(() => localStorage.setItem('mayfit_weight', weight), [weight]);
  useEffect(() => { if (!isSupabaseConfigured) { setLoading(false); return; } supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); }); const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession)); return () => listener.subscription.unsubscribe(); }, []);
  useEffect(() => { if (!session || !isSupabaseConfigured) return; async function load() { const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single(); setProfile(data || { full_name: session.user.user_metadata?.full_name || 'Aluno', role: 'student', status: 'pending' }); if (data?.role === 'admin') { const { data: list } = await supabase.from('profiles').select('id,full_name,phone,status,role').order('created_at', { ascending: false }); if (list) setStudents(list.map(item => ({ name: item.full_name, phone: item.phone || 'Sem telefone', status: item.status === 'pending' ? 'Pendente' : item.status === 'blocked' ? 'Bloqueado' : 'Ativo', progress: item.role === 'admin' ? 'Administrador' : 'Aluno cadastrado' }))); } } load(); }, [session]);
  const userName = useMemo(() => profile?.full_name?.split(' ')[0] || 'Samuel', [profile]);
  const completedExercises = exercises.filter(e => Array.from({ length: e.sets }).every((_, i) => doneSets.includes(`${e.id}-${i}`))).length;
  const progress = Math.round((doneSets.length / exercises.reduce((a, e) => a + e.sets, 0)) * 100);
  const toggleSet = key => setDoneSets(old => old.includes(key) ? old.filter(x => x !== key) : [...old, key]);
  if (loading) return <div className="loading-screen"><LoaderCircle className="spin"/><strong>Carregando MaYFiT</strong></div>;
  if (!session && !demo) return <AuthScreen onDemo={() => { setDemo(true); setProfile({ full_name: 'Samuel', role: 'student', status: 'active' }); }} />;
  if (profile?.status === 'pending' && !demo) return <div className="state-screen"><ShieldCheck/><h1>Cadastro em análise</h1><p>Seu acesso aguarda aprovação.</p><button className="primary" onClick={() => supabase.auth.signOut()}>Sair</button></div>;
  return <div className="app-shell"><header className="topbar"><div><span className="brand">MaYFiT</span><small>{admin ? 'Painel do administrador' : `Olá, ${userName} • ${demo ? 'Modo demonstração' : 'Seu treino'}`}</small></div><div className="top-actions"><button className="icon-btn"><Bell size={20}/></button><button className="icon-btn" onClick={() => demo ? setDemo(false) : supabase.auth.signOut()}><LogOut size={19}/></button></div></header><main className="content">
    {!admin && selected && <ExerciseDetail exercise={selected} doneSets={doneSets} onToggleSet={toggleSet} onRest={setTimer} onBack={() => setSelected(null)}/>} 
    {!admin && !selected && tab === 'inicio' && <><section className="hero-card"><div><span className="eyebrow">TREINO DO DIA</span><h1>Treino A — Peito e tríceps</h1><p>6 exercícios • aproximadamente 52 minutos</p></div><button className="primary" onClick={() => setTab('treino')}><Play size={18} fill="currentColor"/> Iniciar treino</button></section><section className="progress-card"><div><strong>{progress}% concluído</strong><span>{doneSets.length} séries realizadas hoje</span></div><div className="progress-track"><i style={{ width: `${progress}%` }}/></div></section><section className="stats-grid"><article className="stat"><CheckCircle2/><div><strong>{completedExercises}/6</strong><span>Exercícios concluídos</span></div></article><article className="stat"><TrendingUp/><div><strong>-3,5 kg</strong><span>Evolução no peso</span></div></article></section><section><div className="section-title"><h2>Próximos exercícios</h2><button onClick={() => setTab('treino')}>Ver treino</button></div><div className="list">{exercises.slice(0,3).map(e => <button className="list-item clickable" key={e.id} onClick={() => setSelected(e)}><ExerciseModel type={e.id} compact/><div className="grow"><strong>{e.name}</strong><span>{e.sets} × {e.reps} • {e.load ? `${e.load} kg` : 'Peso corporal'}</span></div><ChevronRight size={20}/></button>)}</div></section></>}
    {!admin && !selected && tab === 'treino' && <section><div className="section-title"><h2>Meu treino</h2><button className="reset-button" onClick={() => setDoneSets([])}>Reiniciar</button></div><div className="list">{exercises.map((e, i) => { const count = Array.from({ length: e.sets }).filter((_, s) => doneSets.includes(`${e.id}-${s}`)).length; return <article className="workout-card" key={e.id}><button className="workout-main" onClick={() => setSelected(e)}><ExerciseModel type={e.id} compact/><div className="grow"><strong>{e.name}</strong><span>{e.sets} × {e.reps} • Descanso {e.rest}s</span><small>{count}/{e.sets} séries concluídas</small></div><ChevronRight/></button><div className="load-row"><label>Carga planejada</label><strong>{e.load ? `${e.load} kg` : 'Corporal'}</strong><button onClick={() => setTimer(e.rest)}><Timer size={17}/> Descanso</button></div></article>; })}</div></section>}
    {!admin && !selected && tab === 'evolucao' && <section><div className="section-title"><h2>Minha evolução</h2><span className="pill">Últimos 30 dias</span></div><article className="chart-card"><div className="chart-head"><div><span>Peso atual</span><strong>{Number(weight).toFixed(1).replace('.', ',')} kg</strong></div><span className="positive">-3,5 kg</span></div><div className="fake-chart"><i style={{height:'78%'}}/><i style={{height:'68%'}}/><i style={{height:'58%'}}/><i style={{height:'47%'}}/><i style={{height:'40%'}}/><i style={{height:'31%'}}/></div><div className="axis"><span>01 jul</span><span>28 jul</span></div></article><article className="profile-card"><h3>Registrar peso</h3><div className="weight-input"><input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)}/><span>kg</span><button><Save/> Salvar</button></div></article><div className="achievement"><Award/><div><strong>Sequência de 7 dias</strong><span>Continue assim! Você está construindo consistência.</span></div></div></section>}
    {!admin && !selected && tab === 'perfil' && <section><div className="profile-hero"><div className="profile-avatar">SS</div><h2>Samuel Sathler</h2><p>Aluno MaYFiT • Plano ativo</p></div><div className="profile-options"><button><UserCircle/><div><strong>Dados pessoais</strong><span>Nome, telefone e medidas</span></div><ChevronRight/></button><button><CalendarDays/><div><strong>Histórico de treinos</strong><span>18 treinos concluídos</span></div><ChevronRight/></button><button><Award/><div><strong>Conquistas</strong><span>4 metas alcançadas</span></div><ChevronRight/></button></div></section>}
    {admin && <section><div className="stats-grid admin-stats"><article className="stat"><Users/><div><strong>{students.length}</strong><span>Alunos cadastrados</span></div></article><article className="stat"><UserCircle/><div><strong>{students.filter(s => s.status === 'Pendente').length}</strong><span>Aguardando aprovação</span></div></article></div><div className="section-title"><h2>Gerenciar alunos</h2><button className="small-primary">Novo treino</button></div><div className="search"><Search size={18}/><input placeholder="Buscar por nome ou telefone"/></div><div className="list">{students.map(s => <article className="student" key={s.name}><div className="avatar">{s.name.split(' ').map(n => n[0]).slice(0,2).join('')}</div><div className="grow"><strong>{s.name}</strong><span>{s.phone}</span><small>{s.progress}</small></div><span className={`status ${s.status === 'Pendente' ? 'pending' : ''}`}>{s.status}</span></article>)}</div></section>}
  </main><nav className="bottom-nav">{!admin ? <><button className={tab==='inicio'?'active':''} onClick={() => {setSelected(null);setTab('inicio')}}><Activity/><span>Início</span></button><button className={tab==='treino'?'active':''} onClick={() => {setSelected(null);setTab('treino')}}><Dumbbell/><span>Treino</span></button><button className={tab==='evolucao'?'active':''} onClick={() => {setSelected(null);setTab('evolucao')}}><TrendingUp/><span>Evolução</span></button><button className={tab==='perfil'?'active':''} onClick={() => {setSelected(null);setTab('perfil')}}><UserCircle/><span>Perfil</span></button></> : <><button className="active"><Users/><span>Alunos</span></button><button><Dumbbell/><span>Treinos</span></button><button><TrendingUp/><span>Relatórios</span></button><button><UserCircle/><span>Perfil</span></button></>}</nav>{timer && <RestTimer seconds={timer} onClose={() => setTimer(null)}/>}</div>;
}
createRoot(document.getElementById('root')).render(<App/>);