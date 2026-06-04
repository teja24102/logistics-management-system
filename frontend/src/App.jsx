import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import Login            from './pages/Login.jsx'
import ManagerApp       from './pages/manager/ManagerApp.jsx'
import DriverApp        from './pages/driver/DriverApp.jsx'

function Root() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={user.role === 'manager' ? '/manager' : '/driver'} replace />
}

function RequireRole({ role, children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) return <Navigate to={user.role === 'manager' ? '/manager' : '/driver'} replace />
  return children
}

function GuestOnly({ children }) {
  const { user } = useAuth()
  if (user) return <Navigate to={user.role === 'manager' ? '/manager' : '/driver'} replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"       element={<Root />} />
          <Route path="/login"  element={<GuestOnly><Login /></GuestOnly>} />
          <Route path="/manager/*" element={<RequireRole role="manager"><ManagerApp /></RequireRole>} />
          <Route path="/driver"    element={<RequireRole role="driver"><DriverApp /></RequireRole>} />
          <Route path="*"       element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
