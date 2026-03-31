const toneStyles = {
  low: 'border-[#6BCF8E]/50 bg-[#6BCF8E]/20 text-green-800',
  medium: 'border-[#DBD8A0]/60 bg-[#DBD8A0]/40 text-amber-800',
  high: 'border-red-300 bg-red-100 text-red-700',
}

function RiskCard({ title, count, tone }) {
  return (
    <article className={`rounded-2xl border p-4 shadow-md ${toneStyles[tone] || toneStyles.low}`}>
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-2 text-3xl font-bold leading-none">{count}</p>
    </article>
  )
}

export default RiskCard