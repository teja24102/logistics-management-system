import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 4 + 2,
  duration: Math.random() * 10 + 8,
  delay: Math.random() * 5,
}))

const STATS = [
  { value: '2.4M+', label: 'Deliveries' },
  { value: '98.2%', label: 'On-time rate' },
  { value: '500+',  label: 'Drivers' },
  { value: '15',    label: 'States covered' },
]

const DEMOS = [
  { role: 'MANAGER', email: 'manager@lms.com', pass: 'manager123',
    icon: '🏢', color: '#6366f1', desc: 'Full warehouse & dispatch control' },
  { role: 'DRIVER',  email: 'deepak@lms.com',  pass: 'driver123',
    icon: '🚚', color: '#22d3ee', desc: 'View & accept delivery requests' },
  { role: 'DRIVER 2',email: 'suresh@lms.com',  pass: 'driver123',
    icon: '🚛', color: '#34d399', desc: 'Mumbai-based driver account' },
]

export default function Login() {
  const { login } = useAuth()
  const [email,   setEmail]   = useState('')
  const [pass,    setPass]    = useState('')
  const [err,     setErr]     = useState('')
  const [busy,    setBusy]    = useState(false)
  const [tick,    setTick]    = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const id = setInterval(() => setTick(t => t + 1), 3000)
    return () => clearInterval(id)
  }, [])

  const doLogin = async (e, p) => {
    setErr(''); setBusy(true)
    try {
      const u = await login(e, p)
      window.location.replace(u.role === 'manager' ? '/manager' : '/driver')
    } catch (ex) {
      setErr(ex.message || 'Invalid credentials')
    } finally { setBusy(false) }
  }

  const rotating = ['Hyderabad', 'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad']

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', overflow: 'hidden', position: 'relative' }}>

      {/* Animated background particles */}
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0) scale(1);opacity:.3} 50%{transform:translateY(-40px) scale(1.2);opacity:.7} }
        @keyframes pulse-ring { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(2.5);opacity:0} }
        @keyframes slide-up { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fade-in { from{opacity:0} to{opacity:1} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes rotate-slow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes count-up { from{opacity:0;transform:scale(.5)} to{opacity:1;transform:scale(1)} }
        .particle { position:absolute; border-radius:50%; background:radial-gradient(circle,rgba(99,102,241,.8),transparent); pointer-events:none; }
        .glass { background:rgba(255,255,255,.03); backdrop-filter:blur(20px); border:1px solid rgba(255,255,255,.08); }
        .glow-btn { position:relative; overflow:hidden; transition:all .3s; }
        .glow-btn:hover { transform:translateY(-2px); box-shadow:0 20px 40px rgba(99,102,241,.4); }
        .glow-btn::before { content:''; position:absolute; inset:0; background:linear-gradient(45deg,transparent,rgba(255,255,255,.1),transparent); transform:translateX(-100%); transition:transform .5s; }
        .glow-btn:hover::before { transform:translateX(100%); }
        .demo-card { transition:all .25s; cursor:pointer; }
        .demo-card:hover { transform:translateX(6px); }
        .input-field { background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1); color:#fff; transition:all .3s; }
        .input-field:focus { outline:none; border-color:#6366f1; background:rgba(99,102,241,.1); box-shadow:0 0 0 3px rgba(99,102,241,.2); }
        .input-field::placeholder { color:rgba(255,255,255,.3); }
        .stat-card { animation:count-up .6s ease both; }
      `}</style>

      {PARTICLES.map(p => (
        <div key={p.id} className="particle" style={{
          left: `${p.x}%`, top: `${p.y}%`,
          width: p.size, height: p.size,
          animation: `float ${p.duration}s ${p.delay}s ease-in-out infinite`
        }}/>
      ))}

      {/* Gradient orbs */}
      <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,.15),transparent 70%)', pointerEvents: 'none' }}/>
      <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(34,211,238,.1),transparent 70%)', pointerEvents: 'none' }}/>

      {/* Left panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 80px', animation: mounted ? 'slide-up .8s ease' : 'none' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 60 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#6366f1,#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: '0 8px 32px rgba(99,102,241,.4)' }}>📦</div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-.5px' }}>LogisticsAI</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', letterSpacing: '.1em', textTransform: 'uppercase' }}>Warehouse Management System</div>
          </div>
        </div>

        {/* Hero text */}
        <div style={{ marginBottom: 50 }}>
          <div style={{ fontSize: 13, color: '#6366f1', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 16 }}>Delivering across India</div>
          <h1 style={{ fontSize: 52, fontWeight: 900, color: '#fff', lineHeight: 1.1, marginBottom: 20, letterSpacing: '-2px' }}>
            Smart Dispatch<br/>
            <span style={{ background: 'linear-gradient(135deg,#6366f1,#22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              For Modern
            </span><br/>
            Logistics
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,.5)', lineHeight: 1.7, maxWidth: 420 }}>
            AI-powered warehouse dispatch system with real-time tracking across all Indian states. From stock management to last-mile delivery.
          </p>
        </div>

        {/* Rotating city */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22d3ee', boxShadow: '0 0 12px #22d3ee', animation: 'float 2s ease-in-out infinite' }}/>
          <span style={{ fontSize: 14, color: 'rgba(255,255,255,.5)' }}>Now active in </span>
          <span key={tick} style={{ fontSize: 14, fontWeight: 700, color: '#22d3ee', animation: 'slide-up .5s ease' }}>
            {rotating[tick % rotating.length]}
          </span>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
          {STATS.map((s, i) => (
            <div key={s.label} className="glass stat-card" style={{ padding: '16px', borderRadius: 12, animationDelay: `${i * .1}s` }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - login form */}
      <div style={{ width: 480, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, animation: mounted ? 'fade-in .8s .3s ease both' : 'none' }}>
        <div className="glass" style={{ width: '100%', borderRadius: 24, padding: 40, boxShadow: '0 40px 80px rgba(0,0,0,.5)' }}>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Welcome back</h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,.4)' }}>Sign in to your logistics portal</p>
          </div>

          {err && (
            <div style={{ background: 'rgba(239,68,68,.15)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#fca5a5' }}>
              ⚠ {err}
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', fontWeight: 500, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.05em' }}>Email address</label>
            <input className="input-field" style={{ width: '100%', padding: '12px 16px', borderRadius: 10, fontSize: 14 }}
              type="email" placeholder="you@company.com"
              value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doLogin(email, pass)}/>
          </div>

          {/* Password */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', fontWeight: 500, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.05em' }}>Password</label>
            <input className="input-field" style={{ width: '100%', padding: '12px 16px', borderRadius: 10, fontSize: 14 }}
              type="password" placeholder="••••••••"
              value={pass} onChange={e => setPass(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doLogin(email, pass)}/>
          </div>

          {/* Sign in button */}
          <button className="glow-btn" disabled={busy}
            onClick={() => doLogin(email, pass)}
            style={{ width: '100%', padding: '14px 0', borderRadius: 12, border: 'none', background: busy ? '#4f46e5' : 'linear-gradient(135deg,#6366f1,#818cf8)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: busy ? 'wait' : 'pointer', marginBottom: 28 }}>
            {busy ? '⏳ Signing in…' : 'Sign in →'}
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.08)' }}/>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Quick demo</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.08)' }}/>
          </div>

          {/* Demo accounts */}
          {DEMOS.map(d => (
            <div key={d.email} className="demo-card glass"
              onClick={() => !busy && doLogin(d.email, d.pass)}
              style={{ padding: '12px 14px', borderRadius: 12, marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${d.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, border: `1px solid ${d.color}30` }}>{d.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: d.color, letterSpacing: '.06em' }}>{d.role}</span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,.25)', marginLeft: 'auto' }}>{d.email}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)' }}>{d.desc}</div>
                </div>
                <span style={{ fontSize: 16, color: 'rgba(255,255,255,.2)' }}>›</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
