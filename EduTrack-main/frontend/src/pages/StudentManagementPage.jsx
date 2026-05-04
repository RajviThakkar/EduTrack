import { useEffect, useState } from 'react'
import api from '../api/api'
import { BRANCH_OPTIONS, SEMESTER_OPTIONS, BATCH_OPTIONS } from '../config/academicOptions'

export default function StudentManagementPage() {
  const [allStudents, setAllStudents]         = useState([])
  const [filteredStudents, setFilteredStudents] = useState([])
  const [loading, setLoading]                 = useState(true)
  const [status, setStatus]                   = useState(null)

  // Filters
  const [searchQuery, setSearchQuery]     = useState('')
  const [filterBranch, setFilterBranch]   = useState('')
  const [filterSemester, setFilterSemester] = useState('')
  const [filterBatch, setFilterBatch]     = useState('')

  // Edit mode
  const [editingStudentId, setEditingStudentId] = useState(null)
  const [editForm, setEditForm]           = useState({})
  const [savingEdit, setSavingEdit]       = useState(false)
  const [deletingId, setDeletingId]       = useState(null)

  // Multi-select state
  const [selectedIds, setSelectedIds]     = useState(new Set())
  const [bulkDeleting, setBulkDeleting]   = useState(false)

  useEffect(() => { loadAllStudents() }, [])

  useEffect(() => { applyFilters() }, [allStudents, searchQuery, filterBranch, filterSemester, filterBatch])

  // Clear selection when filtered list changes
  useEffect(() => { setSelectedIds(new Set()) }, [filteredStudents])

  async function loadAllStudents() {
    setLoading(true)
    try {
      const { data } = await api.get('/api/students', { timeout: 15000 })
      setAllStudents(Array.isArray(data) ? data : [])
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
          (s.student_id || '').toLowerCase().includes(q),
      )
    }
    if (filterBranch)   results = results.filter((s) => String(s.branch || '')   === filterBranch)
    if (filterSemester) results = results.filter((s) => String(s.semester || '') === filterSemester)
    if (filterBatch)    results = results.filter((s) => String(s.batch || '')    === filterBatch)
    setFilteredStudents(results)
  }

  // ── Selection helpers ────────────────────────────────────────────────────────
  const allOnPageSelected =
    filteredStudents.length > 0 && filteredStudents.every((s) => selectedIds.has(s.id))

  function toggleSelectAll() {
    if (allOnPageSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredStudents.map((s) => s.id)))
    }
  }

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // ── Bulk delete ──────────────────────────────────────────────────────────────
  async function handleBulkDelete() {
    if (selectedIds.size === 0) return
    const confirmed = window.confirm(
      `Delete ${selectedIds.size} selected student${selectedIds.size > 1 ? 's' : ''}? This cannot be undone.`,
    )
    if (!confirmed) return

    setBulkDeleting(true)
    setStatus(null)
    let successCount = 0
    let failCount    = 0

    await Promise.all(
      [...selectedIds].map(async (id) => {
        try {
          await api.delete(`/api/students/${id}`, { timeout: 15000 })
          successCount++
        } catch {
          failCount++
        }
      }),
    )

    setBulkDeleting(false)
    setSelectedIds(new Set())

    if (failCount === 0) {
      setStatus({ type: 'success', message: `${successCount} student${successCount > 1 ? 's' : ''} deleted successfully.` })
    } else {
      setStatus({ type: 'error', message: `${successCount} deleted, ${failCount} failed.` })
    }

    await loadAllStudents()
  }

  // ── Single delete ────────────────────────────────────────────────────────────
  async function deleteStudent(studentId, studentName) {
    const confirmed = window.confirm(`Delete student "${studentName}"? This cannot be undone.`)
    if (!confirmed) return

    setDeletingId(studentId)
    try {
      await api.delete(`/api/students/${studentId}`, { timeout: 15000 })
      setStatus({ type: 'success', message: `Student "${studentName}" deleted successfully.` })
      if (editingStudentId === studentId) setEditingStudentId(null)
      setSelectedIds((prev) => { const n = new Set(prev); n.delete(studentId); return n })
      await loadAllStudents()
    } catch (error) {
      setStatus({ type: 'error', message: error?.response?.data?.error || 'Failed to delete student.' })
    } finally {
      setDeletingId(null)
    }
  }

  // ── Edit helpers ─────────────────────────────────────────────────────────────
  function startEdit(student) {
    setEditingStudentId(student.id)
    setEditForm({
      student_id:     student.student_id || '',
      name:           student.name || '',
      branch:         student.branch || '',
      semester:       String(student.semester || ''),
      batch:          student.batch || '',
      email:          student.email || '',
      year:           student.year || '',
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
      await api.put(`/api/students/${studentId}`, { ...editForm, semester: Number(editForm.semester) }, { timeout: 15000 })
      setStatus({ type: 'success', message: 'Student updated successfully.' })
      setEditingStudentId(null)
      await loadAllStudents()
    } catch (error) {
      setStatus({ type: 'error', message: error?.response?.data?.error || 'Failed to update student.' })
    } finally {
      setSavingEdit(false)
    }
  }

  function clearFilters() {
    setSearchQuery(''); setFilterBranch(''); setFilterSemester(''); setFilterBatch('')
  }

  const hasActiveFilters = searchQuery || filterBranch || filterSemester || filterBatch

  return (
    <div className="space-y-6 px-4 py-8 sm:px-6 lg:px-8">

      {/* Status message */}
      {status && (
        <div className={`rounded-xl px-4 py-3 text-sm font-medium ${
          status.type === 'success'
            ? 'border border-green-200 bg-green-50 text-green-700'
            : 'border border-red-200 bg-red-50 text-red-700'
        }`}>
          {status.message}
        </div>
      )}

      {/* Filters */}
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
            <label className="mb-1.5 block text-xs font-medium uppercase text-edu-navy/70">Search</label>
            <input
              type="text"
              placeholder="Name, Email, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-edu-blue/20 bg-edu-bg px-3 py-2 text-sm text-edu-navy placeholder:text-edu-navy/30 focus:border-edu-teal focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase text-edu-navy/70">Branch</label>
            <select value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)} className="w-full rounded-lg border border-edu-blue/20 bg-edu-bg px-3 py-2 text-sm text-edu-navy focus:border-edu-teal focus:outline-none">
              <option value="">All Branches</option>
              {BRANCH_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase text-edu-navy/70">Semester</label>
            <select value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)} className="w-full rounded-lg border border-edu-blue/20 bg-edu-bg px-3 py-2 text-sm text-edu-navy focus:border-edu-teal focus:outline-none">
              <option value="">All Semesters</option>
              {SEMESTER_OPTIONS.map((s) => <option key={s} value={String(s)}>Semester {s}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase text-edu-navy/70">Batch</label>
            <select value={filterBatch} onChange={(e) => setFilterBatch(e.target.value)} className="w-full rounded-lg border border-edu-blue/20 bg-edu-bg px-3 py-2 text-sm text-edu-navy focus:border-edu-teal focus:outline-none">
              <option value="">All Batches</option>
              {BATCH_OPTIONS.map((b) => <option key={b} value={b}>Batch {b}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Students table */}
      <div className="rounded-2xl border border-edu-blue/20 bg-white p-6 shadow-soft">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-edu-navy">
            Students
            {hasActiveFilters && (
              <span className="ml-2 text-sm text-edu-blue">({filteredStudents.length} results)</span>
            )}
          </h2>

          <div className="flex items-center gap-2">
            {/* Bulk delete button — only when items selected */}
            {selectedIds.size > 0 && (
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-600 disabled:opacity-60"
              >
                {bulkDeleting
                  ? 'Deleting…'
                  : `Delete Selected (${selectedIds.size})`}
              </button>
            )}
            <button
              type="button"
              onClick={loadAllStudents}
              className="rounded-lg border border-edu-blue/20 px-3 py-1.5 text-xs font-semibold text-edu-navy hover:bg-edu-bg"
            >
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-edu-blue">Loading students...</p>
        ) : filteredStudents.length === 0 ? (
          <p className="text-sm text-edu-blue">
            {hasActiveFilters ? 'No students match the current filters.' : 'No students found.'}
          </p>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full table-fixed text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-edu-blue/10 bg-edu-bg text-left">
                  {/* Master checkbox */}
                  <th className="w-10 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={allOnPageSelected}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 accent-edu-teal"
                      title="Select all"
                    />
                  </th>
                  <th className="px-3 py-2 text-xs font-semibold uppercase text-edu-navy/60">Enrollment No.</th>
                  <th className="px-3 py-2 text-xs font-semibold uppercase text-edu-navy/60">Name</th>
                  <th className="px-3 py-2 text-xs font-semibold uppercase text-edu-navy/60">Email</th>
                  <th className="px-3 py-2 text-xs font-semibold uppercase text-edu-navy/60">Branch</th>
                  <th className="px-3 py-2 text-xs font-semibold uppercase text-edu-navy/60">Sem</th>
                  <th className="px-3 py-2 text-xs font-semibold uppercase text-edu-navy/60">Batch</th>
                  <th className="px-3 py-2 text-xs font-semibold uppercase text-edu-navy/60">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => {
                  const isEditing  = editingStudentId === student.id
                  const isSelected = selectedIds.has(student.id)
                  return (
                    <tr
                      key={student.id}
                      className={`border-b border-edu-blue/10 align-top transition-colors ${
                        isSelected ? 'bg-edu-teal/5' : 'hover:bg-edu-bg/50'
                      }`}
                    >
                      {/* Row checkbox */}
                      <td className="px-3 py-2 align-middle">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(student.id)}
                          className="h-4 w-4 accent-edu-teal"
                        />
                      </td>

                      {/* Enrollment No. */}
                      <td className="px-2 py-2 align-top">
                        <span className="text-xs text-edu-navy/70">{student.student_id || '-'}</span>
                      </td>

                      {/* Name */}
                      <td className="px-2 py-2 align-top">
                        {isEditing ? (
                          <input type="text" name="name" value={editForm.name} onChange={handleEditChange} className={cellInputCls} />
                        ) : (
                          <span className="font-medium text-edu-navy">{student.name || '-'}</span>
                        )}
                      </td>

                      {/* Email */}
                      <td className="px-2 py-2 align-top break-all">
                        {isEditing ? (
                          <input type="email" name="email" value={editForm.email} onChange={handleEditChange} className={cellInputCls} />
                        ) : (
                          <span className="text-xs text-edu-navy/70">{student.email || '-'}</span>
                        )}
                      </td>

                      {/* Branch */}
                      <td className="px-2 py-2 align-top">
                        {isEditing ? (
                          <select name="branch" value={editForm.branch} onChange={handleEditChange} className={cellSelectCls}>
                            <option value="">—</option>
                            {BRANCH_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                          </select>
                        ) : (
                          <span className="text-xs text-edu-navy/70">{student.branch || '-'}</span>
                        )}
                      </td>

                      {/* Semester */}
                      <td className="px-2 py-2 align-top">
                        {isEditing ? (
                          <select name="semester" value={editForm.semester} onChange={handleEditChange} className={cellSelectCls}>
                            <option value="">—</option>
                            {SEMESTER_OPTIONS.map((s) => <option key={s} value={String(s)}>{s}</option>)}
                          </select>
                        ) : (
                          <span className="text-xs text-edu-navy/70">{student.semester || '-'}</span>
                        )}
                      </td>

                      {/* Batch */}
                      <td className="px-2 py-2 align-top">
                        {isEditing ? (
                          <select name="batch" value={editForm.batch} onChange={handleEditChange} className={cellSelectCls}>
                            <option value="">—</option>
                            {BATCH_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                          </select>
                        ) : (
                          <span className="text-xs text-edu-navy/70">{student.batch || '-'}</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-2 py-2 align-top">
                        {isEditing ? (
                          <div className="flex flex-wrap gap-1">
                            <button
                              type="button"
                              onClick={() => saveEdit(student.id)}
                              disabled={savingEdit}
                              className="rounded-md bg-edu-teal px-2 py-1 text-[11px] font-semibold text-white disabled:opacity-60"
                            >
                              {savingEdit ? 'Saving…' : 'Save'}
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
                              {deletingId === student.id ? 'Del…' : 'Delete'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Selection summary bar */}
            {selectedIds.size > 0 && (
              <div className="mt-4 flex items-center justify-between rounded-xl border border-edu-teal/30 bg-edu-teal/5 px-4 py-2.5 text-sm">
                <span className="font-medium text-edu-navy">
                  {selectedIds.size} student{selectedIds.size > 1 ? 's' : ''} selected
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedIds(new Set())}
                    className="text-xs font-medium text-edu-navy/60 hover:text-edu-navy"
                  >
                    Clear selection
                  </button>
                  <button
                    type="button"
                    onClick={handleBulkDelete}
                    disabled={bulkDeleting}
                    className="rounded-lg bg-red-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-red-600 disabled:opacity-60"
                  >
                    {bulkDeleting ? 'Deleting…' : 'Delete Selected'}
                  </button>
                </div>
              </div>
            )}
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
