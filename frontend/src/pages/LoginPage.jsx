import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--paper)' }}>
      {/* Left — brand panel */}
      <div style={{
        flex: 1, borderRight: 'var(--b) solid var(--line)',
        padding: 40, display: 'flex', flexDirection: 'column',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 14, height: 14, background: 'var(--ink)', borderRadius: 2 }} />
          <span className="mono" style={{ fontWeight: 600, fontSize: 12, letterSpacing: '.1em' }}>ETHARA / TRACKER</span>
        </div>

        <div style={{ marginTop: 80 }}>
          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 12 }}>Plan · execute · ship</div>
          <div style={{ fontSize: 48, fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.02em', maxWidth: 420 }}>
            One quiet place<br/>for projects,<br/>tasks &amp; teams.
          </div>
          <div style={{ marginTop: 24, color: 'var(--ink-2)', maxWidth: 360, fontSize: 13, lineHeight: 1.6 }}>
            Role-based workspaces. No noise. No bloat. Just the work, and who's doing it.
          </div>
        </div>

        {/* decorative hatch block */}
        <div style={{
          position: 'absolute', right: 40, bottom: 40,
          width: 240, height: 160,
          border: 'var(--b) solid var(--line)',
          backgroundImage: 'repeating-linear-gradient(45deg, var(--ink) 0 1px, transparent 1px 7px)',
          opacity: 0.08
        }} />
        <div style={{
          position: 'absolute', right: 56, bottom: 56,
          width: 208, height: 128,
          border: 'var(--b) dashed var(--line)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--paper)', color: 'var(--ink-3)',
          fontSize: 11, fontFamily: "'JetBrains Mono', monospace"
        }}>[ illustration ]</div>
      </div>

      {/* Right — form */}
      <div style={{ width: 420, padding: '56px 48px', display: 'flex', flexDirection: 'column', gap: 32 }}>
        {/* Tab switch */}
        <div style={{ display: 'flex', gap: 24, borderBottom: 'var(--b) solid var(--line)' }}>
          <div style={{ paddingBottom: 10, borderBottom: '2px solid var(--ink)', fontWeight: 700, fontSize: 13 }}>Log in</div>
          <Link to="/signup" style={{ paddingBottom: 10, color: 'var(--ink-3)', fontSize: 13 }}>Sign up</Link>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {error && <div className="alert alert-error">{error}</div>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.12em', textTransform: 'uppercase' }}>Email</div>
            <input
              id="email" type="email" required
              value={form.email} onChange={e => setForm({...form, email: e.target.value})}
              placeholder="you@example.com"
              style={{ background: 'none', border: 'none', borderBottom: 'var(--b) solid var(--line)', outline: 'none', padding: '6px 0', fontSize: 13, fontFamily: "'JetBrains Mono', monospace", color: 'var(--ink)', width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.12em', textTransform: 'uppercase' }}>Password</div>
            <input
              id="password" type="password" required
              value={form.password} onChange={e => setForm({...form, password: e.target.value})}
              placeholder="••••••••"
              style={{ background: 'none', border: 'none', borderBottom: 'var(--b) solid var(--line)', outline: 'none', padding: '6px 0', fontSize: 13, fontFamily: "'JetBrains Mono', monospace", color: 'var(--ink)', width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button id="login-submit" type="submit" disabled={loading}
              style={{ width: '100%', padding: 14, fontSize: 13, fontWeight: 600, background: 'var(--ink)', color: 'var(--paper)', border: 'var(--b) solid var(--ink)', borderRadius: 'var(--radius)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {loading ? 'Signing in…' : 'Log in →'}
            </button>
          </div>
        </form>

        <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
          New here? <Link to="/signup" style={{ color: 'var(--ink)', textDecoration: 'underline' }}>Create a workspace</Link>
        </div>
      </div>
    </div>
  );
}
