import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Navbar from './components/Navbar'
import FacultyDashboard from './pages/FacultyDashboard'
import FacultyDataPage from './pages/FacultyDataPage'
import RiskPredictionPage from './pages/RiskPredictionPage'
import AddStudent from './pages/AddStudent'
import StudentDashboard from './pages/StudentDashboard'
import Attendance from './pages/Attendance'
import PredictCGPA from './pages/PredictCGPA'
import LandingPage from './pages/LandingPage'
import SignInPage from './pages/SignInPage'
import SignUpPage from './pages/SignUpPage'
import StudentManagementPage from './pages/StudentManagementPage'

function AppContent() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/login" element={<SignInPage />} />
      <Route path="/sign-in" element={<Navigate to="/login" replace />} />
      <Route path="/sign-up" element={<Navigate to="/landing" replace />} />
      <Route path="/student/login" element={<Navigate to="/login?role=student" replace />} />
      <Route path="/faculty/login" element={<Navigate to="/login?role=faculty" replace />} />
      <Route path="/admin/login" element={<Navigate to="/login?role=admin" replace />} />
      <Route path="/student/signup" element={<SignUpPage role="student" />} />
      <Route path="/faculty/signup" element={<SignUpPage role="faculty" />} />
      <Route path="/admin/signup" element={<SignUpPage role="admin" />} />
      <Route path="/student/sign-in" element={<Navigate to="/login?role=student" replace />} />
      <Route path="/faculty/sign-in" element={<Navigate to="/login?role=faculty" replace />} />
      <Route path="/admin/sign-in" element={<Navigate to="/login?role=admin" replace />} />
      <Route path="/student/sign-up" element={<SignUpPage role="student" />} />
      <Route path="/faculty/sign-up" element={<SignUpPage role="faculty" />} />
      <Route path="/admin/sign-up" element={<SignUpPage role="admin" />} />

      <Route path="/faculty/home" element={<Navigate to="/faculty/dashboard" replace />} />
      <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
      <Route path="/faculty/data" element={<FacultyDataPage />} />
      <Route path="/faculty/predict-risk" element={<RiskPredictionPage />} />
      <Route path="/faculty/manage-students" element={<StudentManagementPage />} />
      <Route path="/faculty/student-overview" element={<Navigate to="/faculty/predict-risk" replace />} />
      <Route path="/faculty/subject-analytics" element={<Navigate to="/faculty/predict-risk" replace />} />

      {/* ── Admin dashboard routes ── */}
      <Route path="/admin/home" element={<Navigate to="/admin/manage-students" replace />} />
      <Route path="/admin/dashboard" element={<Navigate to="/admin/manage-students" replace />} />
      <Route path="/admin/data" element={<Navigate to="/admin/manage-students" replace />} />
      <Route path="/admin/add-student" element={<AddStudent />} />
      <Route path="/admin/manage-students" element={<StudentManagementPage />} />
      <Route path="/admin/predict-risk" element={<Navigate to="/admin/add-student" replace />} />

      {/* ── Counsellor auth routes ── */}
      <Route path="/counsellor/login" element={<Navigate to="/login?role=counsellor" replace />} />
      <Route path="/counsellor/signup" element={<SignUpPage role="counsellor" />} />
      <Route path="/counsellor/sign-in" element={<Navigate to="/login?role=counsellor" replace />} />
      <Route path="/counsellor/sign-up" element={<SignUpPage role="counsellor" />} />

      {/* ── Counsellor dashboard routes ── */}
      <Route path="/counsellor/home" element={<Navigate to="/counsellor/manage-students" replace />} />
      <Route path="/counsellor/dashboard" element={<Navigate to="/counsellor/manage-students" replace />} />
      <Route path="/counsellor/data" element={<Navigate to="/counsellor/manage-students" replace />} />
      <Route path="/counsellor/add-student" element={<AddStudent />} />
      <Route path="/counsellor/manage-students" element={<StudentManagementPage />} />
      <Route path="/counsellor/predict-risk" element={<Navigate to="/counsellor/add-student" replace />} />
      <Route path="/counsellor/assign-counsellor" element={<Navigate to="/counsellor/add-student" replace />} />

      <Route path="/student/home" element={<Navigate to="/student/dashboard" replace />} />
      <Route path="/student/dashboard" element={<StudentDashboard />} />
      <Route path="/student/attendance" element={<Attendance />} />
      <Route path="/student/predict-cgpa" element={<PredictCGPA />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function AppRoutes() {
  const location = useLocation()
  const isRoleAuthRoute = /^\/(faculty|student|counsellor)\/(sign-in|sign-up|login|signup)\/?$/.test(
    location.pathname,
  )
  const isAdminAuthRoute = /^\/admin\/(sign-in|sign-up|login|signup)\/?$/.test(location.pathname)
  const isAuthRoute = isRoleAuthRoute || isAdminAuthRoute
  const isFacultyDashboard = location.pathname.startsWith('/faculty') && !isAuthRoute
  const isCounsellorDashboard = location.pathname.startsWith('/counsellor') && !isAuthRoute
  const isAdminDashboard = location.pathname.startsWith('/admin') && !isAuthRoute
  const isStudentDashboard = location.pathname.startsWith('/student') && !isAuthRoute

  // ── Counsellor: same shared layout as faculty ────────────────────────────
  if (isCounsellorDashboard) {
    return (
      <div className="min-h-screen bg-edu-bg text-edu-navy">
        <Navbar />
        <Sidebar />
        <main className="mx-auto w-full max-w-7xl p-6">
          <AppContent />
        </main>
      </div>
    )
  }

  if (isAdminDashboard) {
    return (
      <div className="min-h-screen bg-edu-bg text-edu-navy">
        <Navbar />
        <Sidebar />
        <main className="mx-auto w-full max-w-7xl p-6">
          <AppContent />
        </main>
      </div>
    )
  }

  // ── Faculty: top navbar + horizontal nav + content ──────────────────────
  if (isFacultyDashboard) {
    return (
      <div className="min-h-screen bg-edu-bg text-edu-navy">
        <Navbar />
        <Sidebar />
        <main className="mx-auto w-full max-w-7xl p-6">
          <AppContent />
        </main>
      </div>
    )
  }

  // ── Student / public: original stacked layout ────────────────────────────
  return (
    <div className="min-h-screen text-edu-navy">
      {isStudentDashboard && (
        <>
          <Navbar />
          <Sidebar />
        </>
      )}
      <main
        className={
          isStudentDashboard
            ? 'mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8'
            : 'mx-auto w-full max-w-6xl p-4 sm:p-8'
        }
      >
        <AppContent />
      </main>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App
