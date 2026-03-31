import { useEffect, useMemo, useState } from 'react'
import api from '../api/api'
import { BRANCH_OPTIONS, SUBJECT_OPTIONS, SEMESTER_OPTIONS, BATCH_OPTIONS } from '../config/academicOptions'

const DUMMY_STUDENTS = [
  { id: '101', name: 'Rahul Sharma' },
  { id: '102', name: 'Aman Patel' },
  { id: '103', name: 'Priya Mehta' },
  { id: '104', name: 'Sneha Joshi' },
  { id: '105', name: 'Arjun Nair' },
]

function AttendanceSection({ mode = 'enter', initialData = null, records = [], onSubmitData }) {
  const isViewMode = mode === 'view'
  const sourceRecords = records.length > 0 ? records : initialData ? [initialData] : []
  const [open, setOpen] = useState(isViewMode)
  const [branch, setBranch] = useState(isViewMode ? '' : initialData?.branch ?? '')
  const [subject, setSubject] = useState(isViewMode ? '' : initialData?.subject ?? '')
  const [semester, setSemester] = useState(isViewMode ? '' : initialData?.semester ?? '')
  const [sessionType, setSessionType] = useState(isViewMode ? '' : initialData?.sessionType ?? '')
  const [batch, setBatch] = useState(isViewMode ? '' : initialData?.batch ?? '')
  const [attendance, setAttendance] = useState(
    initialData?.attendance || Object.fromEntries(DUMMY_STUDENTS.map((student) => [student.id, false])),
  )
  const [submitted, setSubmitted] = useState(false)
  const [enterStudents, setEnterStudents] = useState(initialData?.students || DUMMY_STUDENTS)
  const [showResult, setShowResult] = useState(false)
  const [viewModeData, setViewModeData] = useState(null)

  const isLecture = sessionType === 'Lecture'
  const classFilterReady = branch && subject && semester && sessionType && (isLecture || batch)

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
  const matchedRecord = useMemo(() => {
    if (!isViewMode || sourceRecords.length === 0) return null

    return [...sourceRecords].reverse().find((record) => {
      if (sessionType && record.sessionType !== sessionType) return false
      if (branch && record.branch !== branch) return false
      if (subject && record.subject !== subject) return false
      if (semester && record.semester !== semester) return false
      if (sessionType === 'Lab' && batch && record.batch !== batch) return false
      return true
    }) || null
  }, [isViewMode, sourceRecords, sessionType, branch, subject, semester, batch])

  const students = isViewMode ? viewModeData?.students || [] : classStudents
  const displayedAttendance = isViewMode ? viewModeData?.attendance || {} : attendance
  const shouldShowTable = isViewMode ? showResult && Boolean(viewModeData) : classFilterReady

  const toggle = (id) => {
    if (isViewMode) return
    setAttendance((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  useEffect(() => {
    if (isViewMode) return

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
        setAttendance((prev) => {
          const next = { ...prev }
          dbStudents.forEach((student) => {
            if (typeof next[student.id] === 'undefined') {
              next[student.id] = false
            }
          })
          return next
        })
      } catch (_error) {
        // Keep local dummy students when API is unavailable.
      }
    }

    loadStudents()
  }, [isViewMode])

  useEffect(() => {
    if (!isViewMode) return
    setShowResult(false)
  }, [branch, subject, semester, sessionType, batch, isViewMode])

  // Fetch attendance from backend when "Show" is clicked in view mode
  useEffect(() => {
    if (!isViewMode || !showResult || classStudents.length === 0) {
      setViewModeData(null)
      return
    }

    const fetchViewModeData = async () => {
      try {
        const allAttendance = await Promise.all(
          classStudents.map(async (student) => {
            try {
              const attRes = await api.get(`/api/attendance/${student.id}`)
              return Array.isArray(attRes.data) ? attRes.data : []
            } catch {
              return []
            }
          }),
        )

        const flattened = allAttendance.flat()
        const forSubject = flattened.filter((rec) => (rec.subject || '') === subject)

        const attendanceByStudent = {}
        forSubject.forEach((rec) => {
          attendanceByStudent[rec.student_id] = rec.status === 'Present'
        })

        setViewModeData({
          subject,
          sessionType,
          branch,
          semester,
          batch,
          students: classStudents,
          attendance: attendanceByStudent,
        })
      } catch (_err) {
        setViewModeData(null)
      }
    }

    fetchViewModeData()
  }, [isViewMode, showResult, classStudents, subject, sessionType, branch, semester, batch])

  const handleSubmit = async () => {
    if (!classFilterReady || isViewMode) return
    if (classStudents.length === 0) {
      alert('No students found for selected class.')
      return
    }

    if (onSubmitData) {
      try {
        await onSubmitData({
          branch,
          subject,
          semester,
          sessionType,
          batch,
          attendance,
          students: classStudents,
        })
      } catch (error) {
        const message =
          error?.response?.data?.error ||
          'Failed to save attendance. Please verify backend and student records.'
        alert(message)
        return
      }
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
        onClick={() => {
          if (isViewMode) return
          setOpen((prev) => !prev)
        }}
      >
        <div className="flex items-center gap-3">
          <div className="h-8 w-1.5 rounded-full bg-[#2FA4A9]" />
          <h2 className="text-xl font-bold text-edu-navy">Attendance</h2>
        </div>
        {!isViewMode && (
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2FA4A9] text-xl font-bold text-white transition hover:bg-edu-navy"
            onClick={(event) => {
              event.stopPropagation()
              setOpen((prev) => !prev)
            }}
          >
            {open ? '−' : '+'}
          </button>
        )}
      </div>

      {!open ? null : (
        <>
          <div className="mb-5 mt-5">
            <label className="mb-2 block text-xs font-medium text-edu-blue">Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setSessionType('Lecture')
                  setBatch('')
                }}
                className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                  sessionType === 'Lecture'
                    ? 'bg-[#2FA4A9] text-white'
                    : 'border border-edu-blue/20 bg-white text-edu-navy hover:border-edu-teal'
                }`}
              >
                Lecture
              </button>
              <button
                type="button"
                onClick={() => {
                  setSessionType('Lab')
                  setBatch('')
                }}
                className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                  sessionType === 'Lab'
                    ? 'bg-[#2FA4A9] text-white'
                    : 'border border-edu-blue/20 bg-white text-edu-navy hover:border-edu-teal'
                }`}
              >
                Lab
              </button>
            </div>
          </div>

          <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-edu-blue">Branch</label>
              <select className={selectClass} value={branch} onChange={(event) => setBranch(event.target.value)}>
                <option value="">Select Branch</option>
                {BRANCH_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-edu-blue">Subject</label>
              <select className={selectClass} value={subject} onChange={(event) => setSubject(event.target.value)}>
                <option value="">Select Subject</option>
                {SUBJECT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-edu-blue">Semester</label>
              <select className={selectClass} value={semester} onChange={(event) => setSemester(event.target.value)}>
                <option value="">Select Semester</option>
                {SEMESTER_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    Sem {option}
                  </option>
                ))}
              </select>
            </div>
            {!isLecture && (
              <div>
                <label className="mb-1 block text-xs font-medium text-edu-blue">Batch</label>
                <select className={selectClass} value={batch} onChange={(event) => setBatch(event.target.value)}>
                  <option value="">Select Batch</option>
                  {BATCH_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      Batch {option}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {isViewMode && (
            <div className="mb-5">
              <button
                type="button"
                onClick={() => setShowResult(true)}
                disabled={!classFilterReady}
                className="rounded-xl bg-[#2FA4A9] px-5 py-2.5 text-sm font-semibold text-white transition enabled:hover:bg-edu-navy disabled:cursor-not-allowed disabled:opacity-50"
              >
                Show
              </button>
            </div>
          )}

          {!isViewMode && classFilterReady && (
            <div className="mb-5 flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded-xl bg-[#4E98A2] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-edu-navy"
              >
                Upload
              </button>
            </div>
          )}

          {!shouldShowTable ? (
            <div className="rounded-xl border border-dashed border-edu-blue/30 bg-edu-sand/20 p-6 text-center text-sm text-edu-blue">
              {isViewMode
                ? !showResult
                  ? 'Select filters and click Show.'
                  : 'No attendance found for selected class.'
                : `Select Branch, Subject, Semester${isLecture ? '' : ', and Batch'} to view students.`}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border border-edu-blue/10">
                <table className="w-full min-w-[400px] text-sm">
                  <thead>
                    <tr className="border-b border-edu-blue/10 bg-[#DBD8A0]/50 text-left">
                      <th className="px-5 py-3 font-semibold text-edu-navy">Student ID</th>
                      <th className="px-5 py-3 font-semibold text-edu-navy">Student Name</th>
                      <th className="px-5 py-3 text-center font-semibold text-edu-navy">Present</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr
                        key={student.id}
                        className="border-b border-edu-blue/10 transition-colors last:border-0 hover:bg-edu-sand/20"
                      >
                        <td className="px-5 py-3 font-medium text-edu-navy">{student.id}</td>
                        <td className="px-5 py-3 text-edu-blue">{student.name}</td>
                        <td className="px-5 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={Boolean(displayedAttendance[student.id])}
                            onChange={() => toggle(student.id)}
                            disabled={isViewMode}
                            className="h-4 w-4 accent-[#2FA4A9]"
                          />
                        </td>
                      </tr>
                    ))}
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
                  {submitted && (
                    <span className="text-sm font-medium text-green-600">Attendance submitted!</span>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

export default AttendanceSection
