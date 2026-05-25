'use client'

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  children: React.ReactNode
}

export default function LoadingButton({ loading, children, disabled, className, ...props }: Props) {
  return (
    <button disabled={disabled || loading} className={className} {...props}>
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span style={{ animation: 'spin 0.9s linear infinite', display: 'inline-block' }}>⚽</span>
          <span>Cargando...</span>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </span>
      ) : children}
    </button>
  )
}
