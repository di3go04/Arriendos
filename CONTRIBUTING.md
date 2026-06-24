# Contribuir a RentNow

Gracias por tu interés en contribuir. Este proyecto se vende bajo licencia comercial privada, pero aceptamos contribuciones del comprador y de la comunidad interna.

## Proceso de desarrollo

1. **Fork + clone** el repositorio.
2. Crea una rama: `git checkout -b feature/nombre-descriptivo`.
3. Haz tus cambios siguiendo los estándares de código.
4. Ejecuta las verificaciones locales:
   ```bash
   npm run lint        # ESLint — debe pasar sin errores
   npm run typecheck   # TypeScript — debe pasar sin errores
   npm test            # Jest — todos los tests deben pasar
   npm run build       # Build producción — debe compilar
   ```
5. Haz commit siguiendo [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` nueva característica
   - `fix:` corrección de bug
   - `docs:` solo documentación
   - `refactor:` refactor sin cambio de comportamiento
   - `test:` agregar o corregir tests
   - `chore:` tareas de mantenimiento
6. Los **pre-commit hooks** (Husky + lint-staged) ejecutan ESLint automáticamente.

## Estándares de código

- **TypeScript estricto** — sin `any` sin justificación en el PR.
- **ESLint** — sin errores, warnings solo si son justificados.
- **Arquitectura modular** — features nuevas van en `src/modules/`, no en `src/lib/`.
- **Cobertura de tests** — toda nueva funcionalidad crítica debe incluir tests.
- **i18n** — toda cadena visible al usuario debe estar en `src/messages/*.json` (6 idiomas).

## Reportar bugs

Abre un issue con:
- Descripción clara del problema.
- Pasos para reproducir.
- Comportamiento esperado vs actual.
- Screenshots si aplica.
- Versión de Node, navegador y OS.

## Seguridad

Si encuentras una vulnerabilidad de seguridad, **NO abras un issue público**. Reporta a la dirección de contacto proporcionada al comprador con el repositorio.

## Licencia

Al contribuir, aceptas que tus cambios se licencian bajo la misma **Commercial Software License** del proyecto (ver `LICENSE`).
