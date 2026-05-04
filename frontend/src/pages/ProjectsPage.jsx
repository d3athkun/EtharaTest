import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const getStatus = (p) => {
  const tasks = p._count?.tasks ?? 0;
  if (tasks === 0) return { label: 'PLANNING', color: 'var(--ink-3)' };
  return p.role === 'ADMIN'
    ? { label: 'ON TRACK', color: 'var(--ink)' }
    : { label: 'MEMBER', color: 'var(--ink-2)' };
};

function CreateProjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await api.post('/projects', form);
      onCreated(res.data); onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create project');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">New project</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Project name *</label>
            <input id="project-name" className="form-input" placeholder="e.g. ETH-CORE · Core platform"
              value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea id="project-desc" className="form-textarea" placeholder="What's this project about?"
              value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button id="create-project-submit" type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating…' : 'Create →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const STATUS_COLORS = { ON_TRACK: 'var(--ink)', AT_RISK: 'var(--accent)', DONE: 'var(--ink-3)', PLANNING: 'var(--ink-2)' };

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/projects').then(r => { setProjects(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  const myProjects = projects.filter(p => p.role === 'ADMIN');
  const displayed = filter === 'mine' ? myProjects : projects;

  return (
    <div>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16, borderBottom: 'var(--b) solid var(--line)', marginBottom: 0 }}>
        <div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.12em', textTransform: 'uppercase' }}>WORKSPACE / ETHARA</div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em' }}>Projects</div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {[
            { key:'all', label:`All · ${projects.length}` },
            { key:'mine', label:`Mine · ${myProjects.length}` },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className="mono" style={{ fontSize:11, padding:'5px 12px', border:'var(--b) solid var(--line)', borderRadius:999, background: filter===f.key?'var(--ink)':'var(--paper)', color:filter===f.key?'var(--paper)':'var(--ink-3)', cursor:'pointer' }}>
              {f.label}
            </button>
          ))}
          <span className="mono" style={{ fontSize:11, padding:'5px 12px', border:'var(--b) solid rgba(21,21,26,0.3)', borderRadius:999, color:'var(--ink-3)' }}>Sort: role ↓</span>
          <button id="new-project-btn" className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New project</button>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 60 }}>
          <div className="empty-state-icon">📁</div>
          <h3>No projects yet</h3>
          <p>Create your first project to get started.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowCreate(true)}>+ New project</button>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          {/* Table header */}
          <div className="mono" style={{ display:'flex', alignItems:'center', padding:'10px 0', borderBottom:'var(--b) solid var(--line)', fontSize:10, color:'var(--ink-3)', letterSpacing:'.1em', textTransform:'uppercase', gap:0 }}>
            <div style={{ width:120 }}>Code</div>
            <div style={{ flex: 1 }}>Name</div>
            <div style={{ width:180 }}>Progress</div>
            <div style={{ width:80 }}>Tasks</div>
            <div style={{ width:110 }}>Status</div>
            <div style={{ width:100 }}>Team</div>
            <div style={{ width:70 }}>Role</div>
          </div>

          {displayed.map(p => {
            const taskCount = p._count?.tasks ?? 0;
            const memberCount = p._count?.members ?? 0;
            const lead = p.members?.[0]?.user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || '—';
            const st = getStatus(p);
            return (
              <div key={p.id} onClick={() => navigate(`/projects/${p.id}`)}
                style={{ display:'flex', alignItems:'center', padding:'14px 0', borderBottom:'1px solid rgba(21,21,26,0.1)', cursor:'pointer', gap:0 }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(21,21,26,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}
              >
                <div style={{ width:120 }}>
                  <div className="mono" style={{ fontSize:10, color:'var(--ink-3)' }}>
                    {p.name?.toUpperCase().slice(0,8).replace(/\s/g,'_')}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 2 }}>
                    {p.description ? p.description.slice(0, 40) + (p.description.length > 40 ? '…' : '') : 'No description'}
                  </div>
                </div>
                <div style={{ width: 180, paddingRight: 16 }}>
                  <div className="wf-bar" style={{ marginTop: 2 }}>
                    <i style={{ width: taskCount > 0 ? '40%' : '0%' }} />
                  </div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 4 }}>{taskCount} tasks</div>
                </div>
                <div className="mono" style={{ width:80, fontSize:12 }}>{taskCount}</div>
                <div style={{ width:110 }}>
                  <span className="mono" style={{ fontSize:10, color:st.color, border:'var(--b) solid currentColor', borderRadius:2, padding:'2px 6px', display:'inline-flex', alignItems:'center', gap:4 }}>
                    ● {st.label}
                  </span>
                </div>
                <div style={{ width:100 }}>
                  <div style={{ display:'flex', alignItems:'center' }}>
                    <div className="av">{lead}</div>
                    <span className="mono" style={{ marginLeft:6, fontSize:10, color:'var(--ink-3)' }}>+{memberCount}</span>
                  </div>
                </div>
                <div style={{ width:70 }}>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10, padding: '2px 6px',
                    border: 'var(--b) solid var(--line)',
                    borderRadius: 2,
                    background: p.role === 'ADMIN' ? 'var(--ink)' : 'transparent',
                    color: p.role === 'ADMIN' ? 'var(--paper)' : 'var(--ink)',
                    letterSpacing: '.05em'
                  }}>{p.role}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} onCreated={p => setProjects(prev => [p, ...prev])} />}
    </div>
  );
}
