import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Carga las variables del archivo .env
// Así nunca quedan contraseñas ni URLs hardcodeadas en el código
dotenv.config();

// Las dos marcas (entornos de staging en Salesforce Commerce Cloud) están
// protegidas con HTTP Basic Auth y comparten las mismas credenciales.
// Playwright las envía automáticamente en cada request vía httpCredentials.
const httpCredentials = {
  username: process.env.BASIC_AUTH_USERNAME ?? '',
  password: process.env.BASIC_AUTH_PASSWORD ?? '',
};

// TARGET_ENV controla el entorno de la Sanity Suite.
// staging (por defecto) = sandbox SFCC | production = producción real.
// Producción no usa Basic Auth, así que el proyecto sanity la omite.
const targetEnv = process.env.TARGET_ENV ?? 'staging';
const isSandbox = targetEnv !== 'production';

export default defineConfig({

  // ─── ¿Dónde están los tests? ────────────────────────────────────────────────
  testDir: './tests',

  // ─── Cómo corren los tests ───────────────────────────────────────────────────

  // Si un test falla, lo reintenta una vez antes de marcarlo como fallido.
  // Evita falsos negativos por problemas de red o entorno.
  retries: 1,

  // Cuántos tests corren al mismo tiempo. 2 es seguro para empezar.
  workers: 2,

  // Corta toda la suite si fallan más de 10 tests.
  maxFailures: 10,

  // Falla en CI si alguien dejó un test.only olvidado
  // (evita que la suite pase en verde corriendo solo 1 test).
  forbidOnly: !!process.env.CI,

  // ─── Reportes ────────────────────────────────────────────────────────────────
  reporter: [
    // Reporte HTML — abrir con: npm run report
    ['html', { outputFolder: 'reports/html', open: 'never' }],
    // Muestra resultados en la terminal mientras corren los tests
    ['list'],
  ],

  // ─── Ajustes globales aplicados a TODOS los tests ────────────────────────────
  use: {
    // Credenciales de HTTP Basic Auth (iguales para ambas marcas)
    httpCredentials,

    // Guarda screenshot / video / trace solo cuando un test falla
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',

    // Tiempo máximo para una acción (click, fill, etc.)
    actionTimeout: 15000,

    // Tiempo máximo para que cargue una página
    navigationTimeout: 30000,
  },

  // ─── Projects — uno por marca ────────────────────────────────────────────────
  // Cada marca tiene su propio baseURL. La Basic Auth se hereda del bloque
  // global `use`, así que no hace falta login por formulario ni storageState.
  //
  // Correr todo:            npm test
  // Solo Hobbs:             npm run test:hobbs
  // Solo Phase Eight:       npm run test:phase-eight
  projects: [
    {
      name: 'hobbs',
      testMatch: 'hobbs/**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.HOBBS_BASE_URL,
      },
    },
    {
      name: 'phase-eight',
      testMatch: 'phase-eight/**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.PHASE_EIGHT_BASE_URL,
      },
    },
    {
      name: 'inside-story',
      testMatch: 'inside-story/**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.INSIDE_STORY_BASE_URL,
      },
    },
    // ─── Sanity Suite — cross-site health checks (Hobbs, Phase Eight, Inside Story) ──
    // Tests usan URLs absolutas de data/sanity.data.ts.
    // Basic Auth sólo en sandbox; producción no la necesita.
    {
      name: 'sanity',
      testMatch: 'sanity/**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        httpCredentials: isSandbox ? httpCredentials : undefined,
      },
    },
    // ─── Manage Service — hotfix and release folders ──────────────────────────
    // Tests use absolute URLs from brand data files so baseURL is just the sandbox root.
    {
      name: 'manage-service',
      testMatch: [
        'hotfix-*/**/*.spec.ts',
        'release-*/**/*.spec.ts',
        'search-ui-optimisation/**/*.spec.ts',
        'paid-returns/**/*.spec.ts',
        'gift-cards/**/*.spec.ts',
      ],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.SANDBOX_URL,
      },
    },
  ],
});
