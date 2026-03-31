const parameters = [
  { key: 'assignmentMarks', label: 'Assignment Marks', suffix: '%' },
  { key: 'labMarks', label: 'Lab Marks', suffix: '%' },
  { key: 'attendance', label: 'Attendance', suffix: '%' },
  { key: 'examMarks', label: 'Exam Marks', suffix: '%' },
  { key: 'quizMarks', label: 'Quiz Marks', suffix: '%' },
]

function SubjectAnalytics({ students }) {
  if (!students || students.length === 0) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-edu-navy to-edu-blue p-6 text-white shadow-md">
        <h3 className="text-xl font-semibold">Filtered Performance Output</h3>
        <p className="mt-3 text-sm text-white/70">
          No student data found for the selected filters.
        </p>
      </div>
    )
  }

  const metrics = parameters.map((item) => {
    const total = students.reduce((sum, student) => sum + Number(student[item.key] || 0), 0)
    const average = Number((total / students.length).toFixed(1))
    return { ...item, value: average }
  })

  return (
    <div className="rounded-2xl bg-gradient-to-br from-edu-navy to-edu-blue p-6 text-white shadow-md">
      <h3 className="text-xl font-semibold">Filtered Performance Output</h3>
      <p className="mb-6 mt-1 text-sm text-white/70">Based on {students.length} student(s)</p>

      <div className="space-y-5">
        {metrics.map((metric) => (
          <div key={metric.key}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-white/85">{metric.label}</span>
              <span className="font-semibold">
                {metric.value}
                {metric.suffix}
              </span>
            </div>
            <div className="h-3 rounded-full bg-white/25">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-edu-mint to-edu-teal"
                style={{ width: `${Math.min(metric.value, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SubjectAnalytics