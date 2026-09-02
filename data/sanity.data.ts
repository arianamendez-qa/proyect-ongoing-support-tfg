/**
 * Datos para la suite de sanity checks cross-site multi-región.
 *
 * Cada marca define sus propias regiones — no todas tienen las mismas.
 *   Hobbs:        UK · AU · US · ROW
 *   Phase Eight:  UK · AU · EU · ROW · DACH
 *   Inside Story: UK
 *
 * TARGET_ENV=staging (por defecto) | TARGET_ENV=production
 */

const targetEnv = process.env.TARGET_ENV ?? 'staging';
export { targetEnv };

type Region = {
  name: string;
  path: string;
  searchTerm?: string;
};

type BrandData = {
  name: string;
  stagingUrl: string;
  prodUrl: string;
  searchTerm: string;
  categoryPath: string;
  regions: Region[];
};

export const sanitySiteData: BrandData[] = [
  {
    name: 'Hobbs',
    stagingUrl: process.env.HOBBS_BASE_URL ?? 'https://stage.hobbs.com',
    prodUrl: process.env.HOBBS_PROD_URL ?? 'https://www.hobbs.com',
    searchTerm: 'dress',
    categoryPath: '/clothing/',
    regions: [
      { name: 'UK',  path: '/' },
      { name: 'AU',  path: '/au/' },
      { name: 'US',  path: '/us/' },
      { name: 'ROW', path: '/row/' },
    ],
  },
  {
    name: 'Phase Eight',
    stagingUrl: process.env.PHASE_EIGHT_BASE_URL ?? 'https://stage.phase-eight.com',
    prodUrl: process.env.PHASE_EIGHT_PROD_URL ?? 'https://www.phase-eight.com',
    searchTerm: 'dress',
    categoryPath: '/clothing/',
    regions: [
      { name: 'UK',   path: '/' },
      { name: 'AU',   path: '/au/' },
      { name: 'EU',   path: '/eu/' },
      { name: 'ROW',  path: '/row/' },
      { name: 'DACH', path: '/de/', searchTerm: 'Kleid' },
    ],
  },
  {
    name: 'Inside Story',
    stagingUrl: process.env.INSIDE_STORY_BASE_URL ?? 'https://stage.insidestory.com',
    prodUrl: process.env.INSIDE_STORY_PROD_URL ?? 'https://www.insidestory.com',
    searchTerm: 'dress',
    categoryPath: '/all-products/',
    regions: [
      { name: 'UK', path: '/' },
    ],
  },
];
