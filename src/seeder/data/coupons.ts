export const coupons = [
  {
    name: 'VASK8_PRO_2026',
    discount: 15,
    isPercentage: true,
    limit: 50,
    used: 0,
    minPurchase: 1000,
    expirationDate: new Date('2026-12-31'),
    isActive: true,
  },
  {
    name: 'SKATE_HARD_FIXED',
    discount: 250,
    isPercentage: false,
    limit: 20,
    used: 5,
    minPurchase: 2000,
    expirationDate: new Date('2026-08-15'),
    isActive: true,
  },
  {
    name: 'CAZA_EXECUTIVE_ONLY',
    discount: 50,
    isPercentage: true,
    limit: 0, // Sin límite de uso
    used: 0,
    minPurchase: 0,
    expirationDate: new Date('2027-01-01'),
    isActive: false, // Inyectado pero desactivado por seguridad
  }
];