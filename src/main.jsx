import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Bell, Check, ChevronLeft, Dumbbell, Edit3, Home, LogOut, Play, Plus, Save, Timer, TrendingUp, User, Users, X } from 'lucide-react';
import './styles.css';

const STORE = 'mayfit_v3';
const seed = {
  users: [
    { id: 'admin', name: 'Samuel', email: 'admin@mayfit.com', password: '123456', role: 'admin' },
    { id: 'aluno', name: 'Aluno Teste', email: 'aluno@mayfit.com', password: '123456', role: 'student' }
  ],
  exercises: [
    { id: 1, type: 'supino', name: 'Supino reto', sets: 4, reps: 12, load: 60, rest: 59, progression: 'Aumentar 2 kg', tip: 'Pés firmes, escápulas encaixadas e barra descendo até a linha média do peito.' },
    { id: 2, type: 'pelvica', name: 'Elevação pélvica', sets: 3, reps: 10, load: 80, rest: 60, progression: 'Manter', tip: 'Queixo levemente recolhido, abdômen firme e extensão completa do quadril.' },
    { id: 3, type: 'legpress', name: 'Leg Press 90°', sets: 4, reps: 12, load: 120, rest: 90, progression: 'Aumentar 5 kg', tip: 'Joelhos alinhados com os pés e lombar apoiada durante todo o movimento.' },
    { id: 4, type: 'flexora', name: 'Cadeira flexora', sets: 4, reps: 8, load: 45, rest: 60, progression: 'Buscar 10 reps', tip: 'Quadril apoiado, movimento controlado e sem tirar o tronco do banco.' },
    { id: 5, type: 'panturrilha', name: 'Panturrilha', sets: 4, reps: 15, load: 50, rest: 45, progression: 'Pausa de 1 s', tip: 'Amplitude completa, subindo na ponta dos pés e descendo devagar.' }
  ],
  sessions: []
};

const load = () => { try { return JSON.parse(localStorage.getItem(STORE)) || seed; } catch { return seed; } };
const save = (data) => localStorage.setItem(STORE, JSON.stringify(data));

function ExerciseFigure({ type, compact = false }) {
  const body = {
    supino: <><line x1="15" y1="103" x2="165" y2="103"/><circle cx="57" cy="76" r="9"/><line x1="66" y1="79" x2="120" y2="94"/><line x1="82" y1="84" x2="94" y2="55"/><line x1="110" y1="91" x2="107" y2="55"/><line className="accent" x1="75" y1="54" x2="127" y2="54"/><line x1="119" y1="94" x2="150" y2="112"/></>,
    pelvica: <><line x1="15" y1="116" x2="165" y2="116"/><circle cx="53" cy="84" r="9"/><line x1="62" y1="88" x2="94" y2="100"/><line x1="94" y1="100" x2="124" y2="75"/><line x1="124" y1="75" x2="151" y2="112"/><line className="accent" x1="87" y1="88" x2="130" y2="75"/></>,
    legpress: <><line x1="132" y1="25" x2="158" y2="118"/><circle cx="50" cy="78" r="9"/><line x1="59" y1="82" x2="92" y2="97"/><line x1="91" y1="97" x2="118" y2="78"/><line x1="118" y1="78" x2="140" y2="65"/><line x1="92" y1="98" x2="72" y2="118"/><line className="accent" x1="137" y1="55" x2="160" y2="48"/></>,
    flexora: <><line x1="23" y1="104" x2="124" y2="104"/><circle cx="55" cy="70" r="9"/><line x1="64" y1="75" x2="103" y2="91"/><line x1="103" y1="91" x2="136" y2="91"/><line x1="136" y1="91" x2="145" y2="62"/><line className="accent" x1="140" y1="58" x2="158" y2="58"/></>,
    panturrilha: <><line x1="20" y1="125" x2="160" y2="125"/><circle cx="86" cy="34" r="9"/><line x1="86" y1="44" x2="88" y2="87"/><line x1="88" y1="87" x2="70" y2="118"/><line x1="88" y1="87" x2="105" y2="118"/><line x1="70" y1="118" x2="62" y2="125"/><line x1="105" y1="118" x2="114" y2="125"/><line className="accent" x1="88" y1="50" x2="88" y2="86"/></>
  }[type] || null;
  return <div className={compact ? 'figure compact' : 'figure'}><svg viewBox="0 0 180 145" role="img" aria-label="Demonstração do exercício">{body}</svg><span>EXECUÇÃO</span></div>;
}

