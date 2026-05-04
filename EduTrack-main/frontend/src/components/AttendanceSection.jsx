import { useEffect, useMemo, useState } from 'react'
import api from '../api/api'
import { BRANCH_OPTIONS, SUBJECT_OPTIONS, SEMESTER_OPTIONS, BATCH_OPTIONS } from '../config/academicOptions'
import BulkStudentImportPanel from './BulkStudentImportPanel'

const DUMMY_STUDENTS = [
  { id: '101', name: 'Rahul Sharma' },
  { id: '102', name: 'Aman Patel' },
  { id: '103', name: 'Priya Mehta' },
  { id: '104', name: 'Sneha Joshi' },
  { id: '105', name: 'Arjun Nair' },
]

const todayStr = () => new Date().toISOString().slice(0, 10)

function AttendanceSection({ mode = 'enter', initialData = null, records = [], onSubmitData, onStudentsImported }) {
  const isViewMode = mode === 'view'
  const sourceRecords = records.length > 0 ? records : initialData ? [initialData] : []

  const [open, setOpen] = useState(isViewMode)
  const [branch, setBranch] = useState(isViewMode ? '' : initialData?.branch ?? '')
  const [subject, setSubject] = useState(isViewMode ? '' : initialData?.subject ?? '')
  const [semester, setSemester] = useState(isViewMode ? '' : initialData?.semester ?? '')
  const [sessionType, setSessionType] = useState(isViewMode ? '' : initialData?.sessionType ?? '')
  const [batch, setBatch] = useState(isViewMode ? '' : initialData?.batch ?? '')
  const [date, setDate] = useState(initialData?.date ?? todayStr())
  const [attendance, setAttendance] = useState(
    initialData?.attendance || Object.fromEntries(DUMMY_STUDENTS.map((s) => [s.id, false])),
  )
  const [submitted, setSubmitted] = useState(false)
  const [enterStudents, setEnterStudents] = useState(initialData?.students || DUMMY_STUDENTS)
  const [showResult, setShowResult] = useState(false)
  const [viewModeData, setViewModeData] = useState(null)
  const [allPresent, setAllPresent] = useState(false)
  const [viewLoading, setViewLoading] = useState(false)

  const isLecture = sessionType === 'Lecture'
  // Enter mode: all 4 fields required (+ batch for lab)
  const classFilterReady = branch && subject && semester && sessionType && (isLecture || batch)
  // View mode: only branch + semester + sessionType required
  const viewFilterReady = Boolean(branch && semester && sessionType)

  const classStudents = useMemo(() => {
    return (enterStudents || []).filter((student) => {
      const studentBranch = String(student.branch || '').toUpperCase()
      const studentSemester = String(student.semester || '')
      const studentBatch = String(student.batch || '').toUpperCase()
      const branchMatch = !branch || studentBranch === String(branch).toUpperCase()
      const semesterMatch = !semester || studentSemester === String(semester)
      const batchMatch = isLecture || !batch || studentBatch === String(batch).toUpperCase()
      return branchMatch && semesterMatch && batchMatch
    })
  }, [enterStudents, branch, semester, batch, isLecture])

  const students = isViewMode ? (viewModeData?.students || []) : classStudents
  // In view mode: avgAttendance map; in enter mode: boolean map
  const displayedAttendance = isViewMode ? (viewModeData?.avgAttendance || {}) : attendance
  const shouldShowTable = isViewMode ? showResult && viewModeData !== null : classFilterReady

  // ── Toggle individual student (enter mode) ──────────────────────────────────
  const toggle = (id) => {
    if (isViewMode) return
    setAttendance((prev) => {
      const next = { ...prev, [id]: !prev[id] }
      setAllPresent(students.every((s) => next[s.id]))
      return next
    })
  }

  const toggleAllPresent = () => {
    if (isViewMode) return
    const newState = !allPresent
    setAllPresent(newState)
    setAttendance((prev) => {
      const next = { ...prev }
      students.forEach((s) => { next[s.id] = newState })
      return next
    })
  }

  // ── Load students from API ──────────────────────────────────────────────────
  useEffect(() => {
    const loadStudents = async () => {
      try {
        const response = await api.get('/api/students')
        const dbStudents = Array.isArray(response?.data)
          ? response.data.map((student) => ({
              id: String(student.student_id),
              name: student.name || String(student.student_id),
              branch: student.branch,
              semester: String(student.semester || ''),
              batch: student.batch,
            }))
          : []
        if (dbStudents.length === 0) return
        setEnterStudents(dbStudents)
        if (!isViewMode) {
          setAttendance((prev) => {
            const next = { ...prev }
            dbStudents.forEach((s) => {
              if (typeof next[s.id] === 'undefined') next[s.id] = false
            })
            return next
          })
        }
      } catch {
        // Keep dummy students when API unavailable
      }
    }
    loadStudents()
  }, [isViewMode])

  // Reset on filter change
  useEffect(() => {
    if (!isViewMode) return
    setShowResult(false)
    setViewModeData(null)
  }, [branch, subject, semester, sessionType, batch, isViewMode])

  // Reset allPresent when student list changes
  useEffect(() => {
    if (!isViewMode) setAllPresent(false)
  }, [classStudents, isViewMode])

  // ── Fetch view mode data: avg attendance per student ────────────────────────
  useEffect(() => {
    if (!isViewMode || !showResult || classStudents.length === 0) {
      if (!showResult) setViewModeData(null)
      return
    }

    const fetchViewModeData = async () => {
      setViewLoading(true)
      try {
        const allAttendance = await Promise.all(
          classStudents.map(async (student) => {
            try {
              const res = await api.get(`/api/attendance/${student.id}`)
              return { id: student.id, records: Array.isArray(res.data) ? res.data : [] }
            } catch {
              return { id: student.id, records: [] }
            }
          }),
        )

        const avgAttendance = {}
        allAttendance.forEach(({ id, records }) => {
          // Optionally filter by subject if one is selected
          const relevant = subject
            ? records.filter(
                (r) => String(r?.subject || '').trim().toLowerCase() === subject.toLowerCase(),
              )
            : records

          if (relevant.length === 0) {
            avgAttendance[id] = null // no data
          } else {
            const presentCount = relevant.filter(
              (r) => String(r?.status || '').trim().toLowerCase() === 'present',
            ).length
            avgAttendance[id] = Math.round((presentCount / relevant.length) * 100)
          }
        })

        setViewModeData({ students: classStudents, avgAttendance })
      } catch {
        setViewModeData({ students: classStudents, avgAttendance: {} })
      } finally {
        setViewLoading(false)
      }
    }

    fetchViewModeData()
  }, [isViewMode, showResult, classStudents, subject])

  // ── Submit attendance (enter mode) ──────────────────────────────────────────
  const handleSubmit = async () => {
    if (!classFilterReady || isViewMode) return
    if (classStudents.length === 0) {
      alert('No students found for selected class.')
      return
    }
    if (onSubmitData) {
      try {
        await onSubmitData({ branch, subject, semester, sessionType, batch, date, attendance, students: classStudents })
      } catch (error) {
        alert(error?.response?.data?.error || 'Failed to save attendance.')
        return
      }
    }
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 2500)
  }

  const selectClass =
    'w-full rounded-xl border border-edu-blue/20 bg-white px-3 py-2.5 text-sm text-edu-navy outline-none transition focus:border-edu-teal focus:ring-2 focus:ring-edu-teal/25'

  const normalizePresentFlag = (value) => {
    const n = String(value || '').trim().toLowerCase()
    if (!n) return null
    if (['1', 'true', 'present', 'yes', 'y', 'p'].includes(n)) return 'Present'
    if (['0', 'false', 'absent', 'no', 'n', 'a'].includes(n)) return 'Absent'
    return null
  }

  const handleAttendanceImportAfterBulk = async ({ parsed }) => {
    if (!classFilterReady || !subject) {
      return { message: 'Select Type/Branch/Subject/Semester first to also save attendance statuses.' }
    }
    let existingStudentIds = new Set()
    try {
      const studentsRes = await api.get('/api/students')
      existingStudentIds = new Set(
        (Array.isArray(studentsRes?.data) ? studentsRes.data : []).map((s) =>
          String(s.student_id || '').trim(),
        ),
      )
    } catch {
      return { message: 'Could not verify existing students. Attendance import skipped.' }
    }
    const studentsWithFlags = (parsed?.students || [])
      .filter((s) => normalizePresentFlag(s.present_flag) !== null)
      .filter((s) => existingStudentIds.has(String(s.student_id || '').trim()))
    const missingStudents = (parsed?.students || [])
      .filter((s) => normalizePresentFlag(s.present_flag) !== null)
      .filter((s) => !existingStudentIds.has(String(s.student_id || '').trim()))
    if (studentsWithFlags.length === 0) {
      return {
        message: 'No attendance rows were saved — no matching student IDs found.',
        errors: missingStudents.slice(0, 5).map((s) => ({ row: '-', error: `Student not found: ${s.student_id}` })),
      }
    }
    const entries = studentsWithFlags.map((s) => ({
      student_id: String(s.student_id),
      subject,
      date,
      status: normalizePresentFlag(s.present_flag),
    }))
    try {
      await api.post('/api/attendance', { attendance: entries })
      return {
        message: `${entries.length} attendance rows saved for subject ${subject}.`,
        errors: missingStudents.slice(0, 5).map((s) => ({ row: '-', error: `Skipped unknown ID: ${s.student_id}` })),
      }
    } catch {
      return { message: 'Attendance rows could not be saved.' }
    }
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-md">
      <div
        className={`flex items-center justify-between ${isViewMode ? '' : 'cursor-pointer'}`}
        onClick={() => { if (isViewMode) return; setOpen((p) => !p) }}
      >
        <div className="flex items-center gap-3">
          <div className="h-8 w-1.5 rounded-full bg-[#2FA4A9]" />
          <h2 className="text-xl font-bold text-edu-navy">Attendance</h2>
        </div>
        {!isViewMode && (
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2FA4A9] text-xl font-bold text-white transition hover:bg-edu-navy"
            onClick={(e) => { e.stopPropagation(); setOpen((p) => !p) }}
          >
            {open ? '−' : '+'}
          </button>
        )}
      </div>

      {!open ? null : (
        <>
          {/* Session Type toggle */}
          <div className="mb-5 mt-5">
            <label className="mb-2 block text-xs font-medium text-edu-blue">Type</label>
            <div className="flex gap-2">
              {['Lecture', 'Lab'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => { setSessionType(type); setBatch('') }}
                  className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                    sessionType === type
                      ? 'bg-[#2FA4A9] text-white'
                      : 'border border-edu-blue/20 bg-white text-edu-navy hover:border-edu-teal'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {!sessionType && (
            <div className="rounded-xl border border-dashed border-edu-blue/30 bg-edu-sand/20 p-6 text-center text-sm text-edu-blue">
              Select Lecture or Lab to continue.
            </div>
          )}

          {/* Filters */}
          {sessionType && (
            <div className={`mb-5 grid gap-3 sm:grid-cols-2 ${!isLecture ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
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
              {!isLecture && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-edu-blue">Batch</label>
                  <select className={selectClass} value={batch} onChange={(e) => setBatch(e.target.value)}>
                    <option value="">Select Batch</option>
                    {BATCH_OPTIONS.map((o) => <option key={o} value={o}>Batch {o}</option>)}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Date picker — enter mode, visible as soon as session type is chosen */}
          {!isViewMode && sessionType && (
            <div className="mb-5">
              <label className="mb-1 block text-xs font-medium text-edu-blue">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={todayStr()}
                className={`${selectClass} max-w-xs`}
              />
            </div>
          )}

          {/* Bulk import — enter mode */}
          {!isViewMode && sessionType && classFilterReady && (
            <BulkStudentImportPanel
              title="Bulk Student Import"
              className="mb-5"
              importDefaults={{ branch: branch || 'General', semester: semester || 1, batch: batch || 'A', counsellor_name: 'Unassigned' }}
              skipStudentCreation
              onAfterImport={handleAttendanceImportAfterBulk}
              onImported={onStudentsImported}
            />
          )}

          {/* Show button — view mode */}
          {isViewMode && sessionType && (
            <div className="mb-5">
              <button
                type="button"
                onClick={() => setShowResult(true)}
                disabled={!viewFilterReady}
                className="rounded-xl bg-[#2FA4A9] px-5 py-2.5 text-sm font-semibold text-white transition enabled:hover:bg-edu-navy disabled:cursor-not-allowed disabled:opacity-50"
              >
                Show
              </button>
            </div>
          )}

          {/* Loading */}
          {viewLoading && (
            <div className="rounded-xl border border-edu-blue/10 bg-edu-sand/20 p-4 text-center text-sm text-edu-blue">
              Loading attendance data…
            </div>
          )}

          {/* Empty state */}
          {sessionType && !shouldShowTable && !viewLoading ? (
            <div className="rounded-xl border border-dashed border-edu-blue/30 bg-edu-sand/20 p-6 text-center text-sm text-edu-blue">
              {isViewMode
                ? !showResult
                  ? 'Select Branch, Semester and Type then click Show.'
                  : 'No attendance records found for the selected class.'
                : `Select Branch, Subject, Semester${isLecture ? '' : ', and Batch'} to view students.`}
            </div>
          ) : sessionType && shouldShowTable && !viewLoading ? (
            <>
              <div className="overflow-x-auto rounded-xl border border-edu-blue/10">
                <table className="w-full min-w-[400px] text-sm">
                  <thead>
                    <tr className="border-b border-edu-blue/10 bg-[#DBD8A0]/50 text-left">
                      <th className="px-5 py-3 font-semibold text-edu-navy">Student ID</th>
                      <th className="px-5 py-3 font-semibold text-edu-navy">Student Name</th>
                      <th className="px-5 py-3 text-center font-semibold text-edu-navy">
                        {isViewMode ? (
                          'Avg. Attendance'
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <span>Present</span>
                            <label className="flex cursor-pointer items-center gap-1 text-xs font-normal text-edu-navy/70">
                              <input
                                type="checkbox"
                                checked={allPresent}
                                onChange={toggleAllPresent}
                                className="h-4 w-4 accent-[#2FA4A9]"
                              />
                              All
                            </label>
                          </div>
                        )}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => {
                      const avgVal = displayedAttendance[student.id]
                      return (
                        <tr
                          key={student.id}
                          className="border-b border-edu-blue/10 transition-colors last:border-0 hover:bg-edu-sand/20"
                        >
                          <td className="px-5 py-3 font-medium text-edu-navy">{student.id}</td>
                          <td className="px-5 py-3 text-edu-blue">{student.name}</td>
                          <td className="px-5 py-3 text-center">
                            {isViewMode ? (
                              avgVal === null || avgVal === undefined ? (
                                <span className="text-edu-navy/40">—</span>
                              ) : (
                                <span
                                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                    avgVal < 75
                                      ? 'bg-red-100 text-red-700'
                                      : 'bg-green-100 text-green-700'
                                  }`}
                                >
                                  {avgVal}%
                                </span>
                              )
                            ) : (
                              <input
                                type="checkbox"
                                checked={Boolean(displayedAttendance[student.id])}
                                onChange={() => toggle(student.id)}
                                className="h-4 w-4 accent-[#2FA4A9]"
                              />
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {!isViewMode && (
                <div className="mt-5 flex items-center gap-4">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="rounded-xl bg-[#6BCF8E] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-green-600"
                  >
                    Submit Attendance
                  </button>
                  {submitted && <span className="text-sm font-medium text-green-600">Attendance submitted!</span>}
                </div>
              )}
            </>
          ) : null}
        </>
      )}
    </div>
  )
}

export default AttendanceSection
