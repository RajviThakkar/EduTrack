import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'

function SignUpPage({ role = 'student' }) {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const roleLabel = role === 'faculty' ? 'Faculty' : role === 'counsellor' ? 'Counsellor' : 'Student'

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!fullName || !email || !password || !confirmPassword) return
    if (role === 'counsellor') {
      localStorage.setItem('edutrack_counsellor_profile', JSON.stringify({ name: fullName }))
    }
    navigate(`/${role}/login`)
  }

  return (
    <div className="mx-auto max-w-md py-4 sm:py-10">
      <section className="rounded-soft bg-white p-6 shadow-soft sm:p-7">
        <BrandLogo className="mx-auto" imageClassName="mx-auto h-24 w-auto" priority />
        <h1 className="text-2xl font-bold text-edu-navy">{roleLabel} Sign Up</h1>
        <p className="mt-1 text-sm text-edu-blue">Create a demo account (no real authentication).</p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium text-edu-navy">Full Name</span>
            <input
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Enter full name"
              className="w-full rounded-lg border border-edu-blue/20 px-3 py-2 text-sm outline-none transition focus:border-edu-teal focus:ring-2 focus:ring-edu-teal/25"
            />
          </label>

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
              placeholder="Create password"
              className="w-full rounded-lg border border-edu-blue/20 px-3 py-2 text-sm outline-none transition focus:border-edu-teal focus:ring-2 focus:ring-edu-teal/25"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-edu-navy">Confirm Password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Re-enter password"
              className="w-full rounded-lg border border-edu-blue/20 px-3 py-2 text-sm outline-none transition focus:border-edu-teal focus:ring-2 focus:ring-edu-teal/25"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-lg bg-edu-teal px-4 py-2.5 text-sm font-medium text-white transition hover:bg-edu-blue"
          >
            Sign Up
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