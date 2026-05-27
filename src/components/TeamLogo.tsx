'use client'

interface TeamLogoProps {
  src: string
  alt: string
  className?: string
}

export default function TeamLogo({ src, alt, className }: TeamLogoProps) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e) => {
        ;(e.target as HTMLImageElement).style.display = 'none'
      }}
    />
  )
}
