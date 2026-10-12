// Expiry is always computed here from the printed date, never taken from the AI.

export const SOON_DAYS = 30

const MS_PER_DAY = 24 * 60 * 60 * 1000

// Medicine labels print "EXP MM/YYYY", meaning usable until the end of that month.
// Returns { status: 'ok' | 'soon' | 'expired' | 'unknown', daysLeft }
export function getExpiryStatus(expiryDate, today = new Date()) {
  const match = typeof expiryDate === 'string' && /^(\d{4})-(\d{2})$/.exec(expiryDate)
  if (!match) return { status: 'unknown', daysLeft: null }

  const year = Number(match[1])
  const month = Number(match[2])
  if (month < 1 || month > 12) return { status: 'unknown', daysLeft: null }

  // Day 0 of the next month is the last day of this month
  const lastDay = new Date(year, month, 0)
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const daysLeft = Math.round((lastDay - startOfToday) / MS_PER_DAY)

  if (daysLeft < 0) return { status: 'expired', daysLeft }
  if (daysLeft <= SOON_DAYS) return { status: 'soon', daysLeft }
  return { status: 'ok', daysLeft }
}
