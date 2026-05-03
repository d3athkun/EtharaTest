import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import StatusBadge from '../components/StatusBadge';

const formatDate = (d) => {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
const isOverdue = (d) => d && new Date(d) < new Date();

function TaskRow({ task }) {
  const done = task.status === 'DONE';
  const overdue = isOverdue(task.dueDate) && !done;
  const initials = task.assignee?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '—';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(21,21,26,0.1)' }}>
      <div style={{ width: 14, height: 14, border: 'var(--b) solid var(--line)', borderRadius: 2, flexShrink: 0, background: done ? 'var(--ink)' : 'transparent' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, textDecoration: done ? 'line-through' : 'none', color: done ? 'var(--ink-3)' : 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {task.title}
        </div>
        <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 2 }}>
          📁 {task.project?.name} · <span style={{ color: overdue ? 'var(--accent)' : 'var(--ink-3)' }}>{overdue ? 'OVERDUE · ' : ''}{formatDate(task.dueDate) || 'no due date'}</span>
        </div>
      </div>
      <div className="av">{initials}</div>
    </div>
  );
}

function StatBlock({ label, value, accent }) {
  return (
    <div style={{ border: 'var(--b) solid var(--line)', padding: 16, flex: 1 }}>
      <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', color: accent ? 'var(--accent)' : 'var(--ink)' }}>{value}</div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  const { stats = {}, overdueTasks = [], recentTasks = [] } = data || {};
  const allTasks = [...overdueTasks, ...recentTasks].filter((t, i, a) => a.findIndex(x => x.id === t.id) === i);

  return (
    <div>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, paddingBottom: 20, borderBottom: 'var(--b) solid var(--line)' }}>
        <div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.12em', textTransform: 'uppercase' }}>DASHBOARD</div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>
        <Link to="/tasks" className="btn btn-primary">+ New task</Link>
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
        {/* Center — tasks */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Summary line */}
          <div style={{ marginBottom: 16 }}>
            <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>
              {stats.total ?? 0} tasks
            </span>
            {stats.overdue > 0 && (
              <span style={{ marginLeft: 8, color: 'var(--accent)', fontWeight: 600 }}>· {stats.overdue} overdue</span>
            )}
          </div>

          {/* Task list */}
          <div>
            {allTasks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🎉</div>
                <h3>All clear!</h3>
                <p>No tasks yet. Create a project to get started.</p>
              </div>
            ) : (
              allTasks.map(t => <TaskRow key={t.id} task={t} />)
            )}
          </div>

          {/* Project progress */}
          <div style={{ border: 'var(--b) solid var(--line)', padding: 16, marginTop: 24 }}>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 12 }}>Project progress</div>
            {stats.myProjects === 0 ? (
              <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>No projects yet.</div>
            ) : (
              <div className="mono" style={{ fontSize: 11, color: 'var(--ink-2)' }}>
                {stats.myProjects} project{stats.myProjects !== 1 ? 's' : ''} · {stats.done ?? 0} tasks done
              </div>
            )}
          </div>
        </div>

        {/* Right rail — stats */}
        <div style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <StatBlock label="Open" value={stats.total ?? 0} />
            <StatBlock label="Overdue" value={stats.overdue ?? 0} accent={stats.overdue > 0} />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <StatBlock label="In progress" value={stats.inProgress ?? 0} />
            <StatBlock label="Done" value={stats.done ?? 0} />
          </div>

          {/* Overdue tasks */}
          {overdueTasks.length > 0 && (
            <div style={{ border: 'var(--b) solid var(--accent)', padding: 16, marginTop: 4 }}>
              <div className="mono" style={{ fontSize: 10, color: 'var(--accent)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 10 }}>Overdue</div>
              {overdueTasks.slice(0, 3).map(t => (
                <div key={t.id} style={{ fontSize: 12, padding: '6px 0', borderBottom: '1px solid rgba(217,74,43,0.2)' }}>
                  <div style={{ fontWeight: 500, color: 'var(--ink)' }}>{t.title}</div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--accent)', marginTop: 2 }}>
                    Due {formatDate(t.dueDate)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick links */}
          <div style={{ border: 'var(--b) solid var(--line)', padding: 16 }}>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 10 }}>Quick links</div>
            {[
              { label: '→ View all tasks', to: '/tasks' },
              { label: '→ My projects', to: '/projects' },
              { label: '→ Admin panel', to: '/admin' },
            ].map(l => (
              <div key={l.to} style={{ padding: '6px 0', borderBottom: '1px solid rgba(21,21,26,0.08)', fontSize: 12 }}>
                <Link to={l.to} className="mono" style={{ color: 'var(--ink)', textDecoration: 'none' }}>{l.label}</Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
