import { PropertyCard } from '@/components/ui/PropertyCard';
import { render,screen } from '@testing-library/react';

describe('PropertyCard', () => {
  const renderCard = () =>
    render(
      <PropertyCard
        title="Apartamento Centro"
        address="Cra 10 #20-30, Bogota"
        monthlyRent={1500000}
        rooms={3}
        status="disponible"
      />
    );

  it('renders property title and address', () => {
    renderCard();
    expect(screen.getByText('Apartamento Centro')).toBeInTheDocument();
    expect(screen.getByText('Cra 10 #20-30, Bogota')).toBeInTheDocument();
  });

  it('shows monthly rent formatted', () => {
    renderCard();
    expect(screen.getByText(/\$ 1\.500\.000/)).toBeInTheDocument();
  });

  it('displays status badge', () => {
    renderCard();
    expect(screen.getByText(/disponible/i)).toBeInTheDocument();
  });

  it('shows rooms', () => {
    renderCard();
    expect(screen.getByText('Habitaciones')).toBeInTheDocument();
    expect(screen.getAllByText('3')).toHaveLength(1);
  });
});
