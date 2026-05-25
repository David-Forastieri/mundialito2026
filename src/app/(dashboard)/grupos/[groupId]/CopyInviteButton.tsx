'use client'

interface Props {
  inviteCode: string
}

export default function CopyInviteButton({ inviteCode }: Props) {
  function handleCopy() {
    navigator.clipboard?.writeText(`Código de invitación: ${inviteCode}`)
  }

  return (
    <button
      onClick={handleCopy}
      className="flex-1 bg-white border border-gray-200 rounded-xl p-4 text-center hover:bg-gray-50 transition-colors"
    >
      <div className="text-2xl mb-1">🔗</div>
      <div className="font-semibold text-gray-900 text-sm">Invitar</div>
      <div className="text-xs text-gray-400 mt-0.5 font-mono">
        {inviteCode.slice(0, 4)}-{inviteCode.slice(4)}
      </div>
    </button>
  )
}
