// 🚨 Reemplaza con los IDs reales de tus pruebas en Postman
import { BUSINESS_A_ID, BUSINESS_B_ID, USER_A_ID, USER_B_ID } from './config';


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
      { productName: 1, quantity: 1, price: 25000 }, // Laptop Pro
      { productName: 2, quantity: 1, price: 1500 }   // Teclado
    ]
  },
  {
    businessId: BUSINESS_A_ID,
    userId: USER_A_ID,
    total: 1500,
    status: 'COMPLETED',
    transactionDate: new Date('2026-03-28T10:15:00Z'),
    items: [
      { productName: 2, quantity: 1, price: 1500 }
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
      { productName: 3, quantity: 1, price: 500 }
    ]
  },
  {
    businessId: BUSINESS_B_ID,
    userId: USER_B_ID,
    total: 1000, // Renta de dos carpas para tianguis
    status: 'COMPLETED',
    transactionDate: new Date('2026-03-31T08:30:00Z'),
    items: [
      { productName: 3, quantity: 2, price: 500 }
    ]
  },
  {
    businessId: BUSINESS_B_ID,
    userId: USER_B_ID,
    total: 850,
    status: 'CANCELLED', // Una venta cancelada para probar auditoría
    transactionDate: new Date('2026-03-31T11:00:00Z'),
    items: [
      { productName: 4, quantity: 1, price: 850 } // Mesa plegable
    ]
  }
];