import { useMemo, useState } from 'react'

function PredictCGPA() {
  const [subjects, setSubjects] = useState([])
  const [predicted, setPredicted] = useState(null)

  const isValid = useMemo(
    () => subjects.length > 0,
    [subjects]
  )

  const addSubject = () => {
    setSubjects((prev) => [...prev, { id: Date.now(), name: '', gpa: 0, credit: 0 }])
    setPredicted(null)
  }

  const removeSubject = (id) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id))
    setPredicted(null)
  }

  const updateSubject = (id, field, value) => {
    setSubjects((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: field === 'name' ? value : Number(value) } : s))
    )
    setPredicted(null)
  }

  const handleCalculate = () => {
    if (!isValid) return
    const totalWeightedGPA = subjects.reduce((sum, s) => sum + s.gpa * s.credit, 0)
    const totalCredits = subjects.reduce((sum, s) => sum + s.credit, 0)
    if (totalCredits === 0) {
      setPredicted('--')
      return
    }
    const cgpa = (totalWeightedGPA / totalCredits).toFixed(2)
    setPredicted(cgpa)
  }

  return (
    <div className="space-y-6">
      <section className="rounded-soft bg-white p-5 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-edu-navy">Add Subjects</h2>
          <button
            type="button"
            onClick={addSubject}
            className="rounded-lg bg-edu-teal px-3 py-1.5 text-sm font-medium text-white transition hover:bg-edu-blue"
          >
            + Add Subject
          </button>
        </div>

        {subjects.length === 0 ? (
          <p className="text-sm text-edu-navy/50">No subjects added yet. Click "+ Add Subject" to begin.</p>
        ) : (
          <div className="space-y-3">
            {subjects.map((subject) => (
              <div key={subject.id} className="grid gap-3 rounded-lg border border-edu-blue/20 bg-edu-bg p-4 sm:grid-cols-4 sm:items-end">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-edu-navy/70">Subject Name</span>
                  <input
                    type="text"
                    value={subject.name}
                    onChange={(e) => updateSubject(subject.id, 'name', e.target.value)}
                    placeholder="e.g. Mathematics"
                    className="rounded-lg border border-edu-blue/20 bg-white px-3 py-2 text-sm outline-none transition focus:border-edu-teal focus:ring-2 focus:ring-edu-teal/25"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-edu-navy/70">Expected GPA (0-10)</span>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={subject.gpa}
                    onChange={(e) => updateSubject(subject.id, 'gpa', e.target.value)}
                    placeholder="e.g. 8.5"
                    className="rounded-lg border border-edu-blue/20 bg-white px-3 py-2 text-sm outline-none transition focus:border-edu-teal focus:ring-2 focus:ring-edu-teal/25"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-edu-navy/70">Credit Hours</span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={subject.credit}
                    onChange={(e) => updateSubject(subject.id, 'credit', e.target.value)}
                    placeholder="e.g. 3"
                    className="rounded-lg border border-edu-blue/20 bg-white px-3 py-2 text-sm outline-none transition focus:border-edu-teal focus:ring-2 focus:ring-edu-teal/25"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => removeSubject(subject.id)}
                  className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-100"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={handleCalculate}
          disabled={!isValid}
          className="mt-5 rounded-lg bg-edu-navy px-5 py-2.5 font-medium text-white transition hover:bg-edu-blue disabled:cursor-not-allowed disabled:opacity-60"
        >
          Calculate CGPA
        </button>
      </section>

      <section className="rounded-soft bg-white p-5 shadow-soft">
        <h2 className="text-lg font-semibold text-edu-navy">Predicted CGPA</h2>
        <p className="mt-2 text-sm text-edu-blue">Your weighted CGPA prediction:</p>
        <div className="mt-3 inline-flex items-center rounded-xl bg-edu-blue/12 px-4 py-2">
          <span className="text-2xl font-bold text-edu-navy">{predicted ?? '--'}</span>
        </div>
      </section>
    </div>
  )
}

export default PredictCGPA