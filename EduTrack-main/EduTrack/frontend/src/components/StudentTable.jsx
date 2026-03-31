function StudentTable({ students }) {
  return (
    <div className="rounded-2xl bg-white shadow-md">
      <div className="border-b border-edu-blue/10 px-5 py-4">
        <h2 className="font-semibold text-edu-navy">Student List</h2>
        <p className="mt-0.5 text-xs text-edu-blue">{students.length} student{students.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-edu-blue/10 bg-edu-bg text-left">
              <th className="px-5 py-3 font-semibold text-edu-navy">Student Name</th>
              <th className="px-5 py-3 font-semibold text-edu-navy">Branch</th>
              <th className="px-5 py-3 font-semibold text-edu-navy">Semester</th>
              <th className="px-5 py-3 font-semibold text-edu-navy">Subject</th>
              <th className="px-5 py-3 font-semibold text-edu-navy">Attendance %</th>
              <th className="px-5 py-3 font-semibold text-edu-navy">Status</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-edu-blue">
                  No students match the current filters.
                </td>
              </tr>
            ) : (
              students.map((student, idx) => (
                <tr
                  key={idx}
                  className="border-b border-edu-blue/10 transition-colors last:border-0 hover:bg-edu-sand/30"
                >
                  <td className="px-5 py-3 font-medium text-edu-navy">{student.name}</td>
                  <td className="px-5 py-3 text-edu-blue">{student.branch}</td>
                  <td className="px-5 py-3 text-edu-blue">Sem {student.semester}</td>
                  <td className="px-5 py-3 text-edu-blue">{student.subject}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-20 rounded-full bg-edu-sand/50">
                        <div
                          className={`h-2 rounded-full ${
                            student.attendance < 75 ? 'bg-red-400' : 'bg-edu-mint'
                          }`}
                          style={{ width: `${student.attendance}%` }}
                        />
                      </div>
                      <span className="font-medium text-edu-navy">{student.attendance}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        student.status === 'At Risk'
                          ? 'bg-red-100 text-red-600'
                          : 'bg-edu-mint/25 text-green-700'
                      }`}
                    >
                      {student.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default StudentTable
