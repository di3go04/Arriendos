import { getPageTitle,ROUTES } from '@/lib/routes';

describe('routes', () => {
  it('returns correct title for dashboard', () => {
    expect(getPageTitle('/dashboard/landlord')).toBe('Dashboard');
  });

  it('returns correct title for tenant panel', () => {
    expect(getPageTitle('/dashboard/tenant')).toBe('Mi Panel');
  });

  it('returns correct title for properties', () => {
    expect(getPageTitle('/properties')).toBe('Mis Propiedades');
  });

  it('returns correct title for payments', () => {
    expect(getPageTitle('/dashboard/payments')).toBe('Pagos');
  });

  it('returns RentNow for unknown routes', () => {
    expect(getPageTitle('/unknown-route')).toBe('RentNow');
  });

  it('detects contract sign routes', () => {
    expect(getPageTitle('/contracts/abc-123/sign')).toBe('Firmar Contrato');
  });

  it('has correct ROUTES constants', () => {
    expect(ROUTES.HOME).toBe('/');
    expect(ROUTES.LOGIN).toBe('/login');
    expect(ROUTES.PRECIOS).toBe('/precios');
  });
});
