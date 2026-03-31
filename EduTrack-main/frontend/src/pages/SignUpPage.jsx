import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/api'
import BrandLogo from '../components/BrandLogo'

function SignUpPage({ role = 'student' }) {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const roleLabel = role === 'faculty' ? 'Faculty' : role === 'counsellor' ? 'Counsellor' : 'Student'

  // Students cannot self-register - only counsellors can add them
  if (role === 'student') {
    return (
      <div className="mx-auto max-w-md py-4 sm:py-10">
        <section className="rounded-soft bg-white p-6 shadow-soft sm:p-7">
          <BrandLogo className="mx-auto" imageClassName="mx-auto h-24 w-auto" priority />
          <h1 className="text-2xl font-bold text-edu-navy">Student Access</h1>
          <div className="mt-5 space-y-4 rounded-lg bg-blue-50 p-4 border border-blue-200">
            <p className="text-sm text-edu-navy font-medium">Students cannot self-register.</p>
            <p className="text-sm text-edu-blue">
              A counsellor must add you to the system first. Once added, you can log in with your credentials.
            </p>
            <p className="text-xs text-gray-600 mt-3">Contact your counsellor for registration.</p>
          </div>
          <Link to="/login?role=student" className="mt-6 block rounded-lg bg-edu-teal px-4 py-2.5 text-center text-sm font-medium text-white transition hover:bg-edu-blue">
            Go to Sign In
          </Link>
          <Link to="/" className="mt-2 block text-center text-sm font-medium text-edu-navy hover:underline">
            Back to Landing
          </Link>
        </section>
      </div>
    )
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!fullName || !email || !password || !confirmPassword) {
      setError('All fields are required')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setError('')
    setLoading(true)

    try {
      const response = await api.post('/api/auth/register', {
        name: fullName,
        email: email.toLowerCase().trim(),
        password,
        role,
      })

      const { token, user } = response.data

      // Store token and user info
      localStorage.setItem('edutrack_token', token)
      localStorage.setItem('edutrack_user', JSON.stringify(user))
      localStorage.setItem('edutrack_role', user.role)

      navigate(`/${user.role}/dashboard`)
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Registration failed. Please try again.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md py-4 sm:py-10">
      <section className="rounded-soft bg-white p-6 shadow-soft sm:p-7">
        <BrandLogo className="mx-auto" imageClassName="mx-auto h-24 w-auto" priority />
        <h1 className="text-2xl font-bold text-edu-navy">{roleLabel} Sign Up</h1>
        <p className="mt-1 text-sm text-edu-blue">Create your account</p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium text-edu-navy">Full Name</span>
            <input
              type="text"
              value={fullName}
              onChange={(event) => {
                setFullName(event.target.value)
                setError('')
              }}
              placeholder="Enter full name"
              disabled={loading}
              className="w-full rounded-lg border border-edu-blue/20 px-3 py-2 text-sm outline-none transition focus:border-edu-teal focus:ring-2 focus:ring-edu-teal/25 disabled:bg-gray-100"
            />
          </label>

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
              placeholder="Create password (min 6 characters)"
              disabled={loading}
              className="w-full rounded-lg border border-edu-blue/20 px-3 py-2 text-sm outline-none transition focus:border-edu-teal focus:ring-2 focus:ring-edu-teal/25 disabled:bg-gray-100"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-edu-navy">Confirm Password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value)
                setError('')
              }}
              placeholder="Re-enter password"
              disabled={loading}
              className="w-full rounded-lg border border-edu-blue/20 px-3 py-2 text-sm outline-none transition focus:border-edu-teal focus:ring-2 focus:ring-edu-teal/25 disabled:bg-gray-100"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-edu-teal px-4 py-2.5 text-sm font-medium text-white transition hover:bg-edu-blue disabled:opacity-60"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-4 text-sm text-edu-blue">
          Already have an account?{' '}
          <Link to={`/${role}/login`} className="font-semibold text-edu-navy hover:underline">
            Sign In
          </Link>
        </p>
        <Link to="/" className="mt-2 inline-block text-sm font-medium text-edu-navy hover:underline">
          Back to Landing
        </Link>
      </section>
    </div>
  )
}

export default SignUpPage