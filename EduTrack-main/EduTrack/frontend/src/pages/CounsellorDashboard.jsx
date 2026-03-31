import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import API_BASE from '../config/api'

const quickLinks = [
  { label: 'Student Data', to: '/counsellor/data', gradient: 'from-edu-navy to-edu-blue' },
  { label: 'Add Student', to: '/counsellor/add-student', gradient: 'from-edu-teal to-edu-mint' },
  { label: 'Predict Risk', to: '/counsellor/predict-risk', gradient: 'from-edu-blue to-edu-teal' },
  { label: 'Assign Counsellor', to: '/counsellor/assign-counsellor', gradient: 'from-edu-sand to-edu-teal' },
]

export default function CounsellorDashboard() {
  const [counsellorName, setCounsellorName] = useState('')
  const [allStudents, setAllStudents] = useState([])
  const [myStudents, setMyStudents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Read the counsellor's name from localStorage (stored on sign-in)
    const profile = localStorage.getItem('edutrack_counsellor_profile')
    if (profile) {
      try {
        const parsed = JSON.parse(profile)
        setCounsellorName(parsed.name || 'Counsellor')
      } catch {
        setCounsellorName(profile)
      }
    } else {
      setCounsellorName('Counsellor')
    }
  }, [])

  useEffect(() => {
    fetch(`${API_BASE}/students`)
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : []
        setAllStudents(list)
        if (counsellorName && counsellorName !== 'Counsellor') {
          setMyStudents(list.filter((s) => s.counsellor_name === counsellorName))
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [counsellorName])

  const atRisk = allStudents.filter((s) => (s.attendance_percentage ?? 0) < 75).length

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="rounded-2xl bg-gradient-to-r from-edu-navy to-edu-blue px-7 py-6 text-white shadow-soft">
        <p className="text-sm font-medium tracking-wide uppercase opacity-75">Welcome back</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{counsellorName}</h1>
        <p className="mt-1 text-sm text-white/70">Counsellor Portal — EduTrack</p>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Students"
          value={loading ? '—' : allStudents.length}
          sub="in the system"
          color="text-edu-navy"
        />
        <StatCard
          label="My Students"
          value={loading ? '—' : myStudents.length}
          sub="assigned to me"
          color="text-edu-blue"
        />
        <StatCard
          label="At-Risk Students"
          value={loading ? '—' : atRisk}
          sub="attendance < 75%"
          color="text-red-500"
        />
      </div>

      {/* Quick Links */}
      <section>
        <h2 className="mb-3 text-base font-semibold text-edu-navy/70">Quick Access</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((q) => (
            <Link
              key={q.to}
              to={q.to}
              className={`rounded-2xl bg-gradient-to-br ${q.gradient} px-5 py-6 text-white shadow-soft transition hover:opacity-90`}
            >
              <span className="text-base font-semibold">{q.label}</span>
              <p className="mt-1 text-xs text-white/70">Go to {q.label.toLowerCase()}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* My Students table */}
      {myStudents.length > 0 && (
        <section className="rounded-2xl border border-edu-blue/20 bg-white shadow-soft">
          <div className="border-b border-edu-blue/15 px-6 py-4">
            <h2 className="text-base font-semibold text-edu-navy">My Assigned Students</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-edu-blue/10 bg-edu-bg/60 text-left text-xs font-semibold uppercase tracking-wide text-edu-navy/60">
                  <th className="px-5 py-3">Student ID</th>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Branch</th>
                  <th className="px-5 py-3">Semester</th>
                  <th className="px-5 py-3">Attendance</th>
                </tr>
              </thead>
              <tbody>
                {myStudents.map((s, i) => (
                  <tr
                    key={s.id}
                    className={`border-b border-edu-blue/8 hover:bg-edu-blue/5 transition-colors ${
                      i % 2 === 0 ? '' : 'bg-edu-bg/30'
                    }`}
                  >
                    <td className="px-5 py-3 font-mono text-xs text-edu-navy/70">{s.student_id}</td>
                    <td className="px-5 py-3 font-medium text-edu-navy">{s.name}</td>
                    <td className="px-5 py-3 text-edu-navy/70">{s.branch}</td>
                    <td className="px-5 py-3 text-edu-navy/70">{s.semester}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          (s.attendance_percentage ?? 0) < 75
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {s.attendance_percentage ?? 0}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}

function StatCard({ label, value, sub, color }) {
  return (
    <div className="rounded-2xl border border-edu-blue/20 bg-white px-6 py-5 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-wide text-edu-navy/50">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${color}`}>{value}</p>
      <p className="mt-0.5 text-xs text-edu-navy/50">{sub}</p>
    </div>
  )
}
