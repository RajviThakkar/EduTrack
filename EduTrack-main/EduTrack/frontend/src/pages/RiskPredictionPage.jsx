import { useEffect, useMemo, useState } from 'react'
import api from '../api/api'
import { BRANCH_OPTIONS, SUBJECT_OPTIONS, SEMESTER_OPTIONS } from '../config/academicOptions'
import FilterBar from '../components/risk/FilterBar'
import RiskCard from '../components/risk/RiskCard'
import StudentTable from '../components/risk/StudentTable'

const RISK_ORDER = { High: 3, Medium: 2, Low: 1 }

const sortOptions = [
  { value: 'risk-desc', label: 'Sorting: High to Low Risk' },
  { value: 'risk-asc', label: 'Sorting: Low to High Risk' },
  { value: 'name-asc', label: 'Sorting: Name A-Z' },
]

function RiskPredictionPage() {
  const [studentData, setStudentData] = useState([])
  const [filters, setFilters] = useState({
    branch: '',
    subject: '',
    semester: '',
    sorting: 'risk-desc',
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const [studentsRes, riskRes] = await Promise.all([
          api.get('/api/students'),
          api.get('/api/risk'),
        ])

        const students = Array.isArray(studentsRes.data) ? studentsRes.data : []
        const riskRows = Array.isArray(riskRes.data) ? riskRes.data : []

        // Fetch attendance for each student to extract subjects
        const merged = await Promise.all(
          students.map(async (student) => {
            const risk = riskRows.find((row) => String(row.student_id) === String(student.student_id))
            try {
              const attRes = await api.get(`/api/attendance/${student.student_id}`)
              const attendanceRecords = Array.isArray(attRes.data) ? attRes.data : []
              const subjects = [...new Set(
                attendanceRecords
                  .map((rec) => rec.subject)
                  .filter(Boolean)
              )]
              return {
                id: student.student_id,
                name: student.name,
                status: risk?.status || 'Low',
                reason: risk?.reason || 'No major risk',
                branch: student.branch || 'NA',
                attendance_subjects: subjects,
                semester: String(student.semester || ''),
              }
            } catch (_err) {
              return {
                id: student.student_id,
                name: student.name,
                status: risk?.status || 'Low',
                reason: risk?.reason || 'No major risk',
                branch: student.branch || 'NA',
                attendance_subjects: [],
                semester: String(student.semester || ''),
              }
            }
          }),
        )

        setStudentData(merged)
      } catch (_error) {
        setStudentData([])
      }
    }

    loadData()
  }, [])

  const branchOptions = useMemo(
    () => [...new Set([...BRANCH_OPTIONS, ...studentData.map((student) => student.branch).filter(Boolean)])],
    [studentData],
  )
  const subjectOptions = useMemo(
    () => [
      ...new Set([
        ...SUBJECT_OPTIONS,
        ...studentData
          .flatMap((student) => student.attendance_subjects || [])
          .filter(Boolean),
      ]),
    ],
    [studentData],
  )
  const semesterOptions = useMemo(
    () => [...new Set([...SEMESTER_OPTIONS, ...studentData.map((student) => student.semester).filter(Boolean)])],
    [studentData],
  )

  const filteredStudents = useMemo(() => {
    const next = studentData.filter((student) => {
      if (filters.branch && student.branch !== filters.branch) return false
      if (filters.subject && !student.attendance_subjects.includes(filters.subject)) return false
      if (filters.semester && student.semester !== filters.semester) return false
      return true
    })

    next.sort((a, b) => {
      if (filters.sorting === 'name-asc') return a.name.localeCompare(b.name)
      if (filters.sorting === 'risk-asc') return RISK_ORDER[a.status] - RISK_ORDER[b.status]
      return RISK_ORDER[b.status] - RISK_ORDER[a.status]
    })

    return next
  }, [studentData, filters])

  const riskCounts = useMemo(
    () => ({
      low: filteredStudents.filter((student) => student.status === 'Low').length,
      medium: filteredStudents.filter((student) => student.status === 'Medium').length,
      high: filteredStudents.filter((student) => student.status === 'High').length,
    }),
    [filteredStudents],
  )

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6">
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          branchOptions={branchOptions}
          subjectOptions={subjectOptions}
          semesterOptions={semesterOptions}
          sortOptions={sortOptions}
        />

        <section className="grid gap-4 md:grid-cols-3">
          <RiskCard title="Low Risk Students" count={riskCounts.low} tone="low" />
          <RiskCard title="Medium Risk Students" count={riskCounts.medium} tone="medium" />
          <RiskCard title="High Risk Students" count={riskCounts.high} tone="high" />
        </section>

        <StudentTable students={filteredStudents} />
    </div>
  )
}

export default RiskPredictionPage