import { Link } from 'react-router-dom'

const toneStyles = {
  info: {
    wrapper: 'border-edu-blue/30 bg-white/80',
    icon: 'bg-edu-blue/20 text-edu-navy',
  },
  warning: {
    wrapper: 'border-edu-sand/70 bg-edu-sand/25',
    icon: 'bg-edu-sand/70 text-edu-navy',
  },
  success: {
    wrapper: 'border-edu-mint/70 bg-edu-mint/25',
    icon: 'bg-edu-mint/70 text-edu-navy',
  },
  attention: {
    wrapper: 'border-edu-teal/45 bg-edu-teal/15',
    icon: 'bg-edu-teal/35 text-edu-navy',
  },
}

const toneIcons = {
  info: 'ℹ',
  warning: '⚠',
  success: '✓',
  attention: '!',
}

function AlertBanner({ title, message, tone = 'info', actionLabel, actionTo }) {
  const style = toneStyles[tone] ?? toneStyles.info
  const icon = toneIcons[tone] ?? toneIcons.info

  return (
    <section className={`rounded-soft border p-4 shadow-soft ${style.wrapper}`}>
      <div className="flex items-start gap-3">
        <span
          className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${style.icon}`}
        >
          {icon}
        </span>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-edu-navy">{title}</h3>
          <p className="mt-1 text-sm text-edu-blue">{message}</p>
          {actionLabel && actionTo && (
            <Link
              to={actionTo}
              className="mt-3 inline-flex rounded-lg border border-edu-blue/25 bg-white/85 px-3 py-1.5 text-xs font-semibold text-edu-navy transition hover:border-edu-teal"
            >
              {actionLabel}
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}

export default AlertBanner