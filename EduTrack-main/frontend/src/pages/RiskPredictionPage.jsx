import { useEffect, useMemo, useState } from 'react'
import api from '../api/api'
import { BRANCH_OPTIONS, SEMESTER_OPTIONS } from '../config/academicOptions'
import FilterBar from '../components/risk/FilterBar'
import RiskCard from '../components/risk/RiskCard'
import StudentTable from '../components/risk/StudentTable'

const RISK_ORDER = { High: 3, Medium: 2, Low: 1 }

const sortOptions = [
  { value: 'risk-desc', label: 'Sorting: High to Low Risk' },
  { value: 'risk-asc',  label: 'Sorting: Low to High Risk' },
  { value: 'name-asc',  label: 'Sorting: Name A-Z' },
]

// ── Rule-based fallback  (mirrors notebook assign_risk logic) ─────────────────
function ruleBasedRisk(features) {
  let score = 0
  const { attendance_pct = 0, exam_avg = 0, quiz_avg = 0, assignment_avg = 0, practical_avg = 0 } = features

  if (attendance_pct < 60)  score += 3; else if (attendance_pct < 75) score += 1
  if (exam_avg < 40)        score += 3; else if (exam_avg < 55)       score += 2; else if (exam_avg < 65) score += 1
  if (quiz_avg < 40)        score += 2; else if (quiz_avg < 55)       score += 1
  if (assignment_avg < 40)  score += 2; else if (assignment_avg < 55) score += 1
  if (practical_avg < 40)   score += 2; else if (practical_avg < 55)  score += 1

  if (score >= 7) return 'High'
  if (score >= 3) return 'Medium'
  return 'Low'
}

// ── Build pre-computed feature averages from a student's marks records ─────────
function buildFeatures(marksRecords, attendancePct) {
  const byType = { quiz: [], assignment: [], exam: [], practicals: [] }

  marksRecords.forEach((rec) => {
    const t = String(rec?.type || '').toLowerCase()
    const m = parseFloat(rec?.marks ?? rec?.score ?? 0)
    if (!isNaN(m)) {
      if (t === 'quiz')        byType.quiz.push(m)
      else if (t === 'assignment') byType.assignment.push(m)
      else if (t === 'exam')   byType.exam.push(m)
      else if (t === 'practicals' || t === 'practical') byType.practicals.push(m)
    }
  })

  const avg = (arr) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0

  return {
    quiz_avg:       Math.round(avg(byType.quiz)        * 10) / 10,
    assignment_avg: Math.round(avg(byType.assignment)  * 10) / 10,
    exam_avg:       Math.round(avg(byType.exam)        * 10) / 10,
    practical_avg:  Math.round(avg(byType.practicals)  * 10) / 10,
    attendance_pct: Math.round((attendancePct || 0)    * 10) / 10,
  }
}

function RiskPredictionPage() {
  const [studentData, setStudentData] = useState([])
  const [mlLoading, setMlLoading]     = useState(false)
  const [mlAvailable, setMlAvailable] = useState(true)
  const [filters, setFilters] = useState({
    branch: '', semester: '', sorting: 'risk-desc',
  })

  useEffect(() => {
    const loadData = async () => {
      setMlLoading(true)
      try {
        // ── 1. Load students + stored risk rows in parallel ──────────────────
        const [studentsRes, riskRes] = await Promise.all([
          api.get('/api/students'),
          api.get('/api/risk'),
        ])
        const students = Array.isArray(studentsRes.data) ? studentsRes.data : []
        const riskRows = Array.isArray(riskRes.data)     ? riskRes.data    : []

        // ── 2. For each student: fetch marks + attendance, call ML model ─────
        const merged = await Promise.all(
          students.map(async (student) => {
            const storedRisk = riskRows.find(
              (r) => String(r.student_id) === String(student.student_id),
            )

            // ── Fetch marks records for this student ─────────────────────────
            let marksRecords = []
            try {
              const marksRes = await api.get(`/api/marks/${student.student_id}`)
              marksRecords = Array.isArray(marksRes.data) ? marksRes.data : []
            } catch { /* ignore */ }

            // ── Attendance percentage from student record ─────────────────────
            const attendancePct = parseFloat(student.attendance_percentage ?? student.attendance ?? 0)

            // ── Build feature vector ──────────────────────────────────────────
            const features = buildFeatures(marksRecords, attendancePct)

            // ── Call ML service ───────────────────────────────────────────────
            let mlStatus = null
            let mlReason = null

            try {
              // Send pre-computed averages (Format B) to ML service
              const mlRes = await api.post('/api/ml/predict', features)

              if (mlRes.data?.success && mlRes.data?.prediction) {
                const pred = mlRes.data.prediction
                const raw  = String(pred.risk_level || '').toLowerCase()

                if (raw === 'high')   { mlStatus = 'High';   mlReason = pred.reason }
                else if (raw === 'medium') { mlStatus = 'Medium'; mlReason = pred.reason }
                else if (raw === 'low')    { mlStatus = 'Low';    mlReason = pred.reason }

                setMlAvailable(true)
              }
            } catch {
              setMlAvailable(false)
            }

            // ── Fallback: rule-based if ML unavailable ────────────────────────
            if (!mlStatus) {
              mlStatus = storedRisk?.status || ruleBasedRisk(features)
              mlReason = storedRisk?.reason || 'Based on attendance and marks analysis'
            }

            return {
              id:       student.student_id,
              name:     student.name,
              status:   mlStatus,
              reason:   mlReason || 'No major risk identified',
              branch:   student.branch   || 'NA',
              semester: String(student.semester || ''),
              features,
            }
          }),
        )

        setStudentData(merged)
      } catch {
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
    const next = studentData.filter((s) => {
      if (filters.branch   && s.branch   !== filters.branch)   return false
      if (filters.semester && s.semester !== filters.semester)  return false
      return true
    })
    next.sort((a, b) => {
      if (filters.sorting === 'name-asc')  return a.name.localeCompare(b.name)
      if (filters.sorting === 'risk-asc')  return RISK_ORDER[a.status] - RISK_ORDER[b.status]
      return RISK_ORDER[b.status] - RISK_ORDER[a.status]
    })
    return next
  }, [studentData, filters])

  const riskCounts = useMemo(() => ({
    low:    filteredStudents.filter((s) => s.status === 'Low').length,
    medium: filteredStudents.filter((s) => s.status === 'Medium').length,
    high:   filteredStudents.filter((s) => s.status === 'High').length,
  }), [filteredStudents])

  const handleFilterChange = (field, value) =>
    setFilters((prev) => ({ ...prev, [field]: value }))

  return (
    <div className="space-y-6">
      {mlLoading && (
        <div className="rounded-xl border border-edu-blue/15 bg-white px-4 py-3 text-sm text-edu-navy/60 shadow-soft">
          Running ML risk predictions… this may take a moment.
        </div>
      )}

      {!mlLoading && !mlAvailable && studentData.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 shadow-soft">
          ML service unavailable — showing rule-based predictions (same logic as the notebook).
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
        <RiskCard title="Low Risk Students"    count={riskCounts.low}    tone="low"    />
        <RiskCard title="Medium Risk Students" count={riskCounts.medium} tone="medium" />
        <RiskCard title="High Risk Students"   count={riskCounts.high}   tone="high"   />
      </section>

      <StudentTable students={filteredStudents} />
    </div>
  )
}

export default RiskPredictionPage