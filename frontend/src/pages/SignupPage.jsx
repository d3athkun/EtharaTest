import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SignupPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await signup(form.name, form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--paper)' }}>
      {/* Left — brand */}
      <div style={{
        flex: 1, borderRight: 'var(--b) solid var(--line)',
        padding: 40, display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 14, height: 14, background: 'var(--ink)', borderRadius: 2 }} />
          <span className="mono" style={{ fontWeight: 600, fontSize: 12, letterSpacing: '.1em' }}>ETHARA / TRACKER</span>
        </div>
        <div style={{ marginTop: 80 }}>
          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 12 }}>Plan · execute · ship</div>
          <div style={{ fontSize: 48, fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.02em', maxWidth: 420 }}>
            Start your<br/>workspace.<br/>Ship faster.
          </div>
          <div style={{ marginTop: 24, color: 'var(--ink-2)', maxWidth: 360, fontSize: 13, lineHeight: 1.6 }}>
            Invite your team, assign roles, and track every task from backlog to done.
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div style={{ width: 420, padding: '56px 48px', display: 'flex', flexDirection: 'column', gap: 32 }}>
        <div style={{ display: 'flex', gap: 24, borderBottom: 'var(--b) solid var(--line)' }}>
          <Link to="/login" style={{ paddingBottom: 10, color: 'var(--ink-3)', fontSize: 13 }}>Log in</Link>
          <div style={{ paddingBottom: 10, borderBottom: '2px solid var(--ink)', fontWeight: 700, fontSize: 13 }}>Sign up</div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {error && <div className="alert alert-error">{error}</div>}

          {[
            { id: 'name', label: 'Full name', type: 'text', placeholder: 'Anya Shen', key: 'name' },
            { id: 'email', label: 'Work email', type: 'email', placeholder: 'anya@example.com', key: 'email' },
            { id: 'password', label: 'Password', type: 'password', placeholder: '••••••••', key: 'password' },
          ].map(f => (
            <div key={f.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.12em', textTransform: 'uppercase' }}>{f.label}</div>
              <input
                id={f.id} type={f.type} required
                value={form[f.key]} onChange={e => setForm({...form, [f.key]: e.target.value})}
                placeholder={f.placeholder}
                style={{ background: 'none', border: 'none', borderBottom: 'var(--b) solid var(--line)', outline: 'none', padding: '6px 0', fontSize: 13, fontFamily: "'JetBrains Mono', monospace", color: 'var(--ink)', width: '100%' }}
              />
            </div>
          ))}

          <button id="signup-submit" type="submit" disabled={loading}
            style={{ width: '100%', padding: 14, fontSize: 13, fontWeight: 600, background: 'var(--ink)', color: 'var(--paper)', border: 'var(--b) solid var(--ink)', borderRadius: 'var(--radius)', cursor: 'pointer' }}>
            {loading ? 'Creating…' : 'Create workspace →'}
          </button>
        </form>

        <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--ink)', textDecoration: 'underline' }}>Log in</Link>
        </div>
      </div>
    </div>
  );
}
