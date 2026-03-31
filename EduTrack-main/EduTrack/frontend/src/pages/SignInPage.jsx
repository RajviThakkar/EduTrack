import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
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

  const role = searchParams.get('role')
  const selectedRole = ROLE_OPTIONS.some((item) => item.key === role) ? role : 'student'
  const roleLabel = selectedRole === 'faculty' ? 'Faculty' : selectedRole === 'admin' ? 'Admin' : 'Student'

  const handleRoleChange = (nextRole) => {
    setSearchParams({ role: nextRole })
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!email || !password) return
    if (selectedRole === 'admin') {
      localStorage.setItem('edutrack_admin_profile', JSON.stringify({ name: email.split('@')[0] }))
    }
    navigate(`/${selectedRole}/dashboard`)
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
              className={`rounded-lg px-2 py-2 text-sm font-medium transition ${
                selectedRole === option.key
                  ? 'bg-edu-teal text-white'
                  : 'border border-edu-blue/20 bg-edu-bg text-edu-navy hover:border-edu-teal'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium text-edu-navy">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-edu-blue/20 px-3 py-2 text-sm outline-none transition focus:border-edu-teal focus:ring-2 focus:ring-edu-teal/25"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-edu-navy">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
              className="w-full rounded-lg border border-edu-blue/20 px-3 py-2 text-sm outline-none transition focus:border-edu-teal focus:ring-2 focus:ring-edu-teal/25"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-lg bg-edu-teal px-4 py-2.5 text-sm font-medium text-white transition hover:bg-edu-blue"
          >
            Sign In
          </button>
        </form>

        <p className="mt-4 text-sm text-edu-blue">
          New user?{' '}
          <Link to={`/${selectedRole}/signup`} className="font-semibold text-edu-navy hover:underline">
            Sign Up
          </Link>
        </p>
        <Link to="/" className="mt-2 inline-block text-sm font-medium text-edu-navy hover:underline">
          Back to Landing
        </Link>
      </section>
    </div>
  )
}

export default SignInPage