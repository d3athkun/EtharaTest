import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';

const formatDate = (d) => {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const isOverdue = (d) => d && new Date(d) < new Date();

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then((r) => {
      setData(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  const { stats, overdueTasks, recentTasks } = data || { stats: {}, overdueTasks: [], recentTasks: [] };

  const statCards = [
    { label: 'Total Tasks', value: stats.total ?? 0, icon: '📋', color: 'var(--accent)', bg: 'var(--accent-glow)' },
    { label: 'To Do', value: stats.todo ?? 0, icon: '🔵', color: 'var(--blue)', bg: 'var(--blue-bg)' },
    { label: 'In Progress', value: stats.inProgress ?? 0, icon: '⏳', color: 'var(--yellow)', bg: 'var(--yellow-bg)' },
    { label: 'Completed', value: stats.done ?? 0, icon: '✅', color: 'var(--green)', bg: 'var(--green-bg)' },
    { label: 'Overdue', value: stats.overdue ?? 0, icon: '🚨', color: 'var(--red)', bg: 'var(--red-bg)' },
    { label: 'Assigned to Me', value: stats.assignedToMe ?? 0, icon: '👤', color: 'var(--purple)', bg: 'var(--purple-bg)' },
    { label: 'My Projects', value: stats.myProjects ?? 0, icon: '📁', color: 'var(--accent)', bg: 'var(--accent-glow)' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Your project & task overview at a glance</p>
      </div>

      <div className="stats-grid">
        {statCards.map((s) => (
          <div key={s.label} className="stat-card" style={{ '--stat-color': s.color, '--stat-bg': s.bg }}>
            <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ gap: 20 }}>
        {/* Overdue Tasks */}
        <div className="card">
          <div className="section-header">
            <span className="section-title" style={{ color: 'var(--red)' }}>🚨 Overdue Tasks</span>
            <Link to="/tasks?status=overdue" className="btn btn-sm btn-secondary">View all</Link>
          </div>
          {overdueTasks.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 20px' }}>
              <div className="empty-state-icon">🎉</div>
              <h3>All caught up!</h3>
              <p>No overdue tasks</p>
            </div>
          ) : (
            <div>
              {overdueTasks.map((t) => (
                <div key={t.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{t.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>📁 {t.project?.name}</div>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--red)', whiteSpace: 'nowrap' }}>
                      Due {formatDate(t.dueDate)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Tasks */}
        <div className="card">
          <div className="section-header">
            <span className="section-title">🕐 Recent Tasks</span>
            <Link to="/tasks" className="btn btn-sm btn-secondary">View all</Link>
          </div>
          {recentTasks.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 20px' }}>
              <div className="empty-state-icon">📝</div>
              <h3>No tasks yet</h3>
              <p>Create a project and add tasks</p>
            </div>
          ) : (
            <div>
              {recentTasks.map((t) => (
                <div key={t.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>📁 {t.project?.name}</div>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
