import { useState } from 'react'
import api from '../api/api'
import AttendanceSection from '../components/AttendanceSection'
import MarksSection from '../components/MarksSection'

function FacultyDataPage() {
  const [mode, setMode] = useState('initial') // 'initial' | 'enter' | 'view'
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [marksRecords, setMarksRecords] = useState({
    Quiz: [],
    Exam: [],
    Assignment: [],
    Practicals: [],
  })

  const latestAttendance =
    attendanceRecords.length > 0 ? attendanceRecords[attendanceRecords.length - 1] : null

  const latestMarksByType = (type) => {
    const records = marksRecords[type] || []
    return records.length > 0 ? records[records.length - 1] : null
  }

  const handleAttendanceSubmit = async (payload) => {
    const today = new Date().toISOString().slice(0, 10)
    const attendanceEntries = (payload.students || []).map((student) => ({
      student_id: String(student.id),
      subject: payload.subject,
      date: today,
      status: payload.attendance?.[student.id] ? 'Present' : 'Absent',
    }))

    const response = await api.post('/api/attendance', { attendance: attendanceEntries })
    const savedAttendance = response?.data?.attendance || []

    setAttendanceRecords((prev) => [
      ...prev,
      {
        ...payload,
        savedAt: Date.now(),
        apiSavedCount: savedAttendance.length,
      },
    ])

    return savedAttendance
  }

  const handleMarksSubmit = (type, payload) => {
    setMarksRecords((prev) => ({
      ...prev,
      [type]: [...prev[type], { ...payload, savedAt: Date.now() }],
    }))
  }

  return (
    <div className="space-y-6">
      {/* Initial button selection */}
      {mode === 'initial' && (
        <div className="flex gap-4">
          <button
            onClick={() => setMode('enter')}
            className="flex-1 rounded-xl bg-[#2FA4A9] px-6 py-4 text-lg font-semibold text-white transition hover:bg-edu-navy"
          >
            + Enter Student Data
          </button>
          <button
            onClick={() => setMode('view')}
            className="flex-1 rounded-xl border-2 border-[#2FA4A9] bg-white px-6 py-4 text-lg font-semibold text-[#2FA4A9] transition hover:bg-[#2FA4A9]/5"
          >
            📊 View Student Data
          </button>
        </div>
      )}

      {/* Enter mode — show all data entry sections */}
      {mode === 'enter' && (
        <>
          <button
            onClick={() => setMode('initial')}
            className="rounded-lg border border-edu-blue/20 bg-white px-4 py-2 text-sm font-semibold text-edu-navy transition hover:bg-edu-blue/5"
          >
            ← Back
          </button>
          <AttendanceSection
            mode="enter"
            initialData={latestAttendance}
            onSubmitData={handleAttendanceSubmit}
          />
          <MarksSection
            type="Quiz"
            mode="enter"
            initialData={latestMarksByType('Quiz')}
            onSubmitData={(payload) => handleMarksSubmit('Quiz', payload)}
          />
          <MarksSection
            type="Exam"
            mode="enter"
            initialData={latestMarksByType('Exam')}
            onSubmitData={(payload) => handleMarksSubmit('Exam', payload)}
          />
          <MarksSection
            type="Assignment"
            mode="enter"
            initialData={latestMarksByType('Assignment')}
            onSubmitData={(payload) => handleMarksSubmit('Assignment', payload)}
          />
          <MarksSection
            type="Practicals"
            mode="enter"
            initialData={latestMarksByType('Practicals')}
            onSubmitData={(payload) => handleMarksSubmit('Practicals', payload)}
          />
        </>
      )}

      {/* View mode — same sections in read-only mode with uploaded data */}
      {mode === 'view' && (
        <>
          <button
            onClick={() => setMode('initial')}
            className="rounded-lg border border-edu-blue/20 bg-white px-4 py-2 text-sm font-semibold text-edu-navy transition hover:bg-edu-blue/5"
          >
            ← Back
          </button>
          <AttendanceSection
            mode="view"
            initialData={latestAttendance}
            records={attendanceRecords}
          />
          <MarksSection
            type="Quiz"
            mode="view"
            initialData={latestMarksByType('Quiz')}
            records={marksRecords.Quiz}
          />
          <MarksSection
            type="Exam"
            mode="view"
            initialData={latestMarksByType('Exam')}
            records={marksRecords.Exam}
          />
          <MarksSection
            type="Assignment"
            mode="view"
            initialData={latestMarksByType('Assignment')}
            records={marksRecords.Assignment}
          />
          <MarksSection
            type="Practicals"
            mode="view"
            initialData={latestMarksByType('Practicals')}
            records={marksRecords.Practicals}
          />
        </>
      )}
    </div>
  )
}

export default FacultyDataPage
