import axios from 'axios'

export const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('lms_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  // Always add trailing slash to prevent 307 redirects
  if (cfg.url && !cfg.url.endsWith('/') && !cfg.url.includes('?')) {
    cfg.url = cfg.url + '/'
  }
  return cfg
})

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('lms_token')
      localStorage.removeItem('lms_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)
