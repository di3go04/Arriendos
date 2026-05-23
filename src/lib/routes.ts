export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DEMO: '/demo',
  PRECIOS: '/precios',
  ADMIN: '/admin',

  DASHBOARD: '/dashboard',
  DASHBOARD_LANDLORD: '/dashboard/landlord',
  DASHBOARD_TENANT: '/dashboard/tenant',
  DASHBOARD_PAYMENTS: '/dashboard/payments',
  DASHBOARD_LEASES: '/dashboard/leases',
  DASHBOARD_TENANTS: '/dashboard/tenants',
  DASHBOARD_MAINTENANCE: '/dashboard/maintenance',
  DASHBOARD_TEMPLATES: '/dashboard/templates',
  DASHBOARD_SETTINGS: '/dashboard/settings',
  DASHBOARD_PROPERTIES: '/dashboard/properties',

  PROPERTIES: '/properties',
  PROPERTIES_DETAIL: (id: string) => `/properties/${id}`,

  CONTRACTS_NEW: '/contracts/new',
  CONTRACTS_DETAIL: (id: string) => `/contracts/${id}`,
  CONTRACTS_SIGN: (id: string) => `/contracts/${id}/sign`,
  CONTRACTS_DOCUMENTS: (id: string) => `/contracts/${id}/documents`,

  TEMPLATES: '/templates',
  PLANTILLAS_CREAR: '/plantillas/crear',
  PLANTILLAS_USAR: (id: string) => `/plantillas/${id}/usar`,
} as const;

export const PAGE_TITLES: Record<string, string> = {
  [ROUTES.PROPERTIES]: 'Mis Propiedades',
  [ROUTES.DASHBOARD_TENANTS]: 'Gestión de Inquilinos',
  [ROUTES.CONTRACTS_DETAIL('')]: 'Contratos',
  [ROUTES.DASHBOARD_PAYMENTS]: 'Pagos',
  [ROUTES.TEMPLATES]: 'Plantillas',
  [ROUTES.DASHBOARD_MAINTENANCE]: 'Incidencias',
  [ROUTES.DASHBOARD_SETTINGS]: 'Configuración',
  [ROUTES.DASHBOARD_LANDLORD]: 'Dashboard',
  [ROUTES.DASHBOARD_TENANT]: 'Mi Panel',
  '/dashboard/expenses': 'Gastos',
  '/dashboard/tenant/documents': 'Mis Documentos',
};

export function getPageTitle(pathname: string): string {
  if (pathname.includes('/contracts/new')) return 'Nuevo Contrato';
  if (pathname.match(/\/contracts\/.+\/sign/)) return 'Firmar Contrato';
  if (pathname.match(/\/contracts\/.+\/documents/)) return 'Documentos del Contrato';

  const matchingRoute = Object.keys(PAGE_TITLES)
    .sort((a, b) => b.length - a.length)
    .find((route) => pathname === route || pathname.startsWith(`${route}/`));

  if (matchingRoute) {
    return PAGE_TITLES[matchingRoute];
  }

  return 'RentNow';
}
