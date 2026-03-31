import { useEffect, useState } from 'react'
import api from '../api/api'
import { BRANCH_OPTIONS, SEMESTER_OPTIONS, BATCH_OPTIONS } from '../config/academicOptions'
import BulkStudentImportPanel from '../components/BulkStudentImportPanel'

const emptyForm = {
  student_id: '',
  name: '',
  branch: '',
  semester: '',
  batch: '',
  email: '',
  year: '',
  cgpa: '',
}

export default function AddStudent() {
  const [form, setForm] = useState(emptyForm)
  const [status, setStatus] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [counsellorName, setCounsellorName] = useState('Unassigned')

  useEffect(() => {
    try {
      const userRaw = localStorage.getItem('edutrack_user')
      if (!userRaw) return
      const user = JSON.parse(userRaw)
      if (user?.name?.trim()) {
        setCounsellorName(user.name.trim())
      }
    } catch {
    }
  }, [])

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setStatus(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const required = ['student_id', 'name', 'branch', 'semester', 'batch']
    const missing = required.filter((f) => !form[f].toString().trim())
    if (missing.length) {
      setStatus({ type: 'error', message: `Please fill in: ${missing.join(', ')}` })
      return
    }

    setSubmitting(true)
    setStatus(null)
    try {
      const { data } = await api.post(
        '/api/students',
        {
          ...form,
          semester: Number(form.semester),
          counsellor_name: counsellorName,
        },
        { timeout: 15000 },
      )

      setStatus({
        type: 'success',
        message: `Student "${data.student?.name}" (Enrollment: ${data.student?.student_id}) added successfully. Login password: student123`,
      })
      setForm(emptyForm)
    } catch (error) {
      const message =
        error?.response?.data?.error ||
        (error?.code === 'ECONNABORTED'
          ? 'Request timed out. Check backend connection.'
          : 'Network error. Is the server running?')
      setStatus({ type: 'error', message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <BulkStudentImportPanel
        title="Bulk Add Students"
        importDefaults={{ counsellor_name: counsellorName }}
        onImported={async (summary) => {
          if (Number(summary?.createdCount || 0) > 0) {
            setStatus({
              type: 'success',
              message: `${summary.createdCount} students added successfully via bulk upload. Login password: student123`,
            })
          }
        }}
      />

      <section className="rounded-2xl border border-edu-blue/20 bg-white p-6 shadow-soft">
        <h2 className="mb-6 text-lg font-semibold text-edu-navy">Add New Student</h2>
        <p className="mb-4 text-sm text-edu-blue">Assigned counsellor: {counsellorName}</p>

        {status && (
          <div
            className={`mb-5 rounded-xl px-4 py-3 text-sm font-medium ${
              status.type === 'success'
                ? 'border border-green-200 bg-green-50 text-green-700'
                : 'border border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Enrollment No. *" name="student_id" value={form.student_id} onChange={handleChange} placeholder="e.g. 2301CS001" />
          <Field label="Full Name *" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Rahul Sharma" />

          <SelectField label="Branch *" name="branch" value={form.branch} onChange={handleChange} options={BRANCH_OPTIONS} placeholder="select branch" />
          <SelectField label="Semester *" name="semester" value={form.semester} onChange={handleChange} options={SEMESTER_OPTIONS.map(String)} placeholder="select semester" renderOption={(v) => `Semester ${v}`} />
          <SelectField label="Batch *" name="batch" value={form.batch} onChange={handleChange} options={BATCH_OPTIONS} placeholder="select batch" renderOption={(v) => `Batch ${v}`} />

          <Field label="Email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="student@example.com" />
          <Field label="Year" name="year" value={form.year} onChange={handleChange} placeholder="e.g. 3rd Year" />
          <Field label="Current CGPA" name="cgpa" type="number" step="0.01" value={form.cgpa} onChange={handleChange} placeholder="e.g. 8.5" />

          <div className="col-span-full mt-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-edu-navy px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? 'Adding Student...' : 'Add Student'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

const selectCls =
  'rounded-xl border border-edu-blue/30 bg-edu-bg px-3 py-2.5 text-sm text-edu-navy focus:border-edu-blue focus:outline-none focus:ring-2 focus:ring-edu-blue/20'

function SelectField({ label, name, value, onChange, options, placeholder, renderOption }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-edu-navy/80">{label}</label>
      <select name={name} value={value} onChange={onChange} className={selectCls}>
        <option value="">- {placeholder} -</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {renderOption ? renderOption(opt) : opt}
          </option>
        ))}
      </select>
    </div>
  )
}

function Field({ label, name, value, onChange, placeholder, type = 'text', ...rest }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-edu-navy/80">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="rounded-xl border border-edu-blue/30 bg-edu-bg px-3 py-2.5 text-sm text-edu-navy placeholder:text-edu-navy/35 focus:border-edu-blue focus:outline-none focus:ring-2 focus:ring-edu-blue/20"
        {...rest}
      />
    </div>
  )
}
