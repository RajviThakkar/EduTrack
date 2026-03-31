import { useEffect, useState, useMemo } from 'react'
import api from '../api/api'
import { BRANCH_OPTIONS, BATCH_OPTIONS, SEMESTER_OPTIONS } from '../config/academicOptions'

export default function AdminAllocateClasses() {
  const [students, setStudents] = useState([])
  const [facultyUsers, setFacultyUsers] = useState([])

  const [filterCounsellor, setFilterCounsellor] = useState('')
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Batch allocation state
  const [batchFacultyInput, setBatchFacultyInput] = useState('')
  const [batchBranchInput, setBatchBranchInput] = useState('')
  const [batchSemesterInput, setBatchSemesterInput] = useState('')
  const [batchNameInput, setBatchNameInput] = useState('')
  const [batchPasswordInput, setBatchPasswordInput] = useState('{enrollment}@123')

  useEffect(() => {
    // Load students
    api.get('/api/students')
      .then((res) => {
        const data = res.data
        setStudents(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => {
        setStatus({ type: 'error', message: 'Failed to load students from server.' })
        setLoading(false)
      })

    // Load all registered faculty users from the users DB
    api.get('/api/auth/users?role=faculty')
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : []
        setFacultyUsers(data)
      })
      .catch(() => setFacultyUsers([]))
  }, [])

  // Faculty names come directly from the users collection — no filtering needed
  const overviewFaculties = useMemo(() => {
    if (facultyUsers.length > 0) {
      return facultyUsers.map((u) => u.name).filter(Boolean).sort()
    }
    return []
  }, [facultyUsers])

  const counsellorNames = useMemo(() => {
    const names = students.map((s) => s.counsellor_name).filter(Boolean)
    return [...new Set(names)].filter(n => {
      const lower = n.toLowerCase()
      return n !== 'Unassigned' && lower !== 'rajvi' && lower !== 'rajvee' && lower !== 'admin'
    }).sort()
  }, [students])

  const filteredStudents = useMemo(() => {
    if (!filterCounsellor) return students
    return students.filter((s) => s.counsellor_name === filterCounsellor)
  }, [students, filterCounsellor])



  async function handleBatchAllocate() {
    if (!batchFacultyInput || !batchBranchInput || !batchSemesterInput || !batchNameInput) {
      setStatus({ type: 'error', message: 'Please select Faculty, Branch, Semester, and Batch.' })
      return
    }

    setSubmitting(true)
    setStatus(null)
    try {
      const res = await api.put(`/api/students/batch-counsellor`, {
        counsellor_name: batchFacultyInput,
        branch: batchBranchInput,
        semester: batchSemesterInput,
        batch: batchNameInput,
        password_template: batchPasswordInput
      })
      
      setStatus({ type: 'success', message: res.data.message ?? 'Batch allocated successfully.' })
      // Reload students after batch allocation
      api.get('/api/students')
        .then(res => setStudents(Array.isArray(res.data) ? res.data : []))
    } catch (error) {
      setStatus({ type: 'error', message: error.response?.data?.error || 'Allocation failed.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">

      {status && (
        <div
          className={`rounded-lg px-4 py-3 text-sm font-medium ${
            status.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {status.message}
        </div>
      )}

      {/* Allocate Full Batch */}
      <section className="rounded-xl border border-edu-blue/15 bg-white p-6 shadow-soft">
        <h2 className="mb-5 text-lg font-bold text-edu-navy">Allocate Full Batch</h2>

        <div className="grid gap-4 sm:grid-cols-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-edu-navy/80">Faculty Name</label>
            <select
              value={batchFacultyInput}
              onChange={(e) => setBatchFacultyInput(e.target.value)}
              className="rounded-lg border border-edu-blue/20 bg-transparent px-3 py-2 text-sm text-edu-navy/70 focus:border-edu-blue focus:outline-none focus:ring-1 focus:ring-edu-blue"
            >
              <option value="">— select —</option>
              {overviewFaculties.map((fName) => (
                <option key={fName} value={fName}>{fName}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-edu-navy/80">Branch</label>
            <select
              value={batchBranchInput}
              onChange={(e) => setBatchBranchInput(e.target.value)}
              className="rounded-lg border border-edu-blue/20 bg-transparent px-3 py-2 text-sm text-edu-navy/70 focus:border-edu-blue focus:outline-none focus:ring-1 focus:ring-edu-blue"
            >
              <option value="">— select —</option>
              {BRANCH_OPTIONS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-edu-navy/80">Semester</label>
            <select
              value={batchSemesterInput}
              onChange={(e) => setBatchSemesterInput(e.target.value)}
              className="rounded-lg border border-edu-blue/20 bg-transparent px-3 py-2 text-sm text-edu-navy/70 focus:border-edu-blue focus:outline-none focus:ring-1 focus:ring-edu-blue"
            >
              <option value="">— Sem —</option>
              {SEMESTER_OPTIONS.map((s) => (
                <option key={s} value={String(s)}>{s}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-edu-navy/80">Batch Name</label>
            <select
              value={batchNameInput}
              onChange={(e) => setBatchNameInput(e.target.value)}
              className="rounded-lg border border-edu-blue/20 bg-transparent px-3 py-2 text-sm text-edu-navy/70 focus:border-edu-blue focus:outline-none focus:ring-1 focus:ring-edu-blue"
            >
              <option value="">— select —</option>
              {BATCH_OPTIONS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-edu-navy/80">Default Password</label>
            <input
              type="text"
              value={batchPasswordInput}
              onChange={(e) => setBatchPasswordInput(e.target.value)}
              placeholder="{enrollment}@123"
              className="rounded-lg border border-edu-blue/20 bg-transparent px-3 py-2 text-sm text-edu-navy/70 focus:border-edu-blue focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={handleBatchAllocate}
            disabled={submitting || loading}
            className="rounded-lg bg-[#4E98A2] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#4E98A2]/90 disabled:opacity-50"
          >
            Allocate Entire Batch
          </button>
        </div>
      </section>

      {/* All Students Table */}
      <section className="rounded-xl border border-edu-blue/15 bg-white shadow-soft">
        <div className="flex items-center justify-between border-b border-edu-blue/10 px-6 py-4">
          <h2 className="text-lg font-bold text-edu-navy">All Students</h2>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-edu-navy/60">Filter by counsellor</label>
            <select
              value={filterCounsellor}
              onChange={(e) => setFilterCounsellor(e.target.value)}
              className="rounded-lg border border-edu-blue/20 bg-transparent px-3 py-1.5 text-sm text-edu-navy/70 focus:border-edu-blue focus:outline-none"
            >
              <option value="">All</option>
              {counsellorNames.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <p className="px-6 py-8 text-center text-sm text-edu-navy/50">Loading students…</p>
        ) : filteredStudents.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-edu-navy/50">No students found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-edu-blue/10 bg-edu-bg/60 text-left text-xs font-semibold uppercase tracking-wide text-edu-navy/60">
                  <th className="px-5 py-3">Enrollment No.</th>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Branch</th>
                  <th className="px-5 py-3">Semester</th>
                  <th className="px-5 py-3">Batch</th>
                  <th className="px-5 py-3">Counsellor</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s, i) => (
                  <tr
                    key={s.id}
                    className={`border-b border-edu-blue/5 transition-colors hover:bg-edu-blue/5 ${
                      i % 2 === 0 ? '' : 'bg-edu-bg/30'
                    }`}
                  >
                    <td className="px-5 py-3 font-mono text-xs text-edu-navy/70">{s.student_id}</td>
                    <td className="px-5 py-3 font-medium text-edu-navy">{s.name}</td>
                    <td className="px-5 py-3 text-edu-navy/70">{s.branch}</td>
                    <td className="px-5 py-3 text-edu-navy/70">{s.semester}</td>
                    <td className="px-5 py-3 text-edu-navy/70">{s.batch}</td>
                    <td className="px-5 py-3">
                      {s.counsellor_name ? (
                        <span className="inline-block rounded-full bg-edu-blue/10 px-2.5 py-0.5 text-xs font-medium text-edu-navy">
                          {s.counsellor_name}
                        </span>
                      ) : (
                        <span className="text-edu-navy/35 italic">Unassigned</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
