function DashboardCard({ title, value, tone }) {
  const tones = {
    primary:   'bg-gradient-to-br from-[#2FA4A9] to-[#4E98A2] text-white',
    secondary: 'bg-gradient-to-br from-[#4E98A2] to-[#215D87] text-white',
    success:   'bg-[#98B196] text-white',
  }

  return (
    <div
      className={`rounded-2xl p-5 shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${tones[tone]}`}
    >
      <p className="text-sm opacity-85">{title}</p>
      <h3 className="mt-2 text-3xl font-bold">{value}</h3>
    </div>
  )
}

export default DashboardCard