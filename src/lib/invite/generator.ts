import { customAlphabet } from 'nanoid'

const nanoid = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8)

export function generateInviteCode(): string {
  return nanoid()
}

export function formatInviteCode(code: string): string {
  return `${code.slice(0, 4)}-${code.slice(4)}`
}

export function parseInviteCode(formatted: string): string {
  return formatted.replace('-', '').toUpperCase()
}
