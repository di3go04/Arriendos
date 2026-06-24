export interface LocationCity {
  name: string
  lat: number
  lng: number
}

export interface LocationDepartment {
  name: string
  cities: LocationCity[]
}

export interface LocationCountry {
  name: string
  departments: LocationDepartment[]
}

// ─── 30 países con bounding boxes ──────────────────────────────────
const COUNTRIES_META = [
  { name: 'Colombia',       latMin:  4,  latMax:  6,  lngMin: -76, lngMax: -74, depts: ['Andina',     'Caribe'] },
  { name: 'Estados Unidos', latMin: 25,  latMax: 49,  lngMin:-125, lngMax: -70, depts: ['Pacífico',   'Atlántico'] },
  { name: 'España',         latMin: 36,  latMax: 44,  lngMin: -10, lngMax:   4, depts: ['Central',    'Mediterráneo'] },
  { name: 'Argentina',      latMin:-55,  latMax:-22,  lngMin: -73, lngMax: -54, depts: ['Pampeana',   'Patagónica'] },
  { name: 'México',         latMin: 15,  latMax: 33,  lngMin:-118, lngMax: -86, depts: ['Norteña',    'Sureña'] },
  { name: 'Francia',        latMin: 41,  latMax: 51,  lngMin:  -5, lngMax:   8, depts: ['Alpes',      'Costa Azul'] },
  { name: 'Italia',         latMin: 36,  latMax: 47,  lngMin:   7, lngMax:  18, depts: ['Abruzzo',    'Lombardía'] },
  { name: 'Alemania',       latMin: 47,  latMax: 55,  lngMin:   6, lngMax:  15, depts: ['Baviera',    'Renania'] },
  { name: 'Japón',          latMin: 30,  latMax: 45,  lngMin: 129, lngMax: 145, depts: ['Kanto',      'Kansai'] },
  { name: 'Brasil',         latMin:-34,  latMax:  5,  lngMin: -73, lngMax: -35, depts: ['Nordeste',   'Sudeste'] },
  { name: 'Canadá',         latMin: 42,  latMax: 83,  lngMin:-140, lngMax: -52, depts: ['Columbia',   'Ontario'] },
  { name: 'Australia',      latMin:-44,  latMax:-10,  lngMin: 113, lngMax: 154, depts: ['Queensland', 'Victoria'] },
  { name: 'Reino Unido',    latMin: 50,  latMax: 60,  lngMin:  -8, lngMax:   2, depts: ['Inglaterra', 'Escocia'] },
  { name: 'China',          latMin: 18,  latMax: 54,  lngMin:  73, lngMax: 135, depts: ['Oriental',   'Meridional'] },
  { name: 'India',          latMin:  7,  latMax: 37,  lngMin:  68, lngMax:  97, depts: ['Himalaya',   'Bengala'] },
  { name: 'Rusia',          latMin: 41,  latMax: 82,  lngMin:  19, lngMax: 180, depts: ['Siberia',    'Urales'] },
  { name: 'Chile',          latMin:-56,  latMax:-18,  lngMin: -76, lngMax: -66, depts: ['Norte',      'Central'] },
  { name: 'Perú',           latMin:-18,  latMax:  0,  lngMin: -81, lngMax: -69, depts: ['Andina',     'Amazonía'] },
  { name: 'Venezuela',      latMin:  1,  latMax: 12,  lngMin: -73, lngMax: -60, depts: ['Llanos',     'Costera'] },
  { name: 'Portugal',       latMin: 37,  latMax: 42,  lngMin: -10, lngMax:  -6, depts: ['Norte',      'Lisboa'] },
  { name: 'Países Bajos',   latMin:50.5, latMax:53.5, lngMin:   3, lngMax:   7, depts: ['Holanda',    'Frisia'] },
  { name: 'Suecia',         latMin: 55,  latMax: 69,  lngMin:  11, lngMax:  24, depts: ['Gotland',    'Svealand'] },
  { name: 'Noruega',        latMin: 57,  latMax: 71,  lngMin:   4, lngMax:  31, depts: ['Østlandet',  'Vestlandet'] },
  { name: 'Suiza',          latMin:45.8, latMax:47.8, lngMin:   6, lngMax:10.5, depts: ['Romandía',   'Zúrich'] },
  { name: 'Polonia',        latMin: 49,  latMax: 55,  lngMin:  14, lngMax:  24, depts: ['Masovia',    'Cracovia'] },
  { name: 'Turquía',        latMin: 36,  latMax: 42,  lngMin:  26, lngMax:  45, depts: ['Anatolia',   'Tracia'] },
  { name: 'Corea del Sur',  latMin: 33,  latMax:38.5, lngMin: 124, lngMax: 132, depts: ['Seúl',       'Jeolla'] },
  { name: 'Sudáfrica',      latMin:-35,  latMax:-22,  lngMin:  16, lngMax:  33, depts: ['Cabo',       'Natal'] },
  { name: 'Egipto',         latMin: 22,  latMax: 32,  lngMin:  25, lngMax:  35, depts: ['Delta',      'Valle'] },
  { name: 'Ecuador',        latMin: -5,  latMax:  2,  lngMin: -81, lngMax: -75, depts: ['Costa',      'Sierra'] },
]

const CITY_NAMES = [
  'Nueva Victoria', 'San Clemente', 'Santa Bárbara', 'Valle Hermoso',
  'Puerto Escondido', 'Montebello', 'Rocas Negras', 'Villa del Sol',
  'Costa Serena', 'Piedras Azules', 'Campo Florido', 'El Recodo',
  'San Benito', 'La Candelaria', 'Nueva Esperanza', 'Mar Azul',
  'Cerro Grande', 'Mirador', 'Santa Lucía', 'Los Olivos',
  'Playa del Carmen', 'San Rafael', 'Pradera Verde', 'Aguas Vivas',
  'Villa Mercedes', 'Castillo Viejo', 'Puerto Nuevo', 'Monte Verde',
  'La Laguna', 'El Bosque',
]

function buildHierarchy() {
  return COUNTRIES_META.map((meta, i) => ({
    name: meta.name,
    departments: meta.depts.map((deptName, d) => ({
      name: deptName,
      cities: Array.from({ length: 15 }, (_, c) => {
        const seed = i * 1000 + d * 100 + c
        const cityName = CITY_NAMES[(i * 15 + c) % CITY_NAMES.length]
        const lat = +(meta.latMin + (meta.latMax - meta.latMin) * ((seed * 7 + 3) % 997) / 997).toFixed(4)
        const lng = +(meta.lngMin + (meta.lngMax - meta.lngMin) * ((seed * 13 + 5) % 997) / 997).toFixed(4)
        return { name: cityName, lat, lng }
      }),
    })),
  }))
}

export const LOCATIONS_HIERARCHY: LocationCountry[] = buildHierarchy()
