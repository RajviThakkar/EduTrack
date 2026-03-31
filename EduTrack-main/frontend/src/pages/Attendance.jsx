import { useEffect, useState } from 'react'
import AttendanceTable from '../components/AttendanceTable'
import api from '../api/api'
import { getAttendanceRemark } from '../utils/attendanceRemark'

const resolveSubject = (row) => {
  const candidate = [row?.subject, row?.course_name, row?.subject_name, row?.course]
    .map((value) => String(value || '').trim())
    .find(Boolean)
  return candidate || 'Not Assigned'
}

function Attendance() {
  const [attendanceData, setAttendanceData] = useState([])

  useEffect(() => {
    const loadAttendance = async () => {
      try {
        const profileRaw = localStorage.getItem('edutrack_student_profile')
        const profile = profileRaw ? JSON.parse(profileRaw) : null
        const fallbackStudents = await api.get('/api/students')
        const firstStudent = Array.isArray(fallbackStudents.data) ? fallbackStudents.data[0] : null
        const studentId = profile?.student_id || profile?.id || firstStudent?.student_id
        if (!studentId) {
          setAttendanceData([])
          return
        }

        const response = await api.get(`/api/attendance/${studentId}`)
        const rows = Array.isArray(response.data) ? response.data : []

        const grouped = rows.reduce((acc, row) => {
          const key = resolveSubject(row)
          if (!acc[key]) {
            acc[key] = { subject: key, attended: 0, total: 0, percentage: 0 }
          }
          acc[key].total += 1
          if (String(row.status).toLowerCase() === 'present') {
            acc[key].attended += 1
          }
          acc[key].percentage = Math.round((acc[key].attended / acc[key].total) * 100)
          return acc
        }, {})

        setAttendanceData(Object.values(grouped))
      } catch (_error) {
        setAttendanceData([])
      }
    }

    loadAttendance()
  }, [])

  const safeRows =
    attendanceData.length > 0
      ? attendanceData
      : [{ subject: 'No Attendance Yet', attended: 0, total: 0, percentage: 0 }]
  const overallAttendance = Math.round(
    safeRows.reduce((sum, row) => sum + row.percentage, 0) / safeRows.length,
  )
  const attendanceRemark = getAttendanceRemark(overallAttendance)

  return (
    <div className="space-y-6">
      <div className="rounded-soft bg-white p-4 shadow-soft">
        <p className="text-sm text-edu-blue">Overall Percentage</p>
        <div className="mt-2 flex items-end gap-2">
          <h2 className="text-3xl font-bold text-edu-navy">{overallAttendance}%</h2>
          <span className="mb-1 rounded-full bg-edu-blue/12 px-2 py-1 text-xs text-edu-navy">{attendanceRemark}</span>
        </div>
      </div>

      <AttendanceTable data={safeRows} />
    </div>
  )
}

export default Attendance