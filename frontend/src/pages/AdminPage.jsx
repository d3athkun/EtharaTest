import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function AdminPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [noAccess, setNoAccess] = useState(false);

  useEffect(() => {
    api.get('/admin/overview')
      .then(r => { setData(r.data); setLoading(false); })
      .catch(err => {
        if (err.response?.status === 403) setNoAccess(true);
        setLoading(false);
      });
  }, []);

  const handleRoleChange = async (projectId, userId, newRole) => {
    try {
      await api.patch(`/admin/projects/${projectId}/members/${userId}`, { role: newRole });
      setData(prev => ({
        ...prev,
        projects: prev.projects.map(p =>
          p.id === projectId
            ? { ...p, members: p.members.map(m => m.userId === userId ? { ...m, role: newRole } : m) }
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
      <div style={{ marginBottom: 28, paddingBottom: 18, borderBottom: 'var(--b) solid var(--line)' }}>
        <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.12em', textTransform: 'uppercase' }}>SYSTEM</div>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Admin Panel</div>
      </div>
      <div className="empty-state">
        <div className="empty-state-icon">🔒</div>
        <h3>Access Denied</h3>
        <p>You are not the system administrator.</p>
      </div>
    </div>
  );

  const { projects = [], stats = {} } = data;

  return (
    <div>
      {/* TopBar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 18, borderBottom: 'var(--b) solid var(--line)' }}>
        <div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.12em', textTransform: 'uppercase' }}>SYSTEM / ADMIN</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>Admin Panel</div>
        </div>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, padding: '3px 8px', border: 'var(--b) solid var(--line)', borderRadius: 2, background: 'var(--ink)', color: 'var(--paper)', letterSpacing: '.05em' }}>
          SUPER ADMIN
        </span>
      </div>

      {/* Stat blocks */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Total projects', value: stats.adminProjects ?? 0 },
          { label: 'Total members', value: stats.totalMembers ?? 0 },
          { label: 'Total tasks', value: stats.totalTasks ?? 0 },
          { label: 'Tasks done', value: stats.doneTasks ?? 0 },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, border: 'var(--b) solid var(--line)', padding: 16 }}>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* All projects table */}
      <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 12 }}>
        All projects ({projects.length})
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📁</div>
          <h3>No projects yet</h3>
        </div>
      ) : (
        <>
          {/* Table header */}
          <div className="mono" style={{ display: 'flex', padding: '8px 0', borderBottom: 'var(--b) solid var(--line)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
            <div style={{ flex: 1 }}>Project</div>
            <div style={{ width: 160 }}>Progress</div>
            <div style={{ width: 60 }}>Tasks</div>
            <div style={{ width: 120 }}>Members</div>
            <div style={{ width: 60 }}>Open →</div>
          </div>

          {projects.map(p => {
            const total = p.tasks?.length ?? 0;
            const done = p.tasks?.filter(t => t.status === 'DONE').length ?? 0;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            const code = p.name?.slice(0, 8).toUpperCase().replace(/\s/g, '_');

            return (
              <div key={p.id} style={{ borderBottom: '1px solid rgba(21,21,26,0.1)' }}>
                {/* Project row */}
                <div style={{ display: 'flex', alignItems: 'center', padding: '12px 0' }}>
                  <div style={{ flex: 1 }}>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>{code}</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</div>
                  </div>
                  <div style={{ width: 160, paddingRight: 16 }}>
                    <div className="wf-bar"><i style={{ width: pct + '%' }} /></div>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 4 }}>{done}/{total} done</div>
                  </div>
                  <div className="mono" style={{ width: 60, fontSize: 12 }}>{total}</div>
                  <div style={{ width: 120 }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {p.members?.slice(0, 4).map(m => (
                        <div key={m.id} className="av" title={m.user.name}>{m.user.name?.slice(0, 2).toUpperCase()}</div>
                      ))}
                      {p.members?.length > 4 && (
                        <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', alignSelf: 'center' }}>+{p.members.length - 4}</div>
                      )}
                    </div>
                  </div>
                  <div style={{ width: 60 }}>
                    <Link to={`/projects/${p.id}`} className="btn btn-sm">→</Link>
                  </div>
                </div>

                {/* Members role management */}
                {p.members?.length > 0 && (
                  <div style={{ paddingLeft: 0, paddingBottom: 12 }}>
                    {p.members.map(m => (
                      <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0', fontSize: 12 }}>
                        <div className="av" style={{ width: 20, height: 20, fontSize: 9 }}>{m.user.name?.slice(0, 2).toUpperCase()}</div>
                        <span style={{ flex: 1, color: 'var(--ink-2)' }}>{m.user.name}</span>
                        <span className="mono" style={{ color: 'var(--ink-3)', fontSize: 10 }}>{m.user.email}</span>
                        <select className="filter-select" style={{ fontSize: 10, padding: '2px 6px' }}
                          value={m.role}
                          onChange={e => handleRoleChange(p.id, m.userId, e.target.value)}>
                          <option value="MEMBER">MEMBER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
