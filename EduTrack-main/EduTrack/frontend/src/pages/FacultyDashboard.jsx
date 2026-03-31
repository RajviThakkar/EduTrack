import { useEffect, useMemo, useState } from 'react'
import api from '../api/api'
import { BRANCH_OPTIONS, SUBJECT_OPTIONS, SEMESTER_OPTIONS } from '../config/academicOptions'
import DashboardCard from '../components/DashboardCard'
import FilterBar from '../components/FilterBar'
import SubjectAnalytics from '../components/SubjectAnalytics'
import RiskPieChart from '../components/RiskPieChart'

function FacultyDashboard() {
  const [students, setStudents] = useState([])
  const [riskRows, setRiskRows] = useState([])
  const [loading, setLoading] = useState(true)

  const [filters, setFilters] = useState({
    branch: '', subject: '', semester: '',
  })
  const [hasAppliedFilters, setHasAppliedFilters] = useState(false)
  const [appliedFilters, setAppliedFilters] = useState({
    branch: '', subject: '', semester: '',
  })

  const handleFilterChange = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }))
  const canApply = Boolean(filters.branch && filters.subject && filters.semester)

  const handleApplyFilters = () => {
    if (!canApply) return
    setAppliedFilters(filters)
    setHasAppliedFilters(true)
  }

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [studentsRes, riskRes] = await Promise.all([
          api.get('/api/students'),
          api.get('/api/risk'),
        ])
        const baseStudents = Array.isArray(studentsRes.data) ? studentsRes.data : []
        const risks = Array.isArray(riskRes.data) ? riskRes.data : []

        // Fetch attendance for each student with subject details
        const studentsWithAttendance = await Promise.all(
          baseStudents.map(async (student) => {
            try {
              const attRes = await api.get(`/api/attendance/${student.student_id}`)
              const attendanceRecords = Array.isArray(attRes.data) ? attRes.data : []
              const totalClasses = attendanceRecords.length
              const presentClasses = attendanceRecords.filter(
                (rec) => String(rec.status).toLowerCase() === 'present',
              ).length
              const attendancePercentage =
                totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0
              
              // Collect all subjects the student has attendance for
              const subjects = [...new Set(
                attendanceRecords
                  .map((rec) => rec.subject)
                  .filter(Boolean)
              )]
              
              return {
                ...student,
                attendance_percentage: attendancePercentage,
                attendance_subjects: subjects,
                attendance_records: attendanceRecords,
              }
            } catch (_err) {
              return { ...student, attendance_percentage: 0, attendance_subjects: [], attendance_records: [] }
            }
          }),
        )

        setStudents(studentsWithAttendance)
        setRiskRows(risks)
      } catch (_error) {
        setStudents([])
        setRiskRows([])
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  const normalizedStudents = useMemo(
    () =>
      students.map((item) => {
        const risk = riskRows.find((row) => String(row.student_id) === String(item.student_id))
        const cgpaMarks = Math.max(0, Math.min(100, Number(item.cgpa || 0) * 10))
        return {
          student_id: item.student_id,
          name: item.name,
          branch: item.branch,
          semester: String(item.semester || ''),
          subject: item.subject || 'General',
          attendance_subjects: item.attendance_subjects || [],
          attendance: Number(item.attendance_percentage || 0),
          assignmentMarks: cgpaMarks,
          labMarks: cgpaMarks,
          examMarks: cgpaMarks,
          quizMarks: cgpaMarks,
          status: risk?.status || 'Low',
        }
      }),
    [students, riskRows],
  )

  const branchOptions = useMemo(
    () => [...new Set([...BRANCH_OPTIONS, ...normalizedStudents.map((student) => student.branch).filter(Boolean)])],
    [normalizedStudents],
  )
  const subjectOptions = useMemo(
    () => [
      ...new Set([
        ...SUBJECT_OPTIONS,
        ...normalizedStudents
          .flatMap((student) => student.attendance_subjects || [])
          .filter(Boolean),
      ]),
    ],
    [normalizedStudents],
  )
  const semesterOptions = useMemo(
    () => [...new Set([...SEMESTER_OPTIONS, ...normalizedStudents.map((student) => String(student.semester)).filter(Boolean)])],
    [normalizedStudents],
  )

  const atRiskCount = normalizedStudents.filter((s) => s.status === 'High').length

  const filtered = normalizedStudents.filter((s) => {
    if (appliedFilters.branch && s.branch !== appliedFilters.branch) return false
    if (appliedFilters.subject && !s.attendance_subjects.includes(appliedFilters.subject)) return false
    if (appliedFilters.semester && String(s.semester) !== appliedFilters.semester) return false
    return true
  })

  const studentsForOutput = filtered

  const facultyName = useMemo(() => {
    try {
      const storedProfile = localStorage.getItem('edutrack_faculty_profile')
      if (storedProfile) {
        const parsed = JSON.parse(storedProfile)
        if (parsed?.name && parsed.name.trim()) {
          return parsed.name.trim()
        }
      }
    } catch {
    }
    return 'Kruti Bhatt'
  }, [])

  return (
    <div className="space-y-6">
      <section className="rounded-soft bg-gradient-to-r from-edu-teal to-edu-mint p-5 text-edu-navy shadow-soft">
        <h1 className="text-2xl font-bold">Welcome, {facultyName}</h1>
      </section>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <DashboardCard title="Total Students"   value={loading ? '...' : String(normalizedStudents.length)} tone="primary"   />
        <DashboardCard title="Total Subjects"   value={loading ? '...' : String(subjectOptions.length)}      tone="secondary" />
        <DashboardCard title="At-Risk Students" value={String(atRiskCount)} tone="success" />
      </div>

      {/* Filter bar */}
      <FilterBar
        filters={filters}
        onChange={handleFilterChange}
        onApply={handleApplyFilters}
        canApply={canApply}
        branchOptions={branchOptions}
        subjectOptions={subjectOptions}
        semesterOptions={semesterOptions}
      />

      {/* Filtered output */}
      {hasAppliedFilters ? (
        <div className="space-y-3">
          <div className="grid gap-4 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <SubjectAnalytics students={studentsForOutput} />
            </div>
            <div>
              <RiskPieChart students={studentsForOutput} subjectName={appliedFilters.subject} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default FacultyDashboard
