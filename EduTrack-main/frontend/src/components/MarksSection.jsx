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
  Quiz: '#2FA4A9',
  Exam: '#4E98A2',
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
    initialData?.marks || Object.fromEntries(BASE_STUDENTS.map((student) => [student.id, ''])),
  )
  const [submitted, setSubmitted] = useState(false)

  const allSelected = branch && subject && semester
  const accent = ACCENT_COLORS[type] || '#2FA4A9'

  // Fetch students from API on mount
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
          }))
          : []

        if (dbStudents.length > 0) {
          setDatabaseStudents(dbStudents)
          setStudents(dbStudents)
          setMarks((prev) => {
            const next = { ...prev }
            dbStudents.forEach((student) => {
              if (typeof next[student.id] === 'undefined') {
                next[student.id] = ''
              }
            })
            return next
          })
        }
      } catch (_error) {
        // Keep local students when API is unavailable
      }
    }

    loadStudents()
  }, [])

  const [viewModeMarks, setViewModeMarks] = useState(null)
  const [showResult, setShowResult] = useState(false)

  const matchedRecord = useMemo(() => {
    if (!isViewMode || sourceRecords.length === 0) return null

    return [...sourceRecords].reverse().find((record) => {
      if (branch && record.branch !== branch) return false
      if (subject && record.subject !== subject) return false
      if (semester && record.semester !== semester) return false
      return true
    }) || null
  }, [isViewMode, sourceRecords, branch, subject, semester])

  useEffect(() => {
    if (!isViewMode) return
    setShowResult(false)
  }, [branch, subject, semester, isViewMode])

  // Fetch marks from backend when viewing
  useEffect(() => {
    if (!isViewMode || !showResult || databaseStudents.length === 0) {
      setViewModeMarks(null)
      return
    }

    const fetchViewModeMarks = async () => {
      try {
        const allMarksData = await Promise.all(
          databaseStudents.map(async (student) => {
            try {
              const marksRes = await api.get(`/api/marks/${student.id}`)
              return Array.isArray(marksRes.data) ? marksRes.data : []
            } catch {
              return []
            }
          }),
        )

        const flattened = allMarksData.flat()
        const normalizedSubject = String(subject || '').trim().toLowerCase()
        const normalizedType = type.toLowerCase()
        const forSubjectAndType = flattened.filter(
          (rec) =>
            String(rec?.subject || '').trim().toLowerCase() === normalizedSubject &&
            String(rec?.type || '').trim().toLowerCase() === normalizedType,
        )

        const marksById = {}
        forSubjectAndType.forEach((rec) => {
          const studentId = String(rec?.student_id || '').trim()
          if (studentId) {
            marksById[studentId] = rec?.marks || 0
          }
        })

        setViewModeMarks(marksById)
      } catch (_error) {
        setViewModeMarks({})
      }
    }

    fetchViewModeMarks()
  }, [isViewMode, showResult, databaseStudents, subject, type])

  // Only show students matching the selected semester (in enter mode)
  const filteredStudents = useMemo(() => {
    if (!semester) return databaseStudents.length > 0 ? databaseStudents : students
    const target = String(semester)
    const pool = databaseStudents.length > 0 ? databaseStudents : students
    const filtered = pool.filter((s) => String(s.semester || '') === target)
    return filtered.length > 0 ? filtered : pool
  }, [databaseStudents, students, semester])

  const displayedStudents = isViewMode && showResult
    ? (databaseStudents.length > 0 ? databaseStudents : students).filter(
      (s) => !semester || String(s.semester || '') === String(semester)
    )
    : filteredStudents
  const displayedMarks = isViewMode && viewModeMarks ? viewModeMarks : (isViewMode ? matchedRecord?.marks || {} : marks)
  const displayedOutOfMarks = isViewMode ? matchedRecord?.outOfMarks ?? '' : outOfMarks
  const shouldShowTable = isViewMode ? showResult : allSelected

  const handleChange = (id, value) => {
    if (isViewMode) return
    if (value === '' || (Number(value) >= 0 && Number(value) <= 100)) {
      setMarks((prev) => ({ ...prev, [id]: value }))
    }
  }

  const handleNameChange = (id, value) => {
    if (isViewMode) return
    setStudents((prev) => prev.map((student) => (student.id === id ? { ...student, name: value } : student)))
  }

  const handleSubmit = () => {
    if (!allSelected || isViewMode) return
    if (onSubmitData) {
      onSubmitData({
        branch,
        subject,
        semester,
        outOfMarks,
        students,
        marks,
      })
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
          <div className="h-8 w-1.5 rounded-full" style={{ backgroundColor: accent }} />
          <h2 className="text-xl font-bold text-edu-navy">{type}</h2>
        </div>
        {!isViewMode && (
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full text-xl font-bold text-white transition hover:opacity-80"
            style={{ backgroundColor: accent }}
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
          <div className="mb-5 mt-5 grid gap-3 sm:grid-cols-3">
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
          </div>

          {isViewMode && branch && subject && semester && (
            <div className="mb-5 flex gap-3">
              <button
                type="button"
                onClick={() => setShowResult(!showResult)}
                className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-85"
                style={{ backgroundColor: accent }}
              >
                {showResult ? '− Hide' : '+ Show'}
              </button>
            </div>
          )}

          {!isViewMode && allSelected && (
            <BulkStudentImportPanel
              title={`Bulk Student Import for ${type}`}
              className="mb-5"
              importDefaults={{
                branch: branch || 'General',
                semester: semester || 1,
                batch: 'A',
                counsellor_name: 'Unassigned',
              }}
              onImported={onStudentsImported}
            />
          )}

          {!shouldShowTable ? (
            <div className="rounded-xl border border-dashed border-edu-blue/30 bg-edu-sand/20 p-6 text-center text-sm text-edu-blue">
              {isViewMode
                ? sourceRecords.length === 0
                  ? `No uploaded ${type.toLowerCase()} data found yet. You can still set filters and then add records from Enter Student Data.`
                  : `No ${type.toLowerCase()} record matches the selected filters.`
                : 'Select Branch, Subject, and Semester to view the student list.'}
            </div>
          ) : (
            <>
              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-edu-navy">Out of Marks</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={displayedOutOfMarks}
                  onChange={(event) => setOutOfMarks(event.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="e.g., 100"
                  disabled={isViewMode}
                  className="w-full max-w-xs rounded-xl border border-edu-blue/20 bg-white px-3 py-2.5 text-sm text-edu-navy outline-none transition focus:border-edu-teal focus:ring-2 focus:ring-edu-teal/25"
                />
              </div>

              <div className="overflow-x-auto rounded-xl border border-edu-blue/10">
                <table className="w-full min-w-[360px] text-sm">
                  <thead>
                    <tr className="border-b border-edu-blue/10 bg-[#DBD8A0]/50 text-left">
                      <th className="px-5 py-3 font-semibold text-edu-navy">Student ID</th>
                      <th className="px-5 py-3 font-semibold text-edu-navy">Student Name</th>
                      <th className="px-5 py-3 font-semibold text-edu-navy">
                        Marks {displayedOutOfMarks ? `(out of ${displayedOutOfMarks})` : '(out of 100)'}
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
                              onChange={(event) => handleNameChange(student.id, event.target.value)}
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
                              {displayedMarks[student.id] === '' || displayedMarks[student.id] === undefined
                                ? '—'
                                : displayedMarks[student.id]}
                            </span>
                          ) : (
                            <input
                              type="text"
                              inputMode="numeric"
                              value={displayedMarks[student.id] ?? ''}
                              onChange={(event) => handleChange(student.id, event.target.value.replace(/[^0-9]/g, ''))}
                              placeholder="Enter marks"
                              className="w-36 rounded-lg border border-edu-blue/20 bg-white px-3 py-1.5 text-sm text-edu-navy outline-none transition focus:border-edu-teal focus:ring-2 focus:ring-edu-teal/25"
                            />
                          )}
                        </td>
                      </tr>
                    ))}
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
          )}
        </>
      )}
    </div>
  )
}

export default MarksSection
