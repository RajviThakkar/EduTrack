export function getAttendanceRemark(percentage) {
  const safeValue = Math.max(0, Math.min(100, Number(percentage) || 0))

  if (safeValue >= 85) {
    return 'Excellent Standing'
  }
  if (safeValue >= 75) {
    return 'Good Standing'
  }
  if (safeValue >= 60) {
    return 'Average Standing'
  }
  return 'Needs Attention'
}
