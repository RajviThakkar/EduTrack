function AttendanceTable({ data }) {
  return (
    <div className="overflow-x-auto rounded-soft bg-white p-4 shadow-soft">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-edu-blue/15 text-edu-navy">
            <th className="py-3 font-semibold">Subject</th>
            <th className="py-3 font-semibold">Classes Attended</th>
            <th className="py-3 font-semibold">Total Classes</th>
            <th className="py-3 font-semibold">Percentage</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.subject} className="border-b border-edu-blue/10">
              <td className="py-3 font-medium text-edu-navy">{row.subject}</td>
              <td className="py-3 text-edu-blue">{row.attended}</td>
              <td className="py-3 text-edu-blue">{row.total}</td>
              <td className="py-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-28 rounded-full bg-edu-sand/45">
                    <div
                      className="h-2 rounded-full bg-edu-mint"
                      style={{ width: `${row.percentage}%` }}
                    />
                  </div>
                  <span className="font-medium text-edu-navy">{row.percentage}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default AttendanceTable