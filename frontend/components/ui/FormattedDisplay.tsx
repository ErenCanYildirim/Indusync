/**
 * Formatted Display Components
 * Provides reusable components for displaying formatted values using next-intl
 *
 * @author IndusSync Frontend Team
 * @since Multi-language Support Implementation
 */

"use client";

import { useLocaleFormatting } from "@/lib/utils/formatting";

interface FormattedCurrencyProps {
  amount: number;
  currency?: string;
  options?: any;
  className?: string;
}

/**
 * Component for displaying formatted currency amounts
 */
export function FormattedCurrency({
  amount,
  currency = "EUR",
  options,
  className,
}: FormattedCurrencyProps) {
  const { formatCurrency } = useLocaleFormatting();

  return (
    <span className={className}>
      {formatCurrency(amount, currency, options)}
    </span>
  );
}

interface FormattedNumberProps {
  value: number;
  options?: any;
  className?: string;
}

/**
 * Component for displaying formatted numbers
 */
export function FormattedNumber({
  value,
  options,
  className,
}: FormattedNumberProps) {
  const { formatNumber } = useLocaleFormatting();

  return <span className={className}>{formatNumber(value, options)}</span>;
}

interface FormattedDateProps {
  date: Date | string;
  options?: any;
  className?: string;
}

/**
 * Component for displaying formatted dates
 */
export function FormattedDate({
  date,
  options,
  className,
}: FormattedDateProps) {
  const { formatDate } = useLocaleFormatting();

  return <span className={className}>{formatDate(date, options)}</span>;
}

interface FormattedDateShortProps {
  date: Date | string;
  className?: string;
}

/**
 * Component for displaying short formatted dates (DD.MM.YYYY / MM/DD/YYYY)
 */
export function FormattedDateShort({
  date,
  className,
}: FormattedDateShortProps) {
  const { formatDateShort } = useLocaleFormatting();

  return <span className={className}>{formatDateShort(date)}</span>;
}

interface FormattedDateMediumProps {
  date: Date | string;
  className?: string;
}

/**
 * Component for displaying medium formatted dates with month names
 */
export function FormattedDateMedium({
  date,
  className,
}: FormattedDateMediumProps) {
  const { formatDateMedium } = useLocaleFormatting();

  return <span className={className}>{formatDateMedium(date)}</span>;
}

interface FormattedTimeProps {
  date: Date | string;
  options?: any;
  className?: string;
}

/**
 * Component for displaying formatted time
 */
export function FormattedTime({
  date,
  options,
  className,
}: FormattedTimeProps) {
  const { formatTime } = useLocaleFormatting();

  return <span className={className}>{formatTime(date, options)}</span>;
}

interface FormattedRelativeTimeProps {
  date: Date | string;
  options?: any;
  className?: string;
}

/**
 * Component for displaying relative time (e.g., "2 days ago")
 */
export function FormattedRelativeTime({
  date,
  options,
  className,
}: FormattedRelativeTimeProps) {
  const { formatRelativeTime } = useLocaleFormatting();

  return <span className={className}>{formatRelativeTime(date, options)}</span>;
}

interface FormattedPercentageProps {
  value: number;
  options?: any;
  className?: string;
}

/**
 * Component for displaying formatted percentages
 */
export function FormattedPercentage({
  value,
  options,
  className,
}: FormattedPercentageProps) {
  const { formatPercentage } = useLocaleFormatting();

  return <span className={className}>{formatPercentage(value, options)}</span>;
}

/**
 * Combined component for displaying project budget with proper formatting
 */
interface ProjectBudgetProps {
  amount?: number;
  currency?: string;
  className?: string;
  fallbackText?: string;
}

export function ProjectBudget({
  amount,
  currency = "EUR",
  className,
  fallbackText = "-",
}: ProjectBudgetProps) {
  const { formatCurrency } = useLocaleFormatting();

  if (!amount) {
    return <span className={className}>{fallbackText}</span>;
  }

  return <span className={className}>{formatCurrency(amount, currency)}</span>;
}

/**
 * Combined component for displaying project dates with proper formatting
 */
interface ProjectDateProps {
  date?: Date | string;
  className?: string;
  fallbackText?: string;
}

export function ProjectDate({
  date,
  className,
  fallbackText = "-",
}: ProjectDateProps) {
  const { formatDateShort } = useLocaleFormatting();

  if (!date) {
    return <span className={className}>{fallbackText}</span>;
  }

  return <span className={className}>{formatDateShort(date)}</span>;
}
