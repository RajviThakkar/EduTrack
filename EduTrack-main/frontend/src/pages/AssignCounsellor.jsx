import { useEffect, useState, useMemo } from 'react'
import API_BASE from '../config/api'

export default function AssignCounsellor() {
  const [students, setStudents] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [counsellorInput, setCounsellorInput] = useState('')
  const [filterCounsellor, setFilterCounsellor] = useState('')
  const [status, setStatus] = useState(null) // { type: 'success' | 'error', message: string }
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Fetch all students on mount
  useEffect(() => {
    fetch(`${API_BASE}/students`)
      .then((r) => r.json())
      .then((data) => {
        setStudents(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => {
        setStatus({ type: 'error', message: 'Failed to load students from server.' })
        setLoading(false)
      })
  }, [])

  // Pre-fill counsellor input when a student is selected
  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedId),
    [students, selectedId]
  )
  useEffect(() => {
    setCounsellorInput(selectedStudent?.counsellor_name ?? '')
  }, [selectedStudent])

  // All unique counsellor names for the filter dropdown
  const counsellorNames = useMemo(() => {
    const names = students.map((s) => s.counsellor_name).filter(Boolean)
    return [...new Set(names)].sort()
  }, [students])

  // Filtered student list for the table
  const filteredStudents = useMemo(() => {
    if (!filterCounsellor) return students
    return students.filter((s) => s.counsellor_name === filterCounsellor)
  }, [students, filterCounsellor])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!selectedId) {
      setStatus({ type: 'error', message: 'Please select a student.' })
      return
    }
    const name = counsellorInput.trim()
    if (!name) {
      setStatus({ type: 'error', message: 'Counsellor name cannot be empty.' })
      return
    }

    setSubmitting(true)
    setStatus(null)
    try {
      const res = await fetch(`${API_BASE}/students/${selectedId}/counsellor`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ counsellor_name: name }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus({ type: 'error', message: data.error ?? 'Update failed.' })
      } else {
        // Reflect change in local state without a full refetch
        setStudents((prev) =>
          prev.map((s) =>
            s.id === selectedId ? { ...s, counsellor_name: name } : s
          )
        )
        setStatus({ type: 'success', message: `Counsellor updated to "${name}" for ${selectedStudent?.name}.` })
      }
    } catch {
      setStatus({ type: 'error', message: 'Network error. Is the server running?' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">

      {/* ── Assignment Form ─────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-edu-blue/20 bg-white p-6 shadow-soft">
        <h2 className="mb-5 text-lg font-semibold text-edu-navy">Assign / Update Counsellor</h2>

        {status && (
          <div
            className={`mb-4 rounded-xl px-4 py-3 text-sm font-medium ${
              status.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          {/* Student selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-edu-navy/80">Select Student</label>
            <select
              value={selectedId}
              onChange={(e) => { setSelectedId(e.target.value); setStatus(null) }}
              className="rounded-xl border border-edu-blue/30 bg-edu-bg px-3 py-2.5 text-sm text-edu-navy focus:border-edu-blue focus:outline-none focus:ring-2 focus:ring-edu-blue/20"
            >
              <option value="">— choose a student —</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.student_id} — {s.name} ({s.branch}, Sem {s.semester})
                </option>
              ))}
            </select>
          </div>

          {/* Counsellor name input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-edu-navy/80">Counsellor Name</label>
            <input
              type="text"
              value={counsellorInput}
              onChange={(e) => setCounsellorInput(e.target.value)}
              placeholder="e.g. Dr. Mehta"
              className="rounded-xl border border-edu-blue/30 bg-edu-bg px-3 py-2.5 text-sm text-edu-navy placeholder:text-edu-navy/40 focus:border-edu-blue focus:outline-none focus:ring-2 focus:ring-edu-blue/20"
            />
          </div>

          {/* Current counsellor hint */}
          {selectedStudent?.counsellor_name && (
            <p className="col-span-full text-xs text-edu-navy/55">
              Current counsellor: <span className="font-medium text-edu-navy/80">{selectedStudent.counsellor_name}</span>
            </p>
          )}

          <div className="col-span-full">
            <button
              type="submit"
              disabled={submitting || loading}
              className="rounded-xl bg-edu-navy px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? 'Saving…' : 'Update Counsellor'}
            </button>
          </div>
        </form>
      </section>

      {/* ── Student–Counsellor Table ─────────────────────────────────────── */}
      <section className="rounded-2xl border border-edu-blue/20 bg-white shadow-soft">
        {/* Table header with filter */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-edu-blue/15 px-6 py-4">
          <h2 className="text-lg font-semibold text-edu-navy">All Students</h2>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-edu-navy/60">Filter by counsellor</label>
            <select
              value={filterCounsellor}
              onChange={(e) => setFilterCounsellor(e.target.value)}
              className="rounded-xl border border-edu-blue/30 bg-edu-bg px-3 py-1.5 text-xs text-edu-navy focus:border-edu-blue focus:outline-none"
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
                  <th className="px-5 py-3">Student ID</th>
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
                    className={`border-b border-edu-blue/8 transition-colors hover:bg-edu-blue/5 ${
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
                        <span className="inline-block rounded-full bg-edu-blue/12 px-3 py-0.5 text-xs font-medium text-edu-navy">
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
