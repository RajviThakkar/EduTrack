import { useEffect, useState } from 'react'
import api from '../api/api'
import { BRANCH_OPTIONS, SEMESTER_OPTIONS, BATCH_OPTIONS } from '../config/academicOptions'

export default function StudentManagementPage() {
  const [allStudents, setAllStudents] = useState([])
  const [filteredStudents, setFilteredStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [filterBranch, setFilterBranch] = useState('')
  const [filterSemester, setFilterSemester] = useState('')
  const [filterBatch, setFilterBatch] = useState('')

  const [editingStudentId, setEditingStudentId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [savingEdit, setSavingEdit] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    loadAllStudents()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [allStudents, searchQuery, filterBranch, filterSemester, filterBatch])

  async function loadAllStudents() {
    setLoading(true)
    try {
      const { data } = await api.get('/api/students', { timeout: 15000 })
      const list = Array.isArray(data) ? data : []
      setAllStudents(list)
    } catch {
      setStatus({ type: 'error', message: 'Failed to load students' })
      setAllStudents([])
    } finally {
      setLoading(false)
    }
  }

  function applyFilters() {
    let results = allStudents

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      results = results.filter(
        (s) =>
          (s.name || '').toLowerCase().includes(q) ||
          (s.email || '').toLowerCase().includes(q) ||
          (s.student_id || '').toLowerCase().includes(q) ||
          (s.enrollment_id || '').toLowerCase().includes(q),
      )
    }

    if (filterBranch) {
      results = results.filter((s) => String(s.branch || '') === filterBranch)
    }

    if (filterSemester) {
      results = results.filter((s) => String(s.semester || '') === filterSemester)
    }

    if (filterBatch) {
      results = results.filter((s) => String(s.batch || '') === filterBatch)
    }

    setFilteredStudents(results)
  }

  function startEdit(student) {
    setEditingStudentId(student.id)
    setEditForm({
      name: student.name || '',
      branch: student.branch || '',
      semester: String(student.semester || ''),
      batch: student.batch || '',
      enrollment_id: student.enrollment_id || '',
      email: student.email || '',
      counsellor_name: student.counsellor_name || '',
    })
    setStatus(null)
  }

  function handleEditChange(e) {
    setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function saveEdit(studentId) {
    setSavingEdit(true)
    try {
      const payload = {
        ...editForm,
        semester: Number(editForm.semester),
      }
      await api.put(`/api/students/${studentId}`, payload, { timeout: 15000 })
      setStatus({ type: 'success', message: 'Student updated successfully.' })
      setEditingStudentId(null)
      await loadAllStudents()
    } catch (error) {
      setStatus({ type: 'error', message: error?.response?.data?.error || 'Failed to update student.' })
    } finally {
      setSavingEdit(false)
    }
  }

  async function deleteStudent(studentId, studentName) {
    const confirmed = window.confirm(`Delete student "${studentName}"? This cannot be undone.`)
    if (!confirmed) return

    setDeletingId(studentId)
    try {
      await api.delete(`/api/students/${studentId}`, { timeout: 15000 })
      setStatus({ type: 'success', message: `Student "${studentName}" deleted successfully.` })
      if (editingStudentId === studentId) {
        setEditingStudentId(null)
      }
      await loadAllStudents()
    } catch (error) {
      setStatus({ type: 'error', message: error?.response?.data?.error || 'Failed to delete student.' })
    } finally {
      setDeletingId(null)
    }
  }

  function clearFilters() {
    setSearchQuery('')
    setFilterBranch('')
    setFilterSemester('')
    setFilterBatch('')
  }

  const hasActiveFilters = searchQuery || filterBranch || filterSemester || filterBatch

  return (
    <div className="space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-bold text-edu-navy">Student Management</h1>
        <p className="mt-1 text-sm text-edu-blue">View, update, and manage all students in the system</p>
      </div>

      {status && (
        <div
          className={`rounded-xl px-4 py-3 text-sm font-medium ${
            status.type === 'success'
              ? 'border border-green-200 bg-green-50 text-green-700'
              : 'border border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {status.message}
        </div>
      )}

      <div className="rounded-2xl border border-edu-blue/20 bg-white p-6 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-edu-navy">Filters</h2>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg border border-edu-blue/20 px-3 py-1.5 text-xs font-semibold text-edu-navy hover:bg-edu-bg"
            >
              Clear All Filters
            </button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1.5 text-xs font-medium uppercase text-edu-navy/70">Search</label>
            <input
              type="text"
              placeholder="Name, Email, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-edu-blue/20 bg-edu-bg px-3 py-2 text-sm text-edu-navy placeholder:text-edu-navy/30 focus:border-edu-teal focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 text-xs font-medium uppercase text-edu-navy/70">Branch</label>
            <select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="w-full rounded-lg border border-edu-blue/20 bg-edu-bg px-3 py-2 text-sm text-edu-navy focus:border-edu-teal focus:outline-none"
            >
              <option value="">All Branches</option>
              {BRANCH_OPTIONS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 text-xs font-medium uppercase text-edu-navy/70">Semester</label>
            <select
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
              className="w-full rounded-lg border border-edu-blue/20 bg-edu-bg px-3 py-2 text-sm text-edu-navy focus:border-edu-teal focus:outline-none"
            >
              <option value="">All Semesters</option>
              {SEMESTER_OPTIONS.map((s) => (
                <option key={s} value={String(s)}>
                  Semester {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 text-xs font-medium uppercase text-edu-navy/70">Batch</label>
            <select
              value={filterBatch}
              onChange={(e) => setFilterBatch(e.target.value)}
              className="w-full rounded-lg border border-edu-blue/20 bg-edu-bg px-3 py-2 text-sm text-edu-navy focus:border-edu-teal focus:outline-none"
            >
              <option value="">All Batches</option>
              {BATCH_OPTIONS.map((b) => (
                <option key={b} value={b}>
                  Batch {b}
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>

      <div className="rounded-2xl border border-edu-blue/20 bg-white p-6 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-edu-navy">
            Students
            {hasActiveFilters && <span className="ml-2 text-sm text-edu-blue">({filteredStudents.length} results)</span>}
          </h2>
          <button
            type="button"
            onClick={loadAllStudents}
            className="rounded-lg border border-edu-blue/20 px-3 py-1.5 text-xs font-semibold text-edu-navy hover:bg-edu-bg"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-edu-blue">Loading students...</p>
        ) : filteredStudents.length === 0 ? (
          <p className="text-sm text-edu-blue">{hasActiveFilters ? 'No students match the current filters.' : 'No students found.'}</p>
        ) : (
          <div className="w-full overflow-hidden">
            <table className="w-full table-fixed text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-edu-blue/10 bg-edu-bg text-left">
                  <th className="px-3 py-2 text-xs font-semibold uppercase text-edu-navy/60">Student ID</th>
                  <th className="px-3 py-2 text-xs font-semibold uppercase text-edu-navy/60">Name</th>
                  <th className="px-3 py-2 text-xs font-semibold uppercase text-edu-navy/60">Email</th>
                  <th className="px-3 py-2 text-xs font-semibold uppercase text-edu-navy/60">Branch</th>
                  <th className="px-3 py-2 text-xs font-semibold uppercase text-edu-navy/60">Sem</th>
                  <th className="px-3 py-2 text-xs font-semibold uppercase text-edu-navy/60">Batch</th>
                  <th className="px-3 py-2 text-xs font-semibold uppercase text-edu-navy/60">Enrollment</th>
                  <th className="px-3 py-2 text-xs font-semibold uppercase text-edu-navy/60">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => {
                  const isEditing = editingStudentId === student.id
                  return (
                    <tr key={student.id} className="border-b border-edu-blue/10 align-top hover:bg-edu-bg/50">
                      <td className="px-2 py-2 align-top"><span className="text-xs text-edu-navy/70">{student.student_id || '-'}</span></td>
                      <td className="px-2 py-2 align-top">
                        {isEditing ? (
                          <input type="text" name="name" value={editForm.name} onChange={handleEditChange} className={cellInputCls} />
                        ) : (
                          <span className="font-medium text-edu-navy">{student.name || '-'}</span>
                        )}
                      </td>
                      <td className="px-2 py-2 align-top break-all">
                        {isEditing ? (
                          <input type="email" name="email" value={editForm.email} onChange={handleEditChange} className={cellInputCls} />
                        ) : (
                          <span className="text-xs text-edu-navy/70">{student.email || '-'}</span>
                        )}
                      </td>
                      <td className="px-2 py-2 align-top">
                        {isEditing ? (
                          <select name="branch" value={editForm.branch} onChange={handleEditChange} className={cellSelectCls}>
                            <option value="">—</option>
                            {BRANCH_OPTIONS.map((b) => (
                              <option key={b} value={b}>{b}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-xs text-edu-navy/70">{student.branch || '-'}</span>
                        )}
                      </td>
                      <td className="px-2 py-2 align-top">
                        {isEditing ? (
                          <select name="semester" value={editForm.semester} onChange={handleEditChange} className={cellSelectCls}>
                            <option value="">—</option>
                            {SEMESTER_OPTIONS.map((s) => (
                              <option key={s} value={String(s)}>{s}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-xs text-edu-navy/70">{student.semester || '-'}</span>
                        )}
                      </td>
                      <td className="px-2 py-2 align-top">
                        {isEditing ? (
                          <select name="batch" value={editForm.batch} onChange={handleEditChange} className={cellSelectCls}>
                            <option value="">—</option>
                            {BATCH_OPTIONS.map((b) => (
                              <option key={b} value={b}>{b}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-xs text-edu-navy/70">{student.batch || '-'}</span>
                        )}
                      </td>
                      <td className="px-2 py-2 align-top break-all">
                        {isEditing ? (
                          <input type="text" name="enrollment_id" value={editForm.enrollment_id} onChange={handleEditChange} className={cellInputCls} />
                        ) : (
                          <span className="text-xs text-edu-navy/70">{student.enrollment_id || '-'}</span>
                        )}
                      </td>
                      <td className="px-2 py-2 align-top">
                        {isEditing ? (
                          <div className="flex flex-wrap gap-1">
                            <button
                              type="button"
                              onClick={() => saveEdit(student.id)}
                              disabled={savingEdit}
                              className="rounded-md bg-edu-teal px-2 py-1 text-[11px] font-semibold text-white disabled:opacity-60"
                            >
                              {savingEdit ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingStudentId(null)}
                              className="rounded-md border border-edu-blue/20 px-2 py-1 text-[11px] font-semibold text-edu-navy"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            <button
                              type="button"
                              onClick={() => startEdit(student)}
                              className="rounded-md border border-edu-blue/20 px-2 py-1 text-[11px] font-semibold text-edu-navy hover:bg-edu-bg"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteStudent(student.id, student.name)}
                              disabled={deletingId === student.id}
                              className="rounded-md bg-red-500 px-2 py-1 text-[11px] font-semibold text-white disabled:opacity-60"
                            >
                              {deletingId === student.id ? 'Del...' : 'Delete'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

const cellInputCls =
  'min-w-0 w-full rounded-md border border-edu-blue/30 bg-white px-2 py-1.5 text-xs text-edu-navy focus:border-edu-blue focus:outline-none'

const cellSelectCls =
  'min-w-0 w-full rounded-md border border-edu-blue/30 bg-white px-2 py-1.5 text-xs text-edu-navy focus:border-edu-blue focus:outline-none'
