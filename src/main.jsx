import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Activity, Users, Dumbbell, TrendingUp, UserCircle, Play, Timer, CheckCircle2, Bell, Search, ChevronRight } from 'lucide-react';
import './styles.css';

const students = [
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

function App() {
  const [tab, setTab] = useState('inicio');
  const [admin, setAdmin] = useState(false);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <span className="brand">MaYFiT</span>
          <small>{admin ? 'Painel do administrador' : 'Seu treino, sem complicação'}</small>
        </div>
        <button className="icon-btn" aria-label="Notificações"><Bell size={20}/></button>
      </header>

      <main className="content">
        {!admin && tab === 'inicio' && (
          <>
            <section className="hero-card">
              <div>
                <span className="eyebrow">TREINO DO DIA</span>
                <h1>Treino A — Peito e tríceps</h1>
                <p>6 exercícios • aproximadamente 52 minutos</p>
              </div>
              <button className="primary"><Play size={18} fill="currentColor"/> Iniciar treino</button>
            </section>

            <section className="stats-grid">
              <article className="stat"><CheckCircle2/><div><strong>18</strong><span>Treinos concluídos</span></div></article>
              <article className="stat"><TrendingUp/><div><strong>-3,5 kg</strong><span>Evolução no peso</span></div></article>
            </section>

            <section>
              <div className="section-title"><h2>Próximos exercícios</h2><button onClick={()=>setTab('treino')}>Ver treino</button></div>
              <div className="list">
                {exercises.slice(0,3).map((e) => <article className="list-item" key={e.name}><div className="exercise-icon"><Dumbbell size={22}/></div><div className="grow"><strong>{e.name}</strong><span>{e.sets} • {e.load}</span></div><ChevronRight size={20}/></article>)}
              </div>
            </section>
          </>
        )}

        {!admin && tab === 'treino' && (
          <section>
            <div className="section-title"><h2>Meu treino</h2><span className="pill">Treino A</span></div>
            <div className="list">
              {exercises.map((e, i) => <article className="workout-card" key={e.name}><div className="workout-head"><span className="number">{i+1}</span><div className="grow"><strong>{e.name}</strong><span>{e.sets} • Descanso {e.rest}</span></div><button className="ghost">3D</button></div><div className="load-row"><label>Carga planejada</label><strong>{e.load}</strong><button><Timer size={17}/> Descanso</button></div></article>)}
            </div>
          </section>
        )}

        {!admin && tab === 'evolucao' && (
          <section>
            <div className="section-title"><h2>Minha evolução</h2><span className="pill">Últimos 30 dias</span></div>
            <article className="chart-card"><div className="chart-head"><div><span>Peso atual</span><strong>92,4 kg</strong></div><span className="positive">-3,5 kg</span></div><div className="fake-chart"><i style={{height:'78%'}}></i><i style={{height:'68%'}}></i><i style={{height:'58%'}}></i><i style={{height:'47%'}}></i><i style={{height:'40%'}}></i><i style={{height:'31%'}}></i></div><div className="axis"><span>01 jul</span><span>28 jul</span></div></article>
          </section>
        )}

        {admin && (
          <>
            <section className="stats-grid admin-stats">
              <article className="stat"><Users/><div><strong>42</strong><span>Alunos ativos</span></div></article>
              <article className="stat"><UserCircle/><div><strong>3</strong><span>Aguardando aprovação</span></div></article>
              <article className="stat"><Activity/><div><strong>11</strong><span>Treinaram hoje</span></div></article>
              <article className="stat"><TrendingUp/><div><strong>8</strong><span>Novas evoluções</span></div></article>
            </section>
            <section>
              <div className="section-title"><h2>Gerenciar alunos</h2><button className="small-primary">Ver todos</button></div>
              <div className="search"><Search size={18}/><input placeholder="Buscar por nome ou telefone"/></div>
              <div className="list">
                {students.map((s) => <article className="student" key={s.name}><div className="avatar">{s.name.split(' ').map(n=>n[0]).slice(0,2).join('')}</div><div className="grow"><strong>{s.name}</strong><span>{s.phone}</span><small>{s.progress}</small></div><span className={`status ${s.status === 'Pendente' ? 'pending' : ''}`}>{s.status}</span></article>)}
              </div>
            </section>
          </>
        )}
      </main>

      <nav className="bottom-nav">
        {!admin ? <>
          <button className={tab==='inicio'?'active':''} onClick={()=>setTab('inicio')}><Activity/><span>Início</span></button>
          <button className={tab==='treino'?'active':''} onClick={()=>setTab('treino')}><Dumbbell/><span>Treino</span></button>
          <button className={tab==='evolucao'?'active':''} onClick={()=>setTab('evolucao')}><TrendingUp/><span>Evolução</span></button>
          <button onClick={()=>setAdmin(true)}><UserCircle/><span>Admin</span></button>
        </> : <>
          <button className="active"><Users/><span>Alunos</span></button>
          <button><Dumbbell/><span>Treinos</span></button>
          <button><TrendingUp/><span>Evolução</span></button>
          <button onClick={()=>setAdmin(false)}><UserCircle/><span>Aluno</span></button>
        </>}
      </nav>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App/>);
