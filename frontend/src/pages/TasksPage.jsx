import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';
const isOverdue = (d, s) => d && new Date(d) < new Date() && s !== 'DONE';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const statusFilter = searchParams.get('status') || '';
  const priorityFilter = searchParams.get('priority') || '';
  const projectFilter = searchParams.get('projectId') || '';

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    const params = {};
    if (statusFilter && statusFilter !== 'overdue') params.status = statusFilter;
    if (priorityFilter) params.priority = priorityFilter;
    if (projectFilter) params.projectId = projectFilter;
    try {
      const res = await api.get('/tasks', { params });
      let data = res.data;
      if (statusFilter === 'overdue') data = data.filter(t => isOverdue(t.dueDate, t.status));
      setTasks(data);
    } catch {}
    setLoading(false);
  }, [statusFilter, priorityFilter, projectFilter]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);
  useEffect(() => { api.get('/projects').then(r => setProjects(r.data)); }, []);

  const handleStatusChange = async (taskId, status) => {
    try {
      const res = await api.patch(`/tasks/${taskId}`, { status });
      setTasks(prev => prev.map(t => t.id === taskId ? res.data : t));
    } catch {}
  };

  const setFilter = (key, val) => {
    const next = new URLSearchParams(searchParams);
    if (val) next.set(key, val); else next.delete(key);
    setSearchParams(next);
  };

  const STATUS_OPTS = [['', 'All statuses'], ['TODO', 'Backlog'], ['IN_PROGRESS', 'In progress'], ['DONE', 'Done'], ['overdue', 'Overdue']];
  const PRI_OPTS = [['', 'All priorities'], ['LOW', 'Low'], ['MEDIUM', 'Medium'], ['HIGH', 'High']];

  return (
    <div>
      {/* TopBar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 18, borderBottom: 'var(--b) solid var(--line)' }}>
        <div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.12em', textTransform: 'uppercase' }}>WORKSPACE / TASKS</div>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em' }}>All Tasks</div>
        </div>
        <div className="mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>{tasks.length} task{tasks.length !== 1 ? 's' : ''}</div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <select id="filter-status" className="filter-select" value={statusFilter} onChange={e => setFilter('status', e.target.value)}>
          {STATUS_OPTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select id="filter-priority" className="filter-select" value={priorityFilter} onChange={e => setFilter('priority', e.target.value)}>
          {PRI_OPTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select id="filter-project" className="filter-select" value={projectFilter} onChange={e => setFilter('projectId', e.target.value)}>
          <option value="">All projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {(statusFilter || priorityFilter || projectFilter) && (
          <button className="btn btn-sm" onClick={() => setSearchParams({})}>Clear</button>
        )}
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <h3>No tasks found</h3>
          <p>Try adjusting your filters or create tasks from a project.</p>
        </div>
      ) : (
        <>
          {/* Table header */}
          <div className="mono" style={{ display: 'flex', padding: '8px 12px', borderBottom: 'var(--b) solid var(--line)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
            <div style={{ width: 28 }} />
            <div style={{ flex: 1 }}>Task</div>
            <div style={{ width: 120 }}>Project</div>
            <div style={{ width: 100 }}>Status</div>
            <div style={{ width: 80 }}>Priority</div>
            <div style={{ width: 90 }}>Due</div>
            <div style={{ width: 60 }}>Owner</div>
          </div>

          {tasks.map(t => {
            const done = t.status === 'DONE';
            const over = isOverdue(t.dueDate, t.status);
            const initials = t.assignee?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '—';
            const priColor = { HIGH: 'var(--accent)', MEDIUM: 'var(--ink)', LOW: 'var(--ink-3)' }[t.priority] || 'var(--ink-3)';

            return (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', padding: '11px 12px', borderBottom: '1px solid rgba(21,21,26,0.1)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(21,21,26,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ width: 28 }}>
                  <div onClick={() => handleStatusChange(t.id, done ? 'TODO' : 'DONE')}
                    style={{ width: 14, height: 14, border: 'var(--b) solid var(--line)', borderRadius: 2, background: done ? 'var(--ink)' : 'transparent', cursor: 'pointer' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, textDecoration: done ? 'line-through' : 'none', color: done ? 'var(--ink-3)' : 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.title}
                  </div>
                  {t.description && <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</div>}
                </div>
                <div className="mono" style={{ width: 120, fontSize: 11, color: 'var(--ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.project?.name}</div>
                <div style={{ width: 100 }}>
                  <select className="filter-select" value={t.status} onChange={e => handleStatusChange(t.id, e.target.value)} style={{ fontSize: 11, padding: '3px 6px' }}>
                    <option value="TODO">Backlog</option>
                    <option value="IN_PROGRESS">In progress</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>
                <div style={{ width: 80 }}>
                  <span className="mono" style={{ fontSize: 10, color: priColor, border: 'var(--b) solid currentColor', borderRadius: 2, padding: '2px 6px' }}>{t.priority}</span>
                </div>
                <div className="mono" style={{ width: 90, fontSize: 11, color: over ? 'var(--accent)' : 'var(--ink-3)' }}>
                  {over ? '⚠ ' : ''}{fmt(t.dueDate)}
                </div>
                <div style={{ width: 60 }}><div className="av">{initials}</div></div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
