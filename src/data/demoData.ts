export interface DemoProperty {
  id: string;
  title: string;
  address: string;
  monthlyRent: number;
  rooms: number;
  status: 'disponible' | 'arrendada' | 'mantenimiento';
  image?: string;
}

export interface DemoTenant {
  id: string;
  name: string;
  document: string;
  phone: string;
  property: string;
  status: 'activo' | 'mora' | 'finalizado';
}

export interface DemoPayment {
  id: string;
  tenant: string;
  property: string;
  amount: number;
  date: string;
  status: 'pagado' | 'pendiente' | 'mora';
}

export interface DemoContract {
  id: string;
  tenant: string;
  property: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  status: 'activo' | 'por_vencer' | 'finalizado';
}

export interface DemoMetrics {
  monthlyIncome: number;
  occupancyRate: number;
  pendingPayments: number;
  newTenantsThisMonth: number;
}

export const demoProperties: DemoProperty[] = [
  {
    id: 'prop-1',
    title: 'Apartamento 301',
    address: 'Calle 123 #45-67, Bogotá',
    monthlyRent: 1_200_000,
    rooms: 3,
    status: 'disponible',
  },
  {
    id: 'prop-2',
    title: 'Casa 15',
    address: 'Carrera 50 #80-20, Medellín',
    monthlyRent: 2_500_000,
    rooms: 4,
    status: 'arrendada',
  },
  {
    id: 'prop-3',
    title: 'Local Comercial 5',
    address: 'Av. Siempre Viva #123, Cali',
    monthlyRent: 3_000_000,
    rooms: 2,
    status: 'arrendada',
  },
  {
    id: 'prop-4',
    title: 'Apartamento 1002',
    address: 'Cra 7 #72-10, Bogotá',
    monthlyRent: 1_800_000,
    rooms: 2,
    status: 'disponible',
  },
  {
    id: 'prop-5',
    title: 'Casa 8',
    address: 'Calle 8 #15-30, Barranquilla',
    monthlyRent: 1_500_000,
    rooms: 3,
    status: 'mantenimiento',
  },
];

export const demoTenants: DemoTenant[] = [
  {
    id: 'ten-1',
    name: 'María González',
    document: 'CC 52.123.456',
    phone: '300 111 2233',
    property: 'Apartamento 301',
    status: 'activo',
  },
  {
    id: 'ten-2',
    name: 'Carlos López',
    document: 'CC 79.987.654',
    phone: '310 555 6677',
    property: 'Casa 15',
    status: 'activo',
  },
  {
    id: 'ten-3',
    name: 'Ana Martínez',
    document: 'CC 65.432.198',
    phone: '320 777 8899',
    property: 'Local Comercial 5',
    status: 'mora',
  },
  {
    id: 'ten-4',
    name: 'Pedro Ramírez',
    document: 'CC 88.765.432',
    phone: '301 333 4455',
    property: 'Apartamento 1002',
    status: 'activo',
  },
  {
    id: 'ten-5',
    name: 'Laura Sánchez',
    document: 'CC 45.678.912',
    phone: '315 888 9900',
    property: 'Casa 8',
    status: 'finalizado',
  },
];

export const demoPayments: DemoPayment[] = [
  { id: 'pay-1', tenant: 'María González', property: 'Apartamento 301', amount: 1_200_000, date: '2026-05-01', status: 'pagado' },
  { id: 'pay-2', tenant: 'Carlos López', property: 'Casa 15', amount: 2_500_000, date: '2026-05-01', status: 'pagado' },
  { id: 'pay-3', tenant: 'Ana Martínez', property: 'Local Comercial 5', amount: 3_000_000, date: '2026-04-01', status: 'pendiente' },
  { id: 'pay-4', tenant: 'Pedro Ramírez', property: 'Apartamento 1002', amount: 1_800_000, date: '2026-05-05', status: 'pagado' },
  { id: 'pay-5', tenant: 'María González', property: 'Apartamento 301', amount: 1_200_000, date: '2026-04-01', status: 'pagado' },
  { id: 'pay-6', tenant: 'Ana Martínez', property: 'Local Comercial 5', amount: 3_000_000, date: '2026-03-01', status: 'mora' },
  { id: 'pay-7', tenant: 'Carlos López', property: 'Casa 15', amount: 2_500_000, date: '2026-04-01', status: 'pagado' },
  { id: 'pay-8', tenant: 'Pedro Ramírez', property: 'Apartamento 1002', amount: 1_800_000, date: '2026-04-01', status: 'pendiente' },
  { id: 'pay-9', tenant: 'María González', property: 'Apartamento 301', amount: 1_200_000, date: '2026-03-01', status: 'pagado' },
  { id: 'pay-10', tenant: 'Carlos López', property: 'Casa 15', amount: 2_500_000, date: '2026-03-01', status: 'pagado' },
];

export const demoContracts: DemoContract[] = [
  { id: 'con-1', tenant: 'María González', property: 'Apartamento 301', startDate: '2026-01-01', endDate: '2026-12-31', monthlyRent: 1_200_000, status: 'activo' },
  { id: 'con-2', tenant: 'Carlos López', property: 'Casa 15', startDate: '2026-02-01', endDate: '2027-01-31', monthlyRent: 2_500_000, status: 'activo' },
  { id: 'con-3', tenant: 'Ana Martínez', property: 'Local Comercial 5', startDate: '2025-06-01', endDate: '2026-05-31', monthlyRent: 3_000_000, status: 'por_vencer' },
  { id: 'con-4', tenant: 'Pedro Ramírez', property: 'Apartamento 1002', startDate: '2026-03-01', endDate: '2027-02-28', monthlyRent: 1_800_000, status: 'activo' },
  { id: 'con-5', tenant: 'Laura Sánchez', property: 'Casa 8', startDate: '2025-01-01', endDate: '2025-12-31', monthlyRent: 1_500_000, status: 'finalizado' },
];

export const demoMetrics: DemoMetrics = {
  monthlyIncome: 5_500_000,
  occupancyRate: 60,
  pendingPayments: 2,
  newTenantsThisMonth: 3,
};
