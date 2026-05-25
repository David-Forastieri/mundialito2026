import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-6xl mb-4">⚽</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Página no encontrada</h2>
        <Link href="/" className="text-orange-500 font-medium hover:underline">
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
