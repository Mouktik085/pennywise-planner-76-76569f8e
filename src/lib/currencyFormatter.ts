// Currency symbols and formatting
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  JPY: '¥',
  CNY: '¥',
  AUD: 'A$',
  CAD: 'C$',
  CHF: 'CHF',
  BRL: 'R$',
  MXN: 'MX$',
  ZAR: 'R',
  AED: 'د.إ',
  SAR: '﷼',
  RUB: '₽',
  KRW: '₩',
  SGD: 'S$',
  HKD: 'HK$',
  NZD: 'NZ$',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  PLN: 'zł',
  THB: '฿',
  IDR: 'Rp',
  MYR: 'RM',
  PHP: '₱',
  VND: '₫',
  TRY: '₺',
  ILS: '₪',
  EGP: 'E£',
  NGN: '₦',
  KES: 'KSh',
  PKR: '₨',
  BDT: '৳',
  LKR: 'Rs',
  NPR: 'Rs',
};

const CURRENCY_LOCALES: Record<string, string> = {
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  INR: 'en-IN',
  JPY: 'ja-JP',
  CNY: 'zh-CN',
  AUD: 'en-AU',
  CAD: 'en-CA',
  CHF: 'de-CH',
  BRL: 'pt-BR',
  MXN: 'es-MX',
  ZAR: 'en-ZA',
  AED: 'ar-AE',
  SAR: 'ar-SA',
  RUB: 'ru-RU',
  KRW: 'ko-KR',
  SGD: 'en-SG',
  HKD: 'zh-HK',
  NZD: 'en-NZ',
  SEK: 'sv-SE',
  NOK: 'nb-NO',
  DKK: 'da-DK',
  PLN: 'pl-PL',
  THB: 'th-TH',
  IDR: 'id-ID',
  MYR: 'ms-MY',
  PHP: 'en-PH',
  VND: 'vi-VN',
  TRY: 'tr-TR',
  ILS: 'he-IL',
  EGP: 'ar-EG',
  NGN: 'en-NG',
  KES: 'en-KE',
  PKR: 'en-PK',
  BDT: 'bn-BD',
  LKR: 'si-LK',
  NPR: 'ne-NP',
};

export function formatCurrency(
  amount: number,
  currency: string = 'INR',
  compact: boolean = false
): string {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  const locale = CURRENCY_LOCALES[currency] || 'en-US';

  try {
    if (compact && Math.abs(amount) >= 1000) {
      const formatted = new Intl.NumberFormat(locale, {
        notation: 'compact',
        compactDisplay: 'short',
        maximumFractionDigits: 1,
      }).format(amount);
      return `${symbol}${formatted}`;
    }

    const formatted = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);

    return `${symbol}${formatted}`;
  } catch (error) {
    // Fallback for unsupported locales
    return `${symbol}${amount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  }
}

export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] || currency;
}

export const SUPPORTED_CURRENCIES = Object.keys(CURRENCY_SYMBOLS).sort();