function Login({ data, onLogin }) {
  const [email, setEmail] = useState('aluno@mayfit.com');
  const [password, setPassword] = useState('123456');
  const [message, setMessage] = useState('');
  const submit = (e) => {
    e.preventDefault();
    const user = data.users.find((u) => u.email === email && u.password === password);
    if (!user) return setMessage('E-mail ou senha incorretos.');
    onLogin(user);
  };
  return <div className="login-page"><div className="login-logo"><span>MaY</span>FiT<small>SEU CORPO. SEU FOCO. SEUS RESULTADOS.</small></div><form className="login-card" onSubmit={submit}><h1>Entrar</h1><p>Teste a área do aluno ou o gerenciamento.</p><label>E-mail<input value={email} onChange={(e)=>setEmail(e.target.value)} /></label><label>Senha<input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} /></label>{message && <div className="notice">{message}</div>}<button className="primary">Entrar</button><button type="button" className="demo-switch" onClick={()=>setEmail(email.includes('admin')?'aluno@mayfit.com':'admin@mayfit.com')}>Alternar conta de teste</button></form></div>;
}

function Workout({ data, setData, onBack }) {
  const [seconds, setSeconds] = useState(data.exercises[0]?.rest || 60);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState({});
  const [entries, setEntries] = useState(()=>Object.fromEntries(data.exercises.map(e=>[e.id,{load:e.load,sets:e.sets,reps:e.reps,progression:e.progression}])));
  useEffect(()=>{ if(!running || seconds<=0) return; const id=setInterval(()=>setSeconds(s=>s-1),1000); return()=>clearInterval(id); },[running,seconds]);
  useEffect(()=>{ if(seconds===0){ setRunning(false); if(navigator.vibrate) navigator.vibrate([250,120,250]); } },[seconds]);
  const format=(s)=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const change=(id,field,value)=>setEntries(old=>({...old,[id]:{...old[id],[field]:value}}));
  const conclude=(e)=>{ setDone(old=>({...old,[e.id]:!old[e.id]})); setSeconds(Number(e.rest)||60); setRunning(true); };
  const finish=()=>{ const updated=data.exercises.map(e=>({...e,load:Number(entries[e.id].load)||0,sets:Number(entries[e.id].sets)||1,reps:Number(entries[e.id].reps)||1,progression:entries[e.id].progression})); const session={id:crypto.randomUUID(),date:new Date().toISOString(),completed:Object.values(done).filter(Boolean).length}; setData({...data,exercises:updated,sessions:[...data.sessions,session]}); alert('Treino salvo com sucesso!'); onBack(); };
  return <section className="workout-screen"><div className="workout-top"><button className="icon" onClick={onBack}><ChevronLeft/></button><div className="time-editor"><label>TEMPO</label><input type="number" min="0" value={seconds} onChange={(e)=>setSeconds(Number(e.target.value)||0)}/><strong>{format(seconds)}</strong><button className="icon bell" onClick={()=>setRunning(!running)}>{running?<Timer/>:<Bell/>}</button></div></div><div className="workout-title"><h1>Treino A</h1><p>Todos os campos abaixo são editáveis durante o treino.</p></div><div className="exercise-table"><div className="table-head"><span>EXERCÍCIO</span><span>CARGA</span><span>SÉRIES</span><span>PROGRESSÃO</span></div>{data.exercises.map((e)=><article className={done[e.id]?'exercise-row done':''} key={e.id}><div className="exercise-cell"><strong>{e.name}</strong><ExerciseFigure type={e.type}/><small>{e.tip}</small></div><div><input type="number" value={entries[e.id].load} onChange={(x)=>change(e.id,'load',x.target.value)}/><small>kg</small></div><div className="series-edit"><input type="number" value={entries[e.id].sets} onChange={(x)=>change(e.id,'sets',x.target.value)}/><b>×</b><input type="number" value={entries[e.id].reps} onChange={(x)=>change(e.id,'reps',x.target.value)}/></div><div className="progress-edit"><input value={entries[e.id].progression} onChange={(x)=>change(e.id,'progression',x.target.value)}/><button className="small" onClick={()=>conclude(e)}>{done[e.id]?<><Check/>Feito</>: 'Concluir'}</button></div></article>)}</div><button className="primary finish" onClick={finish}><Save/> Finalizar e salvar treino</button></section>;
}

