import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const isOverdue = (d, status) => d && new Date(d) < new Date() && status !== 'DONE';

function CreateTaskModal({ projectId, members, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: '', description: '', priority: 'MEDIUM', status: 'TODO', dueDate: '', assigneeId: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...form,
        projectId,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
        assigneeId: form.assigneeId || null,
      };
      const res = await api.post('/tasks', payload);
      onCreated(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create Task</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input id="task-title" className="form-input" placeholder="Task title"
              value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea id="task-desc" className="form-textarea" placeholder="Describe the task…"
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select id="task-priority" className="form-select" value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select id="task-status" className="form-select" value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Assignee</label>
            <select id="task-assignee" className="form-select" value={form.assigneeId}
              onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}>
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.user.id} value={m.user.id}>{m.user.name} ({m.role})</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input id="task-due" type="date" className="form-input"
              value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button id="create-task-submit" type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating…' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InviteMemberModal({ projectId, onClose, onInvited }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post(`/projects/${projectId}/members`, { email, role });
      onInvited(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to invite member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Invite Member</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input id="invite-email" type="email" className="form-input" placeholder="colleague@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select id="invite-role" className="form-select" value={role}
              onChange={(e) => setRole(e.target.value)}>
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button id="invite-submit" type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Inviting…' : 'Invite'}
            </button>
          </div>
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
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [activeTab, setActiveTab] = useState('tasks');

  useEffect(() => {
    api.get(`/projects/${id}`)
      .then((r) => { setProject(r.data); setLoading(false); })
      .catch(() => navigate('/projects'));
  }, [id]);

  const isAdmin = project?.role === 'ADMIN';

  const handleDelete = async () => {
    if (!window.confirm('Delete this project? This cannot be undone.')) return;
    await api.delete(`/projects/${id}`);
    navigate('/projects');
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    await api.delete(`/projects/${id}/members/${userId}`);
    setProject((p) => ({ ...p, members: p.members.filter((m) => m.user.id !== userId) }));
  };

  const handleStatusChange = async (taskId, status) => {
    try {
      const res = await api.patch(`/tasks/${taskId}`, { status });
      setProject((p) => ({ ...p, tasks: p.tasks.map((t) => t.id === taskId ? res.data : t) }));
    } catch {}
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!project) return null;

  const filteredTasks = (project.tasks || []).filter((t) => !statusFilter || t.status === statusFilter);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <button onClick={() => navigate('/projects')}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            ← Back to Projects
          </button>
          <h1 className="page-title">{project.name}</h1>
          {project.description && <p className="page-subtitle">{project.description}</p>}
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          {isAdmin && (
            <>
              <button id="invite-member-btn" className="btn btn-secondary btn-sm" onClick={() => setShowInvite(true)}>
                + Invite
              </button>
              <button id="delete-project-btn" className="btn btn-danger btn-sm" onClick={handleDelete}>
                Delete
              </button>
            </>
          )}
          <button id="create-task-btn" className="btn btn-primary btn-sm" onClick={() => setShowCreateTask(true)}>
            + New Task
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--bg-card)', padding: 4, borderRadius: 10, width: 'fit-content', border: '1px solid var(--border)' }}>
        {['tasks', 'members'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{
              padding: '7px 18px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
              background: activeTab === tab ? 'var(--accent)' : 'none',
              color: activeTab === tab ? 'white' : 'var(--text-secondary)',
            }}>
            {tab === 'tasks' ? `Tasks (${project.tasks?.length ?? 0})` : `Members (${project.members?.length ?? 0})`}
          </button>
        ))}
      </div>

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <>
          <div className="filters">
            <select id="status-filter" className="filter-select" value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
            </select>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
            </span>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📝</div>
              <h3>No tasks {statusFilter ? 'with this status' : 'yet'}</h3>
              <p>Click "+ New Task" to add one</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredTasks.map((t) => (
                <div key={t.id} className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 15, fontWeight: 600 }}>{t.title}</span>
                      <StatusBadge status={t.status} />
                      <PriorityBadge priority={t.priority} />
                      {isOverdue(t.dueDate, t.status) && <span className="badge badge-overdue">Overdue</span>}
                    </div>
                    {t.description && (
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.5 }}>
                        {t.description}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-muted)' }}>
                      {t.assignee && <span>👤 {t.assignee.name}</span>}
                      {t.dueDate && (
                        <span style={{ color: isOverdue(t.dueDate, t.status) ? 'var(--red)' : 'inherit' }}>
                          📅 {formatDate(t.dueDate)}
                        </span>
                      )}
                      <span>Created by {t.creator?.name}</span>
                    </div>
                  </div>
                  <select className="filter-select" style={{ fontSize: 12, padding: '5px 8px', flexShrink: 0 }}
                    value={t.status} onChange={(e) => handleStatusChange(t.id, e.target.value)}>
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="card" style={{ maxWidth: 520 }}>
          {(project.members || []).map((m) => (
            <div key={m.id} className="member-item">
              <div className="member-avatar">{m.user.name?.slice(0, 2).toUpperCase()}</div>
              <div className="member-info">
                <div className="member-name">{m.user.name}</div>
                <div className="member-email">{m.user.email}</div>
              </div>
              <span className={`badge ${m.role === 'ADMIN' ? 'badge-admin' : 'badge-member'}`}>{m.role}</span>
              {isAdmin && m.user.id !== user.id && (
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }}
                  onClick={() => handleRemoveMember(m.user.id)} title="Remove member">✕</button>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreateTask && (
        <CreateTaskModal
          projectId={id}
          members={project.members || []}
          onClose={() => setShowCreateTask(false)}
          onCreated={(task) => setProject((p) => ({ ...p, tasks: [task, ...(p.tasks || [])] }))}
        />
      )}
      {showInvite && (
        <InviteMemberModal
          projectId={id}
          onClose={() => setShowInvite(false)}
          onInvited={(m) => setProject((p) => ({ ...p, members: [...(p.members || []), m] }))}
        />
      )}
    </div>
  );
}
