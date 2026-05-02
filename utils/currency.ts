import { Currency } from '../types';

// TR-first launch: currency belirtilmemis ya da legacy data'da eksikse TRY default.
// Eski merchant profilleri (currency field'i save edilmeden once kaydedilmis olanlar)
// QR-mobil tarafinda da TL gostersin diye.
export const formatPrice = (price: number, currency?: Currency | string | null): string => {
  const resolved = currency || 'TRY';
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: resolved,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
};
