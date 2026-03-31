import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api/api'
import BrandLogo from '../components/BrandLogo'

const ROLE_OPTIONS = [
  { key: 'student', label: 'Student' },
  { key: 'faculty', label: 'Faculty' },
  { key: 'admin', label: 'Admin' },
]

function SignInPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const role = searchParams.get('role')
  const selectedRole = ROLE_OPTIONS.some((item) => item.key === role) ? role : 'student'
  const roleLabel = selectedRole === 'faculty' ? 'Faculty' : selectedRole === 'admin' ? 'Admin' : 'Student'

  const handleRoleChange = (nextRole) => {
    setSearchParams({ role: nextRole })
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!email || !password) {
      setError('Email and password are required')
      return
    }

    setError('')
    setLoading(true)

    try {
      const response = await api.post('/api/auth/login', {
        email: email.toLowerCase().trim(),
        password,
      })

      const { token, user } = response.data

      // Verify the user's role matches selected role
      if (user.role !== selectedRole) {
        setError(`This account is registered as ${user.role}, not ${selectedRole}. Please switch roles.`)
        setLoading(false)
        return
      }

      // Store token and user info
      localStorage.setItem('edutrack_token', token)
      localStorage.setItem('edutrack_user', JSON.stringify(user))
      localStorage.setItem('edutrack_role', user.role)

      // Redirect to dashboard (admin uses /admin routes)
      navigate(`/${user.role}/dashboard`)
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Login failed. Please try again.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md py-4 sm:py-10">
      <section className="rounded-soft bg-white p-6 shadow-soft sm:p-7">
        <BrandLogo className="mx-auto" imageClassName="mx-auto h-24 w-auto" priority />
        <h1 className="text-2xl font-bold text-edu-navy">Sign In</h1>
        <p className="mt-1 text-sm text-edu-blue">Selected role: {roleLabel}</p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {ROLE_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => handleRoleChange(option.key)}
              className={`rounded-lg px-2 py-2 text-sm font-medium transition ${selectedRole === option.key
                ? 'bg-edu-teal text-white'
                : 'border border-edu-blue/20 bg-edu-bg text-edu-navy hover:border-edu-teal'
                }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium text-edu-navy">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                setError('')
              }}
              placeholder="you@example.com"
              disabled={loading}
              className="w-full rounded-lg border border-edu-blue/20 px-3 py-2 text-sm outline-none transition focus:border-edu-teal focus:ring-2 focus:ring-edu-teal/25 disabled:bg-gray-100"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-edu-navy">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                setError('')
              }}
              placeholder="Enter password"
              disabled={loading}
              className="w-full rounded-lg border border-edu-blue/20 px-3 py-2 text-sm outline-none transition focus:border-edu-teal focus:ring-2 focus:ring-edu-teal/25 disabled:bg-gray-100"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-edu-teal px-4 py-2.5 text-sm font-medium text-white transition hover:bg-edu-blue disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-xs text-edu-blue">Demo Credentials:</p>
          <p className="text-xs text-gray-600">
            {selectedRole === 'faculty' && 'Faculty: RAJVII@GMAIL.COM / RAJVII123'}
            {selectedRole === 'student' && 'Student: 12402130503007@gcet.ac.in / 12402130503007@123'}
            {selectedRole === 'admin' && 'Admin: RAJVEE@gmail.com / RAJVEE123'}
          </p>
        </div>

        <p className="mt-4 text-sm text-edu-blue">
          New user?{' '}
          <Link to={`/${selectedRole}/signup`} className="font-semibold text-edu-navy hover:underline">
            Sign Up
          </Link>
        </p>
      </section>
    </div>
  )
}

export default SignInPage