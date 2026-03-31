function FilterBar({
  filters,
  onFilterChange,
  branchOptions,
  subjectOptions,
  semesterOptions,
  sortOptions,
}) {
  const inputClass =
    'rounded-2xl border border-edu-blue/20 bg-white px-3 py-2.5 text-sm text-edu-navy outline-none transition focus:border-edu-teal focus:ring-2 focus:ring-edu-teal/25'

  return (
    <section className="rounded-2xl bg-edu-sand/35 p-4 shadow-md">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-edu-blue">Filter by</h2>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <select
          className={inputClass}
          value={filters.branch}
          onChange={(event) => onFilterChange('branch', event.target.value)}
        >
          <option value="">Branch</option>
          {branchOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <select
          className={inputClass}
          value={filters.subject}
          onChange={(event) => onFilterChange('subject', event.target.value)}
        >
          <option value="">Subject</option>
          {subjectOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <select
          className={inputClass}
          value={filters.semester}
          onChange={(event) => onFilterChange('semester', event.target.value)}
        >
          <option value="">Semester</option>
          {semesterOptions.map((option) => (
            <option key={option} value={option}>
              Semester {option}
            </option>
          ))}
        </select>

        <select
          className={inputClass}
          value={filters.sorting}
          onChange={(event) => onFilterChange('sorting', event.target.value)}
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </section>
  )
}

export default FilterBar