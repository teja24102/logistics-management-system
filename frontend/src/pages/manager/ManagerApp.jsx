import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import Dashboard    from './Dashboard.jsx'
import Inventory    from './Inventory.jsx'
import NewDispatch  from './NewDispatch.jsx'
import Tracking     from './Tracking.jsx'
import Analytics    from './Analytics.jsx'
import { LayoutDashboard, Package, PlusCircle, Map, BarChart2, LogOut, Truck } from 'lucide-react'

const NAV = [
  { to: '/manager',           icon: LayoutDashboard, label: 'Dashboard',    exact: true },
  { to: '/manager/inventory', icon: Package,          label: 'Inventory'    },
  { to: '/manager/dispatch',  icon: PlusCircle,       label: 'New Dispatch' },
  { to: '/manager/tracking',  icon: Map,              label: 'Live Tracking'},
  { to: '/manager/analytics', icon: BarChart2,        label: 'Analytics'    },
]

export default function ManagerApp() {
  const { user, logout } = useAuth()
  const nav = useNavigate()

  const handleLogout = () => { logout(); nav('/login') }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0f172a' }}>
      <style>{`
        .nav-link { display:flex; align-items:center; gap:10px; padding:10px 14px; border-radius:10px; text-decoration:none; font-size:13px; color:rgba(255,255,255,.5); transition:all .2s; margin-bottom:2px; }
        .nav-link:hover { background:rgba(255,255,255,.06); color:rgba(255,255,255,.8); }
        .nav-link.active { background:linear-gradient(135deg,rgba(99,102,241,.3),rgba(99,102,241,.1)); color:#a5b4fc; font-weight:600; border:1px solid rgba(99,102,241,.3); }
      `}</style>

      {/* Sidebar */}
      <aside style={{ width: 230, background: 'rgba(255,255,255,.02)', borderRight: '1px solid rgba(255,255,255,.06)', display: 'flex', flexDirection: 'column', padding: '0 12px' }}>
        <div style={{ padding: '22px 8px 20px', borderBottom: '1px solid rgba(255,255,255,.06)', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📦</div>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>LogisticsAI</div>
              <div style={{ color: 'rgba(255,255,255,.3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.06em' }}>Manager Portal</div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1 }}>
          {NAV.map(({ to, icon: Icon, label, exact }) => (
            <NavLink key={to} to={to} end={exact} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <Icon size={16}/>{label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '12px 0', borderTop: '1px solid rgba(255,255,255,.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px', borderRadius: 10, marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>
              {user?.name?.charAt(0)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: '#fff', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', textTransform: 'uppercase' }}>Manager</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,.08)', background: 'transparent', color: 'rgba(255,255,255,.4)', fontSize: 12, cursor: 'pointer' }}>
            <LogOut size={13}/> Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', background: '#0f172a' }}>
        <Routes>
          <Route index           element={<Dashboard />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="dispatch"  element={<NewDispatch />} />
          <Route path="tracking"  element={<Tracking />} />
          <Route path="analytics" element={<Analytics />} />
        </Routes>
      </main>
    </div>
  )
}
