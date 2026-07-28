import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Activity, Users, Dumbbell, TrendingUp, UserCircle, Play, Timer, CheckCircle2, Bell, Search, ChevronRight, LogOut, Eye, EyeOff, LoaderCircle, ShieldCheck } from 'lucide-react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import './styles.css';

const demoStudents = [
  { name: 'João Henrique', phone: '(69) 99999-1201', status: 'Ativo', weight: '92,4 kg', progress: '-3,5 kg' },
  { name: 'Maria Eduarda', phone: '(69) 99871-5520', status: 'Ativo', weight: '67,2 kg', progress: '+20 kg no Leg Press' },
  { name: 'Carlos Alberto', phone: '(69) 98411-7700', status: 'Pendente', weight: '—', progress: 'Aguardando aprovação' }
];

const exercises = [
  { name: 'Supino reto', sets: '4 × 12', load: '60 kg', rest: '90 s' },
  { name: 'Elevação pélvica', sets: '4 × 10', load: '80 kg', rest: '90 s' },
  { name: 'Leg Press 90°', sets: '4 × 12', load: '120 kg', rest: '120 s' },
  { name: 'Cadeira flexora', sets: '3 × 12', load: '45 kg', rest: '60 s' }
];

function AuthScreen({ onDemo }) {
  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' });

  const change = (key) => (event) => setForm((old) => ({ ...old, [key]: event.target.value }));

  async function submit(event) {
    event.preventDefault();
    setMessage('');
    if (!isSupabaseConfigured) {
      setMessage('O aplicativo está pronto. Falta apenas inserir as chaves do Supabase.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: { data: { full_name: form.name, phone: form.phone } }
        });
        if (error) throw error;
        setMessage('Cadastro enviado. Aguarde a aprovação do administrador.');
      }
    } catch (error) {
      setMessage(error.message || 'Não foi possível concluir. Confira os dados.');
    } finally {
      setLoading(false);
    }
  }

  return <div className="auth-page">
    <div className="auth-brand"><span>MaY</span>FiT<small>SEU CORPO. SEU FOCO. SEUS RESULTADOS.</small></div>
    <section className="auth-card">
      <span className="eyebrow">BEM-VINDO AO MAYFIT</span>
      <h1>{mode === 'login' ? 'Entre na sua conta' : 'Crie sua conta'}</h1>
      <p>{mode === 'login' ? 'Acesse seus treinos e acompanhe sua evolução.' : 'Cadastre-se para receber seu plano personalizado.'}</p>
      <form onSubmit={submit}>
        {mode === 'signup' && <>
          <label>Nome completo<input value={form.name} onChange={change('name')} required placeholder="Seu nome" /></label>
          <label>WhatsApp<input value={form.phone} onChange={change('phone')} required placeholder="(69) 99999-9999" /></label>
        </>}
        <label>E-mail<input value={form.email} onChange={change('email')} type="email" required placeholder="seu@email.com" /></label>
        <label>Senha<div className="password-field"><input value={form.password} onChange={change('password')} type={showPassword ? 'text' : 'password'} required minLength="6" placeholder="Mínimo 6 caracteres" /><button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff/> : <Eye/>}</button></div></label>
        {message && <div className="form-message">{message}</div>}
        <button className="primary" disabled={loading}>{loading ? <LoaderCircle className="spin"/> : mode === 'login' ? 'Entrar' : 'Criar conta'}</button>
      </form>
      <button className="switch-auth" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage(''); }}>{mode === 'login' ? 'Não possui conta? Cadastre-se' : 'Já possui conta? Entrar'}</button>
      {!isSupabaseConfigured && <button className="demo-button" onClick={onDemo}>Visualizar demonstração</button>}
    </section>
    <div className="security-note"><ShieldCheck/> Dados protegidos e acesso individual</div>
  </div>;
}

