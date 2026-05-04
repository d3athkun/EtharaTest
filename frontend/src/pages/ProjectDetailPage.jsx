import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { fmt, isOverdue } from '../utils/format';
import InviteModal from '../components/modals/InviteModal';
import CreateTaskModal from '../components/modals/CreateTaskModal';

/* ── Task card (kanban) ─────────────────────────────────────── */
function TaskCard({ t }) {
  const over = isOverdue(t.dueDate, t.status);
  return (
    <div style={{ border: 'var(--b) solid var(--line)', padding: 10, marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>{t.status}</span>
        <div className="av" style={{ width: 18, height: 18, fontSize: 8 }}>
          {t.assignee?.name?.slice(0, 2).toUpperCase() || '—'}
        </div>
      </div>
      <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 6 }}>{t.title}</div>
      <div className="mono" style={{ fontSize: 10, color: over ? 'var(--accent)' : 'var(--ink-3)' }}>
        {over ? 'OVERDUE · ' : ''}{fmt(t.dueDate)}
      </div>
    </div>
  );
}

/* ── Kanban view ────────────────────────────────────────────── */
const COLS = [
  { key: 'TODO', label: 'Backlog' },
  { key: 'IN_PROGRESS', label: 'In progress' },
  { key: 'DONE', label: 'Done' },
];

