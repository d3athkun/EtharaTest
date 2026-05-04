import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';
const overdue = (d, s) => d && new Date(d) < new Date() && s !== 'DONE';

function TaskCard({ t }) {
  return (
    <div style={{ border: 'var(--b) solid var(--line)', padding: 10, background: 'var(--paper)', marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>{t.status}</span>
        <div className="av" style={{ width: 18, height: 18, fontSize: 8 }}>{t.assignee?.name?.slice(0,2).toUpperCase() || '—'}</div>
      </div>
      <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 6 }}>{t.title}</div>
      <div className="mono" style={{ fontSize: 10, color: overdue(t.dueDate, t.status) ? 'var(--accent)' : 'var(--ink-3)' }}>
        {overdue(t.dueDate, t.status) ? 'OVERDUE · ' : ''}{fmt(t.dueDate)}
      </div>
    </div>
  );
}

function KanbanView({ tasks, onStatusChange }) {
  const cols = [
    { key: 'TODO', label: 'Backlog' },
    { key: 'IN_PROGRESS', label: 'In progress' },
    { key: 'DONE', label: 'Done' },
  ];
  return (
    <div style={{ display: 'flex', gap: 12, flex: 1, minHeight: 0 }}>
      {cols.map(col => {
        const colTasks = tasks.filter(t => t.status === col.key);
        return (
          <div key={col.key} style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--ink)' }} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>{col.label}</span>
              <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>{colTasks.length}</span>
            </div>
            <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 320px)' }}>
              {colTasks.map(t => <TaskCard key={t.id} t={t} />)}
              <div style={{ border: 'var(--b) dashed var(--line)', padding: 8, fontSize: 10, color: 'var(--ink-3)', textAlign: 'center', fontFamily: 'monospace' }}>+ add task</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ListView({ tasks, onStatusChange }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <div className="mono" style={{ display: 'flex', padding: '8px 12px', borderBottom: 'var(--b) solid var(--line)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.08em', textTransform: 'uppercase', gap: 0 }}>
        <div style={{ width: 28 }} />
        <div style={{ flex: 1 }}>Task</div>
        <div style={{ width: 110 }}>Status</div>
        <div style={{ width: 80 }}>Due</div>
        <div style={{ width: 60 }}>Owner</div>
      </div>
      {tasks.map(t => (
        <div key={t.id} style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', borderBottom: '1px solid rgba(21,21,26,0.1)', gap: 0 }}>
          <div style={{ width: 28 }}>
            <div style={{ width: 14, height: 14, border: 'var(--b) solid var(--line)', borderRadius: 2, background: t.status === 'DONE' ? 'var(--ink)' : 'transparent' }} />
          </div>
          <div style={{ flex: 1, fontSize: 13, fontWeight: 500, textDecoration: t.status === 'DONE' ? 'line-through' : 'none', color: t.status === 'DONE' ? 'var(--ink-3)' : 'var(--ink)' }}>{t.title}</div>
          <div style={{ width: 110 }}>
            <select className="filter-select" value={t.status} onChange={e => onStatusChange(t.id, e.target.value)} style={{ fontSize: 10, padding: '3px 6px' }}>
              <option value="TODO">Backlog</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="DONE">Done</option>
            </select>
          </div>
          <div className="mono" style={{ width: 80, fontSize: 11, color: overdue(t.dueDate, t.status) ? 'var(--accent)' : 'var(--ink-3)' }}>{fmt(t.dueDate)}</div>
          <div style={{ width: 60 }}><div className="av">{t.assignee?.name?.slice(0,2).toUpperCase() || '—'}</div></div>
        </div>
      ))}
    </div>
  );
}

function TimelineView({ tasks }) {
  const weeks = ['W18','W19','W20','W21','W22'];
  const offsets = [5,18,30,50,12,22,38,60,0,8];
  const widths  = [22,18,30,24,28,16,22,30,20,25];
  return (
    <div style={{ flex:1, overflowY:'auto' }}>
      {/* Ruler */}
      <div style={{ display:'flex', borderBottom:'var(--b) solid var(--line)', paddingBottom:8, marginLeft:220, marginBottom:4 }}>
        {weeks.map((w,i) => (
          <div key={w} className="mono" style={{ flex:1, fontSize:10, color:'var(--ink-3)', borderRight:i<4?'1px dashed rgba(21,21,26,0.2)':'none', paddingLeft:6 }}>{w}</div>
        ))}
      </div>
      {tasks.map((t,i) => {
        const done = t.status === 'DONE';
        const over = t.dueDate && new Date(t.dueDate) < new Date() && !done;
        const left = (offsets[i % offsets.length]) + '%';
        const width = (widths[i % widths.length]) + '%';
        return (
          <div key={t.id} style={{ display:'flex', alignItems:'center', padding:'8px 0', borderBottom:'1px solid rgba(21,21,26,0.08)' }}>
            <div style={{ width:220, display:'flex', alignItems:'center', gap:8, paddingRight:12 }}>
              <div style={{ width:14, height:14, border:'var(--b) solid var(--line)', borderRadius:2, flexShrink:0, background:done?'var(--ink)':'transparent' }} />
              <div style={{ minWidth:0 }}>
                <div className="mono" style={{ fontSize:9, color:'var(--ink-3)' }}>{t.status}</div>
                <div style={{ fontSize:12, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.title}</div>
              </div>
            </div>
            <div style={{ flex:1, position:'relative', height:24 }}>
              <div style={{
                position:'absolute', top:0, bottom:0, left, width,
                border:'var(--b) solid var(--line)',
                background: over ? 'var(--accent)' : done ? 'var(--ink)' : 'var(--paper)',
                color: over||done ? 'var(--paper)' : 'var(--ink)',
                fontSize:10, padding:'0 6px', display:'flex', alignItems:'center',
                fontFamily:"'JetBrains Mono',monospace",
              }}>
                {t.assignee?.name?.slice(0,2).toUpperCase()||'—'}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function InviteModal({ projectId, onClose, onInvited }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { const res = await api.post(`/projects/${projectId}/members`, { email, role }); onInvited(res.data); onClose(); }
    catch (err) { setError(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h2 className="modal-title">Invite member</h2><button className="modal-close" onClick={onClose}>×</button></div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label className="form-label">Email *</label><input id="invite-email" type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} required placeholder="colleague@example.com" /></div>
          <div className="form-group"><label className="form-label">Role</label>
            <select id="invite-role" className="form-select" value={role} onChange={e => setRole(e.target.value)}>
              <option value="MEMBER">Member</option><option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="modal-actions"><button type="button" className="btn" onClick={onClose}>Cancel</button><button id="invite-submit" type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Inviting…' : 'Invite'}</button></div>
        </form>
      </div>
    </div>
  );
}

function CreateTaskModal({ projectId, members, onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM', status: 'TODO', dueDate: '', assigneeId: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const payload = { ...form, projectId, dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null, assigneeId: form.assigneeId || null };
      const res = await api.post('/tasks', payload); onCreated(res.data); onClose();
    } catch (err) { setError(err.response?.data?.error || 'Failed to create task'); }
    finally { setLoading(false); }
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h2 className="modal-title">New task</h2><button className="modal-close" onClick={onClose}>×</button></div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label className="form-label">Title *</label><input id="task-title" className="form-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required placeholder="Task title" /></div>
          <div className="form-group"><label className="form-label">Description</label><textarea id="task-desc" className="form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group"><label className="form-label">Priority</label>
              <select id="task-priority" className="form-select" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option>
              </select>
            </div>
            <div className="form-group"><label className="form-label">Status</label>
              <select id="task-status" className="form-select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                <option value="TODO">Backlog</option><option value="IN_PROGRESS">In progress</option><option value="DONE">Done</option>
              </select>
            </div>
          </div>
          <div className="form-group"><label className="form-label">Assignee</label>
            <select id="task-assignee" className="form-select" value={form.assigneeId} onChange={e => setForm({...form, assigneeId: e.target.value})}>
              <option value="">Unassigned</option>
              {members.map(m => <option key={m.user.id} value={m.user.id}>{m.user.name} ({m.role})</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Due date</label><input id="task-due" type="date" className="form-input" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} /></div>
          <div className="modal-actions"><button type="button" className="btn" onClick={onClose}>Cancel</button><button id="create-task-submit" type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creating…' : 'Create task'}</button></div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // kanban | list
  const [activeTab, setActiveTab] = useState('tasks');
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  useEffect(() => {
    api.get(`/projects/${id}`).then(r => { setProject(r.data); setLoading(false); }).catch(() => navigate('/projects'));
  }, [id]);

  const isAdmin = project?.role === 'ADMIN';

  const handleStatusChange = async (taskId, status) => {
    try {
      const res = await api.patch(`/tasks/${taskId}`, { status });
      setProject(p => ({ ...p, tasks: p.tasks.map(t => t.id === taskId ? res.data : t) }));
    } catch {}
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this project?')) return;
    await api.delete(`/projects/${id}`);
    navigate('/projects');
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    await api.delete(`/projects/${id}/members/${userId}`);
    setProject(p => ({ ...p, members: p.members.filter(m => m.user.id !== userId) }));
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!project) return null;

  const tasks = project.tasks || [];
  const members = project.members || [];
  const done = tasks.filter(t => t.status === 'DONE').length;
  const pct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;

  return (
    <div style={{ display: 'flex', gap: 0, minHeight: 'calc(100vh - 64px)', margin: '-32px' }}>
      {/* Project sub-sidebar */}
      <div style={{ width: 240, borderRight: 'var(--b) solid var(--line)', padding: 20, display: 'flex', flexDirection: 'column', gap: 16, flexShrink: 0 }}>
        <div>
          <button onClick={() => navigate('/projects')} style={{ background: 'none', border: 'none', fontSize: 11, color: 'var(--ink-3)', cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", marginBottom: 8, padding: 0 }}>← Projects</button>
          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 4 }}>{project.name?.slice(0,8).toUpperCase().replace(/\s/g,'_')}</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{project.name}</div>
        </div>

        <div>
          <div className="wf-bar" style={{ marginBottom: 6 }}><i style={{ width: pct + '%' }} /></div>
          <div className="mono" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
            <span>{done} / {tasks.length} tasks</span>
            <span>{pct}%</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
          {['tasks', 'members'].map((tab, i) => (
            <div key={tab} onClick={() => setActiveTab(tab)}
              style={{ padding: '8px 10px', cursor: 'pointer', fontSize: 13, borderRadius: 2, background: activeTab === tab ? 'var(--ink)' : 'transparent', color: activeTab === tab ? 'var(--paper)' : 'var(--ink)' }}>
              {tab === 'tasks' ? `Tasks (${tasks.length})` : `Members (${members.length})`}
            </div>
          ))}
          {isAdmin && (
            <div style={{ padding: '8px 10px', fontSize: 13, color: 'var(--ink-2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              Settings <span className="mono" style={{ fontSize: 9, padding: '1px 4px', border: 'var(--b) solid var(--line)', borderRadius: 2 }}>ADMIN</span>
            </div>
          )}
        </div>

        <div style={{ borderTop: 'var(--b) dashed var(--line)', paddingTop: 12, marginTop: 4 }}>
          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 8 }}>Members ({members.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {members.map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <div className="av" style={{ width: 20, height: 20, fontSize: 9 }}>{m.user.name?.slice(0,2).toUpperCase()}</div>
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.user.name}</span>
                <span className="mono" style={{ fontSize: 9, color: m.role === 'ADMIN' ? 'var(--ink)' : 'var(--ink-3)' }}>{m.role === 'ADMIN' ? 'admin' : 'member'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Topbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: 'var(--b) solid var(--line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>
              {isAdmin ? 'ADMIN' : 'MEMBER'}
            </div>
            {!isAdmin && (
              <div style={{ fontSize: 11, color: 'var(--blue)', background: 'var(--blue-bg)', padding: '3px 10px', border: 'var(--b) solid var(--blue)', borderRadius: 2 }}>
                🔒 Member view — contact an admin to create tasks
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* View toggle — Tasks tab only */}
            {activeTab === 'tasks' && (
              <div style={{ display: 'flex', gap: 4 }}>
                {[['list','List'],['kanban','Board'],['timeline','Timeline']].map(([k,l]) => (
                  <button key={k} onClick={() => setView(k)} className="mono"
                    style={{ fontSize:11, padding:'4px 10px', border:'var(--b) solid var(--line)', borderRadius:2, background:view===k?'var(--ink)':'var(--paper)', color:view===k?'var(--paper)':'var(--ink)', cursor:'pointer' }}>
                    {l}
                  </button>
                ))}
              </div>
            )}
            {isAdmin && (
              <>
                <button id="invite-member-btn" className="btn" onClick={() => setShowInvite(true)}>👥 Invite</button>
                <button id="delete-project-btn" className="btn btn-danger" onClick={handleDelete}>Delete</button>
              </>
            )}
            <button id="create-task-btn" className="btn btn-primary" onClick={() => setShowCreateTask(true)}>+ Task</button>
          </div>
        </div>

        <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {activeTab === 'tasks' && (
            view === 'kanban'
              ? <KanbanView tasks={tasks} onStatusChange={handleStatusChange} />
              : view === 'timeline'
                ? <TimelineView tasks={tasks} />
                : <ListView tasks={tasks} onStatusChange={handleStatusChange} />
          )}

          {activeTab === 'members' && (
            <div style={{ maxWidth: 520 }}>
              {members.map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(21,21,26,0.1)' }}>
                  <div className="av" style={{ width: 32, height: 32, fontSize: 12 }}>{m.user.name?.slice(0,2).toUpperCase()}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{m.user.name}</div>
                    <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{m.user.email}</div>
                  </div>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, padding: '2px 6px', border: 'var(--b) solid var(--line)', borderRadius: 2, background: m.role === 'ADMIN' ? 'var(--ink)' : 'transparent', color: m.role === 'ADMIN' ? 'var(--paper)' : 'var(--ink)' }}>
                    {m.role}
                  </span>
                  {isAdmin && m.user.id !== user.id && (
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--accent)' }} onClick={() => handleRemoveMember(m.user.id)}>✕</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreateTask && <CreateTaskModal projectId={id} members={members} onClose={() => setShowCreateTask(false)} onCreated={t => setProject(p => ({ ...p, tasks: [t, ...(p.tasks || [])] }))} />}
      {showInvite && <InviteModal projectId={id} onClose={() => setShowInvite(false)} onInvited={m => setProject(p => ({ ...p, members: [...(p.members || []), m] }))} />}
    </div>
  );
}
