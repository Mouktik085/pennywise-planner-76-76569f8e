import { useCurrency } from '@/hooks/useCurrency';
import { cn } from '@/lib/utils';

interface CurrencyAmountProps {
  amount: number;
  compact?: boolean;
  className?: string;
  showSign?: boolean;
}

export function CurrencyAmount({ 
  amount, 
  compact = false, 
  className,
  showSign = false 
}: CurrencyAmountProps) {
  const { format } = useCurrency();
  
  const sign = showSign ? (amount >= 0 ? '+' : '') : '';
  const colorClass = showSign 
    ? amount >= 0 
      ? 'text-green-600 dark:text-green-400' 
      : 'text-red-600 dark:text-red-400'
    : '';

  return (
    <span className={cn(colorClass, className)}>
      {sign}{format(amount, compact)}
    </span>
  );
}
