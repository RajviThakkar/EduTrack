import { useEffect, useMemo, useState } from 'react'
import AlertBanner from '../components/AlertBanner'
import FilterBar from '../components/FilterBar'
import api from '../api/api'
import { BRANCH_OPTIONS, SUBJECT_OPTIONS, SEMESTER_OPTIONS } from '../config/academicOptions'

function FacultyStudentOverview() {
  const [filters, setFilters] = useState({
    branch: '',
    subject: '',
    semester: '',
  })
  const [appliedFilters, setAppliedFilters] = useState({
    branch: '',
    subject: '',
    semester: '',
  })
  const [hasApplied, setHasApplied] = useState(false)
  const [rows, setRows] = useState([])

  useEffect(() => {
    const loadData = async () => {
      try {
        const [studentsRes, riskRes] = await Promise.all([
          api.get('/api/students'),
          api.get('/api/risk'),
        ])

        const students = Array.isArray(studentsRes.data) ? studentsRes.data : []
        const riskRows = Array.isArray(riskRes.data) ? riskRes.data : []

        const mergedRows = students.map((student) => {
          const risk = riskRows.find((row) => String(row.student_id) === String(student.student_id))
          return {
            id: student.id || student.student_id,
            name: student.name,
            branch: student.branch || 'NA',
            subject: student.subject || 'Not Assigned',
            semester: String(student.semester || ''),
            risk: risk?.status || 'Low',
          }
        })

        setRows(mergedRows)
      } catch (_error) {
        setRows([])
      }
    }

    loadData()
  }, [])

  const canApply = Boolean(filters.branch && filters.subject && filters.semester)

  const handleFilterChange = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }))
  }

  const handleApply = () => {
    if (!canApply) return
    setAppliedFilters(filters)
    setHasApplied(true)
  }

  const branchOptions = useMemo(
    () => [...new Set([...BRANCH_OPTIONS, ...rows.map((row) => row.branch).filter(Boolean)])],
    [rows],
  )
  const subjectOptions = useMemo(
    () => [...new Set([...SUBJECT_OPTIONS, ...rows.map((row) => row.subject).filter(Boolean)])],
    [rows],
  )
  const semesterOptions = useMemo(
    () => [...new Set([...SEMESTER_OPTIONS, ...rows.map((row) => row.semester).filter(Boolean)])],
    [rows],
  )

  const filteredRows = useMemo(() => {
    if (!hasApplied) return []

    const riskRank = { High: 3, Medium: 2, Low: 1 }

    const next = rows.filter((row) => {
      const matchesBranch = !appliedFilters.branch || row.branch === appliedFilters.branch
      const matchesSubject = !appliedFilters.subject || row.subject === appliedFilters.subject
      const matchesSemester = !appliedFilters.semester || row.semester === appliedFilters.semester
      return matchesBranch && matchesSubject && matchesSemester
    })

    return next.sort((a, b) => riskRank[b.risk] - riskRank[a.risk])
  }, [rows, hasApplied, appliedFilters])

  return (
    <div className="space-y-6">
      <AlertBanner
        tone="attention"
        title="Monitoring Alert"
        message="Use branch, subject, and semester filters to review student risk quickly."
      />

      <FilterBar
        filters={filters}
        onChange={handleFilterChange}
        onApply={handleApply}
        canApply={canApply}
        branchOptions={branchOptions}
        subjectOptions={subjectOptions}
        semesterOptions={semesterOptions}
      />

      <section className="overflow-x-auto rounded-soft bg-white p-5 shadow-soft">
        <h2 className="mb-4 text-lg font-semibold text-edu-navy">Overview Results</h2>
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-edu-blue/15 text-edu-navy">
              <th className="py-3 font-semibold">Student Name</th>
              <th className="py-3 font-semibold">Branch</th>
              <th className="py-3 font-semibold">Subject</th>
              <th className="py-3 font-semibold">Semester</th>
              <th className="py-3 font-semibold">Risk Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.id} className="border-b border-edu-blue/10">
                <td className="py-3 font-medium text-edu-navy">{row.name}</td>
                <td className="py-3 text-edu-blue">{row.branch}</td>
                <td className="py-3 text-edu-blue">{row.subject}</td>
                <td className="py-3 text-edu-blue">Sem {row.semester}</td>
                <td className="py-3">
                  <span className="rounded-full bg-edu-sand/55 px-2.5 py-1 text-xs font-medium text-edu-navy">
                    {row.risk}
                  </span>
                </td>
              </tr>
            ))}
            {filteredRows.length === 0 && (
              <tr>
                <td colSpan="5" className="py-6 text-center text-sm text-edu-blue">
                  {hasApplied ? 'No students match the selected filters.' : 'Apply filters to view students.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  )
}

export default FacultyStudentOverview
