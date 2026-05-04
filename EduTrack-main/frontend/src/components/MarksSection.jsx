import { useEffect, useMemo, useState } from 'react'
import api from '../api/api'
import { BRANCH_OPTIONS, SUBJECT_OPTIONS, SEMESTER_OPTIONS } from '../config/academicOptions'
import BulkStudentImportPanel from './BulkStudentImportPanel'

const BASE_STUDENTS = [
  { id: '101', name: 'Rahul Sharma' },
  { id: '102', name: 'Aman Patel' },
  { id: '103', name: 'Priya Mehta' },
  { id: '104', name: 'Sneha Joshi' },
  { id: '105', name: 'Arjun Nair' },
]

const ACCENT_COLORS = {
  Quiz:       '#2FA4A9',
  Exam:       '#4E98A2',
  Assignment: '#98B196',
  Practicals: '#215D87',
}

function MarksSection({ type, mode = 'enter', initialData = null, records = [], onSubmitData, onStudentsImported }) {
  const isViewMode = mode === 'view'
  const sourceRecords = records.length > 0 ? records : initialData ? [initialData] : []
  const [open, setOpen] = useState(isViewMode)
  const [branch, setBranch] = useState(isViewMode ? '' : initialData?.branch ?? '')
  const [subject, setSubject] = useState(isViewMode ? '' : initialData?.subject ?? '')
  const [semester, setSemester] = useState(isViewMode ? '' : initialData?.semester ?? '')
  const [outOfMarks, setOutOfMarks] = useState(initialData?.outOfMarks ?? '')
  const [databaseStudents, setDatabaseStudents] = useState([])
  const [students, setStudents] = useState(initialData?.students ?? BASE_STUDENTS)
  const [marks, setMarks] = useState(
    initialData?.marks || Object.fromEntries(BASE_STUDENTS.map((s) => [s.id, ''])),
  )
  const [submitted, setSubmitted] = useState(false)
  const [viewModeMarks, setViewModeMarks] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [viewLoading, setViewLoading] = useState(false)

  // Enter mode needs branch + subject + semester; view mode only needs branch + semester
  const allSelected = branch && subject && semester
  const viewReady = Boolean(branch && semester)
  const accent = ACCENT_COLORS[type] || '#2FA4A9'

  // ── Load all students from API ─────────────────────────────────────────────
  useEffect(() => {
    const loadStudents = async () => {
      try {
        const response = await api.get('/api/students')
        const dbStudents = Array.isArray(response?.data)
          ? response.data.map((s) => ({
              id: String(s.student_id),
              name: s.name || String(s.student_id),
              branch: s.branch,
              semester: String(s.semester || ''),
            }))
          : []
        if (dbStudents.length > 0) {
          setDatabaseStudents(dbStudents)
          setStudents(dbStudents)
          setMarks((prev) => {
            const next = { ...prev }
            dbStudents.forEach((s) => { if (typeof next[s.id] === 'undefined') next[s.id] = '' })
            return next
          })
        }
      } catch {
        // Keep local students when API unavailable
      }
    }
    loadStudents()
  }, [])

  // Reset view result when filters change
  useEffect(() => {
    if (!isViewMode) return
    setShowResult(false)
    setViewModeMarks(null)
  }, [branch, subject, semester, isViewMode])

  // ── Fetch marks from backend in view mode ──────────────────────────────────
  useEffect(() => {
    if (!isViewMode || !showResult || databaseStudents.length === 0) {
      if (!showResult) setViewModeMarks(null)
      return
    }

    const fetchViewModeMarks = async () => {
      setViewLoading(true)
      try {
        // Fetch all students in the selected semester
        const semesterStudents = databaseStudents.filter(
          (s) => !semester || String(s.semester || '') === String(semester),
        )
        const targetStudents = semesterStudents.length > 0 ? semesterStudents : databaseStudents

        const allMarksData = await Promise.all(
          targetStudents.map(async (student) => {
            try {
              const res = await api.get(`/api/marks/${student.id}`)
              return Array.isArray(res.data) ? res.data : []
            } catch {
              return []
            }
          }),
        )

        const flattened = allMarksData.flat()
        const normalizedType = type.toLowerCase()

        // Filter by type only (subject is optional)
        const forType = subject
          ? flattened.filter(
              (rec) =>
                String(rec?.type || '').trim().toLowerCase() === normalizedType &&
                String(rec?.subject || '').trim().toLowerCase() === subject.toLowerCase(),
            )
          : flattened.filter(
              (rec) => String(rec?.type || '').trim().toLowerCase() === normalizedType,
            )

        // Take latest marks per student (if multiple records exist)
        const marksById = {}
        forType.forEach((rec) => {
          const studentId = String(rec?.student_id || '').trim()
          if (studentId) {
            // Keep highest or latest — use latest stored
            if (marksById[studentId] === undefined) {
              marksById[studentId] = rec?.marks ?? null
            }
          }
        })

        setViewModeMarks(marksById)
      } catch {
        setViewModeMarks({})
      } finally {
        setViewLoading(false)
      }
    }

    fetchViewModeMarks()
  }, [isViewMode, showResult, databaseStudents, subject, semester, type])

  // ── Semester-filtered student list (enter mode) ────────────────────────────
  const filteredStudents = useMemo(() => {
    if (!semester) return databaseStudents.length > 0 ? databaseStudents : students
    const target = String(semester)
    const pool = databaseStudents.length > 0 ? databaseStudents : students
    const filtered = pool.filter((s) => String(s.semester || '') === target)
    return filtered.length > 0 ? filtered : pool
  }, [databaseStudents, students, semester])

  // In view mode: show semester-filtered DB students; in enter mode: semester-filtered list
  const displayedStudents = isViewMode && showResult
    ? (databaseStudents.length > 0 ? databaseStudents : students).filter(
        (s) => !semester || String(s.semester || '') === String(semester),
      )
    : filteredStudents

  const displayedMarks = isViewMode && viewModeMarks ? viewModeMarks : (isViewMode ? {} : marks)
  const shouldShowTable = isViewMode ? showResult : allSelected

  const handleChange = (id, value) => {
    if (isViewMode) return
    setMarks((prev) => ({ ...prev, [id]: value }))
  }

  const handleNameChange = (id, value) => {
    if (isViewMode) return
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, name: value } : s)))
  }

  const handleSubmit = () => {
    if (!allSelected || isViewMode) return
    if (onSubmitData) {
      onSubmitData({ branch, subject, semester, outOfMarks, students: filteredStudents, marks })
    }
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 2500)
  }

  const selectClass =
    'w-full rounded-xl border border-edu-blue/20 bg-white px-3 py-2.5 text-sm text-edu-navy outline-none transition focus:border-edu-teal focus:ring-2 focus:ring-edu-teal/25'

  return (
    <div className="rounded-2xl bg-white p-6 shadow-md">
      <div
        className={`flex items-center justify-between ${isViewMode ? '' : 'cursor-pointer'}`}
        onClick={() => { if (isViewMode) return; setOpen((p) => !p) }}
      >
        <div className="flex items-center gap-3">
          <div className="h-8 w-1.5 rounded-full" style={{ backgroundColor: accent }} />
          <h2 className="text-xl font-bold text-edu-navy">{type}</h2>
        </div>
        {!isViewMode && (
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full text-xl font-bold text-white transition hover:opacity-80"
            style={{ backgroundColor: accent }}
            onClick={(e) => { e.stopPropagation(); setOpen((p) => !p) }}
          >
            {open ? '−' : '+'}
          </button>
        )}
      </div>

      {!open ? null : (
        <>
          {/* Filters */}
          <div className="mb-5 mt-5 grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-edu-blue">Branch</label>
              <select className={selectClass} value={branch} onChange={(e) => setBranch(e.target.value)}>
                <option value="">Select Branch</option>
                {BRANCH_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-edu-blue">
                Subject {isViewMode && <span className="text-edu-navy/40">(optional)</span>}
              </label>
              <select className={selectClass} value={subject} onChange={(e) => setSubject(e.target.value)}>
                <option value="">Select Subject</option>
                {SUBJECT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-edu-blue">Semester</label>
              <select className={selectClass} value={semester} onChange={(e) => setSemester(e.target.value)}>
                <option value="">Select Semester</option>
                {SEMESTER_OPTIONS.map((o) => <option key={o} value={o}>Sem {o}</option>)}
              </select>
            </div>
          </div>

          {/* Show button — view mode, enabled with just branch + semester */}
          {isViewMode && viewReady && (
            <div className="mb-5 flex gap-3">
              <button
                type="button"
                onClick={() => setShowResult((p) => !p)}
                className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-85"
                style={{ backgroundColor: accent }}
              >
                {showResult ? '− Hide' : '+ Show'}
              </button>
            </div>
          )}

          {/* Bulk import — enter mode */}
          {!isViewMode && allSelected && (
            <BulkStudentImportPanel
              title={`Bulk Student Import for ${type}`}
              className="mb-5"
              importDefaults={{ branch: branch || 'General', semester: semester || 1, batch: 'A', counsellor_name: 'Unassigned' }}
              onImported={onStudentsImported}
            />
          )}

          {/* Loading */}
          {viewLoading && (
            <div className="rounded-xl border border-edu-blue/10 bg-edu-sand/20 p-4 text-center text-sm text-edu-blue">
              Loading {type.toLowerCase()} data…
            </div>
          )}

          {/* Empty state */}
          {!shouldShowTable && !viewLoading ? (
            <div className="rounded-xl border border-dashed border-edu-blue/30 bg-edu-sand/20 p-6 text-center text-sm text-edu-blue">
              {isViewMode
                ? 'Select Branch and Semester then click Show.'
                : 'Select Branch, Subject, and Semester to view the student list.'}
            </div>
          ) : shouldShowTable && !viewLoading ? (
            <>
              {/* Out of Marks — only in enter mode */}
              {!isViewMode && (
                <div className="mb-5">
                  <label className="mb-2 block text-sm font-medium text-edu-navy">Out of Marks</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={outOfMarks}
                    onChange={(e) => setOutOfMarks(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="e.g., 100"
                    className="w-full max-w-xs rounded-xl border border-edu-blue/20 bg-white px-3 py-2.5 text-sm text-edu-navy outline-none transition focus:border-edu-teal focus:ring-2 focus:ring-edu-teal/25"
                  />
                </div>
              )}

              <div className="overflow-x-auto rounded-xl border border-edu-blue/10">
                <table className="w-full min-w-[360px] text-sm">
                  <thead>
                    <tr className="border-b border-edu-blue/10 bg-[#DBD8A0]/50 text-left">
                      <th className="px-5 py-3 font-semibold text-edu-navy">Student ID</th>
                      <th className="px-5 py-3 font-semibold text-edu-navy">Student Name</th>
                      <th className="px-5 py-3 font-semibold text-edu-navy">
                        {isViewMode ? 'Marks' : `Marks${outOfMarks ? ` (out of ${outOfMarks})` : ' (out of 100)'}`}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedStudents.map((student) => (
                      <tr
                        key={student.id}
                        className="border-b border-edu-blue/10 transition-colors last:border-0 hover:bg-edu-sand/20"
                      >
                        <td className="px-5 py-3 font-medium text-edu-navy">{student.id}</td>
                        <td className="px-5 py-3 text-edu-blue">
                          {!isViewMode && student.name === '' ? (
                            <input
                              type="text"
                              value={student.name}
                              onChange={(e) => handleNameChange(student.id, e.target.value)}
                              placeholder="Enter name"
                              className="w-40 rounded-lg border border-edu-blue/20 bg-white px-3 py-1.5 text-sm text-edu-navy outline-none transition focus:border-edu-teal focus:ring-2 focus:ring-edu-teal/25"
                            />
                          ) : (
                            student.name
                          )}
                        </td>
                        <td className="px-5 py-3">
                          {isViewMode ? (
                            <span className="font-medium text-edu-navy">
                              {displayedMarks[student.id] === '' ||
                              displayedMarks[student.id] === undefined ||
                              displayedMarks[student.id] === null
                                ? '—'
                                : displayedMarks[student.id]}
                            </span>
                          ) : (
                            <input
                              type="text"
                              inputMode="numeric"
                              value={displayedMarks[student.id] ?? ''}
                              onChange={(e) => handleChange(student.id, e.target.value.replace(/[^0-9]/g, ''))}
                              placeholder="Enter marks"
                              className="w-36 rounded-lg border border-edu-blue/20 bg-white px-3 py-1.5 text-sm text-edu-navy outline-none transition focus:border-edu-teal focus:ring-2 focus:ring-edu-teal/25"
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                    {displayedStudents.length === 0 && (
                      <tr>
                        <td colSpan="3" className="px-5 py-6 text-center text-sm text-edu-blue/60">
                          No students found for the selected semester.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {!isViewMode && (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-85"
                    style={{ backgroundColor: '#6BCF8E' }}
                  >
                    Submit {type} Marks
                  </button>
                  {submitted && (
                    <span className="text-sm font-medium text-green-600">{type} marks submitted!</span>
                  )}
                </div>
              )}
            </>
          ) : null}
        </>
      )}
    </div>
  )
}

export default MarksSection
