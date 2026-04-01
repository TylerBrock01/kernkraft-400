// 🚨 Reemplaza con los IDs reales de tus pruebas en Postman
export const BUSINESS_A_ID = "d80bad8b-3f51-4ca6-bb7a-72dcd9d14c02"; // Tech Store
export const USER_A_ID = 1; // ID numérico del Admin/Vendedor A

export const BUSINESS_B_ID = "73a8c36e-f49a-46e2-86a6-78eca22baaf0"; // Carpas & Eventos
export const USER_B_ID = 2; // ID numérico del Admin/Vendedor B

export const seedTransactions = [
  // ==========================================
  // 💻 VENTAS: EMPRESA A (Tecnología)
  // ==========================================
  {
    businessId: BUSINESS_A_ID,
    userId: USER_A_ID,
    total: 26500,
    status: 'COMPLETED',
    transactionDate: new Date('2026-03-25T14:30:00Z'),
    items: [
      { productId: 1, quantity: 1, price: 25000 }, // Laptop Pro
      { productId: 2, quantity: 1, price: 1500 }   // Teclado
    ]
  },
  {
    businessId: BUSINESS_A_ID,
    userId: USER_A_ID,
    total: 1500,
    status: 'COMPLETED',
    transactionDate: new Date('2026-03-28T10:15:00Z'),
    items: [
      { productId: 2, quantity: 1, price: 1500 }
    ]
  },

  // ==========================================
  // ⛺ VENTAS: EMPRESA B (Carpas y Toldos)
  // ==========================================
  {
    businessId: BUSINESS_B_ID,
    userId: USER_B_ID,
    total: 500, // Renta de carpa 3x3
    status: 'COMPLETED',
    transactionDate: new Date('2026-03-30T09:00:00Z'),
    items: [
      { productId: 3, quantity: 1, price: 500 }
    ]
  },
  {
    businessId: BUSINESS_B_ID,
    userId: USER_B_ID,
    total: 1000, // Renta de dos carpas para tianguis
    status: 'COMPLETED',
    transactionDate: new Date('2026-03-31T08:30:00Z'),
    items: [
      { productId: 3, quantity: 2, price: 500 }
    ]
  },
  {
    businessId: BUSINESS_B_ID,
    userId: USER_B_ID,
    total: 850,
    status: 'CANCELLED', // Una venta cancelada para probar auditoría
    transactionDate: new Date('2026-03-31T11:00:00Z'),
    items: [
      { productId: 4, quantity: 1, price: 850 } // Mesa plegable
    ]
  }
];