# Ongoing Support — Automatización E2E (Hobbs & Phase Eight)

Suite de pruebas automatizadas con **Playwright** y patrón **Page Object Model (POM)**
para dar soporte continuo a dos marcas: **Hobbs** y **Phase Eight**.

## Requisitos

- Node.js 18+
- npm

## Instalación

```bash
npm install
npx playwright install   # descarga los navegadores
```

## Configuración

1. Copia la plantilla de variables de entorno:
   ```bash
   cp tests/.env.example .env
   ```
2. Rellena el `.env` con las URLs y las credenciales de **HTTP Basic Auth**.
   Ambos entornos de staging (Salesforce Commerce Cloud) están protegidos con
   Basic Auth y comparten las mismas credenciales. Este archivo está en
   `.gitignore` y **nunca** debe subirse al repositorio.

## Cómo correr los tests

```bash
npm test                  # todas las marcas
npm run test:hobbs        # solo Hobbs
npm run test:phase-eight  # solo Phase Eight
npm run test:headed       # con navegador visible
npm run test:ui           # modo UI interactivo de Playwright
npm run test:debug        # modo debug
npm run report            # abrir el reporte HTML del último run
```

> El acceso a staging es por **HTTP Basic Auth**: Playwright envía las
> credenciales (`BASIC_AUTH_USERNAME` / `BASIC_AUTH_PASSWORD`) en cada request
> automáticamente vía `httpCredentials`. No hay login por formulario.

## Estructura

```
.
├── playwright.config.ts      # config + 1 project de tests y 1 de setup por marca
├── tsconfig.json             # alias @pages, @fixtures, @data
├── pages/                    # Page Objects (POM)
│   ├── common/               #   compartidos por ambas marcas (BasePage)
│   ├── hobbs/                #   específicos de Hobbs
│   └── phase-eight/          #   específicos de Phase Eight
├── fixtures/                 # fixtures personalizados (inyectan Page Objects)
├── data/                     # datos de prueba por marca (NO secretos)
└── tests/
    ├── hobbs/
    │   ├── e2e/               # flujos end-to-end
    │   └── ui/                # tests de UI
    └── phase-eight/
        ├── e2e/
        └── ui/
```

## Notas

- Las aserciones de los tests de ejemplo son **esqueletos**: ajústalas a los
  sitios reales.
- Las credenciales viven solo en `.env`; los datos no sensibles en `data/`.
