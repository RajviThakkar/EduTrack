import { useEffect, useMemo, useState } from 'react'
import api from '../api/api'
import { BRANCH_OPTIONS, SEMESTER_OPTIONS } from '../config/academicOptions'
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
  const [mlLoading, setMlLoading] = useState(false)
  const [filters, setFilters] = useState({
    branch: '',
    semester: '',
    sorting: 'risk-desc',
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        setMlLoading(true)
        const [studentsRes, riskRes] = await Promise.all([
          api.get('/api/students'),
          api.get('/api/risk'),
        ])

        const students = Array.isArray(studentsRes.data) ? studentsRes.data : []
        const riskRows = Array.isArray(riskRes.data) ? riskRes.data : []

        // For each student, try to call the ML model via /api/ml/predict
        // Fall back to rule-based risk if ML fails
        const merged = await Promise.all(
          students.map(async (student) => {
            const ruleBasedRisk = riskRows.find(
              (row) => String(row.student_id) === String(student.student_id)
            )

            let mlStatus = null
            let mlReason = null

            try {
              const mlRes = await api.post('/api/ml/predict', {
                student_id: student.student_id,
                cgpa: student.cgpa || 0,
                attendance: student.attendance_percentage || 0,
                semester: student.semester || 1,
                branch: student.branch || '',
              })
              if (mlRes.data?.success && mlRes.data?.prediction) {
                const pred = mlRes.data.prediction
                // Normalize ML output to High/Medium/Low
                const raw = String(pred.risk_level || pred.prediction || pred.status || '').toLowerCase()
                if (raw.includes('high') || raw === '1') {
                  mlStatus = 'High'
                  mlReason = pred.reason || 'ML model flagged as high risk'
                } else if (raw.includes('med') || raw === '2') {
                  mlStatus = 'Medium'
                  mlReason = pred.reason || 'ML model flagged as medium risk'
                } else if (raw.includes('low') || raw === '0') {
                  mlStatus = 'Low'
                  mlReason = pred.reason || 'ML model: low risk'
                }
              }
            } catch (_mlErr) {
              // ML service unavailable — fall back silently
            }

            const finalStatus = mlStatus || ruleBasedRisk?.status || 'Low'
            const finalReason = mlReason || ruleBasedRisk?.reason || 'No major risk identified'

            return {
              id: student.student_id,
              name: student.name,
              status: finalStatus,
              reason: finalReason,
              branch: student.branch || 'NA',
              semester: String(student.semester || ''),
            }
          }),
        )

        setStudentData(merged)
      } catch (_error) {
        setStudentData([])
      } finally {
        setMlLoading(false)
      }
    }

    loadData()
  }, [])

  const branchOptions = useMemo(
    () => [...new Set([...BRANCH_OPTIONS, ...studentData.map((s) => s.branch).filter(Boolean)])],
    [studentData],
  )
  const semesterOptions = useMemo(
    () => [...new Set([...SEMESTER_OPTIONS.map(String), ...studentData.map((s) => s.semester).filter(Boolean)])],
    [studentData],
  )

  const filteredStudents = useMemo(() => {
    const next = studentData.filter((student) => {
      if (filters.branch && student.branch !== filters.branch) return false
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
      low: filteredStudents.filter((s) => s.status === 'Low').length,
      medium: filteredStudents.filter((s) => s.status === 'Medium').length,
      high: filteredStudents.filter((s) => s.status === 'High').length,
    }),
    [filteredStudents],
  )

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6">
      {mlLoading && (
        <div className="rounded-xl border border-edu-blue/15 bg-white px-4 py-3 text-sm text-edu-navy/60 shadow-soft">
          Running ML risk predictions… this may take a moment.
        </div>
      )}

      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        branchOptions={branchOptions}
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