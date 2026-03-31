const statusStyles = {
  Low: {
    row: 'bg-green-50/70',
    pill: 'bg-green-100 text-green-700',
  },
  Medium: {
    row: 'bg-yellow-50/80',
    pill: 'bg-yellow-200 text-amber-800',
  },
  High: {
    row: 'bg-red-50/80',
    pill: 'bg-red-100 text-red-700',
  },
}

function StudentTable({ students }) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-md">
      <div className="mb-3 flex items-center justify-between border-b border-edu-blue/10 pb-3">
        <h2 className="text-lg font-semibold text-edu-navy">Student Risk Table</h2>
        <span className="text-xs font-medium text-edu-blue">{students.length} records</span>
      </div>

      <div className="max-h-96 overflow-auto rounded-xl border border-edu-blue/15">
        <table className="w-full min-w-[680px] text-sm">
          <thead className="sticky top-0 bg-edu-bg">
            <tr className="border-b border-edu-blue/15 text-left">
              <th className="px-4 py-3 font-semibold text-edu-navy">Student ID</th>
              <th className="px-4 py-3 font-semibold text-edu-navy">Name</th>
              <th className="px-4 py-3 font-semibold text-edu-navy">Status</th>
              <th className="px-4 py-3 font-semibold text-edu-navy">Reason</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-edu-blue">
                  No students match the selected filters.
                </td>
              </tr>
            ) : (
              students.map((student) => {
                const style = statusStyles[student.status] || statusStyles.Low
                return (
                  <tr
                    key={student.id}
                    className={`border-b border-edu-blue/10 align-top last:border-b-0 ${style.row}`}
                  >
                    <td className="px-4 py-3 font-semibold text-edu-navy">{student.id}</td>
                    <td className="px-4 py-3 text-edu-navy">{student.name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${style.pill}`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-edu-blue">{student.reason}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default StudentTable