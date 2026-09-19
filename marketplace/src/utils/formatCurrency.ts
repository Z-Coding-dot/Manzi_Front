export type CurrencyCode = 'AFN' | 'USD'

const SYMBOLS: Record<CurrencyCode, string> = {
  AFN: '؋',
  USD: '$',
}

export function formatCurrency(amount: number, currency: CurrencyCode = 'AFN', lang = 'en'): string {
  const grouped = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amount)
  const symbol = SYMBOLS[currency]
  if (lang === 'en') {
    return currency === 'USD' ? `${symbol}${grouped}` : `${grouped} ${symbol}`
  }
  return `${grouped} ${symbol}`
}
