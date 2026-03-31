import { useState } from 'react'
import api from '../api/api'
import { parseStudentImportFile } from '../utils/studentBulkImport'

function BulkStudentImportPanel({
  title = 'Bulk Student Import',
  className = '',
  importDefaults,
  onAfterImport,
  onImported,
  disabled = false,
  disabledMessage = '',
  skipStudentCreation = false,
}) {
  const [summary, setSummary] = useState(null)
  const [isImporting, setIsImporting] = useState(false)

  const handleStudentFileImport = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setSummary(null)

    try {
      const parsed = await parseStudentImportFile(file, { defaults: importDefaults })

      if (parsed.students.length === 0) {
        const nextSummary = {
          fileName: file.name,
          totalRows: parsed.totalRows,
          createdCount: 0,
          failedCount: parsed.rowErrors.length,
          errors: parsed.rowErrors,
          message: 'No valid rows found to import.',
        }
        setSummary(nextSummary)
        if (onImported) onImported(nextSummary)
        return
      }

      let createdCount = 0
      let errors = [...parsed.rowErrors]
      let message = 'Bulk import completed.'

      if (!skipStudentCreation) {
        let apiPayload = null
        try {
          const response = await api.post('/api/students/bulk', { students: parsed.students })
          apiPayload = response?.data || {}
        } catch (error) {
          apiPayload = error?.response?.data
          if (!apiPayload) {
            throw error
          }
        }

        const backendErrors = Array.isArray(apiPayload?.errors) ? apiPayload.errors : []
        const normalizedBackendErrors = backendErrors.map((item) => ({
          row: item?.row ?? '-',
          error: item?.error || 'Unknown import error',
        }))

        createdCount = Number(apiPayload?.created_count || 0)
        errors = [...errors, ...normalizedBackendErrors]
        message = apiPayload?.message || message
      }

      let failedCount = errors.length

      const nextSummary = {
        fileName: file.name,
        totalRows: parsed.totalRows,
        createdCount,
        failedCount,
        errors,
        message,
      }

      if (onAfterImport) {
        const afterImportResult = await onAfterImport({ parsed, summary: nextSummary })
        if (afterImportResult?.message) {
          nextSummary.message = `${nextSummary.message} ${afterImportResult.message}`.trim()
        }
        if (Array.isArray(afterImportResult?.errors) && afterImportResult.errors.length > 0) {
          nextSummary.errors = [...(nextSummary.errors || []), ...afterImportResult.errors]
          nextSummary.failedCount = nextSummary.errors.length
        }
      }

      setSummary(nextSummary)
      if (onImported) onImported(nextSummary)
    } catch (error) {
      const nextSummary = {
        fileName: file.name,
        totalRows: 0,
        createdCount: 0,
        failedCount: 1,
        errors: [{ row: '-', error: error?.message || 'Failed to import file.' }],
        message: 'Bulk import failed.',
      }
      setSummary(nextSummary)
      if (onImported) onImported(nextSummary)
    } finally {
      setIsImporting(false)
      event.target.value = ''
    }
  }

  return (
    <section className={`rounded-2xl bg-white p-6 shadow-md ${className}`.trim()}>
      <h2 className="text-xl font-bold text-edu-navy">{title}</h2>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleStudentFileImport}
          disabled={isImporting || disabled}
          className="block w-full max-w-md rounded-lg border border-edu-blue/20 bg-white px-3 py-2 text-sm text-edu-navy file:mr-3 file:rounded-md file:border-0 file:bg-[#2FA4A9] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white"
        />
        {isImporting && <span className="text-sm font-medium text-edu-blue">Importing students...</span>}
      </div>

      {disabled && disabledMessage ? (
        <p className="mt-2 text-xs text-edu-blue/80">{disabledMessage}</p>
      ) : null}

      {summary && (
        <div className="mt-4 rounded-xl border border-edu-blue/15 bg-edu-bg p-4">
          <p className="text-sm font-semibold text-edu-navy">{summary.message}</p>
          <p className="mt-1 text-xs text-edu-blue">File: {summary.fileName}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-white p-3">
              <p className="text-xs text-edu-blue">Rows Read</p>
              <p className="text-lg font-bold text-edu-navy">{summary.totalRows}</p>
            </div>
            <div className="rounded-lg bg-white p-3">
              <p className="text-xs text-edu-blue">Students Added</p>
              <p className="text-lg font-bold text-green-600">{summary.createdCount}</p>
            </div>
            <div className="rounded-lg bg-white p-3">
              <p className="text-xs text-edu-blue">Rows Failed</p>
              <p className="text-lg font-bold text-red-600">{summary.failedCount}</p>
            </div>
          </div>

          {summary.errors?.length > 0 && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-xs font-semibold text-red-700">Import errors (showing up to 5)</p>
              <ul className="mt-1 space-y-1 text-xs text-red-700">
                {summary.errors.slice(0, 5).map((item, index) => (
                  <li key={`${item.row}-${index}`}>Row {item.row}: {item.error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export default BulkStudentImportPanel
