import { NavLink, useLocation } from 'react-router-dom'

const facultyLinks = [
  { label: 'Dashboard', to: '/faculty/dashboard' },
  { label: 'Student Data', to: '/faculty/data' },
  { label: 'Manage Students', to: '/faculty/manage-students' },
  { label: 'Predict Risk', to: '/faculty/predict-risk' },
]

const counsellorLinks = [
  { label: 'Add Student', to: '/counsellor/add-student' },
  { label: 'Manage Students', to: '/counsellor/manage-students' },
]

const adminLinks = [
  { label: 'Add Student', to: '/admin/add-student' },
  { label: 'Manage Students', to: '/admin/manage-students' },
]

const studentLinks = [
  { label: 'Dashboard', to: '/student/dashboard' },
  { label: 'Attendance', to: '/student/attendance' },
  { label: 'Predict CGPA', to: '/student/predict-cgpa' },
]

function NavStrip({ links }) {
  return (
    <nav className="border-b border-edu-blue/20 bg-edu-navy px-4 py-3 text-white shadow-soft sm:px-6 lg:px-8">
      <div
        className="mx-auto grid w-full max-w-7xl gap-2 text-sm"
        style={{ gridTemplateColumns: `repeat(${links.length}, minmax(0, 1fr))` }}
      >
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `truncate rounded-xl px-3 py-2.5 text-center font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-white/22 text-white shadow-sm'
                  : 'text-white/72 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

function Sidebar() {
  const location = useLocation()
  const isFacultyPath = location.pathname.startsWith('/faculty')
  const isCounsellorPath = location.pathname.startsWith('/counsellor')
  const isAdminPath = location.pathname.startsWith('/admin')

  if (isAdminPath) return <NavStrip links={adminLinks} />
  if (isCounsellorPath) return <NavStrip links={counsellorLinks} />

  // ── Horizontal nav strip for faculty ───────────────────────────────────────
  if (isFacultyPath) return <NavStrip links={facultyLinks} />

  // ── Horizontal nav strip for students ───────────────────────────────────────
  return <NavStrip links={studentLinks} />
}

export default Sidebar