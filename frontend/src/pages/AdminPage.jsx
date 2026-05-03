import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const PBar = ({ done, total }) => {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 5 }}>
        <span>Progress</span><span style={{ fontWeight: 600, color: pct === 100 ? 'var(--green)' : 'inherit' }}>{pct}%</span>
      </div>
      <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? 'var(--green)' : 'var(--accent)', borderRadius: 3, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
};

export default function AdminPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [noAccess, setNoAccess] = useState(false);

  useEffect(() => {
    api.get('/admin/overview')
      .then((r) => { setData(r.data); setLoading(false); })
      .catch((err) => {
        if (err.response?.status === 403) setNoAccess(true);
        setLoading(false);
      });
  }, []);

  const handleRoleChange = async (projectId, userId, newRole) => {
    try {
      await api.patch(`/admin/projects/${projectId}/members/${userId}`, { role: newRole });
      setData((prev) => ({
        ...prev,
        projects: prev.projects.map((p) =>
          p.id === projectId
            ? { ...p, members: p.members.map((m) => m.userId === userId ? { ...m, role: newRole } : m) }
            : p
        ),
      }));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to change role');
    }
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  if (noAccess) return (
    <div>
      <div className="page-header">
        <h1 className="page-title">👑 Admin Panel</h1>
        <p className="page-subtitle">Manage projects, members, and roles</p>
      </div>
      <div className="empty-state">
        <div className="empty-state-icon">🔒</div>
        <h3>No Admin Access</h3>
        <p>You are not an admin in any project yet.</p>
        <Link to="/projects" className="btn btn-primary" style={{ marginTop: 16 }}>
          + Create a Project
        </Link>
      </div>
    </div>
  );

  const { projects, stats } = data;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">👑 Admin Panel</h1>
        <p className="page-subtitle">Manage your projects, members, and roles</p>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 32 }}>
        {[
          { label: 'Admin Projects', value: stats.adminProjects, icon: '📁', color: 'var(--accent)', bg: 'var(--accent-glow)' },
          { label: 'Total Members', value: stats.totalMembers, icon: '👥', color: 'var(--blue)', bg: 'var(--blue-bg)' },
          { label: 'Total Tasks', value: stats.totalTasks, icon: '📋', color: 'var(--yellow)', bg: 'var(--yellow-bg)' },
          { label: 'Completed Tasks', value: stats.doneTasks, icon: '✅', color: 'var(--green)', bg: 'var(--green-bg)' },
        ].map((s) => (
          <div key={s.label} className="stat-card" style={{ '--stat-color': s.color, '--stat-bg': s.bg }}>
            <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Projects */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {projects.map((project) => (
          <div key={project.id} className="card">
            {/* Project Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, gap: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 16 }}>👑</span>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{project.name}</h3>
                  <span className="badge badge-admin" style={{ fontSize: 10 }}>ADMIN</span>
                </div>
                {project.description && (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>{project.description}</p>
                )}
              </div>
              <Link to={`/projects/${project.id}`} className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }}>
                Open →
              </Link>
            </div>

            {/* Task stats row */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
              {[
                { label: 'To Do', count: project.tasks.filter((t) => t.status === 'TODO').length, color: 'var(--blue)' },
                { label: 'In Progress', count: project.tasks.filter((t) => t.status === 'IN_PROGRESS').length, color: 'var(--yellow)' },
                { label: 'Done', count: project.tasks.filter((t) => t.status === 'DONE').length, color: 'var(--green)' },
              ].map((s) => (
                <div key={s.label} style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                  <span style={{ fontWeight: 700, color: s.color }}>{s.count}</span> {s.label}
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div style={{ marginBottom: 20 }}>
              <PBar done={project.tasks.filter((t) => t.status === 'DONE').length} total={project.tasks.length} />
            </div>

            {/* Members */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                Members ({project.members.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {project.members.map((m) => (
                  <div key={m.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 12px', borderRadius: 8,
                    background: m.userId === user.id ? 'var(--accent-glow)' : 'transparent',
                    border: '1px solid',
                    borderColor: m.userId === user.id ? 'var(--accent)' : 'transparent',
                    transition: 'background 0.2s',
                  }}>
                    <div className="member-avatar" style={{ width: 34, height: 34, fontSize: 12 }}>
                      {m.user.name?.slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {m.role === 'ADMIN' && <span>👑</span>}
                        {m.user.name}
                        {m.userId === user.id && (
                          <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 400 }}>(you)</span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.user.email}</div>
                    </div>
                    {m.userId !== user.id ? (
                      <select
                        className="filter-select"
                        style={{ fontSize: 12, padding: '5px 10px', minWidth: 90 }}
                        value={m.role}
                        onChange={(e) => handleRoleChange(project.id, m.userId, e.target.value)}
                      >
                        <option value="MEMBER">👤 Member</option>
                        <option value="ADMIN">👑 Admin</option>
                      </select>
                    ) : (
                      <span className="badge badge-admin">👑 ADMIN</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