function KanbanView({ tasks }) {
  return (
    <div style={{ display: 'flex', gap: 12, flex: 1, minHeight: 0 }}>
      {COLS.map(col => {
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
              <div style={{ border: 'var(--b) dashed var(--line)', padding: 8, fontSize: 10, color: 'var(--ink-3)', textAlign: 'center', fontFamily: 'monospace' }}>
                + add task
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── List view ──────────────────────────────────────────────── */
function ListView({ tasks, onStatusChange }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <div className="mono" style={{ display: 'flex', padding: '8px 12px', borderBottom: 'var(--b) solid var(--line)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
        <div style={{ width: 28 }} />
        <div style={{ flex: 1 }}>Task</div>
        <div style={{ width: 110 }}>Status</div>
        <div style={{ width: 80 }}>Due</div>
        <div style={{ width: 60 }}>Owner</div>
      </div>
      {tasks.map(t => {
        const done = t.status === 'DONE';
        const over = isOverdue(t.dueDate, t.status);
        return (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', borderBottom: '1px solid rgba(21,21,26,0.1)' }}>
            <div style={{ width: 28 }}>
              <div style={{ width: 14, height: 14, border: 'var(--b) solid var(--line)', borderRadius: 2, background: done ? 'var(--ink)' : 'transparent' }} />
            </div>
            <div style={{ flex: 1, fontSize: 13, fontWeight: 500, textDecoration: done ? 'line-through' : 'none', color: done ? 'var(--ink-3)' : 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {t.title}
            </div>
            <div style={{ width: 110 }}>
              <select className="filter-select" style={{ fontSize: 10, padding: '3px 6px' }}
                value={t.status} onChange={e => onStatusChange(t.id, e.target.value)}>
                <option value="TODO">Backlog</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="DONE">Done</option>
              </select>
            </div>
            <div className="mono" style={{ width: 80, fontSize: 11, color: over ? 'var(--accent)' : 'var(--ink-3)' }}>{fmt(t.dueDate)}</div>
            <div style={{ width: 60 }}>
              <div className="av">{t.assignee?.name?.slice(0, 2).toUpperCase() || '—'}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Timeline view ──────────────────────────────────────────── */
const TL_OFFSETS = [5, 18, 30, 50, 12, 22, 38, 60, 0, 8];
const TL_WIDTHS  = [22, 18, 30, 24, 28, 16, 22, 30, 20, 25];

function TimelineView({ tasks }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <div style={{ display: 'flex', borderBottom: 'var(--b) solid var(--line)', paddingBottom: 8, marginLeft: 220, marginBottom: 4 }}>
        {['W18','W19','W20','W21','W22'].map((w, i) => (
          <div key={w} className="mono" style={{ flex: 1, fontSize: 10, color: 'var(--ink-3)', borderRight: i < 4 ? '1px dashed rgba(21,21,26,0.2)' : 'none', paddingLeft: 6 }}>{w}</div>
        ))}
      </div>
      {tasks.map((t, i) => {
        const done = t.status === 'DONE';
        const over = isOverdue(t.dueDate, t.status);
        return (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(21,21,26,0.08)' }}>
            <div style={{ width: 220, display: 'flex', alignItems: 'center', gap: 8, paddingRight: 12 }}>
              <div style={{ width: 14, height: 14, border: 'var(--b) solid var(--line)', borderRadius: 2, flexShrink: 0, background: done ? 'var(--ink)' : 'transparent' }} />
              <div style={{ minWidth: 0 }}>
                <div className="mono" style={{ fontSize: 9, color: 'var(--ink-3)' }}>{t.status}</div>
                <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
              </div>
            </div>
            <div style={{ flex: 1, position: 'relative', height: 24 }}>
              <div style={{
                position: 'absolute', top: 0, bottom: 0,
                left: TL_OFFSETS[i % TL_OFFSETS.length] + '%',
                width: TL_WIDTHS[i % TL_WIDTHS.length] + '%',
                border: 'var(--b) solid var(--line)',
                background: over ? 'var(--accent)' : done ? 'var(--ink)' : 'var(--paper)',
                color: over || done ? 'var(--paper)' : 'var(--ink)',
                fontSize: 10, padding: '0 6px',
                display: 'flex', alignItems: 'center',
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                {t.assignee?.name?.slice(0, 2).toUpperCase() || '—'}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Members tab ────────────────────────────────────────────── */
function MembersTab({ members, isAdmin, currentUserId, onRemove }) {
  return (
    <div style={{ maxWidth: 520 }}>
      {members.map(m => (
        <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(21,21,26,0.1)' }}>
          <div className="av" style={{ width: 32, height: 32, fontSize: 12 }}>
            {m.user.name?.slice(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{m.user.name}</div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{m.user.email}</div>
          </div>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 10, padding: '2px 6px',
            border: 'var(--b) solid var(--line)', borderRadius: 2,
            background: m.role === 'ADMIN' ? 'var(--ink)' : 'transparent',
            color: m.role === 'ADMIN' ? 'var(--paper)' : 'var(--ink)',
          }}>{m.role}</span>
          {isAdmin && m.user.id !== currentUserId && (
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--accent)' }} onClick={() => onRemove(m.user.id)}>✕</button>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Main page ──────────────────────────────────────────────── */
const VIEWS = [['list','List'],['kanban','Board'],['timeline','Timeline']];

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [activeTab, setActiveTab] = useState('tasks');
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  useEffect(() => {
    api.get(`/projects/${id}`)
      .then(r => { setProject(r.data); setLoading(false); })
      .catch(() => navigate('/projects'));
  }, [id]);

  const updateTask = (updated) =>
    setProject(p => ({ ...p, tasks: p.tasks.map(t => t.id === updated.id ? updated : t) }));

  const handleStatusChange = async (taskId, status) => {
    try { updateTask(await api.patch(`/tasks/${taskId}`, { status }).then(r => r.data)); } catch {}
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
  const isAdmin = project.role === 'ADMIN';
  const donePct = tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'DONE').length / tasks.length) * 100) : 0;
  const code = project.name?.slice(0, 8).toUpperCase().replace(/\s/g, '_');

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)', margin: '-32px' }}>

      {/* ── Project sub-sidebar ── */}
      <div style={{ width: 240, borderRight: 'var(--b) solid var(--line)', padding: 20, display: 'flex', flexDirection: 'column', gap: 16, flexShrink: 0 }}>
        <div>
          <button onClick={() => navigate('/projects')}
            style={{ background: 'none', border: 'none', fontSize: 11, color: 'var(--ink-3)', cursor: 'pointer', fontFamily: "'JetBrains Mono',monospace", marginBottom: 8, padding: 0 }}>
            ← Projects
          </button>
          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 4 }}>{code}</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{project.name}</div>
        </div>

        {/* Progress */}
        <div>
          <div className="wf-bar" style={{ marginBottom: 6 }}><i style={{ width: donePct + '%' }} /></div>
          <div className="mono" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
            <span>{tasks.filter(t => t.status === 'DONE').length} / {tasks.length} tasks</span>
            <span>{donePct}%</span>
          </div>
        </div>

        {/* Nav */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[['tasks', `Tasks (${tasks.length})`], ['members', `Members (${members.length})`]].map(([tab, label]) => (
            <div key={tab} onClick={() => setActiveTab(tab)}
              style={{ padding: '8px 10px', cursor: 'pointer', fontSize: 13, borderRadius: 2, background: activeTab === tab ? 'var(--ink)' : 'transparent', color: activeTab === tab ? 'var(--paper)' : 'var(--ink)' }}>
              {label}
            </div>
          ))}
          {isAdmin && (
            <div style={{ padding: '8px 10px', fontSize: 13, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              Settings
              <span className="mono" style={{ fontSize: 9, padding: '1px 4px', border: 'var(--b) solid var(--line)', borderRadius: 2 }}>ADMIN</span>
            </div>
          )}
        </div>

        {/* Member list */}
        <div style={{ borderTop: 'var(--b) dashed var(--line)', paddingTop: 12 }}>
          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 8 }}>
            Members ({members.length})
          </div>
          {members.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 6 }}>
              <div className="av" style={{ width: 20, height: 20, fontSize: 9 }}>{m.user.name?.slice(0, 2).toUpperCase()}</div>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.user.name}</span>
              <span className="mono" style={{ fontSize: 9, color: m.role === 'ADMIN' ? 'var(--ink)' : 'var(--ink-3)' }}>
                {m.role === 'ADMIN' ? 'admin' : 'member'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Topbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', borderBottom: 'var(--b) solid var(--line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, padding: '2px 8px', border: 'var(--b) solid var(--line)', borderRadius: 2, background: isAdmin ? 'var(--ink)' : 'transparent', color: isAdmin ? 'var(--paper)' : 'var(--ink)' }}>
              {isAdmin ? 'ADMIN' : 'MEMBER'}
            </span>
            {!isAdmin && (
              <div style={{ fontSize: 11, color: 'var(--blue)', background: 'var(--blue-bg)', padding: '3px 10px', border: 'var(--b) solid var(--blue)', borderRadius: 2 }}>
                🔒 Member view
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {activeTab === 'tasks' && (
              <div style={{ display: 'flex', gap: 4 }}>
                {VIEWS.map(([k, l]) => (
                  <button key={k} onClick={() => setView(k)} className="mono"
                    style={{ fontSize: 11, padding: '4px 10px', border: 'var(--b) solid var(--line)', borderRadius: 2, background: view === k ? 'var(--ink)' : 'var(--paper)', color: view === k ? 'var(--paper)' : 'var(--ink)', cursor: 'pointer' }}>
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

        {/* Content */}
        <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {activeTab === 'tasks' && (
            view === 'kanban' ? <KanbanView tasks={tasks} /> :
            view === 'timeline' ? <TimelineView tasks={tasks} /> :
            <ListView tasks={tasks} onStatusChange={handleStatusChange} />
          )}
          {activeTab === 'members' && (
            <MembersTab members={members} isAdmin={isAdmin} currentUserId={user.id} onRemove={handleRemoveMember} />
          )}
        </div>
      </div>

      {showCreateTask && (
        <CreateTaskModal projectId={id} members={members} onClose={() => setShowCreateTask(false)}
          onCreated={t => setProject(p => ({ ...p, tasks: [t, ...p.tasks] }))} />
      )}
      {showInvite && (
        <InviteModal projectId={id} onClose={() => setShowInvite(false)}
          onInvited={m => setProject(p => ({ ...p, members: [...p.members, m] }))} />
      )}
    </div>
  );
}
