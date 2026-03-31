function BrandLogo({ className = '', imageClassName = 'h-20 w-auto sm:h-24', priority = false }) {
  return (
    <img
      src="/edutrack-logo.png"
      alt="EduTrack logo"
      className={imageClassName + (className ? ` ${className}` : '')}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
    />
  )
}

export default BrandLogo