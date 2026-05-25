import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params
  const match = filename.match(/icon-(\d+)\.png/)
  const size = match ? parseInt(match[1]) : 192
  const radius = Math.round(size * 0.2)
  const ballSize = Math.round(size * 0.58)

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #FF8200 0%, #e96c00 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: radius,
        }}
      >
        {/* Simple football SVG — no text/emoji needed */}
        <svg
          width={ballSize}
          height={ballSize}
          viewBox="0 0 100 100"
          style={{ display: 'block' }}
        >
          <circle cx="50" cy="50" r="48" fill="white" stroke="#ccc" strokeWidth="2" />
          <polygon points="50,18 62,34 38,34" fill="#222" />
          <polygon points="82,38 72,54 86,66" fill="#222" />
          <polygon points="68,82 50,74 32,82" fill="#222" />
          <polygon points="18,66 28,54 14,38" fill="#222" />
          <polygon points="38,34 62,34 72,54 50,68 28,54" fill="none" stroke="#222" strokeWidth="2" />
        </svg>
      </div>
    ),
    { width: size, height: size }
  )
}
