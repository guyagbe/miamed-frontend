import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './Auth.module.css'

export function Login() {
  const { login }  = useAuth()
  const nav        = useNavigate()
  const [params]   = useSearchParams()
  const redirect   = params.get('redirect') || '/dashboard'

  const [form,  setForm]  = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [busy,  setBusy]  = useState(false)

  const handle = async (e) => {
    e.preventDefault(); setError(''); setBusy(true)
    try {
      await login(form.email, form.password)
      nav(redirect)
    } catch (err) {
      setError(err.message || 'Invalid email or password')
    } finally { setBusy(false) }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <Link to="/" className={styles.logo}>Mia<span>Med</span></Link>
        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.sub}>Sign in to your MiaMed account</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handle}>
          <div className="form-group">
            <label>Email</label>
            <input className="form-control" type="email" placeholder="you@email.com"
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input className="form-control" type="password" placeholder="••••••••"
              value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
          </div>
          <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 8 }}
            type="submit" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in →'}
          </button>
        </form>

        <div className={styles.demoBox}>
          <div className={styles.demoTitle}>Demo credentials</div>
          <button className={styles.demoBtn} onClick={() => setForm({ email: 'patient@miamed.com', password: 'Password123!' })}>
            Patient account
          </button>
          <button className={styles.demoBtn} onClick={() => setForm({ email: 'maria.rodriguez@miamed.com', password: 'Password123!' })}>
            Doctor account
          </button>
        </div>

        <p className={styles.switch}>
          Don't have an account? <Link to="/register">Sign up free</Link>
        </p>
      </div>
    </div>
  )
}

export function Register() {
  const { register } = useAuth()
  const nav          = useNavigate()

  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', password: '', phone: ''
  })
  const [error, setError] = useState('')
  const [busy,  setBusy]  = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handle = async (e) => {
    e.preventDefault(); setError(''); setBusy(true)
    try {
      await register(form)
      nav('/dashboard')
    } catch (err) {
      setError(err.message || 'Registration failed')
    } finally { setBusy(false) }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <Link to="/" className={styles.logo}>Mia<span>Med</span></Link>
        <h1 className={styles.title}>Create your account</h1>
        <p className={styles.sub}>Book appointments with Miami's best doctors</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handle}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
            <div className="form-group">
              <label>First name</label>
              <input className="form-control" placeholder="John"
                value={form.first_name} onChange={e => set('first_name', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Last name</label>
              <input className="form-control" placeholder="Doe"
                value={form.last_name} onChange={e => set('last_name', e.target.value)} required />
            </div>
          </div>
          <div className="form-group">
            <label>Email</label>
            <input className="form-control" type="email" placeholder="you@email.com"
              value={form.email} onChange={e => set('email', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Phone (optional)</label>
            <input className="form-control" type="tel" placeholder="305-555-0100"
              value={form.phone} onChange={e => set('phone', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input className="form-control" type="password" placeholder="Min. 8 characters"
              value={form.password} onChange={e => set('password', e.target.value)} required minLength={8} />
          </div>
          <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 8 }}
            type="submit" disabled={busy}>
            {busy ? 'Creating account…' : 'Create account →'}
          </button>
        </form>

        <p className={styles.switch}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