function App() {
  const [session, setSession] = useState(null);
  const [demo, setDemo] = useState(false);
  const [tab, setTab] = useState('inicio');
  const [profile, setProfile] = useState(null);
  const [students, setStudents] = useState(demoStudents);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const admin = profile?.role === 'admin';

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session || !isSupabaseConfigured) return;
    async function load() {
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      setProfile(data || { full_name: session.user.user_metadata?.full_name || 'Aluno', role: 'student', status: 'pending' });
      if (data?.role === 'admin') {
        const { data: list } = await supabase.from('profiles').select('id,full_name,phone,status,role').order('created_at', { ascending: false });
        if (list) setStudents(list.map((item) => ({ name: item.full_name, phone: item.phone || 'Sem telefone', status: item.status === 'pending' ? 'Pendente' : item.status === 'blocked' ? 'Bloqueado' : 'Ativo', progress: item.role === 'admin' ? 'Administrador' : 'Aluno cadastrado' })));
      }
    }
    load();
  }, [session]);

  const userName = useMemo(() => profile?.full_name?.split(' ')[0] || 'Samuel', [profile]);

  if (loading) return <div className="loading-screen"><LoaderCircle className="spin"/><strong>Carregando MaYFiT</strong></div>;
  if (!session && !demo) return <AuthScreen onDemo={() => { setDemo(true); setProfile({ full_name: 'Samuel', role: 'student', status: 'active' }); }} />;
  if (profile?.status === 'pending' && !demo) return <div className="state-screen"><ShieldCheck/><h1>Cadastro em análise</h1><p>Seu acesso foi criado e aguarda aprovação do administrador.</p><button className="primary" onClick={() => supabase.auth.signOut()}>Sair</button></div>;
  if (profile?.status === 'blocked' && !demo) return <div className="state-screen"><ShieldCheck/><h1>Acesso suspenso</h1><p>Entre em contato com o administrador do MaYFiT.</p><button className="primary" onClick={() => supabase.auth.signOut()}>Sair</button></div>;

  return <div className="app-shell">
    <header className="topbar"><div><span className="brand">MaYFiT</span><small>{admin ? 'Painel do administrador' : `Olá, ${userName} • Seu treino sem complicação`}</small></div><div className="top-actions"><button className="icon-btn"><Bell size={20}/></button><button className="icon-btn" onClick={() => demo ? setDemo(false) : supabase.auth.signOut()}><LogOut size={19}/></button></div></header>
    <main className="content">
      {!admin && tab === 'inicio' && <><section className="hero-card"><div><span className="eyebrow">TREINO DO DIA</span><h1>Treino A — Peito e tríceps</h1><p>6 exercícios • aproximadamente 52 minutos</p></div><button className="primary" onClick={() => setTab('treino')}><Play size={18} fill="currentColor"/> Iniciar treino</button></section><section className="stats-grid"><article className="stat"><CheckCircle2/><div><strong>18</strong><span>Treinos concluídos</span></div></article><article className="stat"><TrendingUp/><div><strong>-3,5 kg</strong><span>Evolução no peso</span></div></article></section><section><div className="section-title"><h2>Próximos exercícios</h2><button onClick={() => setTab('treino')}>Ver treino</button></div><div className="list">{exercises.slice(0,3).map((e) => <article className="list-item" key={e.name}><div className="exercise-icon"><Dumbbell size={22}/></div><div className="grow"><strong>{e.name}</strong><span>{e.sets} • {e.load}</span></div><ChevronRight size={20}/></article>)}</div></section></>}
      {!admin && tab === 'treino' && <section><div className="section-title"><h2>Meu treino</h2><span className="pill">Treino A</span></div><div className="list">{exercises.map((e, i) => <article className="workout-card" key={e.name}><div className="workout-head"><span className="number">{i+1}</span><div className="grow"><strong>{e.name}</strong><span>{e.sets} • Descanso {e.rest}</span></div><button className="ghost">Vídeo</button></div><div className="load-row"><label>Carga planejada</label><strong>{e.load}</strong><button><Timer size={17}/> Descanso</button></div></article>)}</div></section>}
      {!admin && tab === 'evolucao' && <section><div className="section-title"><h2>Minha evolução</h2><span className="pill">Últimos 30 dias</span></div><article className="chart-card"><div className="chart-head"><div><span>Peso atual</span><strong>92,4 kg</strong></div><span className="positive">-3,5 kg</span></div><div className="fake-chart"><i style={{height:'78%'}}/><i style={{height:'68%'}}/><i style={{height:'58%'}}/><i style={{height:'47%'}}/><i style={{height:'40%'}}/><i style={{height:'31%'}}/></div><div className="axis"><span>01 jul</span><span>28 jul</span></div></article></section>}
      {admin && <><section className="stats-grid admin-stats"><article className="stat"><Users/><div><strong>{students.length}</strong><span>Alunos cadastrados</span></div></article><article className="stat"><UserCircle/><div><strong>{students.filter(s => s.status === 'Pendente').length}</strong><span>Aguardando aprovação</span></div></article><article className="stat"><Activity/><div><strong>11</strong><span>Treinaram hoje</span></div></article><article className="stat"><TrendingUp/><div><strong>8</strong><span>Novas evoluções</span></div></article></section><section><div className="section-title"><h2>Gerenciar alunos</h2><button className="small-primary">Novo treino</button></div><div className="search"><Search size={18}/><input placeholder="Buscar por nome ou telefone"/></div><div className="list">{students.map((s) => <article className="student" key={s.name}><div className="avatar">{s.name.split(' ').map(n => n[0]).slice(0,2).join('')}</div><div className="grow"><strong>{s.name}</strong><span>{s.phone}</span><small>{s.progress}</small></div><span className={`status ${s.status === 'Pendente' ? 'pending' : ''}`}>{s.status}</span></article>)}</div></section></>}
    </main>
    <nav className="bottom-nav">{!admin ? <><button className={tab==='inicio'?'active':''} onClick={() => setTab('inicio')}><Activity/><span>Início</span></button><button className={tab==='treino'?'active':''} onClick={() => setTab('treino')}><Dumbbell/><span>Treino</span></button><button className={tab==='evolucao'?'active':''} onClick={() => setTab('evolucao')}><TrendingUp/><span>Evolução</span></button><button><UserCircle/><span>Perfil</span></button></> : <><button className="active"><Users/><span>Alunos</span></button><button><Dumbbell/><span>Treinos</span></button><button><TrendingUp/><span>Relatórios</span></button><button><UserCircle/><span>Perfil</span></button></>}</nav>
  </div>;
}

createRoot(document.getElementById('root')).render(<App/>);