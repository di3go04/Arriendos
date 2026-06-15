# Contribuyendo a RentNow

Gracias por tu interés en contribuir. Esto es lo que necesitas saber.

---

## Setup

```bash
git clone https://github.com/tu-usuario/rentnow.git
cd rentnow
npm install
cp .env.example .env.local
# Completa las variables de entorno
npm run dev
```

## Ramas

- `main` — estable, lista para producción
- `develop` — integración de características
- `feature/*` — nuevas funcionalidades
- `fix/*` — correcciones de bugs
- `docs/*` — mejoras de documentación

## Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: agregar firma electrónica avanzada
fix: corregir cálculo de morosidad en pesos colombianos
docs: actualizar guía de despliegue en Vercel
style: formatear componentes con prettier
```

## Estándares de código

- **React:** Componentes funcionales con hooks
- **Estilos:** Tailwind CSS utility-first
- **Server actions:** Para mutaciones de datos
- **API routes:** Para endpoints externos/webhooks
- **Traducciones:** Agregar keys en ambos idiomas en `lib/i18n.js`

## Reportar bugs

Abre un [issue](https://github.com/tu-usuario/rentnow/issues) con:

1. Descripción del bug
2. Pasos para reproducir
3. Comportamiento esperado vs real
4. Capturas de pantalla (si aplica)
5. Entorno (navegador, SO, versión de Node)
