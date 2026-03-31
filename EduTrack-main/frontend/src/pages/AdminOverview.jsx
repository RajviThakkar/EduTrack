import { useEffect, useState, useMemo } from 'react'
import api from '../api/api'

export default function AdminOverview() {
  const [students, setStudents] = useState([])
  const [riskData, setRiskData] = useState([])
  const [facultyUsers, setFacultyUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([
      api.get('/api/students').then((res) => res.data),
      api.get('/api/risk').then((res) => res.data),
      api.get('/api/auth/users?role=faculty').then((res) => res.data),
    ])
      .then(([studentsRes, riskRes, facultyRes]) => {
        setStudents(Array.isArray(studentsRes) ? studentsRes : [])
        setRiskData(Array.isArray(riskRes) ? riskRes : [])
        setFacultyUsers(Array.isArray(facultyRes) ? facultyRes : [])
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setError('Failed to load dashboard data.')
        setLoading(false)
      })
  }, [])

  // Build faculty rows from the users DB, enriched with student assignment data
  const faculties = useMemo(() => {
    return facultyUsers.map((user) => {
      const userName = (user.name || '').trim()

      // Match students whose counsellor_name matches this faculty's name (case-insensitive)
      const assignedStudents = students.filter(
        (s) => (s.counsellor_name || '').trim().toLowerCase() === userName.toLowerCase()
      )

      const batches = new Set(assignedStudents.map((s) => s.batch).filter(Boolean))

      const atRiskCount = assignedStudents.filter((s) => {
        const riskRow = riskData.find((r) => String(r.student_id) === String(s.student_id))
        return riskRow && riskRow.status === 'High'
      }).length

      return {
        name: userName,
        email: user.email || '—',
        studentsAssigned: assignedStudents.length,
        atRiskCount,
        batches,
      }
    })
  }, [facultyUsers, students, riskData])

  const totalStudents = students.length
  const systemAtRisk = riskData.filter((r) => r.status === 'High').length

  if (loading) {
    return <div className="p-8 text-center text-edu-navy/60">Loading overview...</div>
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-edu-blue/15 bg-white p-6 shadow-soft">
          <p className="text-sm font-bold uppercase tracking-wider text-edu-navy/50">TOTAL FACULTIES</p>
          <p className="mt-2 text-3xl font-bold text-edu-navy">{faculties.length}</p>
        </div>
        <div className="rounded-xl border border-edu-blue/15 bg-white p-6 shadow-soft">
          <p className="text-sm font-bold uppercase tracking-wider text-edu-navy/50">TOTAL STUDENTS</p>
          <p className="mt-2 text-3xl font-bold text-edu-navy">{totalStudents}</p>
        </div>
        <div className="rounded-xl border border-edu-blue/15 bg-white p-6 shadow-soft">
          <p className="text-sm font-bold uppercase tracking-wider text-edu-navy/50">SYSTEM-WIDE AT RISK</p>
          <p className="mt-2 text-3xl font-bold text-red-500">{systemAtRisk}</p>
        </div>
      </div>

      {/* Faculty Allocations Table */}
      <div className="rounded-xl border border-edu-blue/15 bg-white shadow-soft">
        <div className="border-b border-edu-blue/10 px-6 py-5">
          <h2 className="text-lg font-bold text-edu-navy">Faculty Allocations</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-edu-blue/10 bg-edu-bg/60 text-left text-xs font-semibold tracking-wide text-edu-navy">
                <th className="px-6 py-4">Faculty Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Batches</th>
                <th className="px-6 py-4">Students Assigned</th>
                <th className="px-6 py-4">At-Risk Count</th>
              </tr>
            </thead>
            <tbody>
              {faculties.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-edu-navy/50">
                    No faculty accounts found.
                  </td>
                </tr>
              ) : (
                faculties.map((f, i) => (
                  <tr
                    key={i}
                    className="border-b border-edu-blue/5 transition-colors hover:bg-edu-blue/5"
                  >
                    <td className="px-6 py-4 font-medium text-edu-navy">{f.name}</td>
                    <td className="px-6 py-4 text-edu-navy/70">{f.email}</td>
                    <td className="px-6 py-4 font-medium text-edu-navy">{f.batches.size}</td>
                    <td className="px-6 py-4 font-medium text-edu-navy">{f.studentsAssigned}</td>
                    <td className="px-6 py-4 text-edu-navy/50">{f.atRiskCount || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
