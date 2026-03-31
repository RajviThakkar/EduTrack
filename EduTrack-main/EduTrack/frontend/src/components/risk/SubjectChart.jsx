function SubjectChart({ students }) {
  const summary = students.reduce((acc, student) => {
    const key = student.subject
    if (!acc[key]) {
      acc[key] = { Low: 0, Medium: 0, High: 0, total: 0 }
    }
    acc[key][student.status] += 1
    acc[key].total += 1
    return acc
  }, {})

  const subjects = Object.entries(summary)

  return (
    <section className="rounded-2xl bg-white p-4 shadow-md">
      <h2 className="text-lg font-semibold text-edu-navy">Subject Analysis</h2>
      <p className="mt-1 text-sm text-edu-blue">Distribution of student risk per subject</p>

      <div className="mt-4 space-y-4">
        {subjects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-edu-blue/25 bg-edu-sand/25 p-6 text-center text-sm text-edu-blue">
            No data available for subject analysis chart.
          </div>
        ) : (
          subjects.map(([subject, counts]) => {
            const low = counts.total ? (counts.Low / counts.total) * 100 : 0
            const medium = counts.total ? (counts.Medium / counts.total) * 100 : 0
            const high = counts.total ? (counts.High / counts.total) * 100 : 0

            return (
              <div key={subject}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-edu-navy">{subject}</span>
                  <span className="text-edu-blue">{counts.total} students</span>
                </div>
                <div className="h-4 w-full overflow-hidden rounded-full bg-edu-bg">
                  <div className="flex h-full w-full">
                    <div className="h-full bg-[#6BCF8E]" style={{ width: `${low}%` }} />
                    <div className="h-full bg-[#DBD8A0]" style={{ width: `${medium}%` }} />
                    <div className="h-full bg-red-400" style={{ width: `${high}%` }} />
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs font-medium">
        <span className="inline-flex items-center gap-1 text-edu-navy">
          <span className="h-2.5 w-2.5 rounded-full bg-[#6BCF8E]" /> Low
        </span>
        <span className="inline-flex items-center gap-1 text-edu-navy">
          <span className="h-2.5 w-2.5 rounded-full bg-[#DBD8A0]" /> Medium
        </span>
        <span className="inline-flex items-center gap-1 text-edu-navy">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" /> High
        </span>
      </div>
    </section>
  )
}

export default SubjectChart