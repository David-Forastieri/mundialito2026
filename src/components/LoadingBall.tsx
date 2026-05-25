export default function LoadingBall({ text = 'Cargando...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="text-6xl" style={{ animation: 'spin 0.9s linear infinite', display: 'inline-block' }}>
        ⚽
      </div>
      <p className="text-gray-500 font-medium text-sm tracking-wide">{text}</p>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
