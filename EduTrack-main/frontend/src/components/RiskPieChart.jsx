function RiskPieChart({ students, subjectName }) {
  const safeStudents = Array.isArray(students) ? students : []

  const riskCounts = safeStudents.reduce(
    (acc, student) => {
      const status = String(student.status || '').trim().toLowerCase()
      if (status === 'high') acc.high += 1
      else if (status === 'medium') acc.medium += 1
      else acc.low += 1

      return acc
    },
    { high: 0, medium: 0, low: 0 },
  )

  const total = safeStudents.length
  const highPct = total > 0 ? (riskCounts.high / total) * 100 : 0
  const mediumPct = total > 0 ? (riskCounts.medium / total) * 100 : 0
  const lowPct = total > 0 ? (riskCounts.low / total) * 100 : 0

  const firstStop = highPct
  const secondStop = highPct + mediumPct
  const pieStyle = {
    backgroundImage: `conic-gradient(#ef4444 0% ${firstStop}%, #f59e0b ${firstStop}% ${secondStop}%, #22c55e ${secondStop}% 100%)`,
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-md">
      <h3 className="text-lg font-semibold text-edu-navy">Risk Distribution</h3>
      <p className="mt-1 text-xs text-edu-blue">
        {subjectName ? `Subject: ${subjectName}` : 'Selected Subject'}
      </p>

      <div className="mt-4 flex items-center justify-center">
        <div className="relative h-48 w-48 rounded-full" style={pieStyle}>
          <div className="absolute inset-8 flex items-center justify-center rounded-full bg-white text-center">
            <div>
              <p className="text-2xl font-bold text-edu-navy">{total}</p>
              <p className="text-xs text-edu-blue">Students</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-edu-navy">
            <span className="h-3 w-3 rounded-full bg-red-500" />
            High Risk
          </div>
          <span className="font-medium text-edu-navy">
            {riskCounts.high} ({highPct.toFixed(1)}%)
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-edu-navy">
            <span className="h-3 w-3 rounded-full bg-orange-500" />
            Medium Risk
          </div>
          <span className="font-medium text-edu-navy">
            {riskCounts.medium} ({mediumPct.toFixed(1)}%)
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-edu-navy">
            <span className="h-3 w-3 rounded-full bg-green-500" />
            Low Risk
          </div>
          <span className="font-medium text-edu-navy">
            {riskCounts.low} ({lowPct.toFixed(1)}%)
          </span>
        </div>
      </div>
    </div>
  )
}

export default RiskPieChart