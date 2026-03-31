import * as XLSX from 'xlsx'

const REQUIRED_FIELDS = ['student_id', 'name']

const FIELD_ALIASES = {
  student_id: ['studentid', 'student_id', 'id', 'rollno', 'rollnumber', 'studentcode'],
  name: ['name', 'studentname', 'fullname', 'full_name'],
  branch: ['branch', 'department', 'dept'],
  semester: ['semester', 'sem'],
  batch: ['batch', 'division', 'group'],
  counsellor_name: ['counsellorname', 'counsellor_name', 'counselorname', 'mentor'],
  enrollment_id: ['enrollmentid', 'enrollment_id', 'enrollmentno', 'enrollment_no'],
  year: ['year'],
  email: ['email', 'mail'],
  cgpa: ['cgpa'],
  attendance_percentage: ['attendancepercentage', 'attendance_percentage', 'attendance'],
  present_flag: ['present', 'status', 'is_present', 'attendance_status'],
}

function normalizeHeader(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function normalizeCell(value) {
  return String(value ?? '').trim()
}

function firstMappedValue(rowMap, aliases) {
  for (const alias of aliases) {
    if (alias in rowMap && rowMap[alias] !== '') {
      return rowMap[alias]
    }
  }
  return ''
}

function toNumberOrEmpty(value) {
  if (value === '' || value === null || typeof value === 'undefined') {
    return ''
  }
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : value
}

function splitCsvLine(line) {
  const values = []
  let current = ''
  let inQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    const nextChar = line[index + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      values.push(current)
      current = ''
      continue
    }

    current += char
  }

  values.push(current)
  return values.map((item) => item.trim())
}

function parseCsvTextRows(text) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length < 2) {
    return []
  }

  const headers = splitCsvLine(lines[0])
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line)
    const row = {}
    headers.forEach((header, index) => {
      row[header] = values[index] ?? ''
    })
    return row
  })
}

function parseRow(row, defaults = {}) {
  const rowMap = {}
  for (const [key, value] of Object.entries(row || {})) {
    rowMap[normalizeHeader(key)] = normalizeCell(value)
  }

  const fallbackSemester =
    Number.isInteger(Number(defaults.semester)) && String(defaults.semester).trim() !== ''
      ? Number(defaults.semester)
      : 1
  const fallbackBatch = normalizeCell(defaults.batch || 'A')
  const fallbackBranch = normalizeCell(defaults.branch || 'General')
  const fallbackCounsellor = normalizeCell(defaults.counsellor_name || 'Unassigned')

  const parsed = {
    student_id: normalizeCell(firstMappedValue(rowMap, FIELD_ALIASES.student_id)),
    name: normalizeCell(firstMappedValue(rowMap, FIELD_ALIASES.name)),
    branch: normalizeCell(firstMappedValue(rowMap, FIELD_ALIASES.branch)) || fallbackBranch,
    semester: normalizeCell(firstMappedValue(rowMap, FIELD_ALIASES.semester)) || String(fallbackSemester),
    batch: normalizeCell(firstMappedValue(rowMap, FIELD_ALIASES.batch)) || fallbackBatch,
    counsellor_name: normalizeCell(firstMappedValue(rowMap, FIELD_ALIASES.counsellor_name)) || fallbackCounsellor,
    enrollment_id: normalizeCell(firstMappedValue(rowMap, FIELD_ALIASES.enrollment_id)),
    year: normalizeCell(firstMappedValue(rowMap, FIELD_ALIASES.year)),
    email: normalizeCell(firstMappedValue(rowMap, FIELD_ALIASES.email)),
    cgpa: toNumberOrEmpty(firstMappedValue(rowMap, FIELD_ALIASES.cgpa)),
    attendance_percentage: toNumberOrEmpty(firstMappedValue(rowMap, FIELD_ALIASES.attendance_percentage)),
    present_flag: normalizeCell(firstMappedValue(rowMap, FIELD_ALIASES.present_flag)),
  }

  const missingFields = REQUIRED_FIELDS.filter((field) => !parsed[field])
  if (missingFields.length > 0) {
    return { valid: false, error: `Missing required fields: ${missingFields.join(', ')}` }
  }

  const semesterAsNumber = Number(parsed.semester)
  if (!Number.isInteger(semesterAsNumber)) {
    return { valid: false, error: 'semester must be a whole number' }
  }
  parsed.semester = semesterAsNumber

  return { valid: true, student: parsed }
}

export async function parseStudentImportFile(file, options = {}) {
  if (!file) {
    throw new Error('Please choose a file to import.')
  }
  if (Number(file.size || 0) === 0) {
    throw new Error('Selected file is empty.')
  }

  const defaults = options.defaults || {}

  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })
  const firstSheetName = workbook.SheetNames?.[0]
  if (!firstSheetName) {
    throw new Error('File does not contain any worksheet.')
  }

  const firstSheet = workbook.Sheets[firstSheetName]
  let rows = XLSX.utils.sheet_to_json(firstSheet, { defval: '' })

  if (!Array.isArray(rows) || rows.length === 0) {
    const text = await file.text()
    rows = parseCsvTextRows(text)
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('No rows found in file.')
  }

  const students = []
  const rowErrors = []

  rows.forEach((row, index) => {
    const parsedRow = parseRow(row, defaults)
    if (!parsedRow.valid) {
      rowErrors.push({ row: index + 2, error: parsedRow.error })
      return
    }
    students.push(parsedRow.student)
  })

  return {
    totalRows: rows.length,
    students,
    rowErrors,
  }
}
