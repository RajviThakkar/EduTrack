function FilterBar({
  filters,
  onChange,
  onApply,
  canApply,
  branchOptions,
  subjectOptions,
  semesterOptions,
}) {
  const inputClass =
    'w-full rounded-lg border border-edu-blue/20 bg-white/90 px-3 py-2 text-sm text-edu-navy outline-none transition focus:border-edu-teal focus:ring-2 focus:ring-edu-teal/25'

  return (
    <div className="grid gap-3 rounded-2xl border border-edu-sand bg-edu-sand/70 p-4 shadow-md sm:grid-cols-2 lg:grid-cols-4">
      <select
        className={inputClass}
        value={filters.branch}
        onChange={(event) => onChange('branch', event.target.value)}
      >
        <option value="">Filter by Branch</option>
        {branchOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      <select
        className={inputClass}
        value={filters.subject}
        onChange={(event) => onChange('subject', event.target.value)}
      >
        <option value="">Filter by Subject</option>
        {subjectOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      <select
        className={inputClass}
        value={filters.semester}
        onChange={(event) => onChange('semester', event.target.value)}
      >
        <option value="">Filter by Semester</option>
        {semesterOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={onApply}
        disabled={!canApply}
        className="rounded-lg bg-edu-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-edu-blue disabled:cursor-not-allowed disabled:opacity-55"
      >
        Filter
      </button>
    </div>
  )
}

export default FilterBar