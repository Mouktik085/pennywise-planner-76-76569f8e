import { usePreferences } from '@/contexts/PreferencesContext';
import { formatCurrency } from '@/lib/currencyFormatter';

export function useCurrency() {
  const { currency } = usePreferences();

  const format = (amount: number, compact: boolean = false) => {
    return formatCurrency(amount, currency, compact);
  };

  return {
    currency,
    format,
  };
}
