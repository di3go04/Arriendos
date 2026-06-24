import LeadForm from '@/app/propiedades/[id]/LeadForm';
import { fireEvent,render,screen,waitFor } from '@testing-library/react';

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true }),
  })
) as jest.Mock;

describe('LeadForm', () => {
  const defaultProps = {
    propertyId: 'test-123',
    propertyTitle: 'Apartamento 301',
    ownerId: 'owner-123',
  };

  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('renders form fields', () => {
    render(<LeadForm {...defaultProps} />);
    
    expect(screen.getByPlaceholderText('Nombre completo')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Correo electrónico')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Teléfono')).toBeInTheDocument();
    expect(screen.getByText('Solicitar información')).toBeInTheDocument();
  });

  it('submits form successfully', async () => {
    render(<LeadForm {...defaultProps} />);
    
    fireEvent.change(screen.getByPlaceholderText('Nombre completo'), {
      target: { value: 'Juan Pérez' },
    });
    fireEvent.change(screen.getByPlaceholderText('Correo electrónico'), {
      target: { value: 'juan@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Teléfono'), {
      target: { value: '300 123 4567' },
    });

    fireEvent.click(screen.getByText('Solicitar información'));

    await waitFor(() => {
      expect(screen.getByText('¡Solicitud enviada!')).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: expect.any(String),
    });
  });
});