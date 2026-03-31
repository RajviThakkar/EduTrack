import { useState } from 'react'
import { Link } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'

const roles = [
  {
    key: 'student',
    title: 'Student',
    description: 'Track attendance, monitor performance, and predict CGPA quickly.',
    bg: 'from-edu-teal to-edu-mint',
  },
  {
    key: 'faculty',
    title: 'Faculty',
    description: 'Analyze class trends, identify at-risk students, and monitor risk predictions.',
    bg: 'from-edu-navy to-edu-blue',
  },
  {
    key: 'counsellor',
    title: 'Counsellor',
    description: 'Add students, manage counsellor assignments, and support at-risk learners.',
    bg: 'from-edu-blue to-edu-teal',
  },
]

function LandingPage() {
  const [selectedRole, setSelectedRole] = useState('student')
  const activeRole = roles.find((role) => role.key === selectedRole) || roles[0]

  return (
    <div className="mx-auto flex min-h-[80vh] w-full max-w-6xl items-center justify-center py-4 sm:py-8">
      <section className="w-full max-w-4xl rounded-soft bg-white p-6 shadow-soft sm:p-8">
        <BrandLogo className="mx-auto" imageClassName="mx-auto h-24 w-auto" priority />
        <h1 className="mt-3 text-3xl font-bold text-edu-navy">Welcome to EduTrack</h1>
        <p className="mt-1 text-sm text-edu-blue">Selected role: {activeRole.title}</p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {roles.map((role) => (
            <button
              key={role.key}
              type="button"
              onClick={() => setSelectedRole(role.key)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                selectedRole === role.key
                  ? 'bg-edu-teal text-white'
                  : 'border border-edu-blue/20 bg-edu-bg text-edu-navy hover:border-edu-teal'
              }`}
            >
              {role.title}
            </button>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            to={`/login?role=${selectedRole}`}
            className="rounded-lg bg-edu-teal px-5 py-2.5 text-sm font-medium text-white transition hover:bg-edu-blue"
          >
            Sign In
          </Link>
          {selectedRole !== 'student' && (
            <Link
              to={`/${selectedRole}/signup`}
              className="rounded-lg border border-edu-blue/20 bg-edu-bg px-5 py-2.5 text-sm font-medium text-edu-navy transition hover:border-edu-teal"
            >
              Sign Up
            </Link>
          )}
        </div>
      </section>
    </div>
  )
}

export default LandingPage