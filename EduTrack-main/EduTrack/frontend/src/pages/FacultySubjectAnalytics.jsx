import SubjectAnalytics from '../components/SubjectAnalytics'
import AlertBanner from '../components/AlertBanner'

function FacultySubjectAnalytics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-edu-navy">Subject Analytics</h1>
        <p className="text-sm text-edu-blue">
          Analyze which subjects currently have the highest at-risk student counts.
        </p>
      </div>

      <AlertBanner
        tone="warning"
        title="Subject Risk Alert"
        message="Mathematics and Operating Systems currently require immediate faculty intervention plans."
        actionLabel="Open Risk Prediction"
        actionTo="/faculty/predict-risk"
      />

      <SubjectAnalytics />

      <section className="rounded-soft bg-white p-5 shadow-soft">
        <h2 className="text-lg font-semibold text-edu-navy">Insights</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-edu-blue">
          <li>Mathematics currently has the highest at-risk concentration.</li>
          <li>Operating Systems and Data Structures require focused interventions.</li>
          <li>DBMS and Computer Networks show relatively lower risk density.</li>
        </ul>
      </section>
    </div>
  )
}

export default FacultySubjectAnalytics