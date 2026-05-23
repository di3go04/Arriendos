import { Loader } from '@/components/ui/Loader';
import { render,screen } from '@testing-library/react';

describe('Loader', () => {
  it('renders default loader', () => {
    render(<Loader />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders with text', () => {
    render(<Loader text="Cargando..." />);
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('renders fullscreen variant', () => {
    render(<Loader variant="fullscreen" text="Loading" />);
    expect(screen.getByText('Loading')).toBeInTheDocument();
  });
});
