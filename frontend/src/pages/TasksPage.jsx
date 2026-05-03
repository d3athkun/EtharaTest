import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null;
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
      if (statusFilter === 'overdue') {
        data = data.filter((t) => isOverdue(t.dueDate, t.status));
      }
      setTasks(data);
    } catch {}
    setLoading(false);
  }, [statusFilter, priorityFilter, projectFilter]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  useEffect(() => {
    api.get('/projects').then((r) => setProjects(r.data));
  }, []);

  const handleStatusChange = async (taskId, status) => {
    try {
      const res = await api.patch(`/tasks/${taskId}`, { status });
      setTasks((prev) => prev.map((t) => t.id === taskId ? res.data : t));
    } catch {}
  };

  const setFilter = (key, val) => {
    const next = new URLSearchParams(searchParams);
    if (val) next.set(key, val); else next.delete(key);
    setSearchParams(next);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">All Tasks</h1>
        <p className="page-subtitle">Tasks across all your projects</p>
      </div>

      <div className="filters">
        <select id="filter-status" className="filter-select" value={statusFilter} onChange={(e) => setFilter('status', e.target.value)}>
          <option value="">All Statuses</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="DONE">Done</option>
          <option value="overdue">Overdue</option>
        </select>
        <select id="filter-priority" className="filter-select" value={priorityFilter} onChange={(e) => setFilter('priority', e.target.value)}>
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>
        <select id="filter-project" className="filter-select" value={projectFilter} onChange={(e) => setFilter('projectId', e.target.value)}>
          <option value="">All Projects</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {(statusFilter || priorityFilter || projectFilter) && (
          <button className="btn btn-secondary btn-sm" onClick={() => setSearchParams({})}>Clear filters</button>
        )}
        <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 'auto' }}>{tasks.length} task{tasks.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <h3>No tasks found</h3>
          <p>Try adjusting your filters or create tasks from a project</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tasks.map((t) => (
            <div key={t.id} className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>{t.title}</span>
                  <StatusBadge status={t.status} />
                  <PriorityBadge priority={t.priority} />
                  {isOverdue(t.dueDate, t.status) && <span className="badge badge-overdue">Overdue</span>}
                </div>
                {t.description && (
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.5 }}>{t.description}</p>
                )}
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-muted)' }}>
                  <span>📁 {t.project?.name}</span>
                  {t.assignee && <span>👤 {t.assignee.name}</span>}
                  {t.dueDate && (
                    <span style={{ color: isOverdue(t.dueDate, t.status) ? 'var(--red)' : 'inherit' }}>
                      📅 {formatDate(t.dueDate)}
                    </span>
                  )}
                </div>
              </div>
              <select className="filter-select" style={{ fontSize: 12, padding: '5px 8px', flexShrink: 0 }}
                value={t.status}
                onChange={(e) => handleStatusChange(t.id, e.target.value)}>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
