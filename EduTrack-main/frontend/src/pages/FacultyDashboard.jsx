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

  const facultyName = useMemo(() => {
    try {
      const storedProfile = localStorage.getItem('edutrack_user') || localStorage.getItem('edutrack_faculty_profile')
      if (storedProfile) {
        const parsed = JSON.parse(storedProfile)
        if (parsed?.name && parsed.name.trim()) {
          return parsed.name.trim()
        }
      }
    } catch {}
    return 'Faculty'
  }, [])

  const [filters, setFilters] = useState({
    branch: '', subject: '', semester: '',
  })
  const [hasAppliedFilters, setHasAppliedFilters] = useState(false)
  const [appliedFilters, setAppliedFilters] = useState({
    branch: '', subject: '', semester: '',
  })

  const handleFilterChange = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }))
  const canApply = Boolean(filters.branch && filters.semester)

  const handleApplyFilters = () => {
    if (!canApply) return
    setAppliedFilters(filters)
    setHasAppliedFilters(true)
  }

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const url = facultyName ? `/api/students/counsellor/${encodeURIComponent(facultyName)}` : '/api/students'
        const [studentsRes, riskRes] = await Promise.all([
          api.get(url),
          api.get('/api/risk'),
        ])
        const baseStudents = Array.isArray(studentsRes.data) ? studentsRes.data : []
        const risks = Array.isArray(riskRes.data) ? riskRes.data : []

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

              const subjects = [...new Set(
                attendanceRecords.map((rec) => rec.subject).filter(Boolean)
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
  }, [facultyName])

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
    () => [...new Set([...BRANCH_OPTIONS, ...normalizedStudents.map((s) => s.branch).filter(Boolean)])],
    [normalizedStudents],
  )
  const subjectOptions = useMemo(
    () => [
      ...new Set([
        ...SUBJECT_OPTIONS,
        ...normalizedStudents.flatMap((s) => s.attendance_subjects || []).filter(Boolean),
      ]),
    ],
    [normalizedStudents],
  )
  const semesterOptions = useMemo(
    () => [...new Set([...SEMESTER_OPTIONS, ...normalizedStudents.map((s) => String(s.semester)).filter(Boolean)])],
    [normalizedStudents],
  )

  const atRiskCount = normalizedStudents.filter((s) => s.status === 'High').length
  const avgAttendance = normalizedStudents.length > 0
    ? Math.round(normalizedStudents.reduce((sum, s) => sum + s.attendance, 0) / normalizedStudents.length)
    : 0

  const filtered = normalizedStudents.filter((s) => {
    if (appliedFilters.branch && s.branch !== appliedFilters.branch) return false
    if (appliedFilters.subject && !s.attendance_subjects.includes(appliedFilters.subject)) return false
    if (appliedFilters.semester && String(s.semester) !== appliedFilters.semester) return false
    return true
  })

  const quickLinks = []  // kept for future use

  return (
    <div className="space-y-6">

      {/* ── Hero Header ── */}
      <section
        className="rounded-soft p-6 text-white shadow-soft"
        style={{ background: 'linear-gradient(135deg, #1a4a5c 0%, #2d7d8e 50%, #3aafa0 100%)' }}
      >
        <h1 className="text-3xl font-bold">Welcome, {facultyName}</h1>
      </section>

      {/* ── Stat Cards ── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-soft bg-white p-5 shadow-soft">
          <p className="text-sm text-edu-blue">Total Students</p>
          <h2 className="mt-1 text-2xl font-bold text-edu-navy">
            {loading ? <span className="text-edu-navy/40">…</span> : normalizedStudents.length}
          </h2>
          <p className="mt-1 text-xs text-edu-navy/45">Assigned to you</p>
        </div>
        <div className="rounded-soft bg-white p-5 shadow-soft">
          <p className="text-sm text-edu-blue">Avg. Attendance</p>
          <h2 className="mt-1 text-2xl font-bold text-edu-navy">
            {loading ? <span className="text-edu-navy/40">…</span> : `${avgAttendance}%`}
          </h2>
          <p className={`mt-1 text-xs font-medium ${avgAttendance >= 75 ? 'text-green-600' : 'text-red-500'}`}>
            {avgAttendance >= 75 ? 'On Track' : 'Needs Attention'}
          </p>
        </div>
        <div className="rounded-soft bg-white p-5 shadow-soft">
          <p className="text-sm text-edu-blue">At-Risk Students</p>
          <h2 className="mt-1 text-2xl font-bold text-edu-navy">
            {loading ? <span className="text-edu-navy/40">…</span> : atRiskCount}
          </h2>
          <p className={`mt-1 text-xs font-medium ${atRiskCount > 0 ? 'text-red-500' : 'text-green-600'}`}>
            {atRiskCount > 0 ? 'Requires action' : 'All good'}
          </p>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <FilterBar
        filters={filters}
        onChange={handleFilterChange}
        onApply={handleApplyFilters}
        canApply={canApply}
        branchOptions={branchOptions}
        semesterOptions={semesterOptions}
      />

      {/* ── Filtered Analytics ── */}
      {hasAppliedFilters ? (
        <div className="space-y-3">
          <div className="grid gap-4 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <SubjectAnalytics students={filtered} />
            </div>
            <div>
              <RiskPieChart students={filtered} />
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-soft border border-edu-blue/10 bg-white px-6 py-10 text-center shadow-soft">
          <p className="font-semibold text-edu-navy">Select filters to view analytics</p>
          <p className="mt-1 text-sm text-edu-navy/50">
            Choose a branch and semester above then click <strong>Filter</strong>.
          </p>
        </div>
      )}
    </div>
  )
}

export default FacultyDashboard
