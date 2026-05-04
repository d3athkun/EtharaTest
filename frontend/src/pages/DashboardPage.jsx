import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { fmt, isOverdue } from '../utils/format';

function TaskRow({ task, onStatusChange }) {
  const done = task.status === 'DONE';
  const over = isOverdue(task.dueDate) && !done;
  const initials = task.assignee?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || '—';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid rgba(21,21,26,0.1)' }}>
      <div onClick={() => onStatusChange(task.id, done ? 'TODO' : 'DONE')}
        style={{ width:14, height:14, border:'var(--b) solid var(--line)', borderRadius:2, flexShrink:0, background:done?'var(--ink)':'transparent', cursor:'pointer' }} />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:500, textDecoration:done?'line-through':'none', color:done?'var(--ink-3)':'var(--ink)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {task.title}
        </div>
        <div className="mono" style={{ fontSize:10, color:'var(--ink-3)', marginTop:2 }}>
          {task.project?.name} · <span style={{ color:over?'var(--accent)':'var(--ink-3)' }}>{over?'OVERDUE · ':''}{fmt(task.dueDate)||'no due date'}</span>
        </div>
      </div>
      <div className="av">{initials}</div>
    </div>
  );
}

function StatBlock({ label, value, sub, accent }) {
  return (
    <div style={{ border:'var(--b) solid var(--line)', padding:16, flex:1 }}>
      <div className="mono" style={{ fontSize:10, color:'var(--ink-3)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:8 }}>{label}</div>
      <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
        <div style={{ fontSize:32, fontWeight:700, letterSpacing:'-0.02em', color:accent?'var(--accent)':'var(--ink)' }}>{value}</div>
        {sub && <div className="mono" style={{ fontSize:11, color:'var(--ink-3)' }}>{sub}</div>}
      </div>
    </div>
  );
}

function PBar({ name, code, pct, atRisk }) {
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span className="mono" style={{ fontSize:10, color:'var(--ink-3)' }}>{code}</span>
          <span style={{ fontSize:13, fontWeight:500 }}>{name}</span>
        </div>
        <span className="mono" style={{ fontSize:11 }}>{pct}%</span>
      </div>
      <div className={`wf-bar${atRisk?' accent':''}`}><i style={{ width:pct+'%' }} /></div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard').catch(() => ({ data: {} })),
      api.get('/projects').catch(() => ({ data: [] })),
    ]).then(([dash, proj]) => {
      setData(dash.data);
      setProjects(proj.data);
      setLoading(false);
    });
  }, []);

  const handleStatusChange = async (taskId, status) => {
    try {
      const res = await api.patch(`/tasks/${taskId}`, { status });
      setData(prev => {
        const update = (arr) => arr.map(t => t.id === taskId ? { ...t, status: res.data.status } : t);
        return { ...prev, overdueTasks: update(prev.overdueTasks||[]), recentTasks: update(prev.recentTasks||[]) };
      });
    } catch {}
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  const { stats = {}, overdueTasks = [], recentTasks = [] } = data || {};
  const allTasks = [...overdueTasks, ...recentTasks].filter((t,i,a) => a.findIndex(x=>x.id===t.id)===i);
  const today = new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' });
  const initials = user?.name?.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2);

  return (
    <div>
      {/* TopBar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, paddingBottom:18, borderBottom:'var(--b) solid var(--line)' }}>
        <div>
          <div className="mono" style={{ fontSize:10, color:'var(--ink-3)', letterSpacing:'.12em', textTransform:'uppercase' }}>DASHBOARD</div>
          <div style={{ fontSize:20, fontWeight:700, letterSpacing:'-0.01em' }}>{today}</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, padding:'3px 8px', border:'var(--b) solid var(--line)', borderRadius:2, background:'var(--ink)', color:'var(--paper)', letterSpacing:'.05em' }}>
            ADMIN
          </span>
          <div className="av">{initials}</div>
        </div>
      </div>

      <div style={{ display:'flex', gap:24 }}>
        {/* Center — today */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div>
              <div className="mono" style={{ fontSize:10, color:'var(--ink-3)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:4 }}>Today</div>
              <div style={{ fontSize:18, fontWeight:600, letterSpacing:'-0.01em' }}>
                {allTasks.length} tasks{stats.overdue>0 ? ` · ${stats.overdue} overdue` : ''}
                {stats.assignedToMe>0 ? ` · ${stats.assignedToMe} assigned to me` : ''}
              </div>
            </div>
            <Link to="/projects" className="btn btn-primary">+ New task</Link>
          </div>

          <div style={{ marginBottom:24 }}>
            {allTasks.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon">🎉</div><h3>All clear!</h3><p>No tasks yet — create a project to get started.</p></div>
            ) : (
              allTasks.map(t => <TaskRow key={t.id} task={t} onStatusChange={handleStatusChange} />)
            )}
          </div>

          {/* Project progress */}
          <div style={{ border:'var(--b) solid var(--line)', padding:16 }}>
            <div className="mono" style={{ fontSize:10, color:'var(--ink-3)', letterSpacing:'.12em', textTransform:'uppercase', marginBottom:14 }}>Project progress</div>
            {projects.length === 0 ? (
              <div className="mono" style={{ fontSize:11, color:'var(--ink-3)' }}>No projects yet. <Link to="/projects" style={{ textDecoration:'underline', color:'var(--ink)' }}>Create one →</Link></div>
            ) : (
              projects.map((p) => {
                const taskCount = p._count?.tasks ?? 0;
                const pct = taskCount > 0 ? 50 : 0; // real % needs tasks-done count from API
                const code = p.name?.slice(0, 8).toUpperCase().replace(/\s/g, '_');
                return <PBar key={p.id} name={p.name} code={code} pct={pct} atRisk={p.role === 'MEMBER'} />;
              })
            )}
          </div>
        </div>

        {/* Right rail */}
        <div style={{ width:300, display:'flex', flexDirection:'column', gap:12, flexShrink:0 }}>
          <div style={{ display:'flex', gap:10 }}>
            <StatBlock label="My open" value={stats.total??0} sub="tasks" />
            <StatBlock label="Overdue" value={stats.overdue??0} accent={(stats.overdue??0)>0} sub={(stats.overdue??0)>0?"⚠":"✓"} />
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <StatBlock label="In progress" value={stats.inProgress??0} />
            <StatBlock label="Done" value={stats.done??0} />
          </div>

          {/* Activity */}
          <div style={{ border:'var(--b) solid var(--line)', padding:16 }}>
            <div className="mono" style={{ fontSize:10, color:'var(--ink-3)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:12 }}>Activity</div>
            {overdueTasks.length===0 && recentTasks.length===0 ? (
              <div className="mono" style={{ fontSize:11, color:'var(--ink-3)' }}>No recent activity.</div>
            ) : (
              [...overdueTasks, ...recentTasks].slice(0,4).map((t,i) => (
                <div key={t.id+i} style={{ display:'flex', gap:8, marginBottom:10, fontSize:12 }}>
                  <div className="av" style={{ flexShrink:0 }}>{t.assignee?.name?.slice(0,2).toUpperCase()||'—'}</div>
                  <div>
                    <span style={{ fontWeight:600 }}>{t.assignee?.name||'Unassigned'}</span>{' '}
                    <span style={{ color:'var(--ink-2)' }}>{t.status==='DONE'?'completed':'working on'}</span>{' '}
                    <span className="mono" style={{ fontSize:10 }}>{t.title?.slice(0,30)}{t.title?.length>30?'…':''}</span>
                    <div className="mono" style={{ fontSize:10, color:'var(--ink-3)', marginTop:2 }}>📁 {t.project?.name}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Up next */}
          <div style={{ border:'var(--b) solid var(--line)', padding:16 }}>
            <div className="mono" style={{ fontSize:10, color:'var(--ink-3)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:10 }}>Up next</div>
            {[
              { label:'Review projects', href:'/projects' },
              { label:'Check overdue tasks', href:'/tasks?status=overdue' },
              { label:'Admin panel', href:'/admin' },
            ].map(l => (
              <div key={l.href} style={{ display:'flex', justifyContent:'space-between', fontSize:12, padding:'6px 0', borderBottom:'1px solid rgba(21,21,26,0.08)' }}>
                <Link to={l.href} className="mono" style={{ color:'var(--ink)' }}>{l.label}</Link>
                <span className="mono" style={{ color:'var(--ink-3)' }}>→</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
