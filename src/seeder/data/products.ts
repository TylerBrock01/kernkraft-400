// 🚨 Reemplaza estos valores con los UUIDs reales cuando crees las empresas en Postman

import { BUSINESS_A_ID, BUSINESS_B_ID } from './config';

export const products = [
  // ==========================================
  // 💻 INVENTARIO: EMPRESA A (Tech Store)
  // ==========================================
  {
    name: "Laptop Pro de 16'' - Edición 2030",
    description: "Equipo de alto rendimiento ideal para desarrolladores y control de servidores.",
    price: 25000,
    stock: 14,
    type: "retail",
    isActive: true,
    metadata: {
      color: "Space Grey",
      ram: "32GB",
      processor: "M4 Max"
    },
    businessId: BUSINESS_A_ID
  },
  {
    name: "Teclado Mecánico MCU",
    description: "Switches azules para programar a la velocidad de la luz sin ghosting.",
    price: 1500,
    stock: 40,
    type: "retail",
    isActive: true,
    metadata: {
      layout: "Español",
      switch: "Blue"
    },
    businessId: BUSINESS_A_ID
  },

  // ==========================================
  // ⛺ INVENTARIO: EMPRESA B (Carpas y Eventos)
  // ==========================================
  {
    name: "Carpa 3x3 Uso Rudo",
    description: "Toldo impermeable con estructura de acero, ideal para tianguis, mercados y eventos al aire libre.",
    price: 1200,
    stock: 15,
    type: "retail",
    isActive: true,
    metadata: {
      dimensions: "3x3 metros",
      color: "Blanco",
      material: "Lona Reforzada Oxford"
    },
    businessId: BUSINESS_B_ID
  },
  {
    name: "Mesa Plegable Portafolio 1.8m",
    description: "Mesa resistente y fácil de transportar. Soporta hasta 100kg de carga.",
    price: 850,
    stock: 25,
    type: "retail",
    isActive: true,
    metadata: {
      length: "1.8 metros",
      folding: true
    },
    businessId: BUSINESS_B_ID
  }
];