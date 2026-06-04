// Dark-theme UI components

export function Card({ children, title, action, style = {} }) {
  return (
    <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 16, padding: 20, ...style }}>
      {title && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.08em' }}>{title}</div>
          {action}
        </div>
      )}
      {children}
    </div>
  )
}

const BADGE = {
  pending:          { bg: 'rgba(148,163,184,.15)', c: '#94a3b8', border: 'rgba(148,163,184,.2)' },
  awaiting_driver:  { bg: 'rgba(251,191,36,.15)',  c: '#fbbf24', border: 'rgba(251,191,36,.2)'  },
  accepted:         { bg: 'rgba(99,102,241,.15)',   c: '#818cf8', border: 'rgba(99,102,241,.2)'  },
  in_transit:       { bg: 'rgba(168,85,247,.15)',   c: '#c084fc', border: 'rgba(168,85,247,.2)'  },
  delivered:        { bg: 'rgba(52,211,153,.15)',   c: '#34d399', border: 'rgba(52,211,153,.2)'  },
  cancelled:        { bg: 'rgba(239,68,68,.15)',    c: '#f87171', border: 'rgba(239,68,68,.2)'   },
  normal:           { bg: 'rgba(148,163,184,.1)',   c: '#94a3b8', border: 'rgba(148,163,184,.15)'},
  high:             { bg: 'rgba(251,191,36,.1)',    c: '#fbbf24', border: 'rgba(251,191,36,.15)' },
  urgent:           { bg: 'rgba(239,68,68,.1)',     c: '#f87171', border: 'rgba(239,68,68,.15)'  },
  available:        { bg: 'rgba(52,211,153,.1)',    c: '#34d399', border: 'rgba(52,211,153,.15)' },
  busy:             { bg: 'rgba(251,191,36,.1)',    c: '#fbbf24', border: 'rgba(251,191,36,.15)' },
}

export function Badge({ label, text }) {
  const k = (label || '').toLowerCase().replace(/ /g, '_')
  const s = BADGE[k] || BADGE.normal
  return (
    <span style={{ display: 'inline-block', padding: '2px 9px', borderRadius: 99, fontSize: 11, fontWeight: 500, background: s.bg, color: s.c, border: `1px solid ${s.border}` }}>
      {text || label}
    </span>
  )
}

export function Btn({ children, onClick, color = '#6366f1', outline = false, disabled = false, size = 'md', full = false, style = {} }) {
  const pad = size === 'sm' ? '6px 14px' : size === 'lg' ? '14px 28px' : '9px 18px'
  const fs  = size === 'sm' ? 12 : size === 'lg' ? 15 : 13
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: pad, borderRadius: 9, border: outline ? `1px solid ${color}` : 'none',
      background: disabled ? 'rgba(255,255,255,.08)' : outline ? 'transparent' : `linear-gradient(135deg,${color},${color}dd)`,
      color: disabled ? 'rgba(255,255,255,.3)' : outline ? color : '#fff',
      fontSize: fs, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'inline-flex', alignItems: 'center', gap: 6,
      width: full ? '100%' : 'auto', justifyContent: full ? 'center' : 'flex-start',
      boxShadow: (!outline && !disabled) ? `0 4px 16px ${color}40` : 'none',
      transition: 'all .2s', ...style
    }}>
      {children}
    </button>
  )
}

export function StatCard({ label, value, color = '#6366f1', sub, icon }) {
  return (
    <div style={{ background: 'rgba(255,255,255,.03)', border: `1px solid ${color}20`, borderRadius: 16, padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, borderRadius: '50%', background: `radial-gradient(circle,${color}20,transparent)`, transform: 'translate(20px,-20px)' }}/>
      {icon && <div style={{ fontSize: 24, marginBottom: 10 }}>{icon}</div>}
      <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)' }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color, marginTop: 4, fontWeight: 500 }}>{sub}</div>}
    </div>
  )
}

export function Alert({ type = 'warn', children }) {
  const s = {
    warn:  { bg: 'rgba(251,191,36,.1)',  border: 'rgba(251,191,36,.25)',  c: '#fbbf24' },
    error: { bg: 'rgba(239,68,68,.1)',   border: 'rgba(239,68,68,.25)',   c: '#f87171' },
    info:  { bg: 'rgba(99,102,241,.1)',  border: 'rgba(99,102,241,.25)',  c: '#818cf8' },
    ok:    { bg: 'rgba(52,211,153,.1)',  border: 'rgba(52,211,153,.25)',  c: '#34d399' },
  }[type] || {}
  return (
    <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: '10px 14px', fontSize: 13, color: s.c, marginBottom: 12 }}>
      {children}
    </div>
  )
}

export function Empty({ text = 'Nothing here', icon = '📭' }) {
  return (
    <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,.2)', fontSize: 13 }}>
      <div style={{ fontSize: 32, marginBottom: 10 }}>{icon}</div>
      {text}
    </div>
  )
}

export function PageHeader({ title, sub, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,.06)' }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{title}</h1>
        {sub && <p style={{ fontSize: 13, color: 'rgba(255,255,255,.4)' }}>{sub}</p>}
      </div>
      {action}
    </div>
  )
}
