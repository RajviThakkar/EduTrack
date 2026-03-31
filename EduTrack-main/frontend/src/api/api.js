import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:5000',
})

// Add JWT token to all requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('edutrack_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
