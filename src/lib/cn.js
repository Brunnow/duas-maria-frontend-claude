import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Junta classes condicionais (clsx) e resolve conflitos do Tailwind
 * (tailwind-merge). Use em todas as primitivas para permitir override
 * de className sem duplicar utilitarios.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
