export type MapProperty = {
  id: number
  lat: number
  lng: number
  title: string
  price: string
  type: string
  country: string
}

export const DEMO_PROPERTIES: MapProperty[] = [
  { id: 1,  lat: 4.711,   lng: -74.0721, title: 'Apto en Chapinero',       price: '$1.800.000/mes', type: 'Apartamento', country: 'co' },
  { id: 2,  lat: 4.6934,  lng: -74.0559, title: 'Casa en Usaquén',         price: '$3.200.000/mes', type: 'Casa',        country: 'co' },
  { id: 3,  lat: 4.6351,  lng: -74.0703, title: 'Local en Kennedy',        price: '$900.000/mes',   type: 'Local',       country: 'co' },
  { id: 4,  lat: 4.6597,  lng: -74.0917, title: 'Oficina en Teusaquillo',  price: '$2.100.000/mes', type: 'Oficina',     country: 'co' },
  { id: 5,  lat: 6.2518,  lng: -75.5636, title: 'Apto en El Poblado',      price: '$2.400.000/mes', type: 'Apartamento', country: 'co' },
  { id: 6,  lat: 3.4516,  lng: -76.5319, title: 'Casa en Cali Norte',      price: '$1.500.000/mes', type: 'Casa',        country: 'co' },
  { id: 7,  lat: 19.4326, lng: -99.1332, title: 'Apto en CDMX',            price: '$12.000/mes',    type: 'Apartamento', country: 'mx' },
  { id: 8,  lat: 20.6597, lng: -103.349, title: 'Casa en Guadalajara',     price: '$15.000/mes',    type: 'Casa',        country: 'mx' },
  { id: 9,  lat: -34.603, lng: -58.3816, title: 'Departamento en Palermo', price: '$280.000/mes',   type: 'Apartamento', country: 'ar' },
  { id: 10, lat: -34.912, lng: -57.954,  title: 'Casa en La Plata',        price: '$180.000/mes',   type: 'Casa',        country: 'ar' },
  { id: 11, lat: 40.4168, lng: -3.7038,  title: 'Piso en Madrid Centro',   price: '€1.200/mes',     type: 'Apartamento', country: 'es' },
  { id: 12, lat: 41.385,  lng: 2.173,    title: 'Piso en Barcelona',       price: '€1.400/mes',     type: 'Apartamento', country: 'es' },
]

export function filterMapProperties(
  properties: MapProperty[],
  countryCode: string,
  typeFilter: string,
): MapProperty[] {
  return properties.filter(p => {
    const matchCountry = countryCode === '' || p.country === countryCode
    const matchType = typeFilter === 'Todos' || p.type === typeFilter
    return matchCountry && matchType
  })
}

export function formatPropertyCount(count: number): string {
  if (count === 1) return '1 propiedad'
  return `${count} propiedades`
}

/** Ej: "3 de 6 propiedades" cuando el viewport no muestra todas. */
export function formatVisiblePropertyCount(visible: number, total: number): string {
  if (total > visible) {
    const noun = total === 1 ? 'propiedad' : 'propiedades'
    return `${visible} de ${total} ${noun}`
  }
  return formatPropertyCount(visible)
}
