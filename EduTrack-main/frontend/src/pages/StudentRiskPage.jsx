import { useEffect, useState } from 'react'
import api from '../api/api'

// ── Rule-based fallback (mirrors RiskPrediction_updated.ipynb assign_risk) ─────
function ruleBasedRisk(f) {
  let score = 0
  if (f.attendance_pct < 60)  score += 3; else if (f.attendance_pct < 75) score += 1
  if (f.exam_avg < 40)        score += 3; else if (f.exam_avg < 55)       score += 2; else if (f.exam_avg < 65) score += 1
  if (f.quiz_avg < 40)        score += 2; else if (f.quiz_avg < 55)       score += 1
  if (f.assignment_avg < 40)  score += 2; else if (f.assignment_avg < 55) score += 1
  if (f.practical_avg < 40)   score += 2; else if (f.practical_avg < 55)  score += 1
  if (score >= 7) return 'High'
  if (score >= 3) return 'Medium'
  return 'Low'
}

function avg(arr) {
  return arr.length > 0 ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0
}

const toneMap = {
  High:   { bg: 'bg-red-50',    border: 'border-red-200',   text: 'text-red-700',   badge: 'bg-red-100 text-red-700' },
  Medium: { bg: 'bg-amber-50',  border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' },
  Low:    { bg: 'bg-green-50',  border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-700' },
}

export default function StudentRiskPage() {
  const [loading, setLoading]       = useState(true)
  const [risk, setRisk]             = useState(null)      // 'High' | 'Medium' | 'Low'
  const [reason, setReason]         = useState('')
  const [features, setFeatures]     = useState(null)
  const [mlUsed, setMlUsed]         = useState(false)
  const [error, setError]           = useState(null)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        // ── 1. Get logged-in student's ID ──────────────────────────────────────
        let studentId = null
        try {
          const u = JSON.parse(localStorage.getItem('edutrack_user') || '{}')
          studentId = u.student_id || u.id || null
          if (!studentId && u.email) {
            // Fetch by email if student_id not in token
            const allRes = await api.get('/api/students')
            const found = (Array.isArray(allRes.data) ? allRes.data : []).find(
              (s) => s.email === u.email,
            )
            studentId = found?.student_id || null
          }
        } catch { /* ignore */ }

        if (!studentId) {
          setError('Could not identify the logged-in student. Please sign in again.')
          return
        }

        // ── 2. Fetch this student's marks ─────────────────────────────────────
        let marksRecords = []
        try {
          const marksRes = await api.get(`/api/marks/${studentId}`)
          marksRecords = Array.isArray(marksRes.data) ? marksRes.data : []
        } catch { /* ignore */ }

        // ── 3. Fetch this student's attendance ────────────────────────────────
        let attendancePct = 0
        try {
          const attRes = await api.get(`/api/attendance/${studentId}`)
          const recs   = Array.isArray(attRes.data) ? attRes.data : []
          if (recs.length > 0) {
            const present = recs.filter((r) => String(r.status || '').toLowerCase() === 'present').length
            attendancePct = Math.round((present / recs.length) * 100)
          }
        } catch { /* ignore */ }

        // ── 4. Compute feature averages ───────────────────────────────────────
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

        const computed = {
          quiz_avg:       avg(byType.quiz),
          assignment_avg: avg(byType.assignment),
          exam_avg:       avg(byType.exam),
          practical_avg:  avg(byType.practicals),
          attendance_pct: attendancePct,
        }
        setFeatures(computed)

        // ── 5. Call ML service ────────────────────────────────────────────────
        let finalRisk   = null
        let finalReason = null

        try {
          const mlRes = await api.post('/api/ml/predict', computed)
          if (mlRes.data?.success && mlRes.data?.prediction) {
            const pred  = mlRes.data.prediction
            const raw   = String(pred.risk_level || '').toLowerCase()
            if (raw === 'high')        { finalRisk = 'High';   finalReason = pred.reason }
            else if (raw === 'medium') { finalRisk = 'Medium'; finalReason = pred.reason }
            else if (raw === 'low')    { finalRisk = 'Low';    finalReason = pred.reason }
            if (finalRisk) setMlUsed(true)
          }
        } catch { /* ML unavailable */ }

        // ── 6. Fallback to rule-based ─────────────────────────────────────────
        if (!finalRisk) {
          finalRisk   = ruleBasedRisk(computed)
          finalReason = 'Based on your attendance and marks analysis'
        }

        setRisk(finalRisk)
        setReason(finalReason || '')
      } catch (e) {
        setError('Failed to load risk prediction. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-edu-navy/60">
        Calculating your risk level…
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
        {error}
      </div>
    )
  }

  const tone = toneMap[risk] || toneMap.Low

  return (
    <div className="space-y-6">
      {/* Risk banner */}
      <div className={`rounded-2xl border ${tone.border} ${tone.bg} px-6 py-6 shadow-sm`}>
        <p className="text-sm font-medium text-edu-navy/60">Your Risk Level</p>
        <div className="mt-2 flex items-center gap-3">
          <span className={`rounded-full px-4 py-1.5 text-lg font-bold ${tone.badge}`}>
            {risk}
          </span>
          {mlUsed && (
            <span className="text-xs text-edu-navy/40">via ML model</span>
          )}
        </div>
        {reason && (
          <p className={`mt-3 text-sm font-medium ${tone.text}`}>{reason}</p>
        )}
      </div>

      {/* Feature breakdown */}
      {features && (
        <div className="rounded-2xl border border-edu-blue/15 bg-white p-6 shadow-soft">
          <h2 className="mb-4 text-base font-semibold text-edu-navy">Score Breakdown</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: 'Quiz Avg.',       value: features.quiz_avg,       warn: features.quiz_avg < 55 },
              { label: 'Assignment Avg.', value: features.assignment_avg, warn: features.assignment_avg < 55 },
              { label: 'Exam Avg.',       value: features.exam_avg,       warn: features.exam_avg < 55 },
              { label: 'Practical Avg.',  value: features.practical_avg,  warn: features.practical_avg < 55 },
              { label: 'Attendance',      value: `${features.attendance_pct}%`, warn: features.attendance_pct < 75 },
            ].map(({ label, value, warn }) => (
              <div
                key={label}
                className={`rounded-xl border px-4 py-3 ${
                  warn
                    ? 'border-red-200 bg-red-50'
                    : 'border-edu-blue/15 bg-edu-bg'
                }`}
              >
                <p className="text-xs font-medium uppercase tracking-wide text-edu-navy/50">{label}</p>
                <p className={`mt-1 text-xl font-bold ${warn ? 'text-red-600' : 'text-edu-navy'}`}>
                  {typeof value === 'number' ? `${value}%` : value}
                </p>
                {warn && (
                  <p className="mt-0.5 text-xs text-red-500">Below threshold</p>
                )}
              </div>
            ))}
          </div>
          {Object.values(features).every((v) => v === 0) && (
            <p className="mt-4 text-sm text-edu-navy/50">
              No marks or attendance data found yet. Risk is calculated as Low by default.
            </p>
          )}
        </div>
      )}

      {/* Tips */}
      {risk !== 'Low' && (
        <div className="rounded-2xl border border-edu-blue/15 bg-white p-6 shadow-soft">
          <h2 className="mb-3 text-base font-semibold text-edu-navy">Improvement Tips</h2>
          <ul className="space-y-2 text-sm text-edu-navy/70">
            {features?.attendance_pct < 75 && (
              <li className="flex gap-2">
                <span className="mt-0.5 text-amber-500">•</span>
                Improve attendance — aim for at least 75% to avoid shortage
              </li>
            )}
            {features?.exam_avg < 55 && (
              <li className="flex gap-2">
                <span className="mt-0.5 text-amber-500">•</span>
                Focus on exam preparation — solve previous year papers
              </li>
            )}
            {features?.quiz_avg < 55 && (
              <li className="flex gap-2">
                <span className="mt-0.5 text-amber-500">•</span>
                Practice more quizzes — aim for weekly revision sessions
              </li>
            )}
            {features?.assignment_avg < 55 && (
              <li className="flex gap-2">
                <span className="mt-0.5 text-amber-500">•</span>
                Complete all assignments on time
              </li>
            )}
            {features?.practical_avg < 55 && (
              <li className="flex gap-2">
                <span className="mt-0.5 text-amber-500">•</span>
                Improve practical scores — attend all lab sessions
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
