import { formatInTimeZone } from 'date-fns-tz'
import { es } from 'date-fns/locale'

// Argentina does not observe DST — always UTC-3
const AR = 'America/Argentina/Buenos_Aires'

export function formatArgTime(date: string | Date, fmt: string): string {
  return formatInTimeZone(new Date(date), AR, fmt, { locale: es })
}
