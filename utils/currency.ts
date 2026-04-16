import { Currency } from '../types';

export const formatPrice = (price: number, currency: Currency | string = 'USD'): string => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
};
