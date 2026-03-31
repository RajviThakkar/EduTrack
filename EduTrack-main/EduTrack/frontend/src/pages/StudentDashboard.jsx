import { useEffect, useMemo, useState } from 'react'
import api from '../api/api'

function StudentDashboard() {
  const [student, setStudent] = useState(null)

  const studentName = useMemo(() => {
    try {
      const storedProfile = localStorage.getItem('edutrack_student_profile')
      if (storedProfile) {
        const parsed = JSON.parse(storedProfile)
        if (parsed?.name && parsed.name.trim()) {
          return parsed.name.trim()
        }
      }
    } catch {
    }
    return 'Kruti'
  }, [])

  useEffect(() => {
    const loadStudent = async () => {
      try {
        const profileRaw = localStorage.getItem('edutrack_student_profile')
        const profile = profileRaw ? JSON.parse(profileRaw) : null
        const studentId = profile?.student_id || profile?.id || profile?.email

        let studentRecord = null
        if (studentId) {
          const res = await api.get(`/api/students/${studentId}`)
          studentRecord = res.data
        } else {
          const res = await api.get('/api/students')
          const list = Array.isArray(res.data) ? res.data : []
          studentRecord = list[0] || null
        }

        if (!studentRecord) {
          setStudent(null)
          return
        }

        // Fetch attendance for this student and calculate percentage
        try {
          const attRes = await api.get(`/api/attendance/${studentRecord.student_id}`)
          const attendanceRecords = Array.isArray(attRes.data) ? attRes.data : []
          const totalClasses = attendanceRecords.length
          const presentClasses = attendanceRecords.filter(
            (rec) => String(rec.status).toLowerCase() === 'present',
          ).length
          const attendancePercentage =
            totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0

          setStudent({
            ...studentRecord,
            attendance_percentage: attendancePercentage,
            total_classes: totalClasses,
            present_classes: presentClasses,
          })
        } catch (_err) {
          // If attendance fetch fails, show student record with 0% attendance
          setStudent({ ...studentRecord, attendance_percentage: 0 })
        }
      } catch (_error) {
        setStudent(null)
      }
    }

    loadStudent()
  }, [])

  const profileDetails = [
    { label: 'Name', value: student?.name || studentName },
    { label: 'Enrollment ID', value: student?.enrollment_id || 'NA' },
    { label: 'Branch', value: student?.branch || 'NA' },
    { label: 'Year', value: student?.year || 'NA' },
    { label: 'Semester', value: student?.semester ? `Sem ${student.semester}` : 'NA' },
  ]

  return (
    <div className="space-y-6">
      <section className="rounded-soft bg-gradient-to-r from-edu-navy to-edu-blue p-6 text-white shadow-soft">
        <p className="text-sm text-white/75">Student Dashboard</p>
        <h1 className="mt-1 text-3xl font-bold">Welcome, {studentName}</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/80">
          Track your attendance, monitor subject progress, and estimate your CGPA with real-time insights.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-soft bg-white p-5 shadow-soft">
          <p className="text-sm text-edu-blue">Current CGPA</p>
          <h2 className="mt-1 text-2xl font-bold text-edu-navy">{Number(student?.cgpa || 0).toFixed(2)}</h2>
        </div>
        <div className="rounded-soft bg-white p-5 shadow-soft">
          <p className="text-sm text-edu-blue">Attendance</p>
          <h2 className="mt-1 text-2xl font-bold text-edu-navy">{Number(student?.attendance_percentage || 0).toFixed(0)}%</h2>
        </div>
        <div className="rounded-soft bg-white p-5 shadow-soft">
          <p className="text-sm text-edu-blue">Current Semester</p>
          <h2 className="mt-1 text-2xl font-bold text-edu-navy">{student?.semester || 'NA'}</h2>
        </div>
      </section>

      <section className="rounded-soft bg-white p-5 shadow-soft">
        <h2 className="mb-4 text-lg font-semibold text-edu-navy">Profile Details</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {profileDetails.map((item) => (
            <div key={item.label} className="rounded-xl border border-edu-blue/15 bg-edu-bg p-3">
              <p className="text-xs uppercase tracking-wide text-edu-blue">{item.label}</p>
              <p className="mt-1 font-medium text-edu-navy">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-soft bg-white p-5 shadow-soft">
          <h2 className="text-lg font-semibold text-edu-navy">Attendance Overview</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-edu-blue/10 p-4">
              <p className="text-sm text-edu-blue">Current Attendance</p>
              <p className="text-2xl font-bold text-edu-navy">{Number(student?.attendance_percentage || 0).toFixed(0)}%</p>
            </div>
            <div className="rounded-xl bg-edu-bg p-4">
              <p className="text-sm text-edu-blue">Counsellor</p>
              <p className="text-2xl font-bold text-edu-navy">{student?.counsellor_name || 'NA'}</p>
            </div>
          </div>
        </section>

        <section className="rounded-soft bg-white p-5 shadow-soft">
          <h2 className="mb-3 text-lg font-semibold text-edu-navy">Student Info</h2>
          <div className="space-y-2">
            {[
              `Student ID: ${student?.student_id || 'NA'}`,
              `Email: ${student?.email || 'NA'}`,
              `Batch: ${student?.batch || 'NA'}`,
            ].map((subject) => (
              <div
                key={subject}
                className="rounded-lg border border-edu-blue/15 bg-edu-bg px-3 py-2 text-sm font-medium text-edu-navy transition hover:border-edu-teal"
              >
                {subject}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

export default StudentDashboard