function Admin({ data, setData }) {
  const [editing, setEditing] = useState(null);
  const update=(id,field,value)=>setData({...data,exercises:data.exercises.map(e=>e.id===id?{...e,[field]:['sets','reps','load','rest'].includes(field)?Number(value):value}:e)});
  const add=()=>{const id=Math.max(...data.exercises.map(e=>e.id))+1;setData({...data,exercises:[...data.exercises,{id,type:'supino',name:'Novo exercício',sets:3,reps:12,load:0,rest:60,progression:'Definir',tip:'Descreva a execução correta.'}]});setEditing(id)};
  return <section><div className="section-title"><h1>Gerenciar treino</h1><button className="small" onClick={add}><Plus/> Novo</button></div><p className="muted">Edite tempo, séries, repetições, carga, progressão e orientação de cada exercício.</p><div className="admin-list">{data.exercises.map(e=><article className="admin-card" key={e.id}><div className="admin-head"><ExerciseFigure type={e.type} compact/><div><strong>{e.name}</strong><span>{e.sets} × {e.reps} • {e.load} kg • {e.rest}s</span></div><button className="icon" onClick={()=>setEditing(editing===e.id?null:e.id)}>{editing===e.id?<X/>:<Edit3/>}</button></div>{editing===e.id&&<div className="edit-grid"><label>Nome<input value={e.name} onChange={x=>update(e.id,'name',x.target.value)}/></label><label>Figura<select value={e.type} onChange={x=>update(e.id,'type',x.target.value)}><option value="supino">Supino</option><option value="pelvica">Elevação pélvica</option><option value="legpress">Leg press</option><option value="flexora">Cadeira flexora</option><option value="panturrilha">Panturrilha</option></select></label><label>Carga<input type="number" value={e.load} onChange={x=>update(e.id,'load',x.target.value)}/></label><label>Séries<input type="number" value={e.sets} onChange={x=>update(e.id,'sets',x.target.value)}/></label><label>Repetições<input type="number" value={e.reps} onChange={x=>update(e.id,'reps',x.target.value)}/></label><label>Descanso (s)<input type="number" value={e.rest} onChange={x=>update(e.id,'rest',x.target.value)}/></label><label className="full">Progressão<input value={e.progression} onChange={x=>update(e.id,'progression',x.target.value)}/></label><label className="full">Orientação<textarea value={e.tip} onChange={x=>update(e.id,'tip',x.target.value)}/></label></div>}</article>)}</div></section>;
}

function App(){
  const [data,setData]=useState(load);
  const [user,setUser]=useState(()=>{try{return JSON.parse(sessionStorage.getItem('mayfit_user'))}catch{return null}});
  const [tab,setTab]=useState('inicio');
  const [workout,setWorkout]=useState(false);
  useEffect(()=>save(data),[data]);
  const login=(u)=>{setUser(u);sessionStorage.setItem('mayfit_user',JSON.stringify(u))};
  const logout=()=>{setUser(null);sessionStorage.removeItem('mayfit_user')};
  if(!user)return <Login data={data} onLogin={login}/>;
  if(workout)return <div className="app"><Workout data={data} setData={setData} onBack={()=>setWorkout(false)}/></div>;
  const admin=user.role==='admin';
  return <div className="app"><header><div className="logo"><span>MaY</span>FiT<small>{admin?'Gerenciamento':'Área do aluno'}</small></div><button className="icon"><Bell/></button></header><main>{admin?<Admin data={data} setData={setData}/>:<>{tab==='inicio'&&<><section className="hero"><span>TREINO DO DIA</span><h1>Treino A</h1><p>{data.exercises.length} exercícios • tempo e campos editáveis</p><button className="primary" onClick={()=>setWorkout(true)}><Play/> Iniciar treino</button></section><div className="summary"><article><Dumbbell/><strong>{data.exercises.length}</strong><span>Exercícios</span></article><article><TrendingUp/><strong>{data.sessions.length}</strong><span>Treinos salvos</span></article></div></>}{tab==='treinos'&&<><div className="section-title"><h1>Meu treino</h1><button className="small" onClick={()=>setWorkout(true)}><Play/> Abrir</button></div><div className="preview-list">{data.exercises.map(e=><article key={e.id}><ExerciseFigure type={e.type} compact/><div><strong>{e.name}</strong><span>{e.sets} × {e.reps} • {e.load} kg • {e.rest}s</span></div></article>)}</div></>}{tab==='perfil'&&<section className="profile"><div className="avatar">{user.name[0]}</div><h1>{user.name}</h1><p>{user.email}</p><button className="danger" onClick={logout}><LogOut/> Sair</button></section>}</>}</main><nav>{admin?<><button className="active"><Users/><span>Gerenciar</span></button><button onClick={()=>{setUser(data.users.find(u=>u.id==='aluno'));sessionStorage.setItem('mayfit_user',JSON.stringify(data.users.find(u=>u.id==='aluno')))}}><User/><span>Ver aluno</span></button><button onClick={logout}><LogOut/><span>Sair</span></button></>:<><button className={tab==='inicio'?'active':''} onClick={()=>setTab('inicio')}><Home/><span>Início</span></button><button className={tab==='treinos'?'active':''} onClick={()=>setTab('treinos')}><Dumbbell/><span>Treinos</span></button><button className={tab==='perfil'?'active':''} onClick={()=>setTab('perfil')}><User/><span>Perfil</span></button></>}</nav></div>;
}

createRoot(document.getElementById('root')).render(<App/>);
