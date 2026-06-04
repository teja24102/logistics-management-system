import { createContext, useContext, useState } from 'react'

const Ctx = createContext(null)

function readStored() {
  try {
    const token = localStorage.getItem('lms_token')
    const user  = localStorage.getItem('lms_user')
    if (token && user) return JSON.parse(user)
  } catch {}
  return null
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStored())

  const login = async (email, password) => {
    const form = new URLSearchParams()
    form.append('username', email)
    form.append('password', password)

    const res = await fetch('/api/auth/login/', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    form.toString()
    })

    if (!res.ok) {
      const e = await res.json().catch(() => ({}))
      throw new Error(e.detail || 'Invalid email or password')
    }

    const data = await res.json()
    const u = { id: data.user_id, name: data.name, role: data.role, email }

    localStorage.setItem('lms_token', data.access_token)
    localStorage.setItem('lms_user',  JSON.stringify(u))
    setUser(u)
    return u
  }

  const logout = () => {
    localStorage.removeItem('lms_token')
    localStorage.removeItem('lms_user')
    setUser(null)
  }

  return <Ctx.Provider value={{ user, login, logout }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